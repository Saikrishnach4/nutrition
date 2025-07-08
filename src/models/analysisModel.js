import mongoose from 'mongoose';

const AnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String }, // If you store images in cloud or public folder
  imageData: { type: String }, // If you want to store base64 or similar (optional)
  result: { type: mongoose.Schema.Types.Mixed, required: true }, // The AI/API nutrition result (JSON)
  weight: { type: Number, required: true },
  height: { type: Number, required: true },
  foodDescription: { type: String }, // Optional, if available from result
  calories: { type: Number }, // Optional, for quick stats
  protein: { type: Number },
  carbs: { type: Number },
  fat: { type: Number },
  bmi: { type: Number },
  source: { type: String, default: 'ai' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Analysis || mongoose.model('Analysis', AnalysisSchema); 