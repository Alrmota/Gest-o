import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Project } from '../../types';

interface ProjectModalProps {
  initialData?: Project;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProjectModal({ initialData, onClose, onSuccess }: ProjectModalProps) {
  const [formData, setFormData] = useState<Omit<Project, 'id'>>({
    name: initialData?.name || '',
    client: initialData?.client || '',
    type: initialData?.type || '',
    address: initialData?.address || '',
    built_area: initialData?.built_area || 0,
    start_date: initialData?.start_date || new Date().toISOString().split('T')[0],
    end_date: initialData?.end_date || new Date().toISOString().split('T')[0],
    contract_value: initialData?.contract_value || 0,
    status: initialData?.status || 'planning',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = initialData ? `/api/projects/${initialData.id}` : '/api/projects';
      const method = initialData ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900">{initialData ? 'Editar Projeto' : 'Novo Projeto'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input 
              label="Nome do Projeto"
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="Ex: Construção Edifício Alpha"
            />
            <Input 
              label="Cliente"
              required
              value={formData.client}
              onChange={e => setFormData({...formData, client: e.target.value})}
              placeholder="Ex: Empresa Beta"
            />
            <Input 
              label="Tipo de Obra"
              required
              value={formData.type}
              onChange={e => setFormData({...formData, type: e.target.value})}
              placeholder="Ex: Residencial Multifamiliar"
            />
            <Input 
              label="Endereço"
              required
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              placeholder="Ex: Rua Exemplo, 123"
            />
            <Input 
              label="Área Construída"
              type="number"
              step="0.01"
              required
              suffix="m²"
              value={formData.built_area}
              onChange={e => setFormData({...formData, built_area: Number(e.target.value)})}
            />
            <Input 
              label="Valor do Contrato"
              type="number"
              step="0.01"
              required
              prefix="R$"
              value={formData.contract_value}
              onChange={e => setFormData({...formData, contract_value: Number(e.target.value)})}
            />
            <Input 
              label="Data de Início"
              type="date"
              required
              value={formData.start_date}
              onChange={e => setFormData({...formData, start_date: e.target.value})}
            />
            <Input 
              label="Data de Término"
              type="date"
              required
              value={formData.end_date}
              onChange={e => setFormData({...formData, end_date: e.target.value})}
            />
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value as any})}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="planning">Planejamento</option>
                <option value="in_progress">Em Andamento</option>
                <option value="on_hold">Paralisado</option>
                <option value="completed">Concluído</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} type="button">Cancelar</Button>
            <Button 
              type="submit" 
              isLoading={loading}
              icon={<Save size={18} />}
            >
              {initialData ? 'Salvar Alterações' : 'Criar Projeto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
