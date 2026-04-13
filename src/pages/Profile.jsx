import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Key, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name };
      if (password) payload.password = password;
      
      await updateUserProfile(payload);
      toast.success('Profile updated successfully');
      setPassword(''); // Clear password field after update
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <User className="text-blue-400" size={32} />
          Profile Settings
        </h1>
        <p className="text-slate-400 mt-1">Manage your account details and security.</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Personal Information</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Your Name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <input 
                  type="email" 
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-2.5 text-slate-500 cursor-not-allowed outline-none"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Email address cannot be changed.</p>
            </div>
          </div>

          <div className="h-px bg-slate-800 w-full my-6"></div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Security</h2>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">New Password (Optional)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Key size={18} />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Leave blank to keep current"
                  minLength="6"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl transition-colors font-medium shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              <Save size={18} />
              <span>{loading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
