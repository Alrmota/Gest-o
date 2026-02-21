import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Input, CurrencyInput, NumberInput } from '../../components/common/Input';
import { Project } from '../../types';

export default function ProjectFormPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Project, 'id'>>({
    name: '',
    client: '',
    type: '',
    address: '',
    built_area: 0,
    start_date: '',
    end_date: '',
    contract_value: 0,
    status: 'planning'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'built_area' || name === 'contract_value' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar projeto');
      }

      navigate('/projects');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar projeto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost"
          size="sm"
          onClick={() => navigate('/projects')}
          icon={<ArrowLeft size={24} />}
        />
        <h1 className="text-2xl font-bold text-gray-900">Novo Projeto</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nome do Projeto"
            required
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: Residencial Villa Verde"
          />

          <Input
            label="Cliente"
            required
            name="client"
            value={formData.client}
            onChange={handleChange}
            placeholder="Ex: Construtora Horizonte"
          />

          <Input
            label="Tipo de Obra"
            required
            name="type"
            value={formData.type}
            onChange={handleChange}
            placeholder="Ex: Residencial Multifamiliar"
          />

          <Input
            label="Endereço"
            required
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Ex: Av. das Flores, 123"
          />

          <NumberInput
            label="Área Construída (m²)"
            required
            name="built_area"
            value={formData.built_area}
            onValueChange={(values) => setFormData(prev => ({ ...prev, built_area: values.floatValue || 0 }))}
          />

          <CurrencyInput
            label="Valor do Contrato"
            required
            name="contract_value"
            value={formData.contract_value}
            onValueChange={(values) => setFormData(prev => ({ ...prev, contract_value: values.floatValue || 0 }))}
          />

          <Input
            label="Data de Início"
            required
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
          />

          <Input
            label="Data de Término"
            required
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
          />

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="planning">Planejamento</option>
              <option value="in_progress">Em Andamento</option>
              <option value="on_hold">Paralisado</option>
              <option value="completed">Concluído</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <Button
            type="submit"
            isLoading={loading}
            icon={<Save size={20} />}
          >
            Salvar Projeto
          </Button>
        </div>
      </form>
    </div>
  );
}
