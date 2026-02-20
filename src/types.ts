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
