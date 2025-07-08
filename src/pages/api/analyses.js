import dbConnect from '../../utils/mongodb';
import Analysis from '../../models/analysisModel';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import User from '../../models/userModel';
import GoogleUser from '../../models/googleUserModel';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  await dbConnect();
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  let userDoc = await User.findOne({ email: session.user.email });
  if (!userDoc) userDoc = await GoogleUser.findOne({ email: session.user.email });
  if (!userDoc) return res.status(401).json({ error: 'User not found' });

  if (req.query.summary === 'daily') {
    // Aggregate by day
    const daily = await Analysis.aggregate([
      { $match: { userId: userDoc._id } },
      { $addFields: {
          day: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          }
        }
      },
      { $group: {
          _id: "$day",
          calories: { $sum: { $ifNull: ["$calories", 0] } },
          protein: { $sum: { $ifNull: ["$protein", 0] } },
          carbs: { $sum: { $ifNull: ["$carbs", 0] } },
          fat: { $sum: { $ifNull: ["$fat", 0] } },
        }
      },
      { $sort: { _id: -1 } },
      { $project: {
          _id: 0,
          date: "$_id",
          calories: 1,
          protein: 1,
          carbs: 1,
          fat: 1
        }
      }
    ]);
    return res.status(200).json({ daily });
  }

  const analyses = await Analysis.find({ userId: userDoc._id }).sort({ createdAt: -1 }).lean();
  console.log('AI result:', analyses[0].result);
  console.log('Extracted:', { calories: analyses[0].calories, protein: analyses[0].protein, carbs: analyses[0].carbs, fat: analyses[0].fat });
  res.status(200).json({ analyses });
} 