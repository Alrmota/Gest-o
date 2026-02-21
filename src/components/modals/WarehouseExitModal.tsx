import React, { useState, useMemo } from 'react';
import { X, LogOut } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Material, Stage, Activity, StockItem } from '../../types';

interface WarehouseExitModalProps {
  projectId: number;
  stages: Stage[];
  activities: Activity[];
  materials: StockItem[];
  onClose: () => void;
  onSuccess: () => void;
}

export function WarehouseExitModal({ projectId, stages, activities, materials, onClose, onSuccess }: WarehouseExitModalProps) {
  const [formData, setFormData] = useState({
    material_id: '',
    stage_id: '',
    activity_id: '',
    date: new Date().toISOString().split('T')[0],
    collaborator: '',
    storage_location: '',
    storage_sector: '',
    quantity: 0
  });
  const [loading, setLoading] = useState(false);

  const filteredActivities = useMemo(() => {
    if (!formData.stage_id) return [];
    return activities.filter(act => act.stage_id === Number(formData.stage_id));
  }, [activities, formData.stage_id]);

  const filteredMaterials = useMemo(() => {
    if (!formData.activity_id) return [];
    return materials.filter(mat => mat.activity_id === Number(formData.activity_id));
  }, [materials, formData.activity_id]);

  const selectedMaterial = useMemo(() => {
    return materials.find(m => m.id === Number(formData.material_id));
  }, [materials, formData.material_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMaterial && formData.quantity > selectedMaterial.current_stock) {
      alert('Quantidade superior ao estoque disponível!');
      return;
    }

    setLoading(true);
    try {
      await fetch('/api/warehouse/exits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            ...formData, 
            project_id: projectId,
            material_id: Number(formData.material_id),
            stage_id: Number(formData.stage_id),
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900">Registrar Saída de Material</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Etapa Destino</label>
              <select
                required
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={formData.stage_id}
                onChange={e => setFormData({ ...formData, stage_id: e.target.value, activity_id: '', material_id: '' })}
              >
                <option value="">Selecione a etapa...</option>
                {stages.map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Atividade Destino</label>
              <select
                required
                disabled={!formData.stage_id}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                value={formData.activity_id}
                onChange={e => setFormData({ ...formData, activity_id: e.target.value, material_id: '' })}
              >
                <option value="">Selecione a atividade...</option>
                {filteredActivities.map(act => (
                  <option key={act.id} value={act.id}>{act.description}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Material</label>
              <select
                required
                disabled={!formData.activity_id}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                value={formData.material_id}
                onChange={e => setFormData({ ...formData, material_id: e.target.value })}
              >
                <option value="">Selecione o material...</option>
                {filteredMaterials.map(mat => (
                  <option key={mat.id} value={mat.id} disabled={mat.current_stock <= 0}>
                    {mat.description} (Estoque: {mat.current_stock} {mat.unit})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Data"
              type="date"
              required
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
            <Input 
              label="Colaborador / Retirado por"
              required
              value={formData.collaborator}
              onChange={e => setFormData({...formData, collaborator: e.target.value})}
              placeholder="Nome do colaborador"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Local de Armazenamento"
              value={formData.storage_location}
              onChange={e => setFormData({...formData, storage_location: e.target.value})}
              placeholder="Ex: Almoxarifado Central"
            />
            <Input 
              label="Setor / Prateleira"
              value={formData.storage_sector}
              onChange={e => setFormData({...formData, storage_sector: e.target.value})}
              placeholder="Ex: Setor A-1"
            />
          </div>
          
          <div className="space-y-1">
            <Input 
              label="Quantidade de Saída"
              type="number"
              step="0.01"
              required
              suffix={selectedMaterial?.unit}
              value={formData.quantity}
              onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
            />
            {selectedMaterial && (
              <p className="text-[10px] text-slate-500">
                Estoque Disponível: {selectedMaterial.current_stock} {selectedMaterial.unit}
              </p>
            )}
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full"
              isLoading={loading}
              icon={<LogOut size={18} />}
            >
              Confirmar Saída
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
