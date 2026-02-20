import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckSquare, DollarSign, Calendar as CalendarIcon, Activity as ActivityIcon, Download, Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { StageForm, ActivityForm, DailyLogForm } from '../components/Forms';
import { Project, Stage, Activity, DailyLog } from '../types';

// Simple Tabs implementation since we don't have shadcn/ui
function SimpleTabs({ children, defaultValue }: { children: React.ReactNode, defaultValue: string }) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <div className="w-full">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { activeTab, setActiveTab } as any);
        }
        return child;
      })}
    </div>
  );
}

function TabList({ children, activeTab, setActiveTab }: any) {
  return <div className="flex border-b border-gray-200 mb-6">{
    React.Children.map(children, child => React.cloneElement(child, { activeTab, setActiveTab }))
  }</div>;
}

function TabTrigger({ value, children, activeTab, setActiveTab }: any) {
  const isActive = activeTab === value;
  return (
    <button
      className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${isActive ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

function TabContent({ value, children, activeTab }: any) {
  if (activeTab !== value) return null;
  return <div>{children}</div>;
}

export default function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [dailyLogs, setDailyLogs] = useState<(DailyLog & { activity_name?: string })[]>([]);
  const [showStageForm, setShowStageForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState<number | null>(null); // stageId or null
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [showDailyLogForm, setShowDailyLogForm] = useState(false);
  const [editingStageId, setEditingStageId] = useState<number | null>(null);
  const [editingStageName, setEditingStageName] = useState('');

  const fetchData = () => {
    fetch(`/api/projects/${id}`)
      .then(res => res.json())
      .then(data => setProject(data));

    fetch(`/api/projects/${id}/stages`)
      .then(res => res.json())
      .then(data => setStages(data));

    fetch(`/api/projects/${id}/activities`)
      .then(res => res.json())
      .then(data => setActivities(data));

    fetch(`/api/projects/${id}/logs`)
      .then(res => res.json())
      .then(data => setDailyLogs(data));
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleStageNameClick = (stage: Stage) => {
    setEditingStageId(stage.id);
    setEditingStageName(stage.name);
  };

  const handleStageNameSave = async (stageId: number) => {
    if (!editingStageName.trim()) return;
    
    try {
        await fetch(`/api/stages/${stageId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: editingStageName })
        });
        setEditingStageId(null);
        fetchData();
    } catch (error) {
        console.error(error);
    }
  };

  const handleStageNameKeyDown = (e: React.KeyboardEvent, stageId: number) => {
    if (e.key === 'Enter') {
        handleStageNameSave(stageId);
    } else if (e.key === 'Escape') {
        setEditingStageId(null);
    }
  };

  const handleDeleteStage = async (stageId: number) => {
    if(!confirm('Tem certeza? Isso apagará todas as atividades desta etapa.')) return;
    await fetch(`/api/stages/${stageId}`, { method: 'DELETE' });
    fetchData();
  };

  const handleDeleteActivity = async (actId: number) => {
    if(!confirm('Tem certeza?')) return;
    await fetch(`/api/activities/${actId}`, { method: 'DELETE' });
    fetchData();
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === 'stage') {
      const newStages = Array.from(stages);
      const [removed] = newStages.splice(source.index, 1);
      newStages.splice(destination.index, 0, removed);
      setStages(newStages);

      // Update order in backend
      const items = newStages.map((s, index) => ({ id: s.id, order: index + 1 }));
      await fetch('/api/stages/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
    } else if (type === 'activity') {
      const sourceStageId = Number(source.droppableId);
      const destStageId = Number(destination.droppableId);

      if (sourceStageId === destStageId) {
        // Reorder within same stage
        const stageActivities = activities.filter(a => a.stage_id === sourceStageId);
        const otherActivities = activities.filter(a => a.stage_id !== sourceStageId);
        
        const [removed] = stageActivities.splice(source.index, 1);
        stageActivities.splice(destination.index, 0, removed);
        
        const newActivities = [...otherActivities, ...stageActivities]; 
        setActivities(newActivities);

        // Update backend
        const items = stageActivities.map((a, index) => ({ id: a.id, order: index + 1 }));
        await fetch('/api/activities/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items })
        });
      } else {
        // Move to another stage
        const sourceActivities = activities.filter(a => a.stage_id === sourceStageId);
        const destActivities = activities.filter(a => a.stage_id === destStageId);
        const otherActivities = activities.filter(a => a.stage_id !== sourceStageId && a.stage_id !== destStageId);

        const [removed] = sourceActivities.splice(source.index, 1);
        // Update stage_id
        removed.stage_id = destStageId;
        destActivities.splice(destination.index, 0, removed);

        const newActivities = [...otherActivities, ...sourceActivities, ...destActivities];
        setActivities(newActivities);

        // We need to update the activity's stage_id in backend first
        await fetch(`/api/activities/${removed.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage_id: destStageId })
        });

        // Then update orders for both stages
        const sourceItems = sourceActivities.map((a, index) => ({ id: a.id, order: index + 1 }));
        const destItems = destActivities.map((a, index) => ({ id: a.id, order: index + 1 }));
        
        await fetch('/api/activities/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: [...sourceItems, ...destItems] })
        });
      }
    }
  };

  if (!project) return <div>Carregando...</div>;

  const handleExportExcel = () => {
    window.open(`/api/projects/${id}/report/excel`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-500">{project.client}</p>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setShowStageForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus size={18} />
                    Nova Etapa
                </button>
                <button 
                    onClick={handleExportExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                    <Download size={18} />
                    Exportar Excel
                </button>
            </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Status</p>
                <p className="font-medium">{project.status}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Início</p>
                <p className="font-medium">{new Date(project.start_date).toLocaleDateString()}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Fim</p>
                <p className="font-medium">{new Date(project.end_date).toLocaleDateString()}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Contrato</p>
                <p className="font-medium">R$ {project.contract_value.toLocaleString()}</p>
            </div>
        </div>
      </div>

      <SimpleTabs defaultValue="activities">
        <TabList>
          <TabTrigger value="activities">Atividades & Cronograma</TabTrigger>
          <TabTrigger value="budget">Orçamento</TabTrigger>
          <TabTrigger value="tracking">Acompanhamento</TabTrigger>
        </TabList>

        <TabContent value="activities">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 bg-gray-50 border-b border-gray-200 px-6 py-3 font-medium text-gray-700 text-sm">
                <div className="col-span-4">Etapa / Atividade</div>
                <div className="col-span-1">Unid.</div>
                <div className="col-span-1">Qtd.</div>
                <div className="col-span-2">Custo Unit.</div>
                <div className="col-span-2">Total</div>
                <div className="col-span-1">Duração</div>
                <div className="col-span-1 text-right">Ações</div>
            </div>
            
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="stages" type="stage">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {stages.map((stage, index) => (
                      <Draggable key={stage.id} draggableId={`stage-${stage.id}`} index={index}>
                        {(provided) => (
                          <div 
                            ref={provided.innerRef} 
                            {...provided.draggableProps} 
                            className="border-b border-gray-100 last:border-0"
                          >
                            <div className="bg-gray-50/50 px-6 py-2 flex justify-between items-center group">
                                <div className="flex items-center gap-3 font-semibold text-gray-800 flex-1">
                                    <div {...provided.dragHandleProps} className="cursor-grab text-gray-400 hover:text-gray-600">
                                        <GripVertical size={16} />
                                    </div>
                                    <span className="text-gray-500 w-6">{index + 1}.</span>
                                    {editingStageId === stage.id ? (
                                        <input 
                                            autoFocus
                                            className="border border-emerald-500 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            value={editingStageName}
                                            onChange={(e) => setEditingStageName(e.target.value)}
                                            onBlur={() => handleStageNameSave(stage.id)}
                                            onKeyDown={(e) => handleStageNameKeyDown(e, stage.id)}
                                        />
                                    ) : (
                                        <span 
                                            onClick={() => handleStageNameClick(stage)}
                                            className="cursor-pointer hover:text-emerald-600 hover:underline decoration-dashed underline-offset-4"
                                            title="Clique para editar"
                                        >
                                            {stage.name}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => setShowActivityForm(stage.id)}
                                        className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 bg-blue-50 px-2 py-1 rounded"
                                    >
                                        <Plus size={14} /> Add Atividade
                                    </button>
                                    <button onClick={() => handleDeleteStage(stage.id)} className="text-red-500 hover:text-red-700 p-1">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <Droppable droppableId={String(stage.id)} type="activity">
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps}>
                                        {activities.filter(a => a.stage_id === stage.id).map((activity, actIndex) => (
                                            <Draggable key={activity.id} draggableId={`activity-${activity.id}`} index={actIndex}>
                                                {(provided) => (
                                                    <div 
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className="grid grid-cols-12 gap-4 px-6 py-3 hover:bg-gray-50 group items-center text-sm border-t border-gray-50"
                                                    >
                                                        <div className="col-span-4 flex items-center gap-3 pl-8">
                                                            <div {...provided.dragHandleProps} className="cursor-grab text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100">
                                                                <GripVertical size={14} />
                                                            </div>
                                                            <span 
                                                                className="text-gray-600 cursor-pointer hover:text-emerald-600 hover:underline decoration-dashed underline-offset-4"
                                                                onClick={() => setEditingActivity(activity)}
                                                                title="Clique para editar"
                                                            >
                                                                {activity.description}
                                                            </span>
                                                        </div>
                                                        <div className="col-span-1 text-gray-600">{activity.unit}</div>
                                                        <div className="col-span-1 text-gray-600">{activity.planned_quantity}</div>
                                                        <div className="col-span-2 text-gray-600">R$ {activity.planned_unit_cost.toLocaleString()}</div>
                                                        <div className="col-span-2 text-gray-600">R$ {(activity.planned_quantity * activity.planned_unit_cost).toLocaleString()}</div>
                                                        <div className="col-span-1 text-gray-600">{activity.planned_duration} dias</div>
                                                        <div className="col-span-1 text-right">
                                                            <button 
                                                                onClick={() => handleDeleteActivity(activity.id)}
                                                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        {activities.filter(a => a.stage_id === stage.id).length === 0 && (
                                            <div className="px-6 py-4 text-center text-gray-400 text-xs italic">
                                                Nenhuma atividade cadastrada nesta etapa.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            
            {stages.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-500">
                    Nenhuma etapa cadastrada. Clique em "Nova Etapa" para começar.
                </div>
            )}
          </div>
        </TabContent>

        <TabContent value="budget">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-4">Resumo Orçamentário</h3>
                <div className="space-y-4">
                    {stages.map(stage => {
                        const stageActivities = activities.filter(a => a.stage_id === stage.id);
                        const totalCost = stageActivities.reduce((acc, curr) => acc + (curr.planned_quantity * curr.planned_unit_cost), 0);
                        return (
                            <div key={stage.id} className="flex justify-between items-center border-b border-gray-100 pb-2">
                                <span>{stage.name}</span>
                                <span className="font-mono font-medium">R$ {totalCost.toLocaleString()}</span>
                            </div>
                        )
                    })}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <span className="font-bold text-lg">Total Geral</span>
                        <span className="font-bold text-lg text-emerald-600">
                            R$ {activities.reduce((acc, curr) => acc + (curr.planned_quantity * curr.planned_unit_cost), 0).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        </TabContent>

        <TabContent value="tracking">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">Diário de Obras (RDO)</h3>
                    <button 
                        onClick={() => setShowDailyLogForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        <Plus size={18} />
                        Novo Apontamento
                    </button>
                </div>
                
                <div className="overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 font-medium text-gray-700">Data</th>
                                <th className="px-6 py-3 font-medium text-gray-700">Atividade</th>
                                <th className="px-6 py-3 font-medium text-gray-700">Qtd. Executada</th>
                                <th className="px-6 py-3 font-medium text-gray-700">Custo Real</th>
                                <th className="px-6 py-3 font-medium text-gray-700">Observações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {dailyLogs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-3 text-gray-600">{new Date(log.date).toLocaleDateString()}</td>
                                    <td className="px-6 py-3 text-gray-600 font-medium">{log.activity_name}</td>
                                    <td className="px-6 py-3 text-gray-600">{log.executed_quantity}</td>
                                    <td className="px-6 py-3 text-gray-600">R$ {log.real_cost.toLocaleString()}</td>
                                    <td className="px-6 py-3 text-gray-600 italic">{log.notes || '-'}</td>
                                </tr>
                            ))}
                            {dailyLogs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Nenhum apontamento registrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </TabContent>
      </SimpleTabs>

      {showStageForm && (
        <StageForm 
            projectId={Number(id)} 
            onClose={() => setShowStageForm(false)} 
            onSuccess={fetchData} 
        />
      )}

      {showActivityForm && (
        <ActivityForm 
            stageId={showActivityForm} 
            onClose={() => setShowActivityForm(null)} 
            onSuccess={fetchData} 
        />
      )}

      {editingActivity && (
        <ActivityForm 
            stageId={editingActivity.stage_id} 
            initialData={editingActivity}
            onClose={() => setEditingActivity(null)} 
            onSuccess={fetchData} 
        />
      )}

      {showDailyLogForm && (
        <DailyLogForm 
            projectId={Number(id)}
            activities={activities}
            onClose={() => setShowDailyLogForm(false)} 
            onSuccess={fetchData} 
        />
      )}
    </div>
  );
}
