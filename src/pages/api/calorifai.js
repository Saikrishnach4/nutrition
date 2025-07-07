export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { base64Image } = JSON.parse(req.body);

    // 1. Call Clarifai to detect food items
    const clarifaiRes = await fetch('https://api.clarifai.com/v2/models/food-item-recognition/outputs', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${process.env.CLARIFAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_app_id: {
          user_id: 'saikrishnachippa3',
          app_id: 'food-item-recognition',
        },
        inputs: [
          {
            data: {
              image: {
                base64: base64Image,
              },
            },
          },
        ],
      }),
    });

    const clarifaiJson = await clarifaiRes.json();
    const concepts = clarifaiJson.outputs?.[0]?.data?.concepts || [];

    const topFood = concepts[0]?.name;

    // 2. Call Spoonacular for nutrition data
    const spoonacularRes = await fetch(`https://api.spoonacular.com/recipes/parseIngredients?apiKey=${process.env.SPOONACULAR_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        ingredientList: `1 serving ${topFood}`,
        servings: 1,
      }),
    });

    const spoonJson = await spoonacularRes.json();

    return res.status(200).json({
      food: topFood,
      nutrition: spoonJson,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
