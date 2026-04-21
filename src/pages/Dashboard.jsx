import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { goalService } from '../services/goal.service';
import { progressService } from '../services/progress.service';
import { aiService } from '../services/ai.service';
import { Link } from 'react-router-dom';
import { 
  Target, TrendingUp, Sparkles, BookOpen, 
  Clock, Plus, Calendar, ArrowUpRight, 
  CheckCircle2, Flame, PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, CartesianGrid, PieChart, Pie, Legend
} from 'recharts';
import { format, subDays } from 'date-fns';
import AIReportModal from '../components/AIReportModal';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316'];

const Dashboard = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState(null);
  const [allProgress, setAllProgress] = useState([]);
  const [latestReport, setLatestReport] = useState(null);
  const [reportsCount, setReportsCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [goalsData, progressData, aiData, allProgressData] = await Promise.all([
          goalService.getGoals(),
          progressService.getWeeklyProgress(),
          aiService.getReports(),
          progressService.getAllProgress()
        ]);

        setGoals(goalsData.data || goalsData);
        setWeeklyProgress(progressData.data || progressData);
        setAllProgress(allProgressData.data || allProgressData || []);
        
        const aiList = aiData.data || aiData;
        setReportsCount(aiList.length);
        if (aiList.length > 0) {
          setLatestReport(aiList[0]);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Process data for the chart
  const chartData = useMemo(() => {
    if (!weeklyProgress) return [];
    
    const dailyMins = { 'Sun': 0, 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0 };
    
    weeklyProgress.goals?.forEach(goal => {
      goal.entries?.forEach(entry => {
        const date = new Date(entry.date || entry.createdAt);
        const dayName = format(date, 'EEE');
        if (dailyMins[dayName] !== undefined) {
          dailyMins[dayName] += entry.completedMinutes;
        }
      });
    });

    return Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      const dayName = format(d, 'EEE');
      return {
        name: dayName,
        mins: dailyMins[dayName] || 0,
        fullDate: format(d, 'MMM dd')
      };
    });
  }, [weeklyProgress]);

  // Process data for the Pie Chart (Goal Focus)
  const pieData = useMemo(() => {
    if (!allProgress.length) return [];
    const subjects = {};
    allProgress.forEach(entry => {
      const subject = entry.goalId?.subject || 'Unknown';
      subjects[subject] = (subjects[subject] || 0) + entry.completedMinutes;
    });
    return Object.entries(subjects)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [allProgress]);

  // Process data for the Horizontal Bar Chart (Subject Comparison)
  const comparisonData = useMemo(() => {
    return pieData.slice(0, 5); // Top 5 subjects
  }, [pieData]);

  // Flatten recent activity
  const recentActivity = useMemo(() => {
    if (!weeklyProgress) return [];
    const activities = [];
    weeklyProgress.goals?.forEach(goal => {
      goal.entries?.forEach(entry => {
        activities.push({
          ...entry,
          subject: goal.subject,
          timestamp: new Date(entry.date || entry.createdAt)
        });
      });
    });
    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);
  }, [weeklyProgress]);

  const totalWeeklyMinutes = weeklyProgress?.goals?.reduce((sum, g) => sum + g.totalMinutes, 0) || 0;
  const studyHours = (totalWeeklyMinutes / 60).toFixed(1);
  const activeGoals = goals.filter(g => !g.isCompleted);
  const tasksCompleted = goals.filter(g => g.isCompleted).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const stats = [
    { name: 'Active Goals', value: activeGoals.length, icon: Target, color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20' },
    { name: 'Hours Studied', value: studyHours, icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/20' },
    { name: 'Done This Week', value: tasksCompleted, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
    { name: 'Current Streak', value: '5 Days', icon: Flame, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Calendar size={16} />
            <span className="text-sm font-medium">{format(new Date(), 'EEEE, MMMM do')}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
            {getGreeting()}, <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-400 to-purple-400">{user?.name?.split(' ')[0] || 'Student'}</span>!
          </h1>
          <p className="text-slate-400 mt-1 max-w-md">Your progress is looking steady. You tasks for today are ready to view.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/progress" className="hidden sm:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2.5 rounded-xl transition-all font-medium text-slate-300">
            <TrendingUp size={18} />
            <span>Analyze</span>
          </Link>
          <Link to="/goals" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl transition-all font-medium shadow-lg shadow-indigo-500/25">
            <Plus size={20} />
            <span>New Goal</span>
          </Link>
        </div>
      </div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Stats Row */}
        {stats.map((stat, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={stat.name}
            className={`bg-slate-900/40 backdrop-blur-xl border ${stat.border} p-6 rounded-3xl group hover:bg-slate-800/60 transition-all cursor-default shadow-sm shadow-slate-950/20`}
          >
            <div className="flex items-center gap-4">
              <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={22} className="stroke-[2.5]" />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">{stat.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white tracking-tight">{stat.value}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Activity Chart — Bento Large Item */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="md:col-span-2 lg:col-span-3 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[2.5rem] p-8 flex flex-col md:flex-row gap-8 overflow-hidden relative"
        >
          <div className="flex-1">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
                  Daily Activity
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Live</span>
                </h2>
                <p className="text-slate-400 text-sm">Minutes spent studying each day</p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/50 border border-slate-800 p-1 rounded-lg">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full"></div>
                <span className="text-xs text-slate-300 pr-2">Study time</span>
              </div>
            </div>
            
            <div className="h-48 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#475569" 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10} 
                    fontSize={12}
                    fontWeight={500}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      border: '1px solid #334155', 
                      borderRadius: '12px',
                      padding: '8px 12px',
                    }}
                    itemStyle={{ color: '#fff', fontSize: '12px' }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)', radius: 4 }}
                  />
                  <Bar dataKey="mins" radius={[6, 6, 4, 4]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === chartData.length - 1 ? '#6366f1' : '#312e81'} 
                        className="hover:fill-indigo-400 transition-all duration-300"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="w-full md:w-56 shrink-0 flex flex-col justify-center gap-6 border-l border-slate-800/50 md:pl-8">
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Weekly Target</p>
              <h3 className="text-3xl font-black text-white">72%</h3>
              <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className="w-[72%] h-full bg-linear-to-r from-indigo-500 to-purple-500 rounded-full"></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-indigo-500/30 rounded-full overflow-hidden">
                  <div className="w-full h-1/2 bg-indigo-500"></div>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Total Minutes</p>
                  <p className="font-bold text-white">{totalWeeklyMinutes}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 bg-emerald-500/30 rounded-full overflow-hidden">
                  <div className="w-full h-3/4 bg-emerald-500"></div>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Best Session</p>
                  <p className="font-bold text-white">120m</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI Insight Card — Specialty Bento Card */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-linear-to-br from-indigo-600/20 to-purple-600/30 backdrop-blur-2xl border border-indigo-500/20 rounded-[2.5rem] p-8 relative overflow-hidden flex flex-col justify-between group"
        >
          <div className="absolute top-0 right-0 p-8 text-indigo-400 opacity-20 group-hover:scale-125 transition-transform duration-700">
             <Sparkles size={120} />
          </div>
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-indigo-200 text-[10px] font-bold uppercase tracking-wider mb-6 border border-white/5">
              <Sparkles size={12} className="text-indigo-300" />
              AI Insight
            </div>
            <h2 className="text-2xl font-bold text-white mb-4 pr-12 leading-tight">
              Optimize your learning path
            </h2>
            <p className="text-slate-300/80 leading-relaxed text-sm line-clamp-5">
              {latestReport ? latestReport.aiSummary : "No AI report available yet. Log some progress to generate your first AI report!"}
            </p>
          </div>

          <button
            onClick={() => latestReport && setShowModal(true)}
            disabled={!latestReport}
            className="group/btn mt-8 flex items-center justify-between w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white text-sm font-semibold transition-all backdrop-blur-xl disabled:opacity-40"
          >
            <span>Read full analysis</span>
            <div className="bg-white/20 p-2 rounded-xl group-hover/btn:translate-x-1 transition-transform">
              <ArrowUpRight size={18} />
            </div>
          </button>
        </motion.div>

        {/* Goal Focus (Pie Chart) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[2.5rem] p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <PieIcon size={20} className="text-purple-400" />
              Goal Focus
            </h2>
            <span className="text-xs text-slate-500 font-medium">All-time distribution</span>
          </div>
          
          <div className="h-64 w-full">
            {pieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 italic">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle"
                    formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Subject Comparison (Bar Chart) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[2.5rem] p-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <BarChart3 size={20} className="text-sky-400" />
              Subject Comparison
            </h2>
            <span className="text-xs text-slate-500 font-medium">Total minutes logged</span>
          </div>

          <div className="h-64 w-full">
             {comparisonData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 italic">No logs found</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} opacity={0.2} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="#94a3b8" 
                    fontSize={12} 
                    axisLine={false} 
                    tickLine={false}
                    width={80}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                    {comparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Recent Goals Section */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[2.5rem] p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white tracking-wide">Active Goals</h2>
            <Link to="/goals" className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 text-xs font-semibold transition-all">
              View All
            </Link>
          </div>

          <div className="grid gap-3">
            {activeGoals.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/20 rounded-3xl border border-dashed border-slate-800">
                <BookOpen className="mx-auto text-slate-700 mb-3" size={32} />
                <p className="text-slate-500 font-medium italic">No active goals yet.</p>
              </div>
            ) : (
              activeGoals.slice(0, 3).map((goal) => (
                <div key={goal._id} className="flex items-center justify-between p-5 rounded-3xl bg-slate-800/30 border border-white/5 hover:border-slate-700 hover:bg-slate-800/50 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-400 border border-slate-800">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold group-hover:text-indigo-300 transition-colors">{goal.subject}</h3>
                      <p className="text-slate-500 text-xs mt-0.5">{goal.weeklyTarget ? `${goal.weeklyTarget} mins / week` : 'Flexible goal'}</p>
                    </div>
                  </div>
                  <div className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    Ongoing
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800/50 rounded-[2.5rem] p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white tracking-wide">Activity History</h2>
            <div className="p-1 px-2.5 bg-indigo-500/10 rounded-lg text-indigo-400 text-[10px] font-black uppercase tracking-widest">
              Last 5 Logs
            </div>
          </div>

          <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800/50">
            {recentActivity.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-medium italic">
                Start logging your progress to see history.
              </div>
            ) : (
              recentActivity.map((log, idx) => (
                <div key={idx} className="flex items-start gap-5 relative group">
                  <div className="w-9 h-9 shrink-0 relative bg-slate-900 rounded-full border-2 border-slate-800 flex items-center justify-center text-slate-500 z-10 group-hover:border-indigo-500/50 group-hover:bg-slate-800 transition-all">
                    <Clock size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="text-white font-bold text-sm truncate pr-2">{log.subject}</h4>
                      <time className="text-[10px] text-slate-500 font-bold uppercase shrink-0">
                        {format(log.timestamp, 'HH:mm')} • {format(log.timestamp, 'MMM dd')}
                      </time>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed mb-2">
                       Logged <span className="text-indigo-300 font-bold">{log.completedMinutes} mins</span> of learning.
                    </p>
                    {log.notes && (
                      <div className="bg-slate-950/50 p-2.5 px-4 rounded-xl border border-white/5 text-xs text-slate-500 italic max-w-md">
                        "{log.notes}"
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {showModal && (
        <AIReportModal
          report={latestReport}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;