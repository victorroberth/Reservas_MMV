
import React, { useState, useEffect } from 'react';
import { User, Reservation } from '../types';
import { 
  Calendar, 
  Clock, 
  User as UserIcon, 
  Users, 
  Info,
  Monitor,
  Projector,
  Mic2,
  Tablet,
  Laptop,
  Box,
  Plus,
  Filter,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TIME_SLOTS } from '../constants';

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState({ total: 0, labs: 0, equip: 0, presence: 0 });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('Todos');

  const today = new Date();
  // Use a stable date string for the API request that doesn't change on every render
  // and matches the format used in the database (YYYY-MM-DD)
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    fetchData();
  }, [todayStr]);

  const fetchData = async () => {
    setLoading(true);
    console.log('[DEBUG] Dashboard Fetching for:', todayStr);
    try {
      const [resRes, statsRes] = await Promise.all([
        fetch(`/api/reservations?date=${todayStr}`),
        fetch(`/api/dashboard/stats?date=${todayStr}`)
      ]);
      
      const resData = await resRes.json();
      const statsData = await statsRes.json();
      
      console.log('[DEBUG] Dashboard Reservations:', resData);
      console.log('[DEBUG] Dashboard Stats:', statsData);
      
      setReservations(Array.isArray(resData) ? resData : []);
      setStats(statsData || { total: 0, labs: 0, equip: 0, presence: 0 });
    } catch (err) {
      console.error('[DEBUG] Dashboard Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await fetch(`/api/reservations/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/reservations/${id}?userId=${user.id}&role=${user.role}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'laboratório': return <Monitor className="w-5 h-5" />;
      case 'projetor': return <Projector className="w-5 h-5" />;
      case 'caixa de som': return <Mic2 className="w-5 h-5" />;
      case 'tablet': return <Tablet className="w-5 h-5" />;
      case 'notebook': return <Laptop className="w-5 h-5" />;
      default: return <Box className="w-5 h-5" />;
    }
  };

  const getResourceColorClass = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('laboratório')) return 'bg-emerald-50/40 hover:bg-emerald-100/60';
    if (t.includes('sala')) return 'bg-blue-50/40 hover:bg-blue-100/60';
    if (t.includes('equipamento') || t === 'notebook' || t === 'tablet' || t === 'projetor' || t === 'caixa de som') {
      return 'bg-amber-50/40 hover:bg-amber-100/60';
    }
    return 'hover:bg-slate-50/50';
  };

  const filteredReservations = filterType === 'Todos' 
    ? reservations 
    : reservations.filter(r => r.resource_type === filterType);

  // Group reservations by resource, and responsible to show multiple slots as one row
  const groupedReservations = filteredReservations.reduce((acc: Reservation[], current) => {
    const existing = acc.find(r => 
      r.resource_id === current.resource_id && 
      r.reservation_date === current.reservation_date && 
      r.responsible_name === current.responsible_name &&
      r.group_or_sector === current.group_or_sector &&
      r.status === current.status
    );

    if (existing) {
      // Merge slots and remove duplicates
      const slots = [...existing.start_time.split(','), ...current.start_time.split(',')];
      const uniqueSlots = Array.from(new Set(slots)).sort((a, b) => parseInt(a) - parseInt(b));
      existing.start_time = uniqueSlots.join(',');
      return acc;
    }
    
    return [...acc, { ...current }];
  }, []);

  const resourceTypes = [
    'Todos', 
    ...Array.from(new Set(reservations.map(r => r.resource_type || 'Outros')))
  ];

  const formatPeriod = (startTime: string) => {
    const slots = startTime.split(',');
    const labels = slots.map(sId => {
      const slot = TIME_SLOTS.find(s => s.startTime === sId);
      return slot ? slot.label : sId;
    });
    return labels.join(', ');
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
            Dashboard
            <span className="text-xs font-normal text-slate-300">({todayStr})</span>
          </h1>
          <p className="text-slate-500 capitalize text-sm md:text-base">
            {format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button 
            onClick={fetchData}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Clock className="w-4 h-4" />
            Atualizar
          </button>
          <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600">
            <Filter className="w-4 h-4" />
            <select 
              className="bg-transparent outline-none cursor-pointer"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              {resourceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-100/50">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-white/20 p-2 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full text-white">Hoje</span>
          </div>
          <p className="text-blue-100 text-sm font-medium">Total de Reservas</p>
          <h3 className="text-3xl font-bold text-white">{stats.total}</h3>
        </div>

        <div className="p-6 bg-emerald-600 text-white rounded-xl shadow-md shadow-emerald-100/50">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-white/20 p-2 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full text-white">Presença</span>
          </div>
          <p className="text-emerald-100 text-sm font-medium">Alunos na Escola</p>
          <h3 className="text-3xl font-bold text-white">{stats.presence}</h3>
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-50 p-2 rounded-lg">
              <Monitor className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Laboratórios</p>
          <h3 className="text-3xl font-bold text-slate-800">{stats.labs}</h3>
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-amber-50 p-2 rounded-lg">
              <Box className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-slate-500 text-sm font-medium">Equipamentos</p>
          <h3 className="text-3xl font-bold text-slate-800">{stats.equip}</h3>
        </div>
      </div>

      {/* Main Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Reservas do Dia
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Horário</th>
                <th className="px-6 py-4 font-semibold">Recurso</th>
                <th className="px-6 py-4 font-semibold">Responsável</th>
                <th className="px-6 py-4 font-semibold">Turmas</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Carregando reservas...</td>
                </tr>
              ) : groupedReservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Calendar className="w-12 h-12 opacity-20" />
                      <p>Nenhuma reserva para hoje.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                groupedReservations.map((res) => (
                  <tr key={res.id} className={`${getResourceColorClass(res.resource_type || '')} transition-colors group`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Clock className="w-4 h-4 text-slate-400" />
                        {formatPeriod(res.start_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-100 p-2 rounded-lg text-slate-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                          {getResourceIcon(res.resource_type || '')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{res.resource_name}</p>
                          <p className="text-xs text-slate-500">{res.resource_type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        {res.responsible_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users className="w-4 h-4 text-slate-400" />
                        {res.group_or_sector}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        res.status === 'reserved' ? 'bg-blue-50 text-blue-600' :
                        res.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {res.status === 'reserved' ? 'Reservado' : 
                         res.status === 'completed' ? 'Concluído' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {res.status === 'reserved' && (
                          <button 
                            onClick={() => handleStatusChange(res.id, 'completed')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Concluir"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {(user.role === 'admin' || res.user_id === user.id) && (
                          <button 
                            onClick={() => handleDelete(res.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {res.observation && (
                          <div className="relative group/tooltip">
                            <Info className="w-5 h-5 text-slate-300 hover:text-blue-500 cursor-help" />
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block bg-slate-800 text-white text-xs p-2 rounded shadow-lg w-48 z-10">
                              {res.observation}
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
