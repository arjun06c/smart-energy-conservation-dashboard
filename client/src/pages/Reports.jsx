import React, { useState, useEffect } from 'react';
import api from '../api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { Download, Calendar as CalIcon, Filter, BarChart3, TrendingDown, Clock, Activity, Target, PieChart as PieIcon, Layers, FileText, Zap, DollarSign, Loader2, ChevronDown, CheckCircle2, History, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const ANALYSIS_COLORS = ['#6366f1', '#a855f7', '#22c55e', '#facc15', '#f43f5e', '#0ea5e9'];
const PRICE_PER_UNIT = 85;

const AnalysisCard = ({ title, value, icon: Icon, color, desc }) => (
  <motion.div 
    whileHover={{ y: -5, scale: 1.02 }}
    className="glass-card p-6 border-white/5 relative overflow-hidden group transition-all duration-300"
  >
     <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-${color}-400/20 transition-colors duration-500`} />
     <div className="flex items-center space-x-3 mb-4 relative z-10">
        <div className={`p-2 rounded-lg bg-${color}-500/10 border border-${color}-500/20 group-hover:rotate-12 transition-transform`}>
          <Icon className={`h-4 w-4 text-${color}-400`} />
        </div>
        <h4 className="text-[10px] uppercase font-black text-slate-500 tracking-widest">{title}</h4>
     </div>
     <p className="text-2xl font-black text-white relative z-10 tracking-tight">{value}</p>
     <p className="text-[10px] font-bold text-slate-500 mt-1 relative z-10 opacity-70 italic">{desc}</p>
  </motion.div>
);

const Reports = () => {
  const [reportData, setReportData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [dayData, setDayData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dayLoading, setDayLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    fetchDayData();
  }, [selectedDate]);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/reports/history');
      setReportData(Array.isArray(res.data.dailyData) ? res.data.dailyData : []);
    } catch (err) {
      toast.error('Sync failed.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDayData = async () => {
    setDayLoading(true);
    try {
      const res = await api.get(`/reports/history/day/${selectedDate}`);
      setDayData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDayLoading(false);
    }
  };

  const handleDownload = async (ext, type) => {
    setExporting(true);
    const param = type === 'day' ? `date=${selectedDate}` : `month=${selectedMonth}`;
    const friendlyName = type === 'day' ? `Daily_Audit_${selectedDate}` : `Monthly_Audit_${selectedMonth}`;
    
    try {
       const res = await api.get(`/reports/export/${ext}?${param}`, { responseType: 'blob' });
       const url = window.URL.createObjectURL(new Blob([res.data]));
       const link = document.createElement('a');
       link.href = url;
       link.setAttribute('download', `${friendlyName}.${ext}`);
       document.body.appendChild(link);
       link.click();
       toast.success(`${type.toUpperCase()} Report Generated successfully.`);
    } catch (err) {
       toast.error(`Download failed.`);
    } finally {
       setExporting(false);
    }
  };

  const totalEnergyRaw = reportData.reduce((acc, curr) => acc + (parseFloat(curr.energy) || 0), 0);
  const totalEnergy = totalEnergyRaw.toFixed(2);
  const totalCost = (totalEnergyRaw * PRICE_PER_UNIT).toFixed(2);

  // Day specific totals
  const dayTotalEnergy = dayData.reduce((acc, curr) => acc + parseFloat(curr.energy), 0).toFixed(4);
  const dayTotalCost = dayData.reduce((acc, curr) => acc + parseFloat(curr.cost), 0).toFixed(2);
  const maxDayNode = dayData.length > 0 ? [...dayData].sort((a,b) => b.energy - a.energy)[0] : null;

  if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-10 w-10 text-indigo-500 animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Usage <span className="text-indigo-500 text-glow">Analytics</span></h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-2 opacity-80 underline underline-offset-8 decoration-indigo-500/30">Fiscal Period Cycle & Billing History</p>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center bg-slate-900/50 p-3 rounded-2xl border border-white/5 backdrop-blur-xl">
           <div className="flex flex-col space-y-1 min-w-[140px]">
              <label className="text-[9px] font-black uppercase text-slate-500 ml-1 tracking-widest">Audit Date</label>
              <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="glass-input !py-1.5 !px-3 text-[10px] font-bold" />
           </div>
           <div className="flex flex-col space-y-1 min-w-[140px]">
              <label className="text-[9px] font-black uppercase text-slate-500 ml-1 tracking-widest">Audit Month</label>
              <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="glass-input !py-1.5 !px-3 text-[10px] font-bold" />
           </div>
        </div>
      </header>

      {/* DASHBOARD SUMMARY FOR SELECTED DAY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
               <h2 className="text-2xl font-black tracking-tighter flex items-center gap-3">
                 <History className="h-6 w-6 text-indigo-400" />
                 Device Breakdown <span className="text-[10px] font-black uppercase text-slate-500 mt-2 tracking-[0.2em]">[{selectedDate}]</span>
               </h2>
               <div className="flex gap-4">
                  <div className="text-right">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Day Total</p>
                     <p className="text-lg font-black text-white">{dayTotalEnergy} <span className="text-[10px] text-slate-500">kWh</span></p>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Day Cost</p>
                     <p className="text-lg font-black text-emerald-400">₹{dayTotalCost}</p>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <AnimatePresence mode="popLayout">
                  {dayLoading ? (
                    [...Array(2)].map((_, i) => <div key={i} className="h-32 glass-card bg-white/5 animate-pulse" />)
                  ) : dayData.length > 0 ? (
                    dayData.map((d, i) => (
                      <motion.div 
                        key={d.name} 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        className={`glass-card p-6 border-white/5 relative group ${maxDayNode?.name === d.name ? 'border-red-500/20 bg-red-500/5' : ''}`}
                      >
                         {maxDayNode?.name === d.name && <div className="absolute top-4 right-4 bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-[0_0_10px_#ef4444]">High Load Node</div>}
                         <h4 className="text-lg font-black text-white mb-4 tracking-tight group-hover:text-indigo-400 transition-colors">{d.name}</h4>
                         <div className="grid grid-cols-2 gap-4">
                            <div>
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Aggregate</p>
                               <p className="text-sm font-black text-white">{d.energy} kWh</p>
                            </div>
                            <div>
                               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fiscal Rate</p>
                               <p className="text-sm font-black text-emerald-400">₹{d.cost}</p>
                            </div>
                            <div className="col-span-2 flex items-center gap-2 pt-2 border-t border-white/5">
                               <Clock className="h-3 w-3 text-slate-500" />
                               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Estimated Duration: {d.duration} mins</span>
                            </div>
                         </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-2 p-10 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-slate-500">
                       <AlertCircle className="h-10 w-10 mb-4 opacity-20" />
                       <p className="text-xs font-black uppercase tracking-widest">No node telemetry found for this selected date</p>
                    </div>
                  )}
               </AnimatePresence>
            </div>
         </div>

         <div className="space-y-6">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2 pt-1"><Download className="h-5 w-5 text-indigo-400" /> Grid Export Node</h3>
            <div className="space-y-4">
              <motion.div whileHover={{ scale: 1.02 }} className="glass-card p-6 bg-indigo-500/5 border-indigo-500/20 group">
                 <div className="flex justify-between items-center mb-6">
                    <CalIcon className="h-5 w-5 text-indigo-400" />
                    <span className="text-[10px] font-black uppercase text-indigo-400 opacity-60 tracking-widest uppercase">Daily Snap</span>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => handleDownload('pdf', 'day')} disabled={exporting} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                       <FileText className="h-4 w-4" /> PDF
                    </button>
                    <button onClick={() => handleDownload('csv', 'day')} disabled={exporting} className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-slate-400 hover:text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                       <Layers className="h-4 w-4" /> CSV
                    </button>
                 </div>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} className="glass-card p-6 border-white/5 group">
                 <div className="flex justify-between items-center mb-6">
                    <BarChart3 className="h-5 w-5 text-slate-400" />
                    <span className="text-[10px] font-black uppercase text-slate-500 opacity-60 tracking-widest uppercase">Cycle Rep</span>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => handleDownload('pdf', 'month')} disabled={exporting} className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-slate-400 hover:text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                        PDF
                    </button>
                    <button onClick={() => handleDownload('csv', 'month')} disabled={exporting} className="flex-1 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-slate-400 hover:text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                        CSV
                    </button>
                 </div>
              </motion.div>
            </div>
         </div>
      </div>

      {/* BILLING CYCLE INDICATOR */}
      <div className="glass-card p-1 relative overflow-hidden bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border-indigo-500/20">
         <div className="flex flex-wrap md:flex-nowrap divide-x divide-white/5">
            {[
              { label: 'Fiscal Month', val: 'APR 2024', icon: CalIcon, color: 'indigo' },
              { label: 'Cumulative kWh', val: `${totalEnergy}`, icon: Zap, color: 'emerald' },
              { label: 'Projected Bill', val: `₹${totalCost}`, icon: DollarSign, color: 'purple' },
              { label: 'Audit Status', val: 'VERIFIED', icon: Target, color: 'blue' }
            ].map((stat, i) => (
              <div key={i} className="flex-1 p-6 flex flex-col items-center justify-center text-center">
                 <div className="flex items-center gap-2 mb-2 justify-center">
                    <stat.icon className={`h-4 w-4 text-${stat.color}-400`} />
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{stat.label}</span>
                 </div>
                 <p className="text-xl font-black text-slate-200">{stat.val}</p>
              </div>
            ))}
         </div>
      </div>

      <div className="glass-card p-8">
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight"><FileText className="h-5 w-5 text-indigo-400" /> Historical Grid Load Audit</h3>
          <div className="p-1 px-3 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-widest">Active Scan Matrix</div>
        </div>
        <div className="h-84">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={reportData}>
              <defs>
                <linearGradient id="auditGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 700}} dy={15} />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '15px' }} />
              <Area type="monotone" dataKey="energy" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#auditGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
