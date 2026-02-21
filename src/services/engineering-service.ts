import db from '../db/schema.ts';
import { Project, Activity, DailyLog, Stage } from '../types';

export class ProjectService {
  static getAllProjects() {
    return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
  }

  static getProjectById(id: number) {
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  }

  static createProject(project: Omit<Project, 'id'>) {
    const stmt = db.prepare(`
      INSERT INTO projects (name, client, type, address, built_area, start_date, end_date, contract_value, status)
      VALUES (@name, @client, @type, @address, @built_area, @start_date, @end_date, @contract_value, @status)
    `);
    const info = stmt.run(project);
    return { id: info.lastInsertRowid, ...project };
  }

  static updateProject(id: number, project: Partial<Project>) {
    const fields = Object.keys(project).map(key => `${key} = @${key}`).join(', ');
    const stmt = db.prepare(`UPDATE projects SET ${fields} WHERE id = @id`);
    stmt.run({ ...project, id });
    return this.getProjectById(id);
  }

  static getProjectStages(projectId: number) {
    return db.prepare('SELECT * FROM stages WHERE project_id = ? ORDER BY display_order').all(projectId);
  }

  static getStageActivities(stageId: number) {
    return db.prepare('SELECT * FROM activities WHERE stage_id = ?').all(stageId);
  }
  
  static getProjectActivities(projectId: number) {
     return db.prepare(`
        SELECT 
          a.*, 
          s.name as stage_name,
          COALESCE((SELECT SUM(executed_quantity) FROM daily_logs WHERE activity_id = a.id), 0) as executed_quantity
        FROM activities a
        JOIN stages s ON a.stage_id = s.id
        WHERE s.project_id = ?
        ORDER BY a.display_order ASC
     `).all(projectId);
  }

  static createStage(stage: Omit<Stage, 'id'>) {
    const stmt = db.prepare('INSERT INTO stages (project_id, name, display_order) VALUES (@project_id, @name, @display_order)');
    const info = stmt.run(stage);
    return { id: info.lastInsertRowid, ...stage };
  }
  
  static updateStageOrder(id: number, newOrder: number) {
    return db.prepare('UPDATE stages SET display_order = ? WHERE id = ?').run(newOrder, id);
  }

  static updateStage(id: number, stage: Partial<Stage>) {
    const fields = Object.keys(stage).map(key => `${key} = @${key}`).join(', ');
    const stmt = db.prepare(`UPDATE stages SET ${fields} WHERE id = @id`);
    stmt.run({ ...stage, id });
    return this.getStageById(id);
  }

  static getStageById(id: number) {
    return db.prepare('SELECT * FROM stages WHERE id = ?').get(id);
  }

  static deleteStage(id: number) {
    return db.prepare('DELETE FROM stages WHERE id = ?').run(id);
  }

  static createActivity(activity: Omit<Activity, 'id'>) {
    // Get max order for this stage
    const maxOrderResult = db.prepare('SELECT MAX(display_order) as max_order FROM activities WHERE stage_id = ?').get(activity.stage_id) as { max_order: number };
    const nextOrder = (maxOrderResult?.max_order || 0) + 1;

    const stmt = db.prepare(`
      INSERT INTO activities (stage_id, description, unit, planned_quantity, planned_unit_cost, planned_duration, start_date, end_date, display_order)
      VALUES (@stage_id, @description, @unit, @planned_quantity, @planned_unit_cost, @planned_duration, @start_date, @end_date, @display_order)
    `);
    
    const params = {
        ...activity,
        start_date: activity.start_date || null,
        end_date: activity.end_date || null,
        display_order: nextOrder
    };
    
    const info = stmt.run(params);
    return { id: info.lastInsertRowid, ...params };
  }

  static updateActivity(id: number, activity: Partial<Activity>) {
    const fields = Object.keys(activity).map(key => `${key} = @${key}`).join(', ');
    const stmt = db.prepare(`UPDATE activities SET ${fields} WHERE id = @id`);
    stmt.run({ ...activity, id });
    return this.getActivityById(id);
  }
  
  static updateActivityOrder(id: number, newOrder: number) {
    return db.prepare('UPDATE activities SET display_order = ? WHERE id = ?').run(newOrder, id);
  }

  static getActivityById(id: number) {
    return db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
  }

  static deleteActivity(id: number) {
    return db.prepare('DELETE FROM activities WHERE id = ?').run(id);
  }
}

