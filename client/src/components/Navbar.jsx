import { useAuth } from '../context/AuthContext';
import { Menu, Bell, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Navbar = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="h-20 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 sticky top-0 z-10 w-full">
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors pointer-events-auto"
        >
          <Menu size={24} />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-xl font-bold bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            EduTrack AI
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
          <Link to="/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.name || 'Student'}</p>
              <p className="text-xs text-slate-400">{user?.role || 'Learner'}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
              {user?.name?.[0]?.toUpperCase() || <User size={20}/>}
            </div>
          </Link>
          
          <button 
            onClick={logout}
            className="ml-2 text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
