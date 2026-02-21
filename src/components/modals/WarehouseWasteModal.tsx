import React, { useState, useMemo } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { StockItem } from '../../types';

interface WarehouseWasteModalProps {
  projectId: number;
  materials: StockItem[];
  onClose: () => void;
  onSuccess: () => void;
}

export function WarehouseWasteModal({ projectId, materials, onClose, onSuccess }: WarehouseWasteModalProps) {
  const [formData, setFormData] = useState({
    material_id: '',
    date: new Date().toISOString().split('T')[0],
    quantity: 0,
    reason: ''
  });
  const [loading, setLoading] = useState(false);

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
      await fetch('/api/warehouse/waste', {
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
          <h3 className="text-lg font-bold text-slate-900">Registrar Perda / Desperdício</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Material</label>
            <select
              required
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              value={formData.material_id}
              onChange={e => setFormData({ ...formData, material_id: e.target.value })}
            >
              <option value="">Selecione o material...</option>
              {materials.map(mat => (
                <option key={mat.id} value={mat.id} disabled={mat.current_stock <= 0}>
                  {mat.description} (Estoque: {mat.current_stock} {mat.unit})
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Data"
              type="date"
              required
              value={formData.date}
              onChange={e => setFormData({...formData, date: e.target.value})}
            />
            <div className="space-y-1">
              <Input 
                label="Quantidade Perdida"
                type="number"
                step="0.01"
                required
                suffix={selectedMaterial?.unit}
                value={formData.quantity}
                onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
              />
              {selectedMaterial && (
                <p className="text-[10px] text-slate-500">
                  Estoque: {selectedMaterial.current_stock} {selectedMaterial.unit}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Motivo / Observação</label>
            <textarea 
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              value={formData.reason}
              onChange={e => setFormData({...formData, reason: e.target.value})}
              rows={3}
              placeholder="Descreva o motivo da perda ou desperdício..."
              required
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full bg-red-600 hover:bg-red-700"
              isLoading={loading}
              icon={<Trash2 size={18} />}
            >
              Registrar Perda
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
