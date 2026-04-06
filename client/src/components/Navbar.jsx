import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Zap, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-yellow-300" />
              <span className="font-bold text-xl tracking-tight">Smart Energy</span>
            </Link>
            <div className="hidden md:flex space-x-4 ml-8">
              <Link to="/" className="hover:text-indigo-200 px-3 py-2 rounded-md font-medium transition-colors">Dashboard</Link>
              <Link to="/devices" className="hover:text-indigo-200 px-3 py-2 rounded-md font-medium transition-colors">Devices</Link>
              <Link to="/reports" className="hover:text-indigo-200 px-3 py-2 rounded-md font-medium transition-colors">Reports</Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="font-semibold">{user.username}</span>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-1 bg-indigo-700 hover:bg-indigo-800 px-3 py-2 rounded-md transition"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
