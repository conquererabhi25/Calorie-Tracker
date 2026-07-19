const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD
  weight: { type: Number, required: true },
  height: { type: Number, required: true },
  age: { type: Number, required: true },
  calorieTarget: { type: Number, required: true },
  burnTarget: { type: Number, required: true },
  meals: {
    breakfast: { type: Number, default: 0 },
    lunch: { type: Number, default: 0 },
    snacks: { type: Number, default: 0 },
    dinner: { type: Number, default: 0 }
  },
  // Added protein intake monitoring structure
  proteinMeals: {
    breakfast: { type: Number, default: 0 },
    lunch: { type: Number, default: 0 },
    snacks: { type: Number, default: 0 },
    dinner: { type: Number, default: 0 }
  },
  workouts: [
    {
      activity: { type: String, required: true },
      caloriesBurned: { type: Number, required: true }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Log', LogSchema);