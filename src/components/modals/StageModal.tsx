import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '../common/Input';
import { Button } from '../common/Button';

interface StageModalProps {
  projectId: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function StageModal({ projectId, onClose, onSuccess }: StageModalProps) {
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-900">Nova Etapa</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Nome da Etapa"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Fundação"
          />
          <Input 
            label="Ordem"
            type="number"
            required
            min={1}
            value={order}
            onChange={e => setOrder(Number(e.target.value))}
          />
          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full"
              isLoading={loading}
            >
              Criar Etapa
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
