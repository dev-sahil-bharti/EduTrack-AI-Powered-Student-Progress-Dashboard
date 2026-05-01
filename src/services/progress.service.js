import api from '../api/axios';

export const progressService = {
  logProgress: async (progressData) => {
    const response = await api.post('/progress', progressData);
    return response.data;
  },

  getWeeklyProgress: async () => {
    const response = await api.get('/progress/weekly');
    return response.data;
  },

  getAllProgress: async () => {
    const response = await api.get('/progress/all');
    return response.data;
  },

  getProgressByGoal: async (goalId) => {
    const response = await api.get(`/progress/${goalId}`);
    return response.data;
  },

  // Returns [{ goalId, subject, totalMinutes }] — keyed by goalId, not position
  getAllTimeProgress: async (goals) => {
    const results = await Promise.all(
      goals.map(goal =>
        api.get(`/progress/${goal._id}`)
          .then(r => {
            const entries = r.data?.data || r.data || [];
            const total = entries.reduce((sum, e) => sum + e.completedMinutes, 0);
            return { goalId: goal._id, name: goal.subject, value: total };
          })
          .catch(() => ({ goalId: goal._id, name: goal.subject, value: 0 }))
      )
    );
    return results;
  }
};