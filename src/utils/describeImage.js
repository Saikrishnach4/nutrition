import fetch from "node-fetch";

export async function describeImage(base64Image) {
    const HF_TOKEN = process.env.HUGGINGFACE_TOKEN;

    const response = await fetch(
        "https://api-inference.huggingface.co/models/Salesforce/blip-image-captioning-base",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer YOUR_HF_TOKEN`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: {
                    image: `data:image/jpeg;base64,${base64Image}`
                }
            })
        }
    );

    const data = await response.json();

    if (Array.isArray(data) && data[0]?.generated_text) {
        return data[0].generated_text;
    } else {
        console.error("Hugging Face error:", data);
        return "A food dish image";
    }
}