export class MaterialService {
  static getProjectMaterials(projectId: number) {
    return db.prepare(`
      SELECT 
        m.*, 
        s.name as stage_name, 
        a.description as activity_name,
        COALESCE((SELECT SUM(quantity) FROM material_purchases WHERE material_id = m.id), 0) as purchased_quantity,
        COALESCE((SELECT SUM(quantity) FROM warehouse_exits WHERE material_id = m.id), 0) as exited_quantity,
        COALESCE((SELECT SUM(quantity) FROM warehouse_waste WHERE material_id = m.id), 0) as waste_quantity
      FROM project_materials m
      LEFT JOIN stages s ON m.stage_id = s.id
      LEFT JOIN activities a ON m.activity_id = a.id
      WHERE m.project_id = ?
    `).all(projectId).map((m: any) => ({
      ...m,
      current_stock: m.purchased_quantity - m.exited_quantity - m.waste_quantity
    }));
  }

  static createMaterial(material: any) {
    const stmt = db.prepare(`
      INSERT INTO project_materials (project_id, stage_id, activity_id, description, unit, quantity, unit_cost, category)
      VALUES (@project_id, @stage_id, @activity_id, @description, @unit, @quantity, @unit_cost, @category)
    `);
    const info = stmt.run(material);
    return { id: info.lastInsertRowid, ...material };
  }

  static updateMaterial(id: number, material: any) {
    const fields = Object.keys(material).map(key => `${key} = @${key}`).join(', ');
    const stmt = db.prepare(`UPDATE project_materials SET ${fields} WHERE id = @id`);
    stmt.run({ ...material, id });
    return db.prepare('SELECT * FROM project_materials WHERE id = ?').get(id);
  }

  static deleteMaterial(id: number) {
    return db.prepare('DELETE FROM project_materials WHERE id = ?').run(id);
  }
}

export class WarehouseService {
  static getProjectExits(projectId: number) {
    return db.prepare(`
      SELECT e.*, m.description as material_name, m.unit, s.name as stage_name, a.description as activity_name
      FROM warehouse_exits e
      JOIN project_materials m ON e.material_id = m.id
      LEFT JOIN stages s ON e.stage_id = s.id
      LEFT JOIN activities a ON e.activity_id = a.id
      WHERE e.project_id = ?
      ORDER BY e.date DESC
    `).all(projectId);
  }

  static createExit(exit: any) {
    const stmt = db.prepare(`
      INSERT INTO warehouse_exits (project_id, material_id, stage_id, activity_id, date, collaborator, storage_location, storage_sector, quantity)
      VALUES (@project_id, @material_id, @stage_id, @activity_id, @date, @collaborator, @storage_location, @storage_sector, @quantity)
    `);
    const info = stmt.run(exit);
    return { id: info.lastInsertRowid, ...exit };
  }

  static getProjectWaste(projectId: number) {
    return db.prepare(`
      SELECT w.*, m.description as material_name, m.unit
      FROM warehouse_waste w
      JOIN project_materials m ON w.material_id = m.id
      WHERE w.project_id = ?
      ORDER BY w.date DESC
    `).all(projectId);
  }

  static createWaste(waste: any) {
    const stmt = db.prepare(`
      INSERT INTO warehouse_waste (project_id, material_id, date, quantity, reason)
      VALUES (@project_id, @material_id, @date, @quantity, @reason)
    `);
    const info = stmt.run(waste);
    return { id: info.lastInsertRowid, ...waste };
  }
}

export class BudgetService {
  static calculateTotalPlannedCost(projectId: number) {
    const result = db.prepare(`
      SELECT SUM(a.planned_quantity * a.planned_unit_cost) as total_cost
      FROM activities a
      JOIN stages s ON a.stage_id = s.id
      WHERE s.project_id = ?
    `).get(projectId) as { total_cost: number };
    return result.total_cost || 0;
  }

  static getCostByStage(projectId: number) {
    return db.prepare(`
      SELECT s.name, SUM(a.planned_quantity * a.planned_unit_cost) as total_cost
      FROM activities a
      JOIN stages s ON a.stage_id = s.id
      WHERE s.project_id = ?
      GROUP BY s.id
    `).all(projectId);
  }
}

