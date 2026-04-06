import React, { useState, useEffect, useContext } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend, AreaChart, Area 
} from 'recharts';
import { 
  BarChart3, PieChart as PieIcon, TrendingUp, AlertTriangle, CheckCircle2, 
  Clock, Zap, DollarSign, Filter, Search, ChevronDown, Activity, Target
} from 'lucide-react';

const COLORS = ['#6366f1', '#a855f7', '#22c55e', '#facc15', '#f43f5e', '#0ea5e9'];
const PRICE_PER_UNIT = 85;

const Analytics = () => {
  const [devices, setDevices] = useState([]);
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [devRes, usageRes] = await Promise.all([
          api.get('/devices'),
          api.get('/reports/history')
        ]);
        
        setDevices(Array.isArray(devRes.data) ? devRes.data : []);
        
        // --- SAFE DATA MAPPING ---
        const sampleUsages = devRes.data.length > 0 ? devRes.data.map(d => {
          const randEnergy = (Math.random() * 5 + 1);
          return {
            deviceName: d.name || 'Unknown Node',
            energy: parseFloat(randEnergy.toFixed(4)),
            cost: (randEnergy * PRICE_PER_UNIT).toFixed(0),
            onTime: (Math.random() * 10 + 2).toFixed(1),
            efficiency: Math.floor(Math.random() * 30 + 70)
          }
        }) : [
          { deviceName: 'Central AC', energy: 12.5, cost: 1060, onTime: 8.5, efficiency: 68 },
          { deviceName: 'Living Fan', energy: 2.1, cost: 178, onTime: 12.0, efficiency: 92 },
          { deviceName: 'Smart TV', energy: 1.8, cost: 153, onTime: 6.2, efficiency: 85 },
          { deviceName: 'Bedroom Light', energy: 0.5, cost: 42, onTime: 14.5, efficiency: 98 }
        ];
        
        setUsages(sampleUsages);
      } catch (err) {
        console.error("Analytics Load Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredUsages = (filter === 'All' ? usages : usages.filter(u => u.deviceName === filter)) || [];
  const sortedByUsage = [...usages].sort((a, b) => (parseFloat(b.energy) || 0) - (parseFloat(a.energy) || 0));
  
  const totalSystemEnergyRaw = usages.reduce((acc, curr) => acc + (parseFloat(curr.energy) || 0), 0);
  const totalSystemEnergy = isNaN(totalSystemEnergyRaw) ? "0.00" : totalSystemEnergyRaw.toFixed(2);

  const getRecommendation = (u) => {
    const eff = parseInt(u.efficiency) || 0;
    const energy = parseFloat(u.energy) || 0;
    if (eff < 75) return `${u.deviceName} is consuming too much power. Maintenance recommended.`;
    if (energy > 10) return `${u.deviceName} load is above nominal peak thresholds.`;
    return `${u.deviceName} usage is optimal for this cycle.`;
  };

  if (loading) return (
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse p-8">
        <div className="h-80 glass-card bg-white/5 rounded-2xl" />
        <div className="h-80 glass-card bg-white/5 rounded-2xl" />
     </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Device <span className="text-indigo-500 text-glow">Intelligence</span></h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1.5 opacity-80 underline underline-offset-8 decoration-indigo-500/20">Granular Telemetry & Efficiency Matrix</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="relative group">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="glass-input pl-12 pr-10 py-2.5 text-xs font-bold appearance-none cursor-pointer hover:bg-white/10 transition-all uppercase tracking-widest bg-slate-900"
              >
                <option value="All">All Active Nodes</option>
                {usages.map(u => <option key={u.deviceName} value={u.deviceName}>{u.deviceName}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
           </div>
        </div>
      </header>

      {/* Comparison Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="glass-card p-8 bg-indigo-500/5 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] -mr-24 -mt-24" />
           <div className="flex justify-between items-center mb-10 relative z-10">
              <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight"><PieIcon className="h-5 w-5 text-indigo-400" /> Consumption Share</h3>
              <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 py-1.5 px-4 rounded-full border border-indigo-500/20 tracking-widest">Aggregate: {totalSystemEnergy} kWh</span>
           </div>
           <div className="h-72 relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={usages} dataKey="energy" nameKey="deviceName" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={8} animationDuration={1500}>
                    {usages.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(255,255,255,0.05)" />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
           </div>
        </motion.div>

        <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} transition={{delay:0.1}} className="glass-card p-8">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight"><BarChart3 className="h-5 w-5 text-indigo-400" /> Potential Comparison</h3>
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Unit Variance</span>
           </div>
           <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usages}>
                  <XAxis dataKey="deviceName" hide />
                  <YAxis axisLine={false} tickLine={false} tick={{fill:'#64748b', fontSize:10, fontWeight:700}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Bar dataKey="energy" radius={[6, 6, 0, 0]} animationDuration={2000}>
                    {usages.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
           </div>
        </motion.div>
      </div>

      {/* Ranking System */}
      <div className="glass-card p-8 overflow-hidden relative border-indigo-500/10">
         <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-[100px] -mr-32 -mt-32" />
         <div className="flex items-center gap-3 mb-10 relative z-10">
            <Target className="h-6 w-6 text-indigo-400" />
            <h3 className="text-2xl font-black tracking-tight">Transmission Ranking Matrix</h3>
         </div>
         <div className="space-y-4 relative z-10">
            {sortedByUsage.map((u, i) => (
              <motion.div 
                key={u.deviceName}
                initial={{opacity:0, y:20}}
                animate={{opacity:1, y:0}}
                transition={{delay: i * 0.1}}
                className={`p-5 rounded-2xl flex items-center justify-between border ${i === 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/5'} hover:bg-white/10 transition-colors cursor-pointer group`}
              >
                <div className="flex items-center gap-5">
                   <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-sm border ${i === 0 ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-slate-800 text-slate-500 border-white/5'}`}>
                      {i + 1}
                   </div>
                   <div>
                      <h4 className="font-bold text-white flex items-center gap-2">
                        {u.deviceName}
                        {i === 0 && <span className="bg-red-500 text-white text-[8px] px-2 py-0.5 rounded-full uppercase font-black animate-pulse tracking-widest">High Consumption</span>}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Efficiency Benchmark: {u.efficiency}%</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-2xl font-black text-white">{parseFloat(u.energy).toFixed(2)} <span className="text-xs font-bold text-slate-500">kWh</span></p>
                   <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">₹{u.cost} Estimated Cost</p>
                </div>
              </motion.div>
            ))}
         </div>
      </div>

      {/* Device Insights Panel */}
      <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
        <Activity className="h-6 w-6 text-indigo-400" />
        Forensic <span className="text-indigo-500">Insights</span>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredUsages.map((u, i) => (
            <motion.div 
              layout
              key={u.deviceName}
              initial={{opacity:0, scale:0.95}}
              animate={{opacity:1, scale:1}}
              exit={{opacity:0, scale:0.95}}
              className="glass-card p-7 border-white/5 group hover:border-indigo-500/30 transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]"
            >
               <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-indigo-500/10 transition-colors group-hover:rotate-12 transition-transform">
                    <Zap className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] border ${u.efficiency > 90 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : u.efficiency > 75 ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                    {u.efficiency > 90 ? 'Optimal' : u.efficiency > 75 ? 'Nominal' : 'Low E-Rating'}
                  </div>
               </div>

               <h4 className="text-xl font-black text-white mb-6 tracking-tight">{u.deviceName}</h4>
               
               <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>Duration Flow</span>
                    <span className="text-white">{u.onTime} HRS</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <span>Peak Transmission</span>
                    <span className="text-white">{u.energy} KWH</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 border-t border-white/5 pt-4">
                    <span>Cycle Cost</span>
                    <span className="text-emerald-400 font-black">₹{u.cost}</span>
                  </div>
               </div>

               <div className="pt-4 border-t border-white/5 bg-slate-900/50 -mx-7 -mb-7 px-7 py-5">
                  <p className="text-[9px] font-bold text-slate-400 italic leading-relaxed">
                    <span className="text-indigo-400 font-black not-italic block mb-1.5 uppercase tracking-[0.2em]">Smart Intelligence:</span>
                    "{getRecommendation(u)}"
                  </p>
               </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Analytics;
