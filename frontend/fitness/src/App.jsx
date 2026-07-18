import React, { useState, useEffect } from 'react';
import { Flame, Apple, Dumbbell, TrendingDown, Scale, Plus, Calendar, Save, Trash2, TrendingUp, Zap, Trophy } from 'lucide-react';

export default function App() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  
  // Set your baseline metrics directly as defaults
  const [weight, setWeight] = useState(67);
  const [height, setHeight] = useState(160);
  const [age, setAge] = useState(27);
  
  // High-performance default targets for your weight-loss goals
  const [calorieTarget, setCalorieTarget] = useState(1600); 
  const [burnTarget, setBurnTarget] = useState(250);

  const [meals, setMeals] = useState({ breakfast: 0, lunch: 0, snacks: 0, dinner: 0 });
  const [workouts, setWorkouts] = useState([]);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutCals, setWorkoutCals] = useState('');

  const [analytics, setAnalytics] = useState({ weeklyLoss: 0, monthlyLoss: 0, totalDeficitTillToday: 0 });
  const [loading, setLoading] = useState(false);

  const fetchData = async (targetDate) => {
    try {
      const res = await fetch(`http://localhost:5000/api/logs/${targetDate}`);
      const data = await res.json();
      
      // If data exists in MongoDB, use it, otherwise fall back to your personal baselines
      setWeight(data.weight || 67);
      setHeight(data.height || 160);
      setAge(data.age || 27);
      setCalorieTarget(data.calorieTarget || 1600);
      setBurnTarget(data.burnTarget || 250);
      setMeals(data.meals || { breakfast: 0, lunch: 0, snacks: 0, dinner: 0 });
      setWorkouts(data.workouts || []);
    } catch (err) {
      console.error("Error fetching daily log:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  useEffect(() => {
    fetchData(date);
    fetchAnalytics();
  }, [date]);

  // CORRECT BIOMETRIC EQUATIONS
  const heightInMeters = height / 100;
  const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
  
  // Mifflin-St Jeor Equation for Men
  const bmr = Math.round(10 * weight + 6.25 * height - 5 * age + 5); 
  
  // Sedentary Activity Factor Multiplier (1.2x)
  const sedentaryMaintenance = Math.round(bmr * 1.2); 

  const totalIntake = Object.values(meals).reduce((sum, val) => sum + Number(val), 0);
  const totalBurned = workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  
  // DEFICIT CALCULATION FIX: (Maintenance Baseline + Active Gym Burn) - Food Consumed
  const deficit = Math.round((sedentaryMaintenance + totalBurned) - totalIntake);

  const intakePercentage = Math.min(Math.round((totalIntake / calorieTarget) * 100), 100);
  const burnPercentage = Math.min(Math.round((totalBurned / burnTarget) * 100), 100);

  const handleSave = async () => {
    setLoading(true);
    const payload = {
      date,
      weight: Number(weight),
      height: Number(height),
      age: Number(age),
      calorieTarget: Number(calorieTarget),
      burnTarget: Number(burnTarget),
      meals: {
        breakfast: Number(meals.breakfast),
        lunch: Number(meals.lunch),
        snacks: Number(meals.snacks),
        dinner: Number(meals.dinner),
      },
      workouts
    };

    try {
      await fetch('http://localhost:5000/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      alert('Progress Synced securely to MongoDB!');
      fetchAnalytics();
    } catch (err) {
      console.error("Error saving data:", err);
      alert('Failed to sync logs.');
    } finally {
      setLoading(false);
    }
  };

  const addWorkout = () => {
    if (!workoutName || !workoutCals) return;
    setWorkouts([...workouts, { activity: workoutName, caloriesBurned: Number(workoutCals) }]);
    setWorkoutName('');
    setWorkoutCals('');
  };

  const removeWorkout = (index) => {
    setWorkouts(workouts.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F8FAFC] pb-16 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Premium Dark Navbar */}
      <header className="border-b border-slate-800 bg-[#0F172A]/80 backdrop-blur-md sticky top-0 z-50 py-4 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Zap size={22} className="text-white fill-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                FITNESS
              </h1>
              <span className="text-[10px] tracking-widest text-indigo-400 uppercase font-bold block -mt-1">PREMIUM PRO</span>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-end">
            <div className="flex items-center gap-2 bg-white border border-slate-800 p-2 rounded-xl">
              <Calendar size={16} className="text-indigo-400" />
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent border-none text-xs font-semibold focus:outline-none cursor-pointer text-black"
              />
            </div>
            <button 
              onClick={handleSave} 
              disabled={loading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/25 transition-all text-xs tracking-wide"
            >
              <Save size={14} /> {loading ? 'SYNCING...' : 'SYNC DATA'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle Column (Primary Metrics & Loggers) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Top Metrics Panel Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Today's Deficit Panel */}
            <div className="bg-gradient-to-b from-[#1E293B] to-[#0F172A] border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden group">
              <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all duration-700"></div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Today's Net Deficit</span>
                <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg"><TrendingDown size={14} /></span>
              </div>
              <div className="my-4">
                <h3 className="text-4xl font-black tracking-tight text-white">{deficit} <span className="text-sm font-normal text-slate-500">kcal</span></h3>
              </div>
              <div className="text-[11px] text-slate-400">
                Base Burn: <span className="text-white font-semibold">{sedentaryMaintenance} kcal</span> + Workouts
              </div>
            </div>

            {/* Total Cumulative Deficit Panel */}
            <div className="bg-gradient-to-b from-[#1E293B] to-[#0F172A] border border-amber-500/20 p-6 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden group">
              <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-700"></div>
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase">Total Deficit Till Today</span>
                <span className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg"><Trophy size={14} /></span>
              </div>
              <div className="my-4">
                <h3 className="text-4xl font-black tracking-tight text-amber-400">
                  {analytics.totalDeficitTillToday || 0} <span className="text-sm font-normal text-slate-500">kcal</span>
                </h3>
              </div>
              <div className="text-[11px] text-slate-400">
                Estimated fat burn: <span className="text-amber-400 font-semibold">{((analytics.totalDeficitTillToday || 0) / 7700).toFixed(2)} kg</span> total
              </div>
            </div>
          </div>

          {/* Calorie Progress Budget Meters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Intake Metric Panel */}
            <div className="bg-[#1E293B]/40 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Consumed</span>
                <span className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg"><Apple size={14} /></span>
              </div>
              <div className="my-4">
                <h3 className="text-3xl font-black tracking-tight text-cyan-400">{totalIntake} <span className="text-sm font-normal text-slate-500">/ {calorieTarget} kcal</span></h3>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-cyan-400 h-full rounded-full transition-all duration-500" style={{ width: `${intakePercentage}%` }}></div>
                </div>
              </div>
              <span className="text-[10px] text-slate-400">
                {Math.max(0, calorieTarget - totalIntake)} kcal under food budget
              </span>
            </div>

            {/* Burned Metric Panel */}
            <div className="bg-[#1E293B]/40 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Active Burned</span>
                <span className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg"><Dumbbell size={14} /></span>
              </div>
              <div className="my-4">
                <h3 className="text-3xl font-black tracking-tight text-rose-400">{totalBurned} <span className="text-sm font-normal text-slate-500">/ {burnTarget} kcal</span></h3>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${burnPercentage}%` }}></div>
                </div>
              </div>
              <span className="text-[10px] text-slate-400">
                {Math.max(0, burnTarget - totalBurned)} kcal left to hit active target
              </span>
            </div>
          </div>

          {/* Meals Input Deck */}
          <div className="bg-[#0F172A] border border-slate-800/80 p-6 rounded-3xl shadow-2xl">
            <h2 className="text-sm font-bold tracking-wider text-slate-300 uppercase mb-6 flex items-center gap-2">
              <Apple className="text-indigo-400" size={16} /> Meal Intake Logs
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(meals).map((mealKey) => (
                <div key={mealKey} className="bg-[#1E293B]/30 border border-slate-800/60 p-4 rounded-xl focus-within:border-indigo-500 transition-colors">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider capitalize block mb-1.5">{mealKey}</label>
                  <div className="relative flex items-center">
                    <input 
                      type="number"
                      value={meals[mealKey] || ''}
                      onChange={(e) => setMeals({...meals, [mealKey]: e.target.value})}
                      className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg pl-3 pr-8 py-2 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                      placeholder="0"
                    />
                    <span className="absolute right-2 text-[10px] text-slate-500 font-bold">cal</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Workouts Logging Center */}
          <div className="bg-[#0F172A] border border-slate-800/80 p-6 rounded-3xl shadow-2xl">
            <h2 className="text-sm font-bold tracking-wider text-slate-300 uppercase mb-6 flex items-center gap-2">
              <Dumbbell className="text-rose-400" size={16} /> Workout Tracker
            </h2>
            
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <input 
                type="text" 
                placeholder="Workout activity name" 
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="flex-1 bg-[#1E293B]/30 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500 text-white"
              />
              <div className="relative w-full md:w-56 flex items-center">
                <input 
                  type="number" 
                  placeholder="Calories burned" 
                  value={workoutCals}
                  onChange={(e) => setWorkoutCals(e.target.value)}
                  className="w-full bg-[#1E293B]/30 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500 text-white"
                />
                <span className="absolute right-3 text-[10px] text-slate-500 font-bold uppercase">Kcal</span>
              </div>
              <button 
                onClick={addWorkout}
                className="bg-indigo-500 hover:bg-indigo-600 active:scale-95 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-xs tracking-wider"
              >
                <Plus size={14} /> ADD WORKOUT
              </button>
            </div>

            <div className="space-y-2">
              {workouts.length === 0 ? (
                <div className="text-center py-8 bg-[#1E293B]/10 rounded-2xl border border-dashed border-slate-800">
                  <p className="text-xs text-slate-500 italic">No activity logs configured for today.</p>
                </div>
              ) : (
                workouts.map((w, index) => (
                  <div key={index} className="flex justify-between items-center bg-[#1E293B]/20 px-4 py-3 rounded-xl border border-slate-800/50 hover:bg-[#1E293B]/40 transition-colors">
                    <span className="font-semibold text-xs text-slate-300 tracking-wide">{w.activity}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-rose-400 font-bold">-{w.caloriesBurned} Kcal</span>
                      <button 
                        onClick={() => removeWorkout(index)} 
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Weight Profiles, Targets & Weekly/Monthly Bio Trends) */}
        <div className="space-y-6">
          
          {/* User Bio configuration panel */}
          <div className="bg-[#0F172A] border border-slate-800/80 p-6 rounded-3xl shadow-2xl">
            <h2 className="text-sm font-bold tracking-wider text-slate-300 uppercase mb-4 flex items-center gap-2">
              <Scale className="text-indigo-400" size={16} /> Bio Configurations
            </h2>
            <div className="space-y-4">
              <div className="bg-[#1E293B]/20 p-3 rounded-xl border border-slate-800/40">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider block mb-1">Body Weight (kg)</label>
                <input 
                  type="number" 
                  value={weight} 
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="bg-[#1E293B]/20 p-3 rounded-xl border border-slate-800/40">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider block mb-1">Height (cm)</label>
                <input 
                  type="number" 
                  value={height} 
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="bg-[#1E293B]/20 p-3 rounded-xl border border-slate-800/40">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider block mb-1">Age (years)</label>
                <input 
                  type="number" 
                  value={age} 
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-[#1E293B]/20 p-3 rounded-xl border border-slate-800/40">
                  <label className="text-[9px] font-bold text-slate-400 tracking-wider block mb-1">Food Budget</label>
                  <input 
                    type="number" 
                    value={calorieTarget} 
                    onChange={(e) => setCalorieTarget(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div className="bg-[#1E293B]/20 p-3 rounded-xl border border-slate-800/40">
                  <label className="text-[9px] font-bold text-slate-400 tracking-wider block mb-1">Burn Target</label>
                  <input 
                    type="number" 
                    value={burnTarget} 
                    onChange={(e) => setBurnTarget(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Calculated Health Metrics (BMR/BMI) */}
          <div className="bg-[#0F172A] border border-slate-800/80 p-6 rounded-3xl shadow-2xl">
            <h2 className="text-sm font-bold tracking-wider text-slate-300 uppercase mb-4">Calculated Biomarkers</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/10">
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block">BMI Rating</span>
                <span className="text-2xl font-black text-white block mt-1">{bmi}</span>
                <span className="text-[10px] text-indigo-300/60 font-semibold italic">kg/m² (Overweight)</span>
              </div>
              <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/10">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Sedentary Burn</span>
                <span className="text-2xl font-black text-white block mt-1">{sedentaryMaintenance}</span>
                <span className="text-[10px] text-emerald-300/60 font-semibold italic">kcal maintenance</span>
              </div>
            </div>
          </div>

          {/* Weight loss metrics and performance trends */}
          <div className="bg-[#0F172A] border border-slate-800/80 p-6 rounded-3xl shadow-2xl">
            <h2 className="text-sm font-bold tracking-wider text-slate-300 uppercase mb-4 flex items-center gap-2">
              <TrendingUp className="text-emerald-400" size={16} /> Progress Metrics
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2.5 border-b border-slate-800/60">
                <span className="text-xs font-semibold text-slate-400">7-Day Avg. Weight Loss</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${analytics.weeklyLoss >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {analytics.weeklyLoss >= 0 ? `-${analytics.weeklyLoss} kg` : `+${Math.abs(analytics.weeklyLoss)} kg`}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-slate-800/60">
                <span className="text-xs font-semibold text-slate-400">30-Day Net Weight Loss</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${analytics.monthlyLoss >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {analytics.monthlyLoss >= 0 ? `-${analytics.monthlyLoss} kg` : `+${Math.abs(analytics.monthlyLoss)} kg`}
                </span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-xs font-semibold text-slate-400">All-Time Calorie Bank</span>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
                  {analytics.totalDeficitTillToday || 0} kcal
                </span>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}