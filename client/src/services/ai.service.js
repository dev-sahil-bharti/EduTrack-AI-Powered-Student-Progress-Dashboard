import api from '../api/axios';

export const aiService = {
  getReports: async () => {
    const response = await api.get('/ai/reports');
    return response.data;
  },
  
  generateWeeklyReport: async () => {
    const response = await api.post('/ai/weekly-report');
    return response.data;
  }
};
