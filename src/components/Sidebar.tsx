
import React from 'react';
import { User } from '../types';
import { 
  LayoutDashboard, 
  Package, 
  CalendarDays, 
  LogOut, 
  School,
  User as UserIcon,
  Users as UsersIcon
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  setView: (view: any) => void;
  user: User;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ currentView, setView, user, onLogout, isOpen, onClose }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'teacher'] },
    { id: 'reservations', label: 'Reservas', icon: CalendarDays, roles: ['admin', 'teacher'] },
    { id: 'resources', label: 'Recursos', icon: Package, roles: ['admin'] },
    { id: 'users', label: 'Usuários', icon: UsersIcon, roles: ['admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col h-screen transition-transform duration-300 transform
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:block
      `}>
      <div className="p-6 flex flex-col items-center gap-3 border-b border-slate-50">
        <img 
          src="https://web.iema.ma.gov.br/credenciamento2024/pages/img/logo_iema.png" 
          alt="Logo IEMA" 
          className="h-12 w-auto object-contain"
          referrerPolicy="no-referrer"
        />
        <span className="font-bold text-sm text-center text-slate-800 leading-tight">
          IEMA PLENO SÃO LUÍS<br/>Maria Mônica Vale
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {filteredMenuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentView === item.id
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-blue-600' : 'text-slate-400'}`} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-50">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="bg-slate-100 p-2 rounded-full">
            <UserIcon className="w-5 h-5 text-slate-500" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user.role}</p>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
    </>
  );
}
