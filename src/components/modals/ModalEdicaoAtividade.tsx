import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Activity } from '../../types';

interface ModalEdicaoAtividadeProps {
  stageId: number;
  initialData?: Activity;
  onClose: () => void;
  onSuccess: () => void;
}

export function ModalEdicaoAtividade({ stageId, initialData, onClose, onSuccess }: ModalEdicaoAtividadeProps) {
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

  const calculateEndDate = (startDate: string, duration: number) => {
    if (!startDate) return '';
    const [year, month, day] = startDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + Math.max(0, duration - 1));
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    const newEndDate = calculateEndDate(newStartDate, formData.planned_duration);
    setFormData({ ...formData, start_date: newStartDate, end_date: newEndDate });
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDuration = Number(e.target.value);
    const newEndDate = calculateEndDate(formData.start_date, newDuration);
    setFormData({ ...formData, planned_duration: newDuration, end_date: newEndDate });
  };

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900">{initialData ? 'Editar Atividade' : 'Nova Atividade'}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Descrição"
            required
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            placeholder="Ex: Escavação de sapatas"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Unidade"
              required
              value={formData.unit}
              onChange={e => setFormData({...formData, unit: e.target.value})}
              placeholder="Ex: m2, kg, un"
            />
            <Input
              label="Duração (dias)"
              type="number"
              required
              min={1}
              value={formData.planned_duration}
              onChange={handleDurationChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantidade"
              type="number"
              step="0.01"
              required
              suffix={formData.unit}
              value={formData.planned_quantity}
              onChange={e => setFormData({...formData, planned_quantity: Number(e.target.value)})}
            />
            <Input
              label="Custo Unit."
              type="number"
              step="0.01"
              required
              prefix="R$"
              value={formData.planned_unit_cost}
              onChange={e => setFormData({...formData, planned_unit_cost: Number(e.target.value)})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Data Início"
              type="date"
              value={formData.start_date}
              onChange={handleStartDateChange}
            />
            <Input
              label="Data Fim"
              type="date"
              value={formData.end_date}
              onChange={e => setFormData({...formData, end_date: e.target.value})}
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full"
              isLoading={loading}
            >
              {initialData ? 'Salvar Alterações' : 'Criar Atividade'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
