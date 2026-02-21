export interface Project {
  id: number;
  name: string;
  client: string;
  type: string;
  address: string;
  built_area: number;
  start_date: string;
  end_date: string;
  contract_value: number;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
}

export interface Activity {
  id: number;
  stage_id: number;
  description: string;
  unit: string;
  planned_quantity: number;
  planned_unit_cost: number;
  planned_duration: number;
  executed_quantity?: number;
  dependency_id?: number;
  start_date?: string;
  end_date?: string;
  display_order?: number;
}

export interface DailyLog {
  id: number;
  activity_id: number;
  date: string;
  executed_quantity: number;
  real_cost: number;
  notes?: string;
}

export interface Stage {
  id: number;
  project_id: number;
  name: string;
  display_order: number;
}

export interface Material {
  id: number;
  project_id: number;
  stage_id?: number;
  activity_id?: number;
  stage_name?: string;
  activity_name?: string;
  description: string;
  unit: string;
  quantity: number;
  purchased_quantity?: number;
  unit_cost: number;
  category?: string;
}

export interface MaterialPurchase {
  id: number;
  project_id: number;
  material_id: number;
  material_name?: string;
  stage_name?: string;
  activity_name?: string;
  date: string;
  quantity: number;
  unit_price: number;
  supplier: string;
  invoice_number?: string;
  notes?: string;
}

export interface WarehouseExit {
  id: number;
  project_id: number;
  material_id: number;
  material_name?: string;
  stage_id?: number;
  stage_name?: string;
  activity_id?: number;
  activity_name?: string;
  date: string;
  collaborator: string;
  storage_location?: string;
  storage_sector?: string;
  quantity: number;
  unit?: string;
}

export interface WarehouseWaste {
  id: number;
  project_id: number;
  material_id: number;
  material_name?: string;
  date: string;
  quantity: number;
  reason?: string;
  unit?: string;
}

export interface StockItem extends Material {
  purchased_quantity: number;
  exited_quantity: number;
  waste_quantity: number;
  current_stock: number;
}
