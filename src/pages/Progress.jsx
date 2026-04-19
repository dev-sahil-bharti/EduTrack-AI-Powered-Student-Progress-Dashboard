import React, { useEffect, useState } from 'react';
import { progressService } from '../services/progress.service';
import { goalService } from '../services/goal.service';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { format, subDays } from 'date-fns';
import { Clock, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const emptyChartData = Array.from({ length: 7 }).map((_, i) => ({
  name: format(subDays(new Date(), 6 - i), 'EEE'),
  mins: 0
}));

const DONUT_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

const toHoursLabel = (mins) => {
  if (!mins || mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const ConversionBadge = ({ minutes }) => {
  const mins = Number(minutes);
  if (!mins || mins <= 0) return null;
  return (
    <p className="text-xs text-blue-400 mt-1.5 flex items-center gap-1">
      💡 <span>{mins} mins = <span className="font-semibold">{toHoursLabel(mins)}</span></span>
    </p>
  );
};

// Custom label for donut chart slices
const CustomDonutLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null; // Hide label if slice too small
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// Custom tooltip for donut
const CustomDonutTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm shadow-xl">
        <p className="text-white font-semibold">{name}</p>
        <p className="text-slate-300">{value} mins <span className="text-slate-400">({toHoursLabel(value)})</span></p>
      </div>
    );
  }
  return null;
};

const Progress = () => {
  const [loading, setLoading] = useState(false);
  const [weeklyData, setWeeklyData] = useState(emptyChartData);
  const [weeklyGoals, setWeeklyGoals] = useState([]);
  const [minutes, setMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [goalId, setGoalId] = useState('');
  const [goals, setGoals] = useState([]);

  // Chart toggle: 'bar' | 'donut'
  const [activeChart, setActiveChart] = useState('bar');

  // Donut time range: 'week' | 'alltime'
  const [donutRange, setDonutRange] = useState('week');

  // All-time donut data — fetched lazily, cached here
  const [allTimeData, setAllTimeData] = useState(null);
  const [allTimeLoading, setAllTimeLoading] = useState(false);

  const fetchProg = async () => {
    try {
      const data = await progressService.getWeeklyProgress();
      const payload = data.data || data;

      const dailyMinutes = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };

      payload.goals?.forEach(goal => {
        goal.entries?.forEach(entry => {
          const date = new Date(entry.date || entry.createdAt);
          const dayName = format(date, 'EEE');
          if (dailyMinutes[dayName] !== undefined) {
            dailyMinutes[dayName] += entry.completedMinutes;
          }
        });
      });

      const chartData = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(new Date(), 6 - i);
        const dayName = format(d, 'EEE');
        return {
          name: dayName,
          mins: Number(dailyMinutes[dayName].toFixed(0))
        };
      });

      setWeeklyData(chartData);
      setWeeklyGoals(payload.goals || []);
    } catch {
      setWeeklyData(emptyChartData);
      setWeeklyGoals([]);
      toast.error('Failed to load chart data');
    }
  };

  const loadGoals = async () => {
    try {
      const gs = await goalService.getGoals();
      const goalsList = gs.data || gs || [];
      const activeGoals = goalsList.filter(g => !g.isCompleted);
      setGoals(activeGoals);
      if (activeGoals.length > 0) {
        setGoalId(activeGoals[0]._id);
      }
    } catch {
      console.error('Failed to load goals');
    }
  };

  useEffect(() => {
    fetchProg();
    loadGoals();
  }, []);

  // Lazy fetch all-time — keyed by goalId not index position
const fetchAllTimeData = async (currentGoals) => {
  // Accept goals as parameter to avoid stale closure
  const goalsToUse = currentGoals || goals;
  if (allTimeData || allTimeLoading || goalsToUse.length === 0) return;

  setAllTimeLoading(true);
  try {
    const results = await progressService.getAllTimeProgress(goalsToUse);
    // Filter out goals with 0 minutes logged
    const mapped = results.filter(d => d.value > 0);
    setAllTimeData(mapped);
  } catch {
    toast.error('Failed to load all-time data');
  } finally {
    setAllTimeLoading(false);
  }
};

// When user switches range
const handleDonutRangeChange = (range) => {
  setDonutRange(range);
  if (range === 'alltime' && !allTimeData && !allTimeLoading) {
    fetchAllTimeData(goals);
  }
};

// When user switches chart tab
const handleChartToggle = (chart) => {
  setActiveChart(chart);
  // If switching to donut and alltime was previously selected, refetch if cache cleared
  if (chart === 'donut' && donutRange === 'alltime' && !allTimeData && !allTimeLoading) {
    fetchAllTimeData(goals);
  }
};