export class TrackingService {
  static getProjectProgress(projectId: number) {
    // Calculate Earned Value (EV) vs Planned Value (PV) vs Actual Cost (AC)
    // This is a simplified version.
    
    // Total Planned Value (Budget at Completion - BAC)
    const bac = BudgetService.calculateTotalPlannedCost(projectId);
    
    // Actual Cost (AC) from daily logs
    const acResult = db.prepare(`
      SELECT SUM(dl.real_cost) as total_real_cost
      FROM daily_logs dl
      JOIN activities a ON dl.activity_id = a.id
      JOIN stages s ON a.stage_id = s.id
      WHERE s.project_id = ?
    `).get(projectId) as { total_real_cost: number };
    const ac = acResult.total_real_cost || 0;

    // Earned Value (EV) = Sum of (Physical % Complete * Planned Value)
    // Physical % Complete = Executed Quantity / Planned Quantity
    const evResult = db.prepare(`
        SELECT 
            SUM(
                (total_executed / a.planned_quantity) * (a.planned_quantity * a.planned_unit_cost)
            ) as earned_value
        FROM (
            SELECT activity_id, SUM(executed_quantity) as total_executed
            FROM daily_logs
            GROUP BY activity_id
        ) as executed
        JOIN activities a ON executed.activity_id = a.id
        JOIN stages s ON a.stage_id = s.id
        WHERE s.project_id = ?
    `).get(projectId) as { earned_value: number };
    
    const ev = evResult ? evResult.earned_value || 0 : 0;

    // SPI = EV / PV (Assuming PV is linear or based on schedule - simplified here to just EV/BAC for overall progress)
    // For proper SPI we need PV at current date.
    // Let's approximate PV based on time elapsed vs total duration for now, or just return EV/AC metrics.
    
    const cpi = ac > 0 ? ev / ac : 1;
    const spi = bac > 0 ? ev / (bac * 0.5) : 1; // Placeholder for SPI calculation requiring time-phased PV

    return {
      bac,
      ac,
      ev,
      cpi,
      spi,
      percent_complete: bac > 0 ? (ev / bac) * 100 : 0
    };
  }

  static createDailyLog(log: Omit<DailyLog, 'id'>) {
    // Validation: check if total executed quantity exceeds planned quantity
    const activity = db.prepare('SELECT planned_quantity, description FROM activities WHERE id = ?').get(log.activity_id) as { planned_quantity: number, description: string };
    const executed = db.prepare('SELECT SUM(executed_quantity) as total FROM daily_logs WHERE activity_id = ?').get(log.activity_id) as { total: number };
    
    const totalExecuted = (executed.total || 0) + log.executed_quantity;
    
    if (totalExecuted > activity.planned_quantity) {
      throw new Error(`A quantidade total executada (${totalExecuted}) para "${activity.description}" excederia a quantidade planejada (${activity.planned_quantity}).`);
    }

    const stmt = db.prepare(`
      INSERT INTO daily_logs (activity_id, date, executed_quantity, real_cost, notes)
      VALUES (@activity_id, @date, @executed_quantity, @real_cost, @notes)
    `);
    const info = stmt.run(log);
    return { id: info.lastInsertRowid, ...log };
  }

  static getProjectDailyLogs(projectId: number) {
    return db.prepare(`
      SELECT dl.*, a.description as activity_name, s.name as stage_name
      FROM daily_logs dl
      JOIN activities a ON dl.activity_id = a.id
      JOIN stages s ON a.stage_id = s.id
      WHERE s.project_id = ?
      ORDER BY dl.date DESC
    `).all(projectId);
  }
}

export class PurchaseService {
  static getProjectPurchases(projectId: number) {
    return db.prepare(`
      SELECT p.*, m.description as material_name, s.name as stage_name, a.description as activity_name
      FROM material_purchases p
      JOIN project_materials m ON p.material_id = m.id
      LEFT JOIN stages s ON m.stage_id = s.id
      LEFT JOIN activities a ON m.activity_id = a.id
      WHERE p.project_id = ?
      ORDER BY p.date DESC
    `).all(projectId);
  }

  static createPurchase(purchase: any) {
    const stmt = db.prepare(`
      INSERT INTO material_purchases (project_id, material_id, date, quantity, unit_price, supplier, invoice_number, notes)
      VALUES (@project_id, @material_id, @date, @quantity, @unit_price, @supplier, @invoice_number, @notes)
    `);
    const info = stmt.run(purchase);
    return { id: info.lastInsertRowid, ...purchase };
  }

  static deletePurchase(id: number) {
    return db.prepare('DELETE FROM material_purchases WHERE id = ?').run(id);
  }
}
