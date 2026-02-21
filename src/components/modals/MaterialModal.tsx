import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Material, Stage, Activity } from '../../types';

interface MaterialModalProps {
  projectId: number;
  stages: Stage[];
  activities: Activity[];
  initialData?: Material;
  onClose: () => void;
  onSuccess: () => void;
}

export function MaterialModal({ projectId, stages, activities, initialData, onClose, onSuccess }: MaterialModalProps) {
  const [formData, setFormData] = useState({
    stage_id: initialData?.stage_id || '',
    activity_id: initialData?.activity_id || '',
    description: initialData?.description || '',
    unit: initialData?.unit || '',
    quantity: initialData?.quantity || 0,
    unit_cost: initialData?.unit_cost || 0,
    category: initialData?.category || ''
  });
  const [loading, setLoading] = useState(false);

  const filteredActivities = activities.filter(a => a.stage_id === Number(formData.stage_id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = initialData ? `/api/materials/${initialData.id}` : '/api/materials';
      const method = initialData ? 'PUT' : 'POST';
      
      const payload = {
        ...formData,
        project_id: projectId,
        stage_id: formData.stage_id ? Number(formData.stage_id) : null,
        activity_id: formData.activity_id ? Number(formData.activity_id) : null,
      };

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900">
            {initialData ? 'Editar Material' : 'Novo Material'}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Etapa</label>
            <select
              required
              value={formData.stage_id}
              onChange={e => setFormData({...formData, stage_id: e.target.value, activity_id: ''})}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">Selecione a etapa</option>
              {stages.map(stage => (
                <option key={stage.id} value={stage.id}>{stage.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Atividade</label>
            <select
              required
              value={formData.activity_id}
              onChange={e => setFormData({...formData, activity_id: e.target.value})}
              disabled={!formData.stage_id}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="">Selecione a atividade</option>
              {filteredActivities.map(activity => (
                <option key={activity.id} value={activity.id}>{activity.description}</option>
              ))}
            </select>
          </div>

          <Input 
            label="Descrição"
            required
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            placeholder="Ex: Cimento CP-II"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Unidade"
              required
              value={formData.unit}
              onChange={e => setFormData({...formData, unit: e.target.value})}
              placeholder="Ex: sc"
            />
            <Input 
              label="Categoria"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
              placeholder="Ex: Alvenaria"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Quantidade"
              type="number"
              step="0.01"
              required
              suffix={formData.unit}
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
            />
            <Input 
              label="Custo Unit."
              type="number"
              step="0.01"
              required
              prefix="R$"
              value={formData.unit_cost}
              onChange={e => setFormData({...formData, unit_cost: Number(e.target.value)})}
            />
          </div>
          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full"
              isLoading={loading}
            >
              {initialData ? 'Salvar Alterações' : 'Adicionar Material'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
