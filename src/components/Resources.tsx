
import React, { useState, useEffect } from 'react';
import { User, Resource } from '../types';
import { Plus, Pencil, Trash2, Package, Check, X, Monitor, Projector, Mic2, Tablet, Laptop, Box } from 'lucide-react';

interface ResourcesProps {
  user: User;
}

export default function Resources({ user }: ResourcesProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('Laboratório');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);

  const resourceTypes = ['Laboratório', 'Equipamento', 'Sala', 'Outros'];

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/resources');
      const data = await res.json();
      setResources(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingResource ? `/api/resources/${editingResource.id}` : '/api/resources';
    const method = editingResource ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, description, active }),
      });

      if (res.ok) {
        fetchResources();
        closeModal();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/resources/${id}`, { method: 'DELETE' });
      fetchResources();
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (resource: Resource | null = null) => {
    if (resource) {
      setEditingResource(resource);
      setName(resource.name);
      setType(resource.type);
      setDescription(resource.description || '');
      setActive(resource.active);
    } else {
      setEditingResource(null);
      setName('');
      setType('Laboratório');
      setDescription('');
      setActive(true);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingResource(null);
  };

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'laboratório': return <Monitor className="w-5 h-5" />;
      case 'equipamento': return <Projector className="w-5 h-5" />;
      case 'sala': return <Box className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Recursos</h1>
          <p className="text-slate-500 text-sm md:text-base">Gerencie os materiais e salas disponíveis para reserva.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-semibold shadow-md shadow-blue-100 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Novo Recurso
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">Carregando recursos...</div>
        ) : resources.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">Nenhum recurso cadastrado.</div>
        ) : (
          resources.map((resource) => (
            <div key={resource.id} className="glass-card p-6 flex flex-col group">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${resource.active ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                  {getResourceIcon(resource.type)}
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => openModal(resource)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(resource.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-1">{resource.name}</h3>
              <p className="text-sm text-slate-500 mb-4 flex-1">{resource.description || 'Sem descrição'}</p>
              
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{resource.type}</span>
                <span className={`flex items-center gap-1 text-xs font-bold ${resource.active ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {resource.active ? (
                    <>
                      <Check className="w-3 h-3" />
                      Ativo
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3" />
                      Inativo
                    </>
                  )}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingResource ? 'Editar Recurso' : 'Novo Recurso'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Recurso</label>
                <input
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Projetor Epson"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
                <select
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {resourceTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição (Opcional)</label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes sobre o recurso..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-slate-700">Recurso Ativo</label>
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
                  {editingResource ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
