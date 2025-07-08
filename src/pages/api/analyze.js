import nextConnect from "next-connect";
import multer from "multer";
import fs from "fs";
import { callGitHubModelVision } from "../../utils/githubModel";
import dbConnect from '../../utils/mongodb';
import Analysis from '../../models/analysisModel';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';

const upload = multer({ dest: "/tmp" });

const apiRoute = nextConnect({
    onError(error, req, res) {
        res.status(501).json({ error: `Something went wrong: ${error.message}` });
    },
    onNoMatch(req, res) {
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    },
});

apiRoute.use(upload.single("image"));

apiRoute.post(async (req, res) => {
    try {
        await dbConnect();
        const session = await getServerSession(req, res, authOptions);
        if (!session?.user?.email) {
            return res.status(401).json({ error: 'You must be logged in to analyze food.' });
        }
        // Find userId (manual or Google user)
        const User = require('../../models/userModel').default;
        const GoogleUser = require('../../models/googleUserModel').default;
        let userDoc = await User.findOne({ email: session.user.email });
        if (!userDoc) userDoc = await GoogleUser.findOne({ email: session.user.email });
        if (!userDoc) return res.status(401).json({ error: 'User not found.' });

        // Check free plan monthly upload limit
        if (userDoc.subscription === 'free') {
            const now = new Date();
            const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
            const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));
            const monthCount = await Analysis.countDocuments({
                userId: userDoc._id,
                createdAt: { $gte: startOfMonth, $lte: endOfMonth }
            });
            if (monthCount >= 10) {
                return res.status(403).json({ error: 'Free plan limit reached. Please upgrade your plan to upload more than 10 analyses per month.' });
            }
        }

        const imagePath = req.file.path;
        const base64Image = fs.readFileSync(imagePath, "base64");
        const { weight, height } = req.body;

        const result = await callGitHubModelVision(base64Image, weight, height);

        // Try to extract quick stats from result (if possible)
        let calories, protein, carbs, fat, foodDescription;
        try {
            const match = result.match(/\|\s*\*\*Total\*\*\s*\|\s*([\d,]+)\s*kcal\s*\|\s*([\d.]+)\s*g\s*\|\s*([\d.]+)\s*g\s*\|\s*([\d.]+)\s*g\s*\|/i);
            if (match) {
                calories = parseInt(match[1].replace(/,/g, ''));
                protein = parseFloat(match[2]);
                carbs = parseFloat(match[3]);
                fat = parseFloat(match[4]);
            }
            const descMatch = result.match(/\*\*What's on the Plate\?\*\*\s*- (.*)/);
            if (descMatch) foodDescription = descMatch[1];
        } catch {}

        await Analysis.create({
            userId: userDoc._id,
            imageData: base64Image,
            result,
            weight,
            height,
            foodDescription,
            calories,
            protein,
            carbs,
            fat,
            source: 'ai',
        });

        fs.unlinkSync(imagePath);
        res.status(200).json({ result });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export const config = {
    api: {
        bodyParser: false,
    },
};

export default apiRoute;
