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

        // Check if this is a manual entry
        if (req.headers['content-type']?.includes('application/json')) {
            // Manual entry
            let body = req.body;
            if (typeof body === 'string') body = JSON.parse(body);
            if (body.manual) {
                const { description, items } = body;
                // Get weight/height from userDoc
                const weight = userDoc.weight;
                const height = userDoc.height;
                // Build a prompt for the AI
                const itemsText = items.map(i => `- ${i.name}, ${i.quantity}${i.preparation ? ` (${i.preparation})` : ''}`).join('\n');
                const manualPrompt = `A user has entered their meal manually.\n\nDescription: ${description}\n\nItems:\n${itemsText}\n\nUser Details:\n- Weight: ${weight} kg\n- Height: ${height} feet\n\nPlease analyze the meal and return:\n1. A JSON array for each food item (mealType, foodName, calories, protein, carbs, fat)\n2. Then, a markdown nutrition report as usual.`;
                // Call the AI with the manual prompt (no image)
                const result = await callGitHubModelVision(null, weight, height, manualPrompt);
                // Extract structured JSON array from the start of the result
                let structuredNutrition = null;
                try {
                    const jsonMatch = result.match(/```[a-zA-Z]*\s*([\s\S]*?)\s*```/);
                    if (jsonMatch) {
                        structuredNutrition = JSON.parse(jsonMatch[1]);
                    }
                } catch (e) {
                    structuredNutrition = null;
                }
                await Analysis.create({
                    userId: userDoc._id,
                    result,
                    structuredNutrition,
                    weight,
                    height,
                    foodDescription: description,
                    source: 'manual',
                });
                return res.status(200).json({ result });
            }
        }

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
        const { /*weight, height*/ } = req.body;
        const weight = userDoc.weight;
        const height = userDoc.height;

        const result = await callGitHubModelVision(base64Image, weight, height);

        // Extract structured JSON array from the start of the result
        let structuredNutrition = null;
        try {
            const jsonMatch = result.match(/```[a-zA-Z]*\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                structuredNutrition = JSON.parse(jsonMatch[1]);
            }
        } catch (e) {
            structuredNutrition = null;
        }

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
        } catch { }

        await Analysis.create({
            userId: userDoc._id,
            imageData: base64Image,
            result,
            structuredNutrition,
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

// --- Manual JSON body handler ---
export default async function handler(req, res) {
  if (req.method === 'POST' && req.headers['content-type']?.includes('application/json')) {
    // Parse JSON body manually
    let body = '';
    await new Promise((resolve, reject) => {
      req.on('data', chunk => { body += chunk; });
      req.on('end', resolve);
      req.on('error', reject);
    });
    try { body = JSON.parse(body); } catch { body = {}; }
    if (body.manual) {
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
      const { description, items } = body;
      // Get weight/height from userDoc
      const weight = userDoc.weight;
      const height = userDoc.height;
      if (!weight || !height || isNaN(Number(weight)) || isNaN(Number(height))) {
        return res.status(400).json({ error: 'Weight and height are required and must be numbers.' });
      }
      // Build a strict prompt for the AI (same as image upload, but with manual items)
      const itemsText = items.map(i => `- ${i.name}, ${i.quantity} ${i.unit}${i.preparation ? ` (${i.preparation})` : ''}`).join('\n');
      const manualPrompt = `You are a certified fitness and nutrition expert.\n\nA user has entered their meal manually and provided basic personal information. Your job is to analyze the meal and respond **strictly in the following format**:\n\n---\n\n**First, return a JSON array for each food item (for programmatic use):**\n- mealType (Breakfast, Lunch, Brunch, Dinner, Snacks, Other)\n- foodName\n- calories\n- protein\n- carbs\n- fat\n\nExample:\n\`\`\`\n[\n  {\n    \"mealType\": \"Breakfast\",\n    \"foodName\": \"Oatmeal with banana\",\n    \"calories\": 250,\n    \"protein\": 6,\n    \"carbs\": 45,\n    \"fat\": 4\n  },\n  {\n    \"mealType\": \"Snacks\",\n    \"foodName\": \"Almonds\",\n    \"calories\": 100,\n    \"protein\": 4,\n    \"carbs\": 3,\n    \"fat\": 9\n  }\n]\`\`\`\n\n---\n\n**Then, after the JSON, return the full markdown report as before (for user display):**\n\n🍱 **What's on the Plate?**\n- ${description}\n- Items:\n${itemsText}\n\n📊 **Nutrition Estimate (Total Plate)**  \nReturn this as a clean table:\n\n| Item      | Calories | Protein | Carbs | Fat |\n|-----------|----------|---------|-------|-----|\n| Food A    | ___ kcal | ___ g   | ___ g | ___ g |\n| Food B    | ___ kcal | ___ g   | ___ g | ___ g |\n| **Total** | ___ kcal | ___ g   | ___ g | ___ g |\n\n📏 **User Details**\n- Weight: ${weight} kg\n- Height: ${height} feet\n- BMI: (calculate and mention only the value and category, e.g., 24.5 – Normal)\n\n🎯 **Suitability**\n- Is this meal suitable for the user's BMI and lifestyle?\n- Mention pros and cons.\n\n⚖️ **Weight Recommendation**\n- Render here calculated BMI of that user and also range as well.\n- Should user lose/gain/maintain weight?\n\n🥗 **1-Day Sample Meal Plan**\n- **Breakfast:**  \n- **Snack:**  \n- **Lunch:**  \n- **Snack:**  \n- **Dinner:**  \n- **Late Snack:**  \n\n✅ **Eat More Of:**\n- Bullet list of recommended foods\n\n🚫 **Avoid / Reduce:**\n- Bullet list of foods to cut down\n\n💡 **Top 3 Health Tips**\n1. ...\n2. ...\n3. ...\n\n---\n\nRespond only in the above format. Don't explain your role or add extra notes.`;
      // Call the AI with the manual prompt (no image)
      const result = await callGitHubModelVision(null, weight, height, manualPrompt);
      // Extract structured JSON array from the start of the result
      let structuredNutrition = null;
      try {
        const jsonMatch = result.match(/```[a-zA-Z]*\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          structuredNutrition = JSON.parse(jsonMatch[1]);
        }
      } catch (e) {
        structuredNutrition = null;
      }
      await Analysis.create({
        userId: userDoc._id,
        result,
        structuredNutrition,
        weight,
        height,
        foodDescription: description,
        source: 'manual',
      });
      return res.status(200).json({ result });
    }
  }
  // --- Otherwise, use nextConnect/multer for file uploads ---
  return apiRoute(req, res);
}
