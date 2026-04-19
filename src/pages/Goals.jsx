// pages/Goal.jsx
import React, { useEffect, useState } from 'react';
import { goalService } from '../services/goal.service';
import { progressService } from '../services/progress.service';
import { Plus, Circle, Trash2, Target, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Converts minutes to "Xh Ym" format
const toHoursLabel = (mins) => {
  if (!mins || mins <= 0) return null;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// Live conversion badge shown below minute inputs
const ConversionBadge = ({ minutes }) => {
  const mins = Number(minutes);
  if (!mins || mins <= 0) return null;
  return (
    <p className="text-xs text-blue-400 mt-1.5 flex items-center gap-1">
      💡 <span>{mins} mins = <span className="font-semibold">{toHoursLabel(mins)}</span></span>
    </p>
  );
};

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Progress state — { [goalId]: { totalMinutes, loaded, loading } }
  const [progressMap, setProgressMap] = useState({});

  // Expanded card state
  const [expandedId, setExpandedId] = useState(null);

  // Form State
  const [newSubject, setNewSubject] = useState('');
  const [newWeeklyTarget, setNewWeeklyTarget] = useState('');

  // Edit State
  const [editingId, setEditingId] = useState(null);
  const [editSubject, setEditSubject] = useState('');
  const [editWeeklyTarget, setEditWeeklyTarget] = useState('');

  const fetchGoals = async () => {
    try {
      const res = await goalService.getGoals();
      const allGoals = res.data || res || [];
      setGoals(allGoals.filter(g => !g.isCompleted));
    } catch (err) {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleExpand = async (goalId) => {
    if (expandedId === goalId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(goalId);
    if (progressMap[goalId]?.loaded) return;

    setProgressMap(prev => ({ ...prev, [goalId]: { totalMinutes: 0, loaded: false, loading: true } }));

    try {
      const res = await progressService.getProgressByGoal(goalId);
      const entries = res.data || res || [];
      const totalMinutes = entries.reduce((sum, e) => sum + e.completedMinutes, 0);
      setProgressMap(prev => ({ ...prev, [goalId]: { totalMinutes, loaded: true, loading: false } }));
    } catch {
      toast.error('Failed to load progress');
      setProgressMap(prev => ({ ...prev, [goalId]: { totalMinutes: 0, loaded: true, loading: false } }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await goalService.createGoal({ subject: newSubject, weeklyTarget: Number(newWeeklyTarget) });
      toast.success('Goal created!');
      setNewSubject('');
      setNewWeeklyTarget('');
      setShowForm(false);
      fetchGoals();
    } catch (err) {
      toast.error('Failed to create goal');
    }
  };

  const handleDelete = async (id) => {
    try {
      await goalService.deleteGoal(id);
      toast.success('Goal deleted');
      setProgressMap(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
      fetchGoals();
    } catch {
      toast.error('Failed to delete goal');
    }
  };

  const handleComplete = async (id) => {
    try {
      await goalService.markCompleted(id);
      toast.success('Goal completed! 🎉');
      setGoals(prev => prev.filter(g => g._id !== id));
      setProgressMap(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (err) {
      if (err.response?.status === 400) {
        toast.error('Goal is already completed');
      } else {
        toast.error('Failed to update goal');
      }
    }
  };

  const startEdit = (goal) => {
    setEditingId(goal._id);
    setEditSubject(goal.subject);
    setEditWeeklyTarget(goal.weeklyTarget || '');
  };

  const handleUpdate = async (id) => {
    try {
      await goalService.updateGoal(id, { subject: editSubject, weeklyTarget: Number(editWeeklyTarget) });
      toast.success('Goal updated!');
      setEditingId(null);
      setGoals(prev => prev.map(g =>
        g._id === id
          ? { ...g, subject: editSubject, weeklyTarget: Number(editWeeklyTarget) }
          : g
      ));
    } catch {
      toast.error('Failed to update goal');
    }
  };

  const ProgressBar = ({ goalId, weeklyTarget }) => {
    const data = progressMap[goalId];

    if (!data || data.loading) {
      return (
        <div className="mt-4 space-y-2">
          <div className="h-2 bg-slate-700 rounded-full animate-pulse" />
          <p className="text-slate-500 text-xs">Loading progress...</p>
        </div>
      );
    }

    const total = data.totalMinutes;
    const target = weeklyTarget || 0;
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
      <div className="mt-4 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-400">
            {/* Show both mins and hours */}
            {total} mins ({toHoursLabel(total)}) logged
          </span>
          <span className={exceeded ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
            {exceeded
              ? `🎉 Exceeded by ${total - target} mins (${toHoursLabel(total - target)})`
              : `${remaining} mins (${toHoursLabel(remaining)}) remaining`}
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full ${barColor}`}
          />
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500">{percentage.toFixed(1)}% complete</span>
          {/* Show both mins and hours for target too */}
          <span className="text-slate-500">Target: {target} mins ({toHoursLabel(target)})</span>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Your Goals</h1>
          <p className="text-slate-400 mt-1">Set targets and track your achievements.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-lg shadow-blue-500/20"
        >
          <Plus size={20} />
          <span>New Goal</span>
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl overflow-hidden"
            onSubmit={handleCreate}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Goal Subject</label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="E.g., Complete Math Assignment"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Weekly Target (minutes)</label>
                <input
                  type="number"
                  value={newWeeklyTarget}
                  onChange={e => setNewWeeklyTarget(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="E.g., 120"
                  required
                  min="1"
                />
                {/* Live conversion badge */}
                <ConversionBadge minutes={newWeeklyTarget} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-500 transition-colors">Save Goal</button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-slate-500">Loading goals...</div>
        ) : goals.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl">
            <Target className="mx-auto h-12 w-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white">No active goals</h3>
            <p className="text-slate-400 mt-1">Get started by creating your first study goal.</p>
          </div>
        ) : (
          goals.map((goal, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={goal._id}
              className="p-5 rounded-2xl border bg-slate-900 border-slate-800 shadow-sm"
            >
              {/* Top Row */}
              <div className="flex items-start gap-4">
                <button
                  onClick={() => handleComplete(goal._id)}
                  className="mt-1 shrink-0 text-slate-500 hover:text-emerald-400 transition-colors"
                  title="Mark as completed"
                >
                  <Circle size={24} />
                </button>

                <div className="flex-1 min-w-0">
                  {editingId === goal._id ? (
                    <div className="space-y-3 pr-4">
                      <input
                        type="text"
                        value={editSubject}
                        onChange={e => setEditSubject(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Goal Subject"
                        required
                      />
                      <div>
                        <input
                          type="number"
                          value={editWeeklyTarget}
                          onChange={e => setEditWeeklyTarget(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="Weekly Target (minutes)"
                          required
                          min="1"
                        />
                        {/* Live conversion badge in edit mode */}
                        <ConversionBadge minutes={editWeeklyTarget} />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => handleUpdate(goal._id)} className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-blue-500 transition-colors">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-sm text-slate-400 hover:text-white px-3 py-1.5 transition-colors">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-lg font-semibold text-white">{goal.subject}</h3>
                      {goal.weeklyTarget && (
                        // Show both mins and hours in goal card
                        <p className="text-slate-400 text-sm mt-1">
                          {goal.weeklyTarget} mins ({toHoursLabel(goal.weeklyTarget)}) target
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                          In Progress
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="shrink-0 ml-2 flex gap-1 items-center">
                  {editingId !== goal._id && (
                    <>
                      <button onClick={() => startEdit(goal)} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors" title="Edit Goal">
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleExpand(goal._id)}
                        className="p-2 text-slate-500 hover:text-purple-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="View Progress"
                      >
                        {expandedId === goal._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </>
                  )}
                  <button onClick={() => handleDelete(goal._id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors" title="Delete Goal">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Expandable Progress Section */}
              <AnimatePresence>
                {expandedId === goal._id && editingId !== goal._id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden pl-10"
                  >
                    <ProgressBar goalId={goal._id} weeklyTarget={goal.weeklyTarget} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default Goals;