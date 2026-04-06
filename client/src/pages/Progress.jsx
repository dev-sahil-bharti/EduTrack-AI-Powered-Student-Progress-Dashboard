import React, { useEffect, useState } from 'react';
import { progressService } from '../services/progress.service';
import { goalService } from '../services/goal.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';
import { Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const mockChartData = Array.from({ length: 7 }).map((_, i) => ({
  name: format(subDays(new Date(), 6 - i), 'EEE'),
  hours: Math.floor(Math.random() * 5) + 1
}));

const Progress = () => {
  const [loading, setLoading] = useState(false);
  const [weeklyData, setWeeklyData] = useState(mockChartData);
  const [hours, setHours] = useState('');
  const [goalId, setGoalId] = useState('');

  const [goals, setGoals] = useState([]);

  const fetchProg = async () => {
    try {
      const data = await progressService.getWeeklyProgress();
      const payload = data.data || data;
      
      const dailyHours = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
      
      payload.goals?.forEach(goal => {
        goal.entries?.forEach(entry => {
          const date = new Date(entry.date || entry.createdAt);
          const dayName = format(date, 'EEE');
          if (dailyHours[dayName] !== undefined) {
             dailyHours[dayName] += (entry.completedMinutes / 60);
          }
        });
      });

      const chartData = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(new Date(), 6 - i);
        const dayName = format(d, 'EEE');
        return {
          name: dayName,
          hours: Number(dailyHours[dayName].toFixed(1))
        };
      });
      setWeeklyData(chartData);
    } catch {
      toast.error('Failed to load chart data');
    }
  };

  const loadGoals = async () => {
    try {
      const gs = await goalService.getGoals();
      const goalsList = gs.data || gs || [];
      setGoals(goalsList);
      if (goalsList.length > 0) {
        setGoalId(goalsList[0]._id);
      }
    } catch {
      console.error('Failed to load goals');
    }
  };

  useEffect(() => {
    fetchProg();
    loadGoals();
  }, []);

  const handleLogProgress = async (e) => {
    e.preventDefault();
    if (!goalId) {
      toast.error('Please select a goal first');
      return;
    }
    try {
      setLoading(true);
      await progressService.logProgress({ completedMinutes: Number(hours) * 60, goalId });
      toast.success('Progress logged successfully!');
      setHours('');
      fetchProg(); // Refresh the chart
    } catch (err) {
      toast.error('Failed to log progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Your Progress</h1>
        <p className="text-slate-400 mt-1">Consistency is key. See how you're doing this week.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Study Hours (Last 7 Days)</h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" axisLine={false} tickLine={false} dy={10} />
                <YAxis stroke="#64748b" axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: '#1e293b' }}
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="hours" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
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
              <label className="block text-sm font-medium text-slate-300 mb-1">Hours Studied</label>
              <input 
                type="number" 
                step="0.5"
                required
                value={hours}
                onChange={e => setHours(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none"
                placeholder="2.5"
              />
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
                    <option key={g._id} value={g._id}>
                      {g.subject}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-400">
                  No active goals found.
                </div>
              )}
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium py-3 rounded-xl hover:shadow-lg hover:shadow-purple-500/20 transition-all disabled:opacity-50"
            >
              Save Progress
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Progress;
