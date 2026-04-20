import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { goalService } from '../services/goal.service';
import { progressService } from '../services/progress.service';
import { aiService } from '../services/ai.service';
import { Link } from 'react-router-dom';
import { Target, TrendingUp, Sparkles, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import AIReportModal from '../components/AIReportModal';

const Dashboard = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [weeklyProgress, setWeeklyProgress] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [reportsCount, setReportsCount] = useState(0);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const goalsData = await goalService.getGoals();
        const allGoals = goalsData.data || goalsData;
        setGoals(allGoals);

        const progressData = await progressService.getWeeklyProgress();
        setWeeklyProgress(progressData.data || progressData);

        const aiData = await aiService.getReports();
        const aiList = aiData.data || aiData;
        setReportsCount(aiList.length);
        if (aiList.length > 0) {
          setLatestReport(aiList[0]);
        }
      } catch (err) {
        console.error("Failed to load dashboard data");
      }
    };
    fetchData();
  }, []);

  const totalWeeklyMinutes = weeklyProgress?.goals?.reduce((sum, g) => sum + g.totalMinutes, 0) || 0;
  const studyHours = (totalWeeklyMinutes / 60).toFixed(1);

  // Correctly use isCompleted field from backend
  const activeGoals = goals.filter(g => !g.isCompleted);
  const tasksCompleted = goals.filter(g => g.isCompleted).length;

  const stats = [
    { name: 'Active Goals', value: activeGoals.length, icon: Target, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { name: 'Study Hours (Week)', value: studyHours, icon: TrendingUp, color: 'text-purple-400', bg: 'bg-purple-400/10' },
    { name: 'Tasks Completed', value: tasksCompleted, icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { name: 'AI Insights', value: `${reportsCount} Total`, icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'Student'}!</h1>
        <p className="text-slate-400 mt-1">Here's what's happening with your learning journey today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={stat.name}
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">{stat.name}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Goals Section — only shows active, incomplete goals */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Recent Goals</h2>
            <Link to="/goals" className="text-blue-400 text-sm hover:text-blue-300">View All</Link>
          </div>

          <div className="space-y-4">
            {activeGoals.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No active goals. Time to set some!
              </div>
            ) : (
              activeGoals.slice(0, 3).map((goal) => (
                <div key={goal._id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                  <div>
                    <h3 className="text-white font-medium">{goal.subject}</h3>
                    <p className="text-slate-400 text-sm mt-1">{goal.weeklyTarget ? `${goal.weeklyTarget} mins / week` : 'No weekly target'}</p>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    In Progress
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Insight Snippet */}
        <div className="bg-linear-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
              <Sparkles size={20} />
            </div>
            <h2 className="text-lg font-bold text-white">AI Suggestion</h2>
          </div>
          <p className="text-slate-300 leading-relaxed text-sm line-clamp-4">
            {latestReport ? latestReport.aiSummary : "No AI report available yet. Log some progress to generate your first AI report!"}
          </p>
          <button
            onClick={() => latestReport && setShowModal(true)}
            className="mt-6 flex justify-center w-full py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white text-sm font-medium transition-colors backdrop-blur-md disabled:opacity-40"
            disabled={!latestReport}
          >
            View Full Report
          </button>

          {showModal && (
            <AIReportModal
              report={latestReport}
              onClose={() => setShowModal(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;