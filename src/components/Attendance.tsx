
import React, { useState, useEffect } from 'react';
import { User, DailyAttendance } from '../types';
import { format } from 'date-fns';
import { 
  Plus, 
  Users, 
  Calendar, 
  Save, 
  Search,
  School,
  History,
  TrendingUp,
  AlertCircle,
  Edit2,
  Trash2
} from 'lucide-react';

interface AttendanceProps {
  user: User;
}

export default function Attendance({ user }: AttendanceProps) {
  const [records, setRecords] = useState<DailyAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [customClassName, setCustomClassName] = useState('');
  const [studentCount, setStudentCount] = useState('');
  const [targetDate, setTargetDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [saving, setSaving] = useState(false);

  const CLASS_OPTIONS = [
    '101 - Informática',
    '102 - Informática para Internet',
    '103 - Veterinária',
    '201 - Informática',
    '202 - Informática para Internet',
    '203 - Veterinária',
    '300 - Marketing',
    '301 - Informática para Internet',
    '302 - Administração',
    'Outros'
  ];

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/attendance?date=${targetDate}`);
      const data = await res.json();
      if (res.ok) {
        setRecords(data);
        setError(null);
      } else {
        setError(data.error || 'Erro ao carregar presenças');
      }
    } catch (err) {
      setError('Falha na conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [targetDate]);

  const handleEdit = (record: DailyAttendance) => {
    setEditId(record.id);
    if (CLASS_OPTIONS.includes(record.class_name)) {
      setSelectedClass(record.class_name);
      setCustomClassName('');
    } else {
      setSelectedClass('Outros');
      setCustomClassName(record.class_name);
    }
    setStudentCount(record.student_count.toString());
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro?')) return;

    try {
      const res = await fetch(`/api/attendance/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAttendance();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir registro');
      }
    } catch (err) {
      alert('Falha ao conectar com o servidor');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalClassName = selectedClass === 'Outros' ? customClassName : selectedClass;

    if (!finalClassName || studentCount === '') return;
    
    const count = parseInt(studentCount);
    if (isNaN(count) || count < 0) {
      alert('Quantidade inválida');
      return;
    }

    try {
      setSaving(true);
      const url = editId ? `/api/attendance/${editId}` : '/api/attendance';
      const method = editId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          class_name: finalClassName,
          student_count: count,
          attendance_date: targetDate
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setEditId(null);
        setSelectedClass('');
        setCustomClassName('');
        setStudentCount('');
        fetchAttendance();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao salvar presença');
      }
    } catch (err) {
      alert('Falha ao conectar com o servidor');
    } finally {
      setSaving(false);
    }
  };

  if (error && error.includes('migração')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-amber-50 rounded-3xl border-2 border-dashed border-amber-200">
        <div className="bg-amber-100 p-4 rounded-full text-amber-600 mb-6 font-bold text-4xl">!</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Configuração Necessária</h2>
        <p className="text-slate-600 max-w-lg mb-8 leading-relaxed">
          {error}
          <br /><br />
          Para resolver, copie o código SQL que está na parte de <strong>daily_attendance</strong> do arquivo <strong>supabase_migration.sql</strong> 
          e execute-o no <strong>SQL Editor</strong> do seu painel do Supabase.
        </p>
        <button 
          onClick={fetchAttendance}
          className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md active:scale-95"
        >
          Já executei, tentar novamente
        </button>
      </div>
    );
  }

  const totalPresence = records.reduce((sum, r) => sum + r.student_count, 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Presença do Dia</h1>
          <p className="text-slate-500 mt-1">Acompanhamento diário de alunos presentes na escola.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Registrar Sala
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total de Alunos (Hoje)</p>
            <p className="text-2xl font-bold text-slate-800 leading-none mt-1">{totalPresence}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
            <School className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Salas Registradas</p>
            <p className="text-2xl font-bold text-slate-800 leading-none mt-1">
              {records.filter(r => CLASS_OPTIONS.slice(0, 9).includes(r.class_name)).length}/9
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 overflow-hidden relative">
          <div className="bg-slate-100 p-3 rounded-xl text-slate-600">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-500">Filtrar por Data</p>
            <input 
              type="date" 
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="font-bold text-slate-800 bg-transparent border-none p-0 focus:ring-0 cursor-pointer w-full"
            />
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            <h2 className="font-bold text-slate-700">Registros Detalhados</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Sala / Turma</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Quantidade</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Líder Responsável</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Horário do Registro</th>
                {user.role === 'admin' && (
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Ações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={user.role === 'admin' ? 5 : 4} className="px-6 py-12 text-center text-slate-400">Carregando...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={user.role === 'admin' ? 5 : 4} className="px-6 py-12 text-center text-slate-400">Nenhum registro para esta data.</td></tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{r.class_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-bold inline-block">
                        {r.student_count} alunos
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{r.responsible_name}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">
                      {r.created_at ? format(new Date(r.created_at), 'HH:mm') : '-'}
                    </td>
                    {user.role === 'admin' && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleEdit(r)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(r.id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className={`px-8 py-6 text-white ${editId ? 'bg-amber-600' : 'bg-blue-600'}`}>
              <h2 className="text-xl font-bold">{editId ? 'Editar Registro' : 'Registrar Presença'}</h2>
              <p className={`${editId ? 'text-amber-100' : 'text-blue-100'} text-sm mt-1`}>
                {editId ? 'Altere os dados da presença registrada.' : 'Informe a quantidade de alunos presentes na sala.'}
              </p>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                <label className="text-sm font-semibold text-slate-700">Data do Registro</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="date" 
                    readOnly
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-slate-500 cursor-not-allowed"
                    value={targetDate}
                  />
                </div>
              </div>

              <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                <label className="text-sm font-semibold text-slate-700">Sala / Turma</label>
                <div className="relative">
                  <School className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select 
                    required 
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    <option value="" disabled>Selecione uma turma</option>
                    {CLASS_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedClass === 'Outros' && (
                <div className="space-y-1.5 focus-within:text-blue-600 transition-colors animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-sm font-semibold text-slate-700">Especificar Sala/Turma</label>
                  <div className="relative">
                    <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      required 
                      className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                      value={customClassName}
                      onChange={(e) => setCustomClassName(e.target.value)}
                      placeholder="Ex: Turma Extra, Palestra..."
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 focus-within:text-blue-600 transition-colors">
                <label className="text-sm font-semibold text-slate-700">Quantidade de Alunos</label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    type="number" 
                    min="0"
                    required 
                    className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={studentCount}
                    onChange={(e) => setStudentCount(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditId(null);
                    setSelectedClass('');
                    setCustomClassName('');
                    setStudentCount('');
                  }}
                  className="flex-1 px-4 py-3 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className={`flex-1 flex items-center justify-center gap-2 disabled:opacity-50 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-sm active:scale-95 ${editId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Salvando...' : editId ? 'Atualizar' : 'Salvar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
