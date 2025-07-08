import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4o";
const token = process.env.GITHUB_TOKEN;

export async function callGitHubModelVision(base64Image, weight, height) {
    const client = ModelClient(endpoint, new AzureKeyCredential(token));

    const response = await client.path("/chat/completions").post({
        body: {
            model,
            messages: [
                {
                    role: "system",
                    content: "You are a professional nutrition and fitness expert."
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `
You are a certified fitness & nutrition expert.

The user has uploaded a food image and provided some personal information.

Please follow this **strict format** for the response (Markdown preferred):

---

🍱 **What's on the Plate?**
- Short description of what food is visible in the image.

📊 **Nutrition Estimate (for total plate)**  
Return this in a table format:

| Item      | Calories | Protein | Carbs | Fat |
|-----------|----------|---------|-------|-----|
| Food A    | ___ kcal | ___ g   | ___ g | ___ g |
| Food B    | ___ kcal | ___ g   | ___ g | ___ g |
| **Total** | ___ kcal | ___ g   | ___ g | ___ g |

📏 **User Details**
- Weight: ${weight} kg
- Height: ${height} feet
- BMI: (calculate and display range only, e.g., 26.5 – Overweight)

🎯 **Suitability**
- Is this dish suitable for the user's body type?
- Mention pros and cons.

⚖️ **Weight Recommendation**
- Render here calculated BMI of that user and also range as well.
- Should user lose/gain/maintain weight?

🥗 **1-Day Meal Plan**
- Breakfast:
- Snack:
- Lunch:
- Snack:
- Dinner:
- Late Snack:

✅ **Eat More:**
- Bullet points

🚫 **Avoid/Reduce:**
- Bullet points

💡 **Health Tips:**
1. ...
2. ...
3. ...

---

Always return in the above format. No apologies or refusals.
                            `
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`
                            }
                        }
                    ]
                }
            ],
            temperature: 0.7,
            top_p: 1
        }
    });

    if (isUnexpected(response)) {
        throw response.body.error;
    }

    return response.body.choices[0].message.content;
}
