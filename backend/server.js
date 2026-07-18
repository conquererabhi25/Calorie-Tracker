const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Log = require('./models/Log');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected securely to MongoDB database.'))
  .catch((err) => console.error('❌ MongoDB database connection error:', err));

/**
 * GET /api/logs/:date
 * Fetches the logs matching a specific calendar date string (YYYY-MM-DD)
 */
app.get('/api/logs/:date', async (req, res) => {
  try {
    const log = await Log.findOne({ date: req.params.date });
    if (!log) {
      return res.status(200).json({
        weight: 67,
        height: 160,
        age: 27,
        calorieTarget: 1400,
        burnTarget: 250,
        meals: { breakfast: 0, lunch: 0, snacks: 0, dinner: 0 },
        workouts: []
      });
    }
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: 'Server error pulling daily data log.' });
  }
});

/**
 * POST /api/logs
 * Saves or updates a daily metrics payload
 */
app.post('/api/logs', async (req, res) => {
  const { date } = req.body;
  try {
    // Upsert behavior: searches by date, updates if exists, creates if new
    const log = await Log.findOneAndUpdate(
      { date },
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json(log);
  } catch (err) {
    res.status(500).json({ error: 'Server error processing data synchronization sync.' });
  }
});

/**
 * GET /api/analytics
 * Aggregates logs to compute weekly weight deltas, monthly weight deltas, 
 * and calculates the cumulative total calorie deficit accumulated across all history.
 */
app.get('/api/analytics', async (req, res) => {
  try {
    const logs = await Log.find().sort({ date: 1 }); // Sort chronologically oldest to newest

    if (logs.length === 0) {
      return res.json({ weeklyLoss: 0, monthlyLoss: 0, totalDeficitTillToday: 0 });
    }

    // 1. Calculate All-Time Cumulative Deficit
    let totalDeficitTillToday = 0;

    logs.forEach(log => {
      // Replicate frontend equation: Mifflin-St Jeor (Men)
      const bmr = Math.round(10 * log.weight + 6.25 * log.height - 5 * log.age + 5);
      // Sedentary Maintenance Baseline (1.2x factor)
      const sedentaryMaintenance = Math.round(bmr * 1.2);
      
      const dayIntake = Object.values(log.meals).reduce((sum, val) => sum + Number(val), 0);
      const dayActiveBurn = log.workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
      
      // Daily Deficit = (Sedentary Burn + Workout Burn) - Food Consumed
      const dayDeficit = (sedentaryMaintenance + dayActiveBurn) - dayIntake;
      totalDeficitTillToday += dayDeficit;
    });

    // 2. Weight delta indicators (7-Day and 30-Day snapshots)
    const latestLog = logs[logs.length - 1];
    let weeklyLoss = 0;
    let monthlyLoss = 0;

    const parseDateStr = (str) => new Date(str);
    const latestDate = parseDateStr(latestLog.date);

    // Filter historical points for snapshots
    const sevenDaysAgo = new Date(latestDate);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const thirtyDaysAgo = new Date(latestDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logSevenDaysAgo = logs.find(l => parseDateStr(l.date) >= sevenDaysAgo);
    const logThirtyDaysAgo = logs.find(l => parseDateStr(l.date) >= thirtyDaysAgo);

    if (logSevenDaysAgo) {
      weeklyLoss = Number((logSevenDaysAgo.weight - latestLog.weight).toFixed(2));
    }
    if (logThirtyDaysAgo) {
      monthlyLoss = Number((logThirtyDaysAgo.weight - latestLog.weight).toFixed(2));
    }

    res.json({
      weeklyLoss,
      monthlyLoss,
      totalDeficitTillToday: Math.round(totalDeficitTillToday)
    });

  } catch (err) {
    res.status(500).json({ error: 'Server error processing system bio analytical telemetry.' });
  }
});

// Port Execution Configuration
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Kinetic Server engine processing on port ${PORT}`));