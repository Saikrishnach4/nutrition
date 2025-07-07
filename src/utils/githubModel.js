import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1";
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
Analyze this food image. Estimate calories, protein, carbs, and fat.
User weight: ${weight} kg
User height: ${height} feet

Also:
1. Is this dish suitable for their body type?
2. Should they lose/gain weight?
3. Suggest a healthy 1-day meal plan.
4. Recommend foods to eat more or avoid.
5. Give personalized tips.
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
