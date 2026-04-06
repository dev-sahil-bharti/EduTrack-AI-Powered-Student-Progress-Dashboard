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

  getProgressByGoal: async (goalId) => {
    const response = await api.get(`/progress/${goalId}`);
    return response.data;
  }
};
