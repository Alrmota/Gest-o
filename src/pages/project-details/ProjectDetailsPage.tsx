import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { clsx } from 'clsx';
import { Download, Plus, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { StageModal } from '../../components/modals/StageModal';
import { ModalEdicaoAtividade } from '../../components/modals/ModalEdicaoAtividade';
import { DailyLogModal } from '../../components/modals/DailyLogModal';
import { ProjectModal } from '../../components/modals/ProjectModal';
import { MaterialModal } from '../../components/modals/MaterialModal';
import { PurchaseModal } from '../../components/modals/PurchaseModal';
import { SimpleTabs, TabList, TabTrigger, TabContent } from '../../components/common/Tabs';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Project, Stage, Activity, DailyLog, Material, MaterialPurchase } from '../../types';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [dailyLogs, setDailyLogs] = useState<(DailyLog & { activity_name?: string })[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [purchases, setPurchases] = useState<MaterialPurchase[]>([]);
  const [showStageForm, setShowStageForm] = useState(false);
  const [showActivityForm, setShowActivityForm] = useState<number | null>(null); // stageId or null
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [showDailyLogForm, setShowDailyLogForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [editingStageId, setEditingStageId] = useState<number | null>(null);
  const [editingStageName, setEditingStageName] = useState('');
  const [showProjectForm, setShowProjectForm] = useState(false);

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

    fetch(`/api/projects/${id}/materials`)
      .then(res => res.json())
      .then(data => setMaterials(data));

    fetch(`/api/projects/${id}/purchases`)
      .then(res => res.json())
      .then(data => setPurchases(data));
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
        const stageActivities = activities.filter(a => a.stage_id === sourceStageId);
        const otherActivities = activities.filter(a => a.stage_id !== sourceStageId);
        
        const [removed] = stageActivities.splice(source.index, 1);
        stageActivities.splice(destination.index, 0, removed);
        
        const newActivities = [...otherActivities, ...stageActivities]; 
        setActivities(newActivities);

        const items = stageActivities.map((a, index) => ({ id: a.id, order: index + 1 }));
        await fetch('/api/activities/reorder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items })
        });
      } else {
        const sourceActivities = activities.filter(a => a.stage_id === sourceStageId);
        const destActivities = activities.filter(a => a.stage_id === destStageId);
        const otherActivities = activities.filter(a => a.stage_id !== sourceStageId && a.stage_id !== destStageId);

        const [removed] = sourceActivities.splice(source.index, 1);
        removed.stage_id = destStageId;
        destActivities.splice(destination.index, 0, removed);

        const newActivities = [...otherActivities, ...sourceActivities, ...destActivities];
        setActivities(newActivities);

        await fetch(`/api/activities/${removed.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage_id: destStageId })
        });

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
                <h1 
                    className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-emerald-600 hover:underline decoration-dashed underline-offset-4"
                    onClick={() => setShowProjectForm(true)}
                    title="Clique para editar o projeto"
                >
                    {project.name}
                </h1>
                <p className="text-gray-500">{project.client}</p>
            </div>
            <div className="flex gap-2">
                <Button 
                    onClick={handleExportExcel}
                    variant="primary"
                    icon={<Download size={18} />}
                >
                    Exportar Excel
                </Button>
            </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <Badge variant={project.status === 'completed' ? 'success' : project.status === 'in_progress' ? 'info' : project.status === 'on_hold' ? 'danger' : 'warning'}>
                    {project.status === 'in_progress' ? 'Em Andamento' : 
                     project.status === 'planning' ? 'Planejamento' : 
                     project.status === 'on_hold' ? 'Paralisado' : 'Concluído'}
                </Badge>
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
          <TabTrigger value="materials">Levantamento de Materiais</TabTrigger>
          <TabTrigger value="purchases">Compras</TabTrigger>
          <TabTrigger value="tracking">Acompanhamento</TabTrigger>
        </TabList>

        <TabContent value="activities">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Atividades & Cronograma</h3>
                <Button 
                  onClick={() => setShowStageForm(true)}
                  variant="primary"
                  icon={<Plus size={18} />}
                >
                  Nova Etapa
                </Button>
              </div>

              <div className="rounded-lg border border-gray-100 overflow-hidden">
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
                                            <Plus size={14} /> Adicionar Atividade
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
            </div>

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
          </div>
        </TabContent>

        <TabContent value="materials">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Levantamento de Materiais</h3>
              <Button 
                onClick={() => setShowMaterialForm(true)}
                variant="primary"
                icon={<Plus size={18} />}
              >
                Adicionar Material
              </Button>
            </div>

            <div className="overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-700">Etapa / Atividade</th>
                    <th className="px-6 py-3 font-medium text-gray-700">Descrição</th>
                    <th className="px-6 py-3 font-medium text-gray-700">Categoria</th>
                    <th className="px-6 py-3 font-medium text-gray-700">Unid.</th>
                    <th className="px-6 py-3 font-medium text-gray-700">Qtd. Prev.</th>
                    <th className="px-6 py-3 font-medium text-gray-700">Qtd. Comp.</th>
                    <th className="px-6 py-3 font-medium text-gray-700">Custo Unit.</th>
                    <th className="px-6 py-3 font-medium text-gray-700">Total</th>
                    <th className="px-6 py-3 font-medium text-gray-700 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {materials.map(material => (
                    <tr key={material.id} className="hover:bg-gray-50 group">
                      <td className="px-6 py-3">
                        <div className="text-xs font-medium text-emerald-600">{material.stage_name}</div>
                        <div className="text-gray-500">{material.activity_name}</div>
                      </td>
                      <td className="px-6 py-3 text-gray-900 font-medium">{material.description}</td>
                      <td className="px-6 py-3 text-gray-600">{material.category || '-'}</td>
                      <td className="px-6 py-3 text-gray-600">{material.unit}</td>
                      <td className="px-6 py-3 text-gray-600">{material.quantity}</td>
                      <td className="px-6 py-3">
                        <span className={clsx(
                          "font-medium",
                          (material.purchased_quantity || 0) >= material.quantity ? "text-emerald-600" : "text-amber-600"
                        )}>
                          {material.purchased_quantity || 0}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-600">R$ {material.unit_cost.toLocaleString()}</td>
                      <td className="px-6 py-3 text-emerald-600 font-semibold">R$ {(material.quantity * material.unit_cost).toLocaleString()}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingMaterial(material)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={async () => {
                              if(confirm('Excluir material?')) {
                                await fetch(`/api/materials/${material.id}`, { method: 'DELETE' });
                                fetchData();
                              }
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {materials.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                        Nenhum material cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
                {materials.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td colSpan={7} className="px-6 py-3 text-right text-gray-700">Total Geral de Materiais:</td>
                      <td className="px-6 py-3 text-emerald-600">
                        R$ {materials.reduce((acc, curr) => acc + (curr.quantity * curr.unit_cost), 0).toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </TabContent>

        <TabContent value="purchases">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Compras de Materiais</h3>
              <Button 
                onClick={() => setShowPurchaseForm(true)}
                variant="primary"
                icon={<Plus size={18} />}
              >
                Registrar Compra
              </Button>
            </div>

            <div className="overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 font-medium text-gray-700">Data</th>
                    <th className="px-6 py-3 font-medium text-gray-700">Material / Etapa</th>
                    <th className="px-6 py-3 font-medium text-gray-700">Fornecedor</th>
                    <th className="px-6 py-3 font-medium text-gray-700">Qtd.</th>
                    <th className="px-6 py-3 font-medium text-gray-700">Preço Unit.</th>
                    <th className="px-6 py-3 font-medium text-gray-700">Total</th>
                    <th className="px-6 py-3 font-medium text-gray-700 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchases.map(purchase => (
                    <tr key={purchase.id} className="hover:bg-gray-50 group">
                      <td className="px-6 py-3 text-gray-600">{new Date(purchase.date).toLocaleDateString()}</td>
                      <td className="px-6 py-3">
                        <div className="text-gray-900 font-medium">{purchase.material_name}</div>
                        <div className="text-xs text-gray-500">{purchase.stage_name} - {purchase.activity_name}</div>
                      </td>
                      <td className="px-6 py-3 text-gray-600">{purchase.supplier}</td>
                      <td className="px-6 py-3 text-gray-600">{purchase.quantity}</td>
                      <td className="px-6 py-3 text-gray-600">R$ {purchase.unit_price.toLocaleString()}</td>
                      <td className="px-6 py-3 text-emerald-600 font-semibold">R$ {(purchase.quantity * purchase.unit_price).toLocaleString()}</td>
                      <td className="px-6 py-3 text-right">
                        <button 
                          onClick={async () => {
                            if(confirm('Excluir registro de compra?')) {
                              await fetch(`/api/purchases/${purchase.id}`, { method: 'DELETE' });
                              fetchData();
                            }
                          }}
                          className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {purchases.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        Nenhuma compra registrada.
                      </td>
                    </tr>
                  )}
                </tbody>
                {purchases.length > 0 && (
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td colSpan={5} className="px-6 py-3 text-right text-gray-700">Total em Compras:</td>
                      <td className="px-6 py-3 text-emerald-600">
                        R$ {purchases.reduce((acc, curr) => acc + (curr.quantity * curr.unit_price), 0).toLocaleString()}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </TabContent>

        <TabContent value="tracking">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">Diário de Obras (RDO)</h3>
                    <Button 
                        onClick={() => setShowDailyLogForm(true)}
                        variant="primary"
                        icon={<Plus size={18} />}
                    >
                        Novo Apontamento
                    </Button>
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
        <StageModal 
            projectId={Number(id)} 
            onClose={() => setShowStageForm(false)} 
            onSuccess={fetchData} 
        />
      )}

      {showActivityForm && (
        <ModalEdicaoAtividade 
            stageId={showActivityForm} 
            onClose={() => setShowActivityForm(null)} 
            onSuccess={fetchData} 
        />
      )}

      {editingActivity && (
        <ModalEdicaoAtividade 
            stageId={editingActivity.stage_id} 
            initialData={editingActivity}
            onClose={() => setEditingActivity(null)} 
            onSuccess={fetchData} 
        />
      )}

      {showDailyLogForm && (
        <DailyLogModal 
            projectId={Number(id)}
            stages={stages}
            activities={activities}
            onClose={() => setShowDailyLogForm(false)} 
            onSuccess={fetchData} 
        />
      )}

      {showMaterialForm && (
        <MaterialModal 
            projectId={Number(id)}
            stages={stages}
            activities={activities}
            onClose={() => setShowMaterialForm(false)} 
            onSuccess={fetchData} 
        />
      )}

      {showPurchaseForm && (
        <PurchaseModal 
            projectId={Number(id)}
            stages={stages}
            activities={activities}
            materials={materials}
            onClose={() => setShowPurchaseForm(false)} 
            onSuccess={fetchData} 
        />
      )}

      {editingMaterial && (
        <MaterialModal 
            projectId={Number(id)}
            stages={stages}
            activities={activities}
            initialData={editingMaterial}
            onClose={() => setEditingMaterial(null)} 
            onSuccess={fetchData} 
        />
      )}

      {showProjectForm && project && (
        <ProjectModal
            initialData={project}
            onClose={() => setShowProjectForm(false)}
            onSuccess={fetchData}
        />
      )}
    </div>
  );
}
