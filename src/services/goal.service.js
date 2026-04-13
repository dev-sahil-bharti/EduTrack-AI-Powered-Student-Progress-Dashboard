import api from '../api/axios';

export const goalService = {
  getGoals: async () => {
    const response = await api.get('/goals');
    return response.data;
  },
  
  createGoal: async (goalData) => {
    const response = await api.post('/goals', goalData);
    return response.data;
  },

  updateGoal: async (id, goalData) => {
    const response = await api.put(`/goals/${id}`, goalData);
    return response.data;
  },

  markCompleted: async (id) => {
    const response = await api.patch(`/goals/${id}/complete`);
    return response.data;
  },

  deleteGoal: async (id) => {
    const response = await api.delete(`/goals/${id}`);
    return response.data;
  }
};