// After logging progress — Option B: just clear cache, don't refetch
const handleLogProgress = async (e) => {
  e.preventDefault();
  if (!goalId) {
    toast.error('Please select a goal first');
    return;
  }
  try {
    setLoading(true);
    await progressService.logProgress({
      completedMinutes: Number(minutes),
      goalId,
      notes: notes.trim() || undefined
    });
    toast.success('Progress logged successfully!');
    setMinutes('');
    setNotes('');
    // Option B — clear cache, user will refetch when they visit All Time again
    setAllTimeData(null);
    fetchProg();
  } catch {
    toast.error('Failed to log progress. Please try again.');
  } finally {
    setLoading(false);
  }
};

  // Build week donut data from already-fetched weeklyGoals
  const weekDonutData = weeklyGoals
    .map(g => ({ name: g.subject, value: g.totalMinutes || 0 }))
    .filter(d => d.value > 0);

  const donutData = donutRange === 'week' ? weekDonutData : (allTimeData || []);
  const donutEmpty = donutData.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Your Progress</h1>
        <p className="text-slate-400 mt-1">Consistency is key. See how you're doing this week.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart Card */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">

          {/* Tab Toggle */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
              <button
                onClick={() => handleChartToggle('bar')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeChart === 'bar'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                📊 Daily Minutes
              </button>
              <button
                onClick={() => handleChartToggle('donut')}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  activeChart === 'donut'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🎯 Goal Focus
              </button>
            </div>

            {/* Time range toggle — only visible on donut tab */}
            <AnimatePresence>
              {activeChart === 'donut' && (
                <motion.div
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="flex bg-slate-800 rounded-xl p-1 gap-1"
                >
                  <button
                    onClick={() => handleDonutRangeChange('week')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      donutRange === 'week'
                        ? 'bg-slate-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    This Week
                  </button>
                  <button
                    onClick={() => handleDonutRangeChange('alltime')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      donutRange === 'alltime'
                        ? 'bg-slate-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Time
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Charts */}
          <div className="h-80 w-full">
            <AnimatePresence mode="wait">
              {activeChart === 'bar' ? (
                <motion.div
                  key="bar"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} dy={10} />
                      <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: '#1e293b' }}
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                        formatter={(value) => [`${value} mins (${toHoursLabel(value)})`, 'Study Time']}
                      />
                      <Bar dataKey="mins" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              ) : (
                <motion.div
                  key="donut"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-full flex items-center justify-center"
                >
                  {allTimeLoading ? (
                    <div className="text-slate-500 text-sm">Loading all-time data...</div>
                  ) : donutEmpty ? (
                    <div className="text-center">
                      <p className="text-slate-500 text-sm">No progress logged {donutRange === 'week' ? 'this week' : 'yet'}.</p>
                      <p className="text-slate-600 text-xs mt-1">Log a session to see your goal focus.</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={130}
                          paddingAngle={3}
                          dataKey="value"
                          labelLine={false}
                          label={CustomDonutLabel}
                        >
                          {donutData.map((_, idx) => (
                            <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomDonutTooltip />} />
                        <Legend
                          formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
                          iconType="circle"
                          iconSize={8}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Log Progress Sidebar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Clock size={20} />
            </div>
            <h2 className="text-lg font-bold text-white">Log Session</h2>
          </div>

          <form onSubmit={handleLogProgress} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Minutes Studied</label>
              <input
                type="number"
                min="1"
                required
                value={minutes}
                onChange={e => setMinutes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="E.g. 90"
              />
              <ConversionBadge minutes={minutes} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Select Goal</label>
              {goals.length > 0 ? (
                <select
                  value={goalId}
                  onChange={e => setGoalId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                >
                  {goals.map(g => (
                    <option key={g._id} value={g._id}>{g.subject}</option>
                  ))}
                </select>
              ) : (
                <div className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-400">
                  No active goals found.
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Notes <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                placeholder="E.g. Covered chapters 3 and 4..."
              />
            </div>
            <button
              type="submit"
              disabled={loading || goals.length === 0}
              className="w-full mt-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium py-3 rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Progress'}
            </button>
          </form>
        </div>
      </div>

      {/* Weekly Goal Summary Cards */}
      {weeklyGoals.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <TrendingUp size={20} />
            </div>
            <h2 className="text-xl font-bold text-white">This Week's Breakdown</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeklyGoals.map((g, idx) => {
              const target = g.weeklyTarget || 0;
              const total = g.totalMinutes || 0;
              const percentage = target > 0 ? Math.min((total / target) * 100, 100) : 0;
              const remaining = Math.max(target - total, 0);
              const exceeded = total > target;

              const barColor = percentage >= 100
                ? 'bg-emerald-500'
                : percentage >= 60
                  ? 'bg-blue-500'
                  : percentage >= 30
                    ? 'bg-amber-500'
                    : 'bg-red-500';

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      {/* Color dot matching donut chart */}
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                      />
                      <h3 className="text-white font-semibold">{g.subject}</h3>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${exceeded ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>
                      {exceeded ? '🎉 Exceeded' : 'In Progress'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{total} mins ({toHoursLabel(total)}) this week</span>
                      <span>{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-full ${barColor}`}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className={exceeded ? 'text-emerald-400' : 'text-slate-500'}>
                        {exceeded
                          ? `+${total - target} mins (${toHoursLabel(total - target)}) over target`
                          : `${remaining} mins (${toHoursLabel(remaining)}) remaining`}
                      </span>
                      <span className="text-slate-500">Target: {target} mins ({toHoursLabel(target)})</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;