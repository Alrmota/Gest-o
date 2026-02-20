import React, { useState } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { Stage, Activity } from '../types';

interface StageFormProps {
  projectId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function StageForm({ projectId, onClose, onSuccess }: StageFormProps) {
  const [name, setName] = useState('');
  const [order, setOrder] = useState(1);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId, name, display_order: order })
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Nova Etapa</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nome da Etapa</label>
            <input 
              required
              className="w-full border rounded-lg p-2"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Fundação"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Ordem</label>
            <input 
              type="number"
              required
              className="w-full border rounded-lg p-2"
              value={order}
              onChange={e => setOrder(Number(e.target.value))}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  );
}

interface ActivityFormProps {
  stageId: number;
  initialData?: Activity;
  onClose: () => void;
  onSuccess: () => void;
}

export function ActivityForm({ stageId, initialData, onClose, onSuccess }: ActivityFormProps) {
  const [formData, setFormData] = useState({
    description: initialData?.description || '',
    unit: initialData?.unit || 'un',
    planned_quantity: initialData?.planned_quantity || 0,
    planned_unit_cost: initialData?.planned_unit_cost || 0,
    planned_duration: initialData?.planned_duration || 1,
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = initialData ? `/api/activities/${initialData.id}` : '/api/activities';
      const method = initialData ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          stage_id: stageId, 
          ...formData,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null
        })
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{initialData ? 'Editar Atividade' : 'Nova Atividade'}</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Descrição</label>
            <input 
              required
              className="w-full border rounded-lg p-2"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Unidade</label>
                <input 
                required
                className="w-full border rounded-lg p-2"
                value={formData.unit}
                onChange={e => setFormData({...formData, unit: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Duração (dias)</label>
                <input 
                type="number"
                required
                className="w-full border rounded-lg p-2"
                value={formData.planned_duration}
                onChange={e => setFormData({...formData, planned_duration: Number(e.target.value)})}
                />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Quantidade</label>
                <input 
                type="number"
                step="0.01"
                required
                className="w-full border rounded-lg p-2"
                value={formData.planned_quantity}
                onChange={e => setFormData({...formData, planned_quantity: Number(e.target.value)})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Custo Unit. (R$)</label>
                <input 
                type="number"
                step="0.01"
                required
                className="w-full border rounded-lg p-2"
                value={formData.planned_unit_cost}
                onChange={e => setFormData({...formData, planned_unit_cost: Number(e.target.value)})}
                />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Data Início</label>
                <input 
                type="date"
                className="w-full border rounded-lg p-2"
                value={formData.start_date}
                onChange={e => setFormData({...formData, start_date: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Data Fim</label>
                <input 
                type="date"
                className="w-full border rounded-lg p-2"
                value={formData.end_date}
                onChange={e => setFormData({...formData, end_date: e.target.value})}
                />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  );
}

interface DailyLogFormProps {
  projectId: number;
  activities: Activity[];
  onClose: () => void;
  onSuccess: () => void;
}

export function DailyLogForm({ projectId, activities, onClose, onSuccess }: DailyLogFormProps) {
  const [formData, setFormData] = useState({
    activity_id: '',
    date: new Date().toISOString().split('T')[0],
    executed_quantity: 0,
    real_cost: 0,
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            ...formData, 
            activity_id: Number(formData.activity_id) 
        })
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Novo Apontamento</h3>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Atividade</label>
            <select
              required
              className="w-full border rounded-lg p-2"
              value={formData.activity_id}
              onChange={e => setFormData({...formData, activity_id: e.target.value})}
            >
                <option value="">Selecione uma atividade...</option>
                {activities.map(act => (
                    <option key={act.id} value={act.id}>{act.description}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data</label>
            <input 
              type="date"
              required
              className="w-full border rounded-lg p-2"
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Qtd. Executada</label>
                <input 
                type="number"
                step="0.01"
                required
                className="w-full border rounded-lg p-2"
                value={formData.executed_quantity}
                onChange={e => setFormData({...formData, executed_quantity: Number(e.target.value)})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Custo Real (R$)</label>
                <input 
                type="number"
                step="0.01"
                required
                className="w-full border rounded-lg p-2"
                value={formData.real_cost}
                onChange={e => setFormData({...formData, real_cost: Number(e.target.value)})}
                />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Observações</label>
            <textarea 
              className="w-full border rounded-lg p-2"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              rows={3}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </div>
    </div>
  );
}
