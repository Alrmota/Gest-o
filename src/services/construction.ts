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

  static getProjectStages(projectId: number) {
    return db.prepare('SELECT * FROM stages WHERE project_id = ? ORDER BY display_order').all(projectId);
  }

  static getStageActivities(stageId: number) {
    return db.prepare('SELECT * FROM activities WHERE stage_id = ?').all(stageId);
  }
  
  static getProjectActivities(projectId: number) {
     return db.prepare(`
        SELECT a.*, s.name as stage_name 
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
