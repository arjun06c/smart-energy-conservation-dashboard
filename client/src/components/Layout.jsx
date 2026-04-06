import React from 'react';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#0f172a] text-white selection:bg-indigo-500/30 overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 relative overflow-hidden">
        {/* Animated Background Mesh */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] -z-10 -translate-x-1/4 translate-y-1/4" />
        
        <AnimatePresence mode="wait">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
        
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: 'rgba(15, 23, 42, 0.9)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
            },
          }}
        />
      </main>
    </div>
  );
};

export default Layout;
