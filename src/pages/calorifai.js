import React, { useState } from 'react';

export default function CalorifaiPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result.split(',')[1];
      setImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!image) return alert("Upload an image first.");
    setLoading(true);
    setResult(null);

    const res = await fetch('/api/calorifai', {
      method: 'POST',
      body: JSON.stringify({ base64Image: image }),
    });

    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 32 }}>
      <h1>🍽️ Calorifai + Edamam Analysis</h1>
      <form onSubmit={handleAnalyze}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button type="submit" disabled={loading} style={{ marginTop: 16 }}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 24 }}>
          <h2>🍔 Detected Food: <b>{result.food}</b></h2>
          <pre style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
            {JSON.stringify(result.nutrition, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
