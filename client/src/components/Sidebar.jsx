import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Zap, BarChart3, LogOut, ChevronRight, Settings, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for Tailwind classes
const cn = (...inputs) => twMerge(clsx(inputs));

const Sidebar = () => {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'Devices', icon: Zap, path: '/devices' },
    { name: 'Analytics', icon: Activity, path: '/analytics' },
    { name: 'Reports', icon: BarChart3, path: '/reports' },
  ];

  return (
    <motion.aside 
      initial={{ x: -250, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-0 top-0 h-full w-64 bg-[#0f172a] shadow-2xl z-50 border-r border-white/5 space-y-8 py-8 flex flex-col"
    >
      <div className="px-8 flex items-center space-x-3 group cursor-pointer" onClick={() => navigate('/')}>
        <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2 rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
          <Zap className="text-white h-6 w-6" fill="currentColor" />
        </div>
        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          SmartEnergy
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-2 pt-8">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group transition-all",
              isActive 
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
                : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("h-5 w-5", isActive ? "text-indigo-400" : "group-hover:text-white")} />
                <span className="flex-1">{item.name}</span>
                {isActive && <motion.div layoutId="sidebar-active" className="h-1.5 w-1.5 rounded-full bg-indigo-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 pb-8 space-y-4">
        <div className="mx-4 p-4 rounded-xl bg-slate-900 border border-white/5 shadow-inner">
           <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider mb-2">Logged In As</p>
           <div className="flex items-center space-x-3 overflow-hidden">
             <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 border border-indigo-500/20">
               {user?.username?.charAt(0).toUpperCase()}
             </div>
             <span className="truncate text-sm font-medium text-slate-300">{user?.username}</span>
           </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all group"
        >
          <LogOut className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          <span>Logout</span>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
