import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import { io } from 'socket.io-client';
import { Activity, Zap, DollarSign, Leaf, AlertCircle, TrendingUp, Clock, Grid, Layers, Plus, CheckCircle2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'react-hot-toast';

const PRICE_PER_UNIT = 85; 

const StatCard = ({ title, value, unit, icon: Icon, color, liveValue, trend }) => {
  const safeValue = parseFloat(value) || 0;
  const safeLive = parseFloat(liveValue) || 0;
  const displayValue = isNaN(safeValue) ? "0.0000" : (safeValue + safeLive).toFixed(4);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass-card p-6 relative overflow-hidden group border-white/5 shadow-2xl"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-${color}-400/20 transition-all duration-500`} />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-2xl bg-${color}-500/10 border border-${color}-500/20 group-hover:rotate-6 transition-transform duration-500`}>
          <Icon className={`h-6 w-6 text-${color}-400`} />
        </div>
        {trend && <span className="bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-red-500/20">Peak Usage</span>}
      </div>
      <div className="relative z-10">
        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{title}</h3>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-black text-white">{displayValue}</span>
          <span className="text-[10px] font-bold text-slate-500 tracking-widest">{unit}</span>
        </div>
        {safeLive > 0 && (
          <motion.div 
            animate={{ opacity: [0.6, 1, 0.6] }} 
            transition={{ duration: 1.5, repeat: Infinity }}
            className="flex items-center space-x-2 mt-3"
          >
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Active Live Stream</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [dbData, setDbData] = useState({ totalEnergyKwh: 0, runningDevices: 0, totalCost: 0, carbonFootprint: 0 });
  const [liveMetrics, setLiveMetrics] = useState({ energy: 0, running: 0 });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [alert, setAlert] = useState('');

  const fetchData = async () => {
    try {
      const [dashRes, histRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/reports/history')
      ]);
      setDbData({
        totalEnergyKwh: parseFloat(dashRes.data.totalEnergyKwh) || 0,
        runningDevices: parseInt(dashRes.data.runningDevices) || 0,
        totalCost: parseFloat(dashRes.data.totalCost) || 0,
        carbonFootprint: parseFloat(dashRes.data.carbonFootprint) || 0
      });
      if (histRes.data && histRes.data.dailyData) {
        setChartData(histRes.data.dailyData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const socket = io('http://localhost:5000');
    api.get('/auth/me').then(res => { if (res.data?._id) socket.emit('join', res.data._id); });
    socket.on('energyUpdate', (update) => {
      const incomingEnergy = parseFloat(update.liveEnergy) || 0;
      const incomingRunning = parseInt(update.runningDevices) || 0;
      setLiveMetrics({ energy: incomingEnergy, running: incomingRunning });
      if (incomingEnergy > 5) setAlert('CRITICAL: Grid load ceiling exceeded.');
      else if (incomingRunning > 3) setAlert('NOTICE: Heavy network parallelization detected.');
      else setAlert('');
    });
    socket.on('automationEvent', () => fetchData());
    return () => socket.disconnect();
  }, []);

  const handleOptimize = async () => {
     setOptimizing(true);
     const tId = toast.loading("Analyzing grid topology...");
     try {
        const res = await api.put('/devices/action/optimize');
        toast.dismiss(tId);
        if (res.data.affected?.length > 0) {
           toast.success(`Grid Balanced: Throttled ${res.data.affected.join(', ')}`, {
              style: { background: '#0f172a', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
           });
        } else {
           toast("Grid architecture is already optimal.", { icon: '💎' });
        }
        await fetchData();
     } catch (err) {
        toast.dismiss(tId);
        toast.error(`Optimization engine handshake failed.`);
     } finally {
        setOptimizing(false);
     }
  };

  const totalSessionEnergy = (dbData.totalEnergyKwh + liveMetrics.energy);
  const totalSessionCost = (totalSessionEnergy * PRICE_PER_UNIT);
  const totalSessionCarbon = (totalSessionEnergy * 0.4);

  if (loading) return (
     <div className="flex items-center justify-center h-screen bg-[#020617]">
        <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
     </div>
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto pb-16">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
           <h1 className="text-5xl font-black tracking-tighter flex items-center gap-3">
             System <span className="text-white text-glow">Audit</span>
             {liveMetrics.running > 0 && <div className="h-3 w-3 rounded-full bg-indigo-500 animate-ping shadow-[0_0_15px_#6366f1]" />}
           </h1>
           <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-[0.3em] opacity-80 decoration-indigo-500 underline underline-offset-8">High Fidelity Grid Intelligence Dashboard</p>
        </div>
        
        <div className="flex p-1.5 bg-slate-900/50 rounded-2xl border border-white/5 backdrop-blur-xl">
           <div className="px-8 py-3 text-center border-r border-white/10">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter mb-1">Consumption Flow</p>
              <p className="text-lg font-black text-indigo-400">{totalSessionEnergy.toFixed(4)} kWh</p>
           </div>
           <div className="px-8 py-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter mb-1">Grid Saturation</p>
              <p className="text-lg font-black text-white">{liveMetrics.running} Units</p>
           </div>
        </div>
      </header>

      <AnimatePresence>
        {alert && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-red-500/10 border border-red-500/30 rounded-3xl p-5 flex items-center gap-6 shadow-[0_0_30px_rgba(239,68,68,0.1)]">
            <div className="bg-red-500 p-3 rounded-2xl shadow-[0_0_20px_#ef4444]"><AlertCircle className="text-white h-6 w-6" /></div>
            <p className="text-red-400 text-xs font-black uppercase tracking-[0.1em]">{alert}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Aggregate Load" value={dbData.totalEnergyKwh} unit="kWh" icon={Zap} color="indigo" liveValue={liveMetrics.energy} trend={1} />
        <StatCard title="Active Topology" value={liveMetrics.running || dbData.runningDevices} unit="NODES" icon={Layers} color="blue" />
        <StatCard title="Fiscal Projection" value={totalSessionCost} unit="INR" icon={DollarSign} color="emerald" />
        <StatCard title="Emission Index" value={totalSessionCarbon} unit="kg CO₂" icon={Leaf} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-12 min-h-[500px] flex flex-col bg-slate-900/30">
          <div className="flex justify-between items-center mb-12">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20"><TrendingUp className="h-6 w-6 text-indigo-400" /></div>
                <div>
                   <h3 className="text-2xl font-black text-white tracking-widest uppercase">Grid Timeline</h3>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Last 7 Calendar Aggregates</p>
                </div>
             </div>
             <div className="flex items-center gap-2 px-6 py-2 rounded-full bg-slate-900/80 border border-white/5 shadow-inner">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Scanning Grid Metadata</span>
             </div>
          </div>
          
          <div className="h-[350px] w-full mt-auto">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="p-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 10, fontWeight: 800}} 
                    dy={15}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={false} domain={[0, 'auto']} />
                  <Tooltip 
                    cursor={{ stroke: 'rgba(99,102,241,0.2)', strokeWidth: 2 }}
                    contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px' }}
                    labelStyle={{ color: '#64748b', fontWeight: 900, fontSize: '10px', marginBottom: '4px' }}
                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 900 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="energy" 
                    stroke="#6366f1" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#p-grad)" 
                    animationDuration={2000}
                    activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2, fill: '#fff' }}
                  />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-12 bg-indigo-500/5 relative overflow-hidden group shadow-2xl">
           <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[120px] -mr-40 -mt-40 transition-all duration-700 group-hover:bg-indigo-500/20" />
           <h3 className="text-2xl font-black text-white tracking-widest uppercase mb-10 flex items-center gap-4"><Grid className="h-6 w-6 text-indigo-400" /> Analyst</h3>
           
           <div className="space-y-10 relative z-10">
              <div className="p-8 rounded-[40px] bg-slate-900/50 border border-white/5 hover:border-indigo-500/30 transition-all duration-500">
                <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-3">Cycle Bill Projection</p>
                <p className="text-5xl font-black text-white tracking-tighter">₹{totalSessionCost.toFixed(2).split('.')[0]}<span className="text-xl text-slate-500">.{totalSessionCost.toFixed(2).split('.')[1]}</span></p>
                <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                   <CheckCircle2 className="h-3 w-3" /> Nominal Distribution
                </div>
              </div>
              
              <div className="p-8 rounded-[35px] bg-indigo-500/5 border border-indigo-500/10 hover:bg-indigo-500/10 transition-colors">
                 <div className="flex items-center gap-3 mb-4">
                    <Activity className="h-4 w-4 text-indigo-400 animate-pulse" />
                    <span className="text-[11px] font-black uppercase text-slate-300 tracking-widest">Efficiency AI</span>
                 </div>
                 <p className="text-xs font-bold text-slate-400 leading-relaxed italic">
                   {liveMetrics.energy > 3 
                     ? "Optimization algorithm suggests immediate load throttling to stabilize current surge." 
                     : "Load balance is optimal. Smart scheduling is managing passive nodes perfectly."}
                 </p>
              </div>

              <div className="pt-10 border-t border-white/5">
                <button 
                  onClick={handleOptimize}
                  disabled={optimizing}
                  className="w-full flex items-center justify-center gap-4 py-6 bg-indigo-600 rounded-[30px] font-black text-[11px] uppercase tracking-[0.3em] text-white shadow-[0_20px_50px_rgba(99,102,241,0.4)] hover:bg-indigo-500 hover:shadow-[0_20px_50px_rgba(99,102,241,0.6)] transition-all active:scale-95 disabled:opacity-50"
                >
                  {optimizing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                  {optimizing ? 'Throttling Grid...' : 'Optimize Load'}
                </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
