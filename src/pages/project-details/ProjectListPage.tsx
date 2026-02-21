import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Calendar, MapPin } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { Project } from '../../types';

import { ProjectModal } from '../../components/modals/ProjectModal';

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [showProjectModal, setShowProjectModal] = useState(false);

  const fetchProjects = () => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => setProjects(data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planning': return <Badge variant="warning">Planejamento</Badge>;
      case 'in_progress': return <Badge variant="info">Em Andamento</Badge>;
      case 'completed': return <Badge variant="success">Concluído</Badge>;
      case 'on_hold': return <Badge variant="danger">Paralisado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Projetos</h1>
        <Button 
          icon={<Plus size={20} />}
          onClick={() => setShowProjectModal(true)}
        >
          Novo Projeto
        </Button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-end gap-4">
        <div className="flex-1">
          <Input 
            placeholder="Buscar projetos..." 
            className="pl-10"
            icon={<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-slate-700">Status</label>
          <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
            <option value="">Todos os Status</option>
            <option value="planning">Planejamento</option>
            <option value="in_progress">Em Andamento</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Link key={project.id} to={`/projects/${project.id}`} className="block group">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                {getStatusBadge(project.status)}
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

      {showProjectModal && (
        <ProjectModal 
          onClose={() => setShowProjectModal(false)}
          onSuccess={fetchProjects}
        />
      )}
    </div>
  );
}
