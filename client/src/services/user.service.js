import api from '../api/axios';

export const userService = {
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },
  
  updateProfile: async (profileData) => {
    const response = await api.put('/user/profile', profileData);
    return response.data;
  }
};
