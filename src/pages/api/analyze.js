import nextConnect from "next-connect";
import multer from "multer";
import fs from "fs";
import { callGitHubModelVision } from "../../utils/githubModel";

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
        const imagePath = req.file.path;
        const base64Image = fs.readFileSync(imagePath, "base64");
        const { weight, height } = req.body;

        const result = await callGitHubModelVision(base64Image, weight, height);

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
