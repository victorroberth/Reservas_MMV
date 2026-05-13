
import React, { useState, useEffect } from 'react';
import { User } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Resources from './components/Resources';
import Reservations from './components/Reservations';
import Extraclasse from './components/Extraclasse';
import Attendance from './components/Attendance';
import Users from './components/Users';
import Sidebar from './components/Sidebar';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Validate that it's a valid user object with a role
      if (parsed && typeof parsed === 'object' && parsed.id && parsed.role) {
        return parsed as User;
      }
      localStorage.removeItem('user');
      return null;
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
      localStorage.removeItem('user');
      return null;
    }
  });
  const [currentView, setCurrentView] = useState<'dashboard' | 'resources' | 'reservations' | 'extraclasse' | 'attendance' | 'users'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    // Security check for roles
    if (user && user.role === 'teacher') {
      if (currentView === 'resources' || currentView === 'users') {
        setCurrentView('dashboard');
      }
    }
    // Close sidebar on mobile when view changes
    setIsSidebarOpen(false);
  }, [currentView, user]);

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="bg-blue-600 p-2 rounded-lg text-white shadow-sm"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img 
              src="https://web.iema.ma.gov.br/credenciamento2024/pages/img/logo_iema.png" 
              alt="Logo IEMA" 
              className="h-8 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="font-bold text-[10px] text-slate-800 leading-tight hidden sm:block">
              IEMA PLENO SÃO LUÍS - Maria Mônica Vale
            </span>
            <span className="font-bold text-[10px] text-slate-800 leading-tight sm:hidden">
              IEMA PLENO
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <span className="max-w-[100px] truncate">{user.name}</span>
        </div>
      </div>

      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        user={user} 
        onLogout={() => setUser(null)} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <main className="flex-1 p-4 md:p-8 pt-20 lg:pt-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'dashboard' && <Dashboard user={user} />}
              {currentView === 'resources' && <Resources user={user} />}
              {currentView === 'reservations' && <Reservations user={user} />}
              {currentView === 'attendance' && <Attendance user={user} />}
              {currentView === 'extraclasse' && <Extraclasse user={user} />}
              {currentView === 'users' && <Users user={user} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
