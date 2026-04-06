import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Eye, EyeOff, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 overflow-hidden relative">
      {/* Animated Background Mesh */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[150px] -z-10 -translate-x-1/4 translate-y-1/4" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full glass-card p-8 relative"
      >
        <div className="flex flex-col items-center mb-10">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="bg-indigo-500 p-3.5 rounded-2xl mb-5 shadow-[0_0_30px_rgba(99,102,241,0.3)] border border-indigo-400/30"
          >
            <Zap className="h-9 w-9 text-white" fill="currentColor" />
          </motion.div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            SmartEnergy Portal
          </h2>
          <p className="text-sm text-slate-400 mt-2 font-medium">Control your ecosystem with precision</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center font-medium"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2 shrink-0 animate-pulse" />
            {error}
          </motion.div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="group relative">
            <label className="text-xs uppercase font-bold text-slate-500 mb-2 block tracking-wider group-focus-within:text-indigo-400 transition-colors">Username</label>
            <input 
              type="text" 
              required
              placeholder="e.g. arjun@energy"
              className="glass-input w-full group-focus-within:neon-glow-blue"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="group relative">
            <label className="text-xs uppercase font-bold text-slate-500 mb-2 block tracking-wider group-focus-within:text-indigo-400 transition-colors">Password</label>
            <div className="relative">
              <input 
                type={showPass ? "text" : "password"} 
                required
                placeholder="••••••••"
                className="glass-input w-full pr-12 group-focus-within:neon-glow-blue"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors"
              >
                {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-4 px-4 bg-gradient-to-r from-indigo-600 topurple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-sm font-bold shadow-2xl shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:grayscale"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <div className="flex items-center space-x-2">
                <span>Sign In to System</span>
                <ArrowRight className="h-4 w-4" />
              </div>
            )}
          </motion.button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500 font-medium">
          New terminal user?{' '}
          <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
            Register Account
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
