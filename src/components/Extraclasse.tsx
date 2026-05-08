
import React, { useState, useEffect } from 'react';
import { User, Extraclasse as ExtraclasseType } from '../types';
import { 
  Plus, 
  Search, 
  Calendar, 
  User as UserIcon, 
  Clock, 
  FileText, 
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Clock3,
  Trash2,
  GraduationCap
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TIME_SLOTS } from '../constants';

interface ExtraclasseProps {
  user: User;
}

export default function Extraclasse({ user }: ExtraclasseProps) {
  const [records, setRecords] = useState<ExtraclasseType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [className, setClassName] = useState('');
  const [requestingTeacher, setRequestingTeacher] = useState(user.name);
  const [activityDate, setActivityDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [reason, setReason] = useState('');
  const [observation, setObservation] = useState('');
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch('/api/extraclasse');
      const data = await res.json();
      if (Array.isArray(data)) {
        setRecords(data);
      }
    } catch (err) {
      console.error('Error fetching records:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedSlots.length === 0) {
      setError('Selecione pelo menos um horário.');
      return;
    }

    try {
      const sortedSlots = [...selectedSlots].sort((a, b) => parseInt(a) - parseInt(b));
      const slotLabels = sortedSlots.map(sId => {
        const slot = TIME_SLOTS.find(s => s.id === sId);
        return slot?.label;
      }).join(', ');

      const res = await fetch('/api/extraclasse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          student_name: studentName,
          class_name: className,
          requesting_teacher: requestingTeacher,
          activity_date: activityDate,
          time_slots: slotLabels,
          reason,
          observation
        }),
      });

      if (res.ok) {
        fetchRecords();
        closeModal();
      } else {
        const data = await res.json();
        setError(data.error || 'Erro ao criar solicitação');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await fetch(`/api/extraclasse/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchRecords();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta solicitação?')) return;
    try {
      await fetch(`/api/extraclasse/${id}`, { method: 'DELETE' });
      fetchRecords();
    } catch (err) {
      console.error(err);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setStudentName('');
    setClassName('');
    setRequestingTeacher(user.name);
    setActivityDate(format(new Date(), 'yyyy-MM-dd'));
    setSelectedSlots([]);
    setReason('');
    setObservation('');
    setError('');
  };

  const toggleSlot = (id: string) => {
    setSelectedSlots(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const filteredRecords = records.filter(r => 
    r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.class_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-semibold"><CheckCircle2 className="w-3 h-3" /> Aprovado</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-semibold"><XCircle className="w-3 h-3" /> Rejeitado</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">Cancelado</span>;
      default:
        return <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-semibold"><Clock3 className="w-3 h-3" /> Pendente</span>;
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-8 h-8 text-blue-600" />
            Solicitações Extraclasse
          </h1>
          <p className="text-slate-500">Controle de retirada de alunos para atividades externas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nova Solicitação
        </button>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por aluno, turma ou motivo..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Aluno / Turma</th>
                <th className="px-6 py-4">Data / Horários</th>
                <th className="px-6 py-4">Responsável / Motivo</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">Carregando solicitações...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">Nenhuma solicitação encontrada.</td></tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-slate-800 font-semibold">{r.student_name}</span>
                        <span className="text-slate-500 text-xs">{r.class_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-sm text-slate-600">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {format(new Date(r.activity_date), "dd 'de' MMMM", { locale: ptBR })}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {r.time_slots}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-sm text-slate-700 font-medium">
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          {r.requesting_teacher}
                        </div>
                        <p className="text-xs text-slate-500 italic max-w-[200px] truncate">{r.reason}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {user.role === 'admin' && r.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(r.id, 'approved')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Aprovar"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleStatusChange(r.id, 'rejected')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Rejeitar"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        {(user.role === 'admin' || r.user_id === user.id) && (
                          <button 
                            onClick={() => handleDelete(r.id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Excluir"
                          >
                            <Trash2 className="w-5 h-5" />
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-6 h-6 text-blue-600" />
                Nova Solicitação
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium">{error}</div>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Nome do Aluno</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Ex: João Silva"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">Turma</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    placeholder="Ex: 1º Ano A"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Professor Solicitante</label>
                <input 
                  type="text" 
                  required 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={requestingTeacher}
                  onChange={(e) => setRequestingTeacher(e.target.value)}
                  placeholder="Nome do professor ou admin"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Data da Atividade</label>
                <input 
                  type="date" 
                  required 
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={activityDate}
                  onChange={(e) => setActivityDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 block">Horários Necessários</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => toggleSlot(slot.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                        selectedSlots.includes(slot.id)
                          ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-blue-200 hover:bg-blue-50'
                      }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Motivo da Retirada</label>
                <textarea 
                  required 
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explique o motivo da atividade fora de sala..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Observações (Opcional)</label>
                <textarea 
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Informações adicionais relevantes..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-200"
                >
                  Confirmar Solicitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
