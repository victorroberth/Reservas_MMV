
import React, { useState, useEffect } from 'react';
import { User, Reservation, Resource } from '../types';
import { 
  Plus, 
  Calendar, 
  Clock, 
  User as UserIcon, 
  Users, 
  X, 
  AlertCircle, 
  CheckCircle2,
  Trash2,
  Filter,
  Search
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface ReservationsProps {
  user: User;
}

export default function Reservations({ user }: ReservationsProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  
  // Filters
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Form State
  const [resourceId, setResourceId] = useState('');
  const [responsibleName, setResponsibleName] = useState(user.name);
  const [groupOrSector, setGroupOrSector] = useState('');
  const [resDate, setResDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('01');
  const [endTime, setEndTime] = useState('01');
  const [observation, setObservation] = useState('');

  const schoolPeriods = [
    { id: '01', label: '1º Horário' },
    { id: '02', label: '2º Horário' },
    { id: '03', label: '3º Horário' },
    { id: '04', label: '4º Horário' },
    { id: '05', label: '5º Horário' },
    { id: '06', label: '6º Horário' },
    { id: '07', label: '7º Horário' },
    { id: '08', label: '8º Horário' },
    { id: '09', label: '9º Horário' },
  ];

  const formatPeriod = (p: string) => {
    const period = schoolPeriods.find(sp => sp.id === p);
    return period ? period.label : p;
  };

  useEffect(() => {
    fetchData();
  }, [filterDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resData, resourcesData] = await Promise.all([
        fetch(`/api/reservations?date=${filterDate}`).then(r => r.json()),
        fetch('/api/resources').then(r => r.json())
      ]);
      setReservations(resData);
      setResources(resourcesData.filter((r: Resource) => r.active));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (startTime > endTime) {
      setError('O horário de fim não pode ser anterior ao de início.');
      return;
    }

    // Rule for Teachers - All Resources
    if (user.role === 'teacher') {
      const now = new Date();
      const todayStr = format(now, 'yyyy-MM-dd');
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');

      if (resDate < todayStr) {
        setError('Não é possível realizar reservas para datas passadas.');
        return;
      }

      if (resDate > tomorrowStr) {
        setError('Professores só podem realizar reservas para o dia atual ou para o dia seguinte.');
        return;
      }

      if (resDate === tomorrowStr && now.getHours() < 18) {
        setError('Reservas para o dia seguinte só são permitidas a partir das 18h de hoje.');
        return;
      }
    }

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resource_id: parseInt(resourceId),
          user_id: user.id,
          responsible_name: responsibleName,
          group_or_sector: groupOrSector,
          reservation_date: resDate,
          start_time: startTime,
          end_time: endTime,
          observation
        }),
      });

      if (res.ok) {
        fetchData();
        closeModal();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao criar reserva');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor');
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

  const openModal = () => {
    setError('');
    setResourceId(resources[0]?.id.toString() || '');
    setResponsibleName(user.name);
    setGroupOrSector('');
    setResDate(format(new Date(), 'yyyy-MM-dd'));
    setStartTime('01');
    setEndTime('01');
    setObservation('');
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Reservas</h1>
          <p className="text-slate-500 text-sm md:text-base">Visualize e gerencie todas as reservas do sistema.</p>
        </div>
        <button 
          onClick={openModal}
          disabled={resources.length === 0}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold shadow-md shadow-blue-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-5 h-5" />
          Nova Reserva
        </button>
      </header>

      {/* Filters Bar */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="w-4 h-4" />
          Filtrar por data:
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input 
            type="date"
            className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <button 
            onClick={() => setFilterDate(format(new Date(), 'yyyy-MM-dd'))}
            className="text-sm text-blue-600 font-medium hover:underline whitespace-nowrap"
          >
            Ir para hoje
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold">Data/Hora</th>
                <th className="px-6 py-4 font-semibold">Recurso</th>
                <th className="px-6 py-4 font-semibold">Responsável</th>
                <th className="px-6 py-4 font-semibold">Turmas</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Carregando...</td></tr>
              ) : reservations.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Nenhuma reserva encontrada para esta data.</td></tr>
              ) : (
                reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-800">
                        {format(parseISO(res.reservation_date), 'dd/MM/yyyy')}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {res.start_time === res.end_time 
                          ? formatPeriod(res.start_time) 
                          : `${formatPeriod(res.start_time)} - ${formatPeriod(res.end_time)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-800">{res.resource_name}</div>
                      <div className="text-xs text-slate-400">{res.resource_type}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{res.responsible_name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{res.group_or_sector}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        res.status === 'reserved' ? 'bg-blue-50 text-blue-600' :
                        res.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {res.status === 'reserved' ? 'Reservado' : 
                         res.status === 'completed' ? 'Concluído' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
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
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Nova Reserva
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Recurso</label>
                  <select
                    required
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={resourceId}
                    onChange={(e) => setResourceId(e.target.value)}
                  >
                    {resources.map(r => <option key={r.id} value={r.id}>{r.name} ({r.type})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
                  <input
                    required
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={responsibleName}
                    onChange={(e) => setResponsibleName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Turmas</label>
                  <input
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={groupOrSector}
                    onChange={(e) => setGroupOrSector(e.target.value)}
                    placeholder="Ex: 2º Ano B"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={resDate}
                    onChange={(e) => setResDate(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Horário Início</label>
                    <select
                      required
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                    >
                      {schoolPeriods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Horário Fim</label>
                    <select
                      required
                      className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                    >
                      {schoolPeriods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Observação (Opcional)</label>
                  <textarea
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 shadow-md shadow-blue-100 transition-all"
                >
                  Confirmar Reserva
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
