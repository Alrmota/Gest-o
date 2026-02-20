import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Calendar, MapPin } from 'lucide-react';
import { Project } from '../types';

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error(err));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
        case 'planning': return 'Planejamento';
        case 'in_progress': return 'Em Andamento';
        case 'completed': return 'Concluído';
        case 'on_hold': return 'Paralisado';
        default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Projetos</h1>
        <Link to="/projects/new" className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700">
          <Plus size={20} />
          Novo Projeto
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar projetos..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <select className="border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">Todos os Status</option>
          <option value="planning">Planejamento</option>
          <option value="in_progress">Em Andamento</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link key={project.id} to={`/projects/${project.id}`} className="block group">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                  {getStatusLabel(project.status)}
                </div>
                <span className="text-sm text-gray-500 font-mono">#{project.id.toString().padStart(4, '0')}</span>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{project.client}</p>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  {project.address}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  {new Date(project.start_date).toLocaleDateString('pt-BR')} - {new Date(project.end_date).toLocaleDateString('pt-BR')}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">Valor Contrato</p>
                  <p className="font-semibold text-gray-900">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(project.contract_value)}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
