import React, { useState, useEffect } from 'react';
import api, { getSocketUrl } from '../api';
import { Power, Trash2, Edit2, Plus, Zap, Activity, Cpu, X, Tv, Wind, Lightbulb, Thermometer, Clock, ShieldCheck, ToggleLeft, ToggleRight, Calendar, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

const DEVICE_ICONS = {
  'Fan': Wind,
  'AC': Thermometer,
  'Light': Lightbulb,
  'TV': Tv,
  'Default': Cpu
};

const DeviceCard = ({ device, onToggle, onEdit, onDelete }) => {
  const isON = device.status === 'ON';
  
  // Safe numeric parsing for calculation
  const volt = parseFloat(device.voltage) || 0;
  const curr = parseFloat(device.current) || 0;
  const powerKW = ((volt * curr) / 1000).toFixed(2);
  
  const Icon = DEVICE_ICONS[device.name] || DEVICE_ICONS['Default'];

  return (
    <motion.div 
      layout
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`glass-card p-6 overflow-hidden relative group transition-all duration-500 ${isON ? 'border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-white/5'}`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-16 -mt-16 transition-colors duration-700 ${isON ? 'bg-emerald-500/10' : 'bg-slate-500/5'}`} />
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-2xl border transition-all duration-500 ${isON ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-white/5'}`}>
            <Icon className={`h-6 w-6 ${isON ? 'text-emerald-400' : 'text-slate-500'}`} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tighter">{device.name || 'Unnamed Node'}</h3>
            <div className="flex items-center space-x-2 mt-1">
               <div className={`h-1.5 w-1.5 rounded-full ${isON ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
               <span className={`text-[10px] uppercase font-black tracking-widest ${isON ? 'text-emerald-400' : 'text-slate-500'}`}>{device.status || 'OFF'}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-1">
          <button onClick={() => onEdit(device)} className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Edit2 className="h-4 w-4" /></button>
          <button onClick={() => onDelete(device._id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6 relative z-10">
        {[
          { label: 'Voltage', val: `${volt}V` },
          { label: 'Load', val: `${curr}A` },
          { label: 'Power', val: `${isNaN(parseFloat(powerKW)) ? "0.00" : powerKW}kW` }
        ].map((stat, i) => (
          <div key={i} className="text-center p-2.5 rounded-xl bg-white/5 border border-white/5 group-hover:border-white/10 transition-colors">
            <p className="text-[9px] uppercase font-bold text-slate-500 mb-1">{stat.label}</p>
            <p className="text-xs font-black text-white">{stat.val}</p>
          </div>
        ))}
      </div>

      {/* Automation Indicators */}
      {(device.autoOffThreshold > 0 || device.schedule?.enabled) && (
        <div className="mb-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-2.5 relative z-10">
           {device.autoOffThreshold > 0 && (
             <div className="flex items-center gap-2.5 text-[9px] font-black uppercase text-indigo-400 tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Auto-Off Threshold: <span className="text-white">{device.autoOffThreshold}m</span></span>
             </div>
           )}
           {device.schedule?.enabled && (
             <div className="flex items-center gap-2.5 text-[9px] font-black uppercase text-purple-400 tracking-wider">
                <Calendar className="h-3.5 w-3.5" />
                <span>Active Cycle: <span className="text-white">{device.schedule.startTime} – {device.schedule.endTime}</span></span>
             </div>
           )}
        </div>
      )}

      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onToggle(device._id)}
        className={`w-full flex items-center justify-center space-x-3 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-500 border ${
          isON 
          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
          : 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Power className={`h-4 w-4 ${isON && 'animate-pulse'}`} />
        <span>{isON ? 'Power Online' : 'Set Active'}</span>
      </motion.button>
    </motion.div>
  );
};

const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    name: '', voltage: '', current: '', 
    autoOffThreshold: 0, 
    schedule: { enabled: false, startTime: '', endTime: '' } 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
    const socket = io(getSocketUrl());
    
    api.get('/auth/me').then(res => {
       if (res.data?._id) socket.emit('join', res.data._id);
    });
    
    socket.on('deviceStatusUpdate', ({ id, status }) => {
      setDevices(prev => prev.map(d => d._id === id ? { ...d, status } : d));
    });

    socket.on('automationEvent', ({ message, type }) => {
      toast(message, {
        icon: type === 'success' ? '⚡' : '🕒',
        style: {
          background: '#0f172a',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)',
          fontWeight: '900',
          fontSize: '11px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }
      });
      fetchDevices(); 
    });

    return () => socket.disconnect();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await api.get('/devices');
      setDevices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
       console.error("Device Sync Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      const res = await api.put(`/devices/${id}/toggle`);
      setDevices(devices.map(d => d._id === id ? res.data : d));
    } catch (err) {
      toast.error('Handshake failed.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Safe parsing before submission
      const payload = {
        ...formData,
        voltage: parseFloat(formData.voltage) || 0,
        current: parseFloat(formData.current) || 0,
        autoOffThreshold: parseInt(formData.autoOffThreshold) || 0
      };

      if (editingId) {
        await api.put(`/devices/${editingId}`, payload);
      } else {
        await api.post('/devices', payload);
      }
      setShowModal(false);
      fetchDevices();
      toast.success('Grid topology updated.');
    } catch (err) {
      toast.error('Consistency error.');
    }
  };

  const openEdit = (device) => {
    setFormData({ 
      name: device.name || '', 
      voltage: device.voltage || '', 
      current: device.current || '',
      autoOffThreshold: device.autoOffThreshold || 0,
      schedule: device.schedule || { enabled: false, startTime: '', endTime: '' }
    });
    setEditingId(device._id);
    setShowModal(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
       <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter">Device <span className="text-indigo-500 text-glow">Matrix</span></h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 opacity-80 underline underline-offset-8 decoration-indigo-500/20">Autonomous Grid Control & Provisioning</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setEditingId(null); setFormData({ name: '', voltage: '', current: '', autoOffThreshold: 0, schedule: { enabled: false, startTime: '', endTime: '' } }); setShowModal(true); }}
          className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-9 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <Plus className="h-5 w-5" /> Provision Node
        </motion.button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map(device => (
          <DeviceCard key={device._id} device={device} onToggle={handleToggle} onEdit={openEdit} onDelete={async (id) => { await api.delete(`/devices/${id}`); fetchDevices(); }} />
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card max-w-xl w-full p-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[80px] -mr-24 -mt-24" />
            <div className="flex justify-between items-center mb-8 relative z-10">
              <h2 className="text-2xl font-black tracking-tight">{editingId ? 'Modify Strategy' : 'Initialize Node'}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 opacity-40 hover:opacity-100" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                 <div className="group col-span-2">
                    <label className="text-[10px] uppercase font-black text-slate-500 mb-2 block tracking-widest">Descriptor</label>
                    <input type="text" required className="glass-input w-full" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Master Fan" />
                 </div>
                 <div className="group">
                    <label className="text-[10px] uppercase font-black text-slate-500 mb-2 block tracking-widest">Voltage (V)</label>
                    <input type="number" required className="glass-input w-full" value={formData.voltage} onChange={e => setFormData({...formData, voltage: e.target.value})} />
                 </div>
                 <div className="group">
                    <label className="text-[10px] uppercase font-black text-slate-500 mb-2 block tracking-widest">Load (A)</label>
                    <input type="number" required step="0.1" className="glass-input w-full" value={formData.current} onChange={e => setFormData({...formData, current: e.target.value})} />
                 </div>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-6">
                  <h4 className="text-[11px] font-black text-indigo-400 opacity-80 uppercase tracking-[0.2em] flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Automation Engine
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="group">
                      <label className="text-[10px] uppercase font-black text-slate-500 mb-2 block tracking-widest whitespace-nowrap">Auto-Off (Min)</label>
                      <input type="number" className="glass-input w-full" value={formData.autoOffThreshold} onChange={e => setFormData({...formData, autoOffThreshold: e.target.value})} placeholder="0 = Disabled" />
                    </div>
                    
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Cycle</span>
                        <button type="button" onClick={() => setFormData({...formData, schedule: {...formData.schedule, enabled: !formData.schedule.enabled }})}>
                          {formData.schedule.enabled ? <ToggleRight className="text-indigo-400 h-6 w-6" /> : <ToggleLeft className="text-slate-600 h-6 w-6" />}
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input type="time" className="glass-input flex-1 !py-1.5 text-[10px] font-bold" value={formData.schedule.startTime} onChange={e => setFormData({...formData, schedule: {...formData.schedule, startTime: e.target.value }})} />
                        <span className="text-[10px] font-black text-slate-600 uppercase">to</span>
                        <input type="time" className="glass-input flex-1 !py-1.5 text-[10px] font-bold" value={formData.schedule.endTime} onChange={e => setFormData({...formData, schedule: {...formData.schedule, endTime: e.target.value }})} />
                      </div>
                    </div>
                  </div>
              </div>

              <div className="flex justify-end gap-5 pt-8">
                <button type="button" onClick={() => setShowModal(false)} className="text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] hover:text-white transition-colors">Cancel</button>
                <button type="submit" className="bg-indigo-600 px-9 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-white shadow-2xl shadow-indigo-500/20 hover:bg-indigo-500 transition-all">
                   {editingId ? 'Push Updates' : 'Confirm Topology'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Devices;
