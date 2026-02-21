import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Activity, Stage } from '../../types';

interface DailyLogModalProps {
  projectId: number;
  stages: Stage[];
  activities: Activity[];
  onClose: () => void;
  onSuccess: () => void;
}

export function DailyLogModal({ projectId, stages, activities, onClose, onSuccess }: DailyLogModalProps) {
  const [formData, setFormData] = useState({
    activity_id: '',
    date: new Date().toISOString().split('T')[0],
    executed_quantity: 0,
    real_cost: 0,
    notes: ''
  });
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredStages = useMemo(() => {
    return stages.filter(stage => 
      activities.some(act => 
        act.stage_id === stage.id && 
        (act.planned_quantity - (act.executed_quantity || 0)) > 0
      )
    );
  }, [stages, activities]);

  const filteredActivities = useMemo(() => {
    if (!selectedStageId) return [];
    return activities.filter(act => act.stage_id === Number(selectedStageId));
  }, [activities, selectedStageId]);

  const selectedActivity = useMemo(() => {
    return activities.find(a => a.id === Number(formData.activity_id));
  }, [activities, formData.activity_id]);
  const remainingQuantity = selectedActivity 
    ? selectedActivity.planned_quantity - (selectedActivity.executed_quantity || 0)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.executed_quantity > remainingQuantity) {
      setError(`A quantidade executada não pode ultrapassar o saldo restante (${remainingQuantity.toFixed(2)} ${selectedActivity?.unit}).`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            ...formData, 
            activity_id: Number(formData.activity_id) 
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar apontamento');
      }

      onSuccess();
      onClose();
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900">Novo Apontamento</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Etapa</label>
              <select
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={selectedStageId}
                onChange={e => {
                  setSelectedStageId(e.target.value);
                  setFormData(prev => ({ ...prev, activity_id: '' }));
                  setError(null);
                }}
              >
                <option value="">Selecione a etapa...</option>
                {filteredStages.map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Atividade</label>
              <select
                required
                disabled={!selectedStageId}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                value={formData.activity_id}
                onChange={e => {
                  setFormData({...formData, activity_id: e.target.value});
                  setError(null);
                }}
              >
                <option value="">Selecione a atividade...</option>
                {filteredActivities
                  .filter(act => (act.planned_quantity - (act.executed_quantity || 0)) > 0)
                  .map(act => (
                    <option key={act.id} value={act.id}>
                      {act.description}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>
          
          <Input 
            label="Data"
            type="date"
            required
            value={formData.date}
            onChange={e => setFormData({...formData, date: e.target.value})}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Input 
                label="Qtd. Executada"
                type="number"
                step="0.01"
                required
                max={remainingQuantity}
                suffix={selectedActivity?.unit}
                value={formData.executed_quantity}
                onChange={e => setFormData({...formData, executed_quantity: Number(e.target.value)})}
              />
              {selectedActivity && (
                <p className="text-[10px] text-slate-500">
                  Saldo disponível: {remainingQuantity.toFixed(2)} {selectedActivity.unit}
                </p>
              )}
            </div>
            <Input 
              label="Custo Real"
              type="number"
              step="0.01"
              required
              prefix="R$"
              value={formData.real_cost}
              onChange={e => setFormData({...formData, real_cost: Number(e.target.value)})}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Observações</label>
            <textarea 
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              rows={3}
              placeholder="Notas sobre o serviço..."
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full"
              isLoading={loading}
            >
              Salvar Apontamento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
