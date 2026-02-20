import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { Project } from '../types';

export default function ProjectForm() {
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
        <button 
          onClick={() => navigate('/projects')}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Novo Projeto</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Nome do Projeto</label>
            <input
              required
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ex: Residencial Villa Verde"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Cliente</label>
            <input
              required
              type="text"
              name="client"
              value={formData.client}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ex: Construtora Horizonte"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tipo de Obra</label>
            <input
              required
              type="text"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ex: Residencial Multifamiliar"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Endereço</label>
            <input
              required
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Ex: Av. das Flores, 123"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Área Construída (m²)</label>
            <input
              required
              type="number"
              name="built_area"
              value={formData.built_area}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Valor do Contrato (R$)</label>
            <input
              required
              type="number"
              name="contract_value"
              value={formData.contract_value}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Data de Início</label>
            <input
              required
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Data de Término</label>
            <input
              required
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="planning">Planejamento</option>
              <option value="in_progress">Em Andamento</option>
              <option value="on_hold">Paralisado</option>
              <option value="completed">Concluído</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
          >
            <Save size={20} />
            {loading ? 'Salvando...' : 'Salvar Projeto'}
          </button>
        </div>
      </form>
    </div>
  );
}
