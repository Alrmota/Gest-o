import React, { useState, useMemo } from 'react';
import { X, ShoppingCart } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Material, Stage, Activity } from '../../types';

interface PurchaseModalProps {
  projectId: number;
  stages: Stage[];
  activities: Activity[];
  materials: Material[];
  onClose: () => void;
  onSuccess: () => void;
}

export function PurchaseModal({ projectId, stages, activities, materials, onClose, onSuccess }: PurchaseModalProps) {
  const [formData, setFormData] = useState({
    material_id: '',
    date: new Date().toISOString().split('T')[0],
    quantity: 0,
    unit_price: 0,
    supplier: '',
    invoice_number: '',
    notes: ''
  });
  const [selectedStageId, setSelectedStageId] = useState<string>('');
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const filteredStages = useMemo(() => {
    return stages.filter(stage => 
      materials.some(mat => {
        const activity = activities.find(a => a.id === mat.activity_id);
        return activity?.stage_id === stage.id;
      })
    );
  }, [stages, materials, activities]);

  const filteredActivities = useMemo(() => {
    if (!selectedStageId) return [];
    return activities.filter(act => act.stage_id === Number(selectedStageId));
  }, [activities, selectedStageId]);

  const filteredMaterials = useMemo(() => {
    if (!selectedActivityId) return [];
    return materials.filter(mat => mat.activity_id === Number(selectedActivityId));
  }, [materials, selectedActivityId]);

  const selectedMaterial = useMemo(() => {
    return materials.find(m => m.id === Number(formData.material_id));
  }, [materials, formData.material_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            ...formData, 
            project_id: projectId,
            material_id: Number(formData.material_id) 
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
          <h3 className="text-lg font-bold text-slate-900">Registrar Compra</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
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
                  setSelectedActivityId('');
                  setFormData(prev => ({ ...prev, material_id: '' }));
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
                value={selectedActivityId}
                onChange={e => {
                  setSelectedActivityId(e.target.value);
                  setFormData(prev => ({ ...prev, material_id: '' }));
                }}
              >
                <option value="">Selecione a atividade...</option>
                {filteredActivities.map(act => (
                  <option key={act.id} value={act.id}>{act.description}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Material do Levantamento</label>
              <select
                required
                disabled={!selectedActivityId}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-50 disabled:text-slate-400"
                value={formData.material_id}
                onChange={e => {
                  const matId = e.target.value;
                  const mat = materials.find(m => m.id === Number(matId));
                  setFormData(prev => ({ 
                    ...prev, 
                    material_id: matId,
                    unit_price: mat?.unit_cost || 0
                  }));
                }}
              >
                <option value="">Selecione o material...</option>
                {filteredMaterials.map(mat => (
                  <option key={mat.id} value={mat.id}>
                    {mat.description} ({mat.unit})
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
              label="Fornecedor"
              required
              value={formData.supplier}
              onChange={e => setFormData({...formData, supplier: e.target.value})}
              placeholder="Ex: Leroy Merlin"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Input 
                label="Quantidade"
                type="number"
                step="0.01"
                required
                suffix={selectedMaterial?.unit}
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
              />
              {selectedMaterial && (
                <p className="text-[10px] text-slate-500">
                  Previsto: {selectedMaterial.quantity} {selectedMaterial.unit} | Comprado: {selectedMaterial.purchased_quantity || 0}
                </p>
              )}
            </div>
            <Input 
              label="Preço Unit."
              type="number"
              step="0.01"
              required
              prefix="R$"
              value={formData.unit_price}
              onChange={e => setFormData({...formData, unit_price: Number(e.target.value)})}
            />
          </div>

          <Input 
            label="Nº Nota Fiscal"
            value={formData.invoice_number}
            onChange={e => setFormData({...formData, invoice_number: e.target.value})}
            placeholder="Opcional"
          />
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Observações</label>
            <textarea 
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              rows={2}
              placeholder="Notas sobre a compra..."
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full"
              isLoading={loading}
              icon={<ShoppingCart size={18} />}
            >
              Confirmar Compra
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
