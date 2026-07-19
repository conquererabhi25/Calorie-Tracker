import React, { useState, useEffect } from 'react';
import { Flame, Apple, Dumbbell, TrendingDown, Scale, Plus, Calendar, Save, Trash2, TrendingUp, Zap, Trophy, Sparkles, RefreshCw, Dna } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
// This is new code. for the app
export default function App() {
  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(todayStr);
  
  const [weight, setWeight] = useState(67);
  const [height, setHeight] = useState(160);
  const [age, setAge] = useState(27);
  
  const [calorieTarget, setCalorieTarget] = useState(1600); 
  const [burnTarget, setBurnTarget] = useState(250);
  const [proteinTarget, setProteinTarget] = useState(60); // Default dynamic premium protein target

  const [meals, setMeals] = useState({ breakfast: 0, lunch: 0, snacks: 0, dinner: 0 });
  const [proteinMeals, setProteinMeals] = useState({ breakfast: 0, lunch: 0, snacks: 0, dinner: 0 }); // Added state tracking
  const [workouts, setWorkouts] = useState([]);
  const [workoutName, setWorkoutName] = useState('');
  const [workoutCals, setWorkoutCals] = useState('');

  const [analytics, setAnalytics] = useState({ weeklyLoss: 0, monthlyLoss: 0, totalDeficitTillToday: 0 });
  const [initialLoading, setInitialLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiInsights, setAiInsights] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  const fetchData = async (targetDate) => {
    try {
      const res = await fetch(`https://calorie-tracker-protein-second-brach.onrender.com/api/logs/${targetDate}`);
      const data = await res.json();
      
      setWeight(data.weight || 67);
      setHeight(data.height || 160);
      setAge(data.age || 27);
      setCalorieTarget(data.calorieTarget || 1600);
      setBurnTarget(data.burnTarget || 250);
      setMeals(data.meals || { breakfast: 0, lunch: 0, snacks: 0, dinner: 0 });
      setProteinMeals(data.proteinMeals || { breakfast: 0, lunch: 0, snacks: 0, dinner: 0 }); // Fetch sync integration
      setWorkouts(data.workouts || []);
    } catch (err) {
      console.error("Error fetching daily log:", err);
      toast.error('Failed to load daily log configurations.');
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('https://calorie-tracker-protein-second-brach.onrender.com/api/analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    }
  };

  const generateAiInsights = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter the food items or questions for Gemini.');
      return;
    }
    setLoadingAi(true);
    try {
      const response = await fetch('https://calorie-tracker-protein-second-brach.onrender.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: aiPrompt })
      });
      
      if (!response.ok) throw new Error(`Server returned status code ${response.status}`);
      
      const data = await response.json();
      
      if (data.calories !== undefined) {
        const confidenceText = data.confidence ? ` (Confidence: ${data.confidence})` : '';
        setAiInsights(`Item: ${data.foodItem} | Estimated: ${data.calories} kcal | Protein: ${data.protein || 0}g${confidenceText}`);
      } else {
        setAiInsights(data.reply || data.message || data.result || 'Processed successfully!');
      }
      
      toast.success('AI evaluation complete!');
    } catch (err) {
      console.error("AI Error:", err);
      setAiInsights('Unable to establish real-time evaluation profile at this moment.');
    } finally {
      setLoadingAi(false);
    }
  };

  useEffect(() => {
    async function loadInitialData() {
      setInitialLoading(true);
      await Promise.all([fetchData(date), fetchAnalytics()]);
      setInitialLoading(false);
    }
    loadInitialData();
  }, [date]);

  const heightInMeters = height / 100;
  const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(2);
  const bmr = Math.round(10 * weight + 6.25 * height - 5 * age + 5); 
  const sedentaryMaintenance = Math.round(bmr * 1.2); 

  const totalIntake = Object.values(meals).reduce((sum, val) => sum + Number(val), 0);
  const totalProteinIntake = Object.values(proteinMeals).reduce((sum, val) => sum + Number(val), 0); // Added protein summing logic
  const totalBurned = workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  
  const deficit = Math.round((sedentaryMaintenance + totalBurned) - totalIntake);

  const intakePercentage = Math.min(Math.round((totalIntake / calorieTarget) * 100), 100);
  const proteinPercentage = Math.min(Math.round((totalProteinIntake / proteinTarget) * 100), 100);
  const burnPercentage = Math.min(Math.round((totalBurned / burnTarget) * 100), 100);

  const handleSave = async () => {
    setSyncing(true);
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
      proteinMeals: {
        breakfast: Number(proteinMeals.breakfast),
        lunch: Number(proteinMeals.lunch),
        snacks: Number(proteinMeals.snacks),
        dinner: Number(proteinMeals.dinner),
      },
      workouts
    };

    const syncPromise = fetch('https://calorie-tracker-protein-second-brach.onrender.com/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    toast.promise(syncPromise, {
      loading: 'Synchronizing telemetry metrics to cloud...',
      success: <b>Progress securely synced to MongoDB!</b>,
      error: <b>Failed to sync logging data streams.</b>,
    });

    try {
      const res = await syncPromise;
      if (!res.ok) throw new Error();
      await fetchAnalytics();
    } catch (err) {
      console.error("Error saving data:", err);
    } finally {
      setSyncing(false);
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

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#090D16] text-[#F8FAFC]">
        <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-indigo-500/20"></div>
        <p className="mt-5 text-xs font-bold tracking-widest text-indigo-400 uppercase animate-pulse">Getting Your Data From Server...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090D16] text-[#F8FAFC] pb-16 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      <Toaster 
        position="top-right" 
        toastOptions={{ style: { background: '#0F172A', color: '#F8FAFC', border: '1px solid #1E293B' } }} 
      />

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
              disabled={syncing}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-500/10 transition-all text-xs tracking-wide disabled:opacity-50"
            >
              <Save size={14} /> {syncing ? 'SYNCING...' : 'SYNC DATA'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-gradient-to-b from-[#1E293B] to-[#0F172A] border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden group">
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

            <div className="bg-gradient-to-b from-[#1E293B] to-[#0F172A] border border-amber-500/20 p-6 rounded-2xl flex flex-col justify-between shadow-xl relative overflow-hidden group">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1E293B]/40 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Calories</span>
                <span className="p-1.5 bg-cyan-500/10 text-cyan-400 rounded-lg"><Apple size={14} /></span>
              </div>
              <div className="my-3">
                <h3 className="text-2xl font-black tracking-tight text-cyan-400">{totalIntake} <span className="text-xs font-normal text-slate-500">/{calorieTarget} kcal</span></h3>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${intakePercentage}%` }}></div>
                </div>
              </div>
            </div>

            {/* NEW: Protein Overview Summary Card */}
            <div className="bg-[#1E293B]/40 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Daily Protein</span>
                <span className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg"><Dna size={14} /></span>
              </div>
              <div className="my-3">
                <h3 className="text-2xl font-black tracking-tight text-indigo-400">{totalProteinIntake} <span className="text-xs font-normal text-slate-500">/{proteinTarget}g</span></h3>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${proteinPercentage}%` }}></div>
                </div>
              </div>
            </div>

            <div className="bg-[#1E293B]/40 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Active Burned</span>
                <span className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg"><Dumbbell size={14} /></span>
              </div>
              <div className="my-3">
                <h3 className="text-2xl font-black tracking-tight text-rose-400">{totalBurned} <span className="text-xs font-normal text-slate-500">/{burnTarget} kcal</span></h3>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${burnPercentage}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0F172A] border border-slate-800/80 p-6 rounded-3xl shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold tracking-wider text-slate-300 uppercase flex items-center gap-2">
                <Sparkles className="text-indigo-400 fill-indigo-400/20 animate-pulse" size={16} /> Gemini AI Health Advisory
              </h2>
            </div>
            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <input 
                type="text" 
                placeholder="Type your food items or query (e.g., 100 gram soya chunks)" 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="flex-1 bg-[#1E293B]/30 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white"
              />
              <button
                onClick={generateAiInsights}
                disabled={loadingAi}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-xs tracking-wider"
              >
                {loadingAi ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {aiInsights ? 'RE-EVALUATE' : 'ASK GEMINI'}
              </button>
            </div>
            {aiInsights && (
              <div className="bg-[#1E293B]/20 border border-slate-800/50 p-4 rounded-xl">
                <p className="text-xs text-slate-300 leading-relaxed font-medium">{aiInsights}</p>
              </div>
            )}
          </div>

          {/* UPDATED: Meal Intake Logs with Dual Calorie & Protein Trackers */}
          <div className="bg-[#0F172A] border border-slate-800/80 p-6 rounded-3xl shadow-2xl">
            <h2 className="text-sm font-bold tracking-wider text-slate-300 uppercase mb-6 flex items-center gap-2">
              <Apple className="text-indigo-400" size={16} /> Meal Intake Logs
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Object.keys(meals).map((mealKey) => (
                <div key={mealKey} className="bg-[#1E293B]/30 border border-slate-800/60 p-4 rounded-xl space-y-3">
                  <label className="text-[11px] font-extrabold text-indigo-400 tracking-wider capitalize block border-b border-slate-800 pb-1">{mealKey}</label>
                  
                  {/* Calorie Input */}
                  <div>
                    <span className="text-[9px] text-slate-400 block mb-1 font-semibold">Calories</span>
                    <div className="relative flex items-center">
                      <input 
                        type="number"
                        value={meals[mealKey] || ''}
                        onChange={(e) => setMeals({...meals, [mealKey]: e.target.value})}
                        className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg pl-2 pr-7 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                        placeholder="0"
                      />
                      <span className="absolute right-2 text-[9px] text-slate-500 font-bold">cal</span>
                    </div>
                  </div>

                  {/* Protein Input */}
                  <div>
                    <span className="text-[9px] text-slate-400 block mb-1 font-semibold">Protein</span>
                    <div className="relative flex items-center">
                      <input 
                        type="number"
                        value={proteinMeals[mealKey] || ''}
                        onChange={(e) => setProteinMeals({...proteinMeals, [mealKey]: e.target.value})}
                        className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg pl-2 pr-7 py-1.5 text-xs font-semibold focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        placeholder="0"
                      />
                      <span className="absolute right-2 text-[9px] text-slate-500 font-bold">g</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

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
                className="flex-1 bg-[#1E293B]/30 border border-slate-800 rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none text-white"
              />
              <div className="relative w-full md:w-56 flex items-center">
                <input 
                  type="number" 
                  placeholder="Calories burned" 
                  value={workoutCals}
                  onChange={(e) => setWorkoutCals(e.target.value)}
                  className="w-full bg-[#1E293B]/30 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-xs font-semibold focus:outline-none text-white"
                />
                <span className="absolute right-3 text-[10px] text-slate-500 font-bold uppercase">Kcal</span>
              </div>
              <button 
                onClick={addWorkout}
                className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all text-xs tracking-wider"
              >
                <Plus size={14} /> ADD WORKOUT
              </button>
            </div>

            <div className="space-y-2">
              {workouts.length === 0 ? (
                <div className="text-center py-6 bg-[#1E293B]/10 rounded-2xl border border-dashed border-slate-800">
                  <p className="text-xs text-slate-500 italic">No activity logs configured for today.</p>
                </div>
              ) : (
                workouts.map((w, index) => (
                  <div key={index} className="flex justify-between items-center bg-[#1E293B]/20 px-4 py-3 rounded-xl border border-slate-800/50">
                    <span className="font-semibold text-xs text-slate-300">{w.activity}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-rose-400 font-bold">-{w.caloriesBurned} Kcal</span>
                      <button onClick={() => removeWorkout(index)} className="text-slate-500 hover:text-rose-400 p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0F172A] border border-slate-800/80 p-6 rounded-3xl shadow-2xl">
            <h2 className="text-sm font-bold tracking-wider text-slate-300 uppercase mb-4 flex items-center gap-2">
              <Scale className="text-indigo-400" size={16} /> Bio Configurations
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 tracking-wider block mb-1">Body Weight (kg)</label>
                <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-1.5 text-xs font-semibold" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 tracking-wider block mb-1">Height (cm)</label>
                <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-1.5 text-xs font-semibold" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 tracking-wider block mb-1">Age (years)</label>
                <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-3 py-1.5 text-xs font-semibold" />
              </div>
              
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 tracking-wider block mb-1">Cal Budget</label>
                  <input type="number" value={calorieTarget} onChange={(e) => setCalorieTarget(e.target.value)} className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-2 py-1 text-xs font-semibold" />
                </div>
                {/* NEW: Protein target layout adjustment */}
                <div>
                  <label className="text-[9px] font-bold text-slate-400 tracking-wider block mb-1">Protein Goal</label>
                  <input type="number" value={proteinTarget} onChange={(e) => setProteinTarget(e.target.value)} className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-2 py-1 text-xs font-semibold" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 tracking-wider block mb-1">Burn Target</label>
                  <input type="number" value={burnTarget} onChange={(e) => setBurnTarget(e.target.value)} className="w-full bg-[#0F172A] border border-slate-800 text-slate-100 rounded-lg px-2 py-1 text-xs font-semibold" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0F172A] border border-slate-800/80 p-6 rounded-3xl shadow-2xl">
            <h2 className="text-sm font-bold tracking-wider text-slate-300 uppercase mb-4">Calculated Biomarkers</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/10">
                <span className="text-[10px] text-indigo-400 font-bold tracking-wider block">BMI Rating</span>
                <span className="text-2xl font-black text-white block mt-1">{bmi}</span>
              </div>
              <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/10">
                <span className="text-[10px] text-emerald-400 font-bold tracking-wider block">Sedentary Burn</span>
                <span className="text-2xl font-black text-white block mt-1">{sedentaryMaintenance}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}