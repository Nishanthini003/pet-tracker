import express from 'express';
import Petition from '../models/Petition.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// GET /api/petitions/stats - Get petition statistics
router.get('/stats', protect, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Get current stats
    const [total, active, resolved] = await Promise.all([
      Petition.countDocuments({ creator: req.user._id }),
      Petition.countDocuments({ creator: req.user._id, status: { $ne: 'resolved' } }),
      Petition.countDocuments({ creator: req.user._id, status: 'resolved' })
    ]);

    // Get stats from 30 days ago for comparison
    const [totalPrev, activePrev, resolvedPrev] = await Promise.all([
      Petition.countDocuments({ 
        creator: req.user._id,
        createdAt: { $lt: thirtyDaysAgo }
      }),
      Petition.countDocuments({ 
        creator: req.user._id,
        status: { $ne: 'resolved' },
        createdAt: { $lt: thirtyDaysAgo }
      }),
      Petition.countDocuments({ 
        creator: req.user._id,
        status: 'resolved',
        createdAt: { $lt: thirtyDaysAgo }
      })
    ]);

    // Calculate average response time for resolved petitions
    const resolvedPetitions = await Petition.find({
      creator: req.user._id,
      status: 'resolved',
      resolvedAt: { $exists: true }
    }).select('createdAt resolvedAt');

    let avgResponseTime = 0;
    if (resolvedPetitions.length > 0) {
      const totalResponseTime = resolvedPetitions.reduce((acc, petition) => {
        return acc + (petition.resolvedAt - petition.createdAt);
      }, 0);
      avgResponseTime = Math.round(totalResponseTime / resolvedPetitions.length / (1000 * 60 * 60)); // Convert to hours
    }

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    res.json({
      total,
      active,
      resolved,
      avgResponseTime,
      totalChange: calculateChange(total, totalPrev),
      activeChange: calculateChange(active, activePrev),
      resolvedChange: calculateChange(resolved, resolvedPrev),
      avgResponseTimeChange: '0%' // This is a placeholder as historical avg response time calculation would be complex
    });
  } catch (error) {
    console.error('Error fetching petition stats:', error);
    res.status(500).json({ error: 'Failed to fetch petition statistics' });
  }
});

// GET /api/petitions/recent - Get recent petitions
router.get('/recent', protect, async (req, res) => {
  try {
    const petitions = await Petition.find({ creator: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title description status createdAt');

    res.json({ petitions });
  } catch (error) {
    console.error('Error fetching recent petitions:', error);
    res.status(500).json({ error: 'Failed to fetch recent petitions' });
  }
});

export default router;
