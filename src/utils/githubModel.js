import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4o";
const token = process.env.GITHUB_TOKEN;

export async function callGitHubModelVision(base64Image, weight, height, manualPrompt) {
    const client = ModelClient(endpoint, new AzureKeyCredential(token));

    let userMessage;
    if (manualPrompt) {
        userMessage = {
            role: "user",
            content: [
                {
                    type: "text",
                    text: manualPrompt
                }
            ]
        };
    } else {
        userMessage = {
            role: "user",
            content: [
                {
                    type: "text",
                    text: `
You are a certified fitness and nutrition expert.

A user has uploaded a food image and provided basic personal information. Your job is to analyze the image and respond **strictly in the following format**:

---

**First, return a JSON array for each food item (for programmatic use):**
- mealType (Breakfast, Lunch, Brunch, Dinner, Snacks, Other)
- foodName
- calories
- protein
- carbs
- fat

Example:
\`\`\`
[
  {
    "mealType": "Breakfast",
    "foodName": "Oatmeal with banana",
    "calories": 250,
    "protein": 6,
    "carbs": 45,
    "fat": 4
  },
  {
    "mealType": "Snacks",
    "foodName": "Almonds",
    "calories": 100,
    "protein": 4,
    "carbs": 3,
    "fat": 9
  }
]
\`\`\`

---

**Then, after the JSON, return the full markdown report as before (for user display):**

🍱 **What's on the Plate?**
- Briefly describe the food items visible in the image.

📊 **Nutrition Estimate (Total Plate)**  
Return this as a clean table:

| Item      | Calories | Protein | Carbs | Fat |
|-----------|----------|---------|-------|-----|
| Food A    | ___ kcal | ___ g   | ___ g | ___ g |
| Food B    | ___ kcal | ___ g   | ___ g | ___ g |
| **Total** | ___ kcal | ___ g   | ___ g | ___ g |

📏 **User Details**
- Weight: ${weight} kg
- Height: ${height} feet
- BMI: (calculate and mention only the value and category, e.g., 24.5 – Normal)

🎯 **Suitability**
- Is this meal suitable for the user's BMI and lifestyle?
- Mention pros and cons.

⚖️ **Weight Recommendation**
- Render here calculated BMI of that user and also range as well.
- Should user lose/gain/maintain weight?

🥗 **1-Day Sample Meal Plan**
- **Breakfast:**  
- **Snack:**  
- **Lunch:**  
- **Snack:**  
- **Dinner:**  
- **Late Snack:**  

✅ **Eat More Of:**
- Bullet list of recommended foods

🚫 **Avoid / Reduce:**
- Bullet list of foods to cut down

💡 **Top 3 Health Tips**
1. ...
2. ...
3. ...

---

Respond only in the above format. Don't explain your role or add extra notes.
                            `
                },
                {
                    type: "image_url",
                    image_url: {
                        url: `data:image/jpeg;base64,${base64Image}`
                    }
                }
            ]
        };
    }

    const response = await client.path("/chat/completions").post({
        body: {
            model,
            messages: [
                {
                    role: "system",
                    content: "You are a professional nutrition and fitness expert."
                },
                userMessage
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
