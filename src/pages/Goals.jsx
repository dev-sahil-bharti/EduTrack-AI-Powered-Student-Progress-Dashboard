import React, { useEffect, useState } from 'react';
import { goalService } from '../services/goal.service';
import { Plus, CheckCircle, Circle, Trash2, Target, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
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
      setGoals(res.data || res || []);
    } catch (err) {
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

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
      fetchGoals();
    } catch {
      toast.error('Failed to delete goal');
    }
  };

  const handleComplete = async (id) => {
    try {
      await goalService.markCompleted(id);
      toast.success('Goal completed!');
      fetchGoals();
    } catch {
      toast.error('Failed to update goal');
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
      fetchGoals();
    } catch {
      toast.error('Failed to update goal');
    }
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
          goals.map((goal, idx) => {
            const isCompleted = goal.status === 'completed';
            return (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={goal._id}
                className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${isCompleted ? 'bg-slate-900/50 border-slate-800/50 opacity-75' : 'bg-slate-900 border-slate-800 shadow-sm'}`}
              >
                <button 
                  onClick={() => handleComplete(goal._id)}
                  className={`mt-1 shrink-0 transition-colors ${isCompleted ? 'text-emerald-500' : 'text-slate-500 hover:text-blue-400'}`}
                >
                  {isCompleted ? <CheckCircle size={24} /> : <Circle size={24} />}
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
                      <input
                        type="number"
                        value={editWeeklyTarget}
                        onChange={e => setEditWeeklyTarget(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Weekly Target (minutes)"
                        required
                        min="1"
                      />
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => handleUpdate(goal._id)} className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg font-medium hover:bg-blue-500 transition-colors">Save</button>
                        <button onClick={() => setEditingId(null)} className="text-sm text-slate-400 hover:text-white px-3 py-1.5 transition-colors">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className={`text-lg font-semibold transition-all ${isCompleted ? 'text-slate-400 line-through' : 'text-white'}`}>
                        {goal.subject}
                      </h3>
                      {goal.weeklyTarget && (
                        <p className="text-slate-400 text-sm mt-1 mb-3 pr-4">{goal.weeklyTarget} mins / week</p>
                      )}
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                          {isCompleted ? 'Done' : 'In Progress'}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="shrink-0 ml-4 flex gap-1">
                  {editingId !== goal._id && (
                    <button onClick={() => startEdit(goal)} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-slate-800 rounded-lg transition-colors" title="Edit Goal">
                      <Edit2 size={20} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(goal._id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors" title="Delete Goal">
                    <Trash2 size={20} />
                  </button>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  );
};

export default Goals;
