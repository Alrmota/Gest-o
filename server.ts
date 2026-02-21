import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import { initDatabase } from './src/db/schema.ts';
import { ProjectService, BudgetService, TrackingService, MaterialService, PurchaseService, WarehouseService } from './src/services/engineering-service.ts';
import { ReportService } from './src/services/report-service.ts';
import db from './src/db/schema.ts';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = 'construction-app-secret-key'; // In prod, use env var

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Initialize DB
  initDatabase();

  // --- API Routes ---

  // Auth
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    // Mock login for demo purposes
    if (username === 'admin' && password === 'admin') {
       const token = jwt.sign({ username, role: 'admin' }, SECRET_KEY, { expiresIn: '1h' });
       return res.json({ token, user: { username, role: 'admin', name: 'Struxio Admin' } });
    }
    // Real implementation would query DB
    res.status(401).json({ error: 'Credenciais inválidas' });
  });

  // Projects
  app.get('/api/projects', (req, res) => {
    const projects = ProjectService.getAllProjects();
    res.json(projects);
  });

  app.get('/api/projects/:id', (req, res) => {
    const project = ProjectService.getProjectById(Number(req.params.id));
    if (!project) return res.status(404).json({ error: 'Projeto não encontrado' });
    
    const stats = TrackingService.getProjectProgress(Number(req.params.id));
    res.json({ ...project, stats });
  });

  app.post('/api/projects', (req, res) => {
    try {
      const project = ProjectService.createProject(req.body);
      res.json(project);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.put('/api/projects/:id', (req, res) => {
    try {
      const project = ProjectService.updateProject(Number(req.params.id), req.body);
      res.json(project);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // Stages & Activities
  app.get('/api/projects/:id/stages', (req, res) => {
    const stages = ProjectService.getProjectStages(Number(req.params.id));
    res.json(stages);
  });

  app.get('/api/projects/:id/activities', (req, res) => {
    const activities = ProjectService.getProjectActivities(Number(req.params.id));
    res.json(activities);
  });

  app.post('/api/stages', (req, res) => {
    try {
      const stage = ProjectService.createStage(req.body);
      res.json(stage);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post('/api/stages/reorder', (req, res) => {
    try {
      const { items } = req.body; // Array of { id, order }
      items.forEach((item: { id: number, order: number }) => {
        ProjectService.updateStageOrder(item.id, item.order);
      });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.put('/api/stages/:id', (req, res) => {
    try {
      const stage = ProjectService.updateStage(Number(req.params.id), req.body);
      res.json(stage);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.delete('/api/stages/:id', (req, res) => {
    try {
      ProjectService.deleteStage(Number(req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.post('/api/activities', (req, res) => {
    try {
      const activity = ProjectService.createActivity(req.body);
      res.json(activity);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });
  
  app.post('/api/activities/reorder', (req, res) => {
    try {
      const { items } = req.body; // Array of { id, order }
      items.forEach((item: { id: number, order: number }) => {
        ProjectService.updateActivityOrder(item.id, item.order);
      });
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.put('/api/activities/:id', (req, res) => {
    try {
      const activity = ProjectService.updateActivity(Number(req.params.id), req.body);
      res.json(activity);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.delete('/api/activities/:id', (req, res) => {
    try {
      ProjectService.deleteActivity(Number(req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // Daily Logs
  app.get('/api/projects/:id/logs', (req, res) => {
    const logs = TrackingService.getProjectDailyLogs(Number(req.params.id));
    res.json(logs);
  });

  app.post('/api/logs', (req, res) => {
    try {
      const log = TrackingService.createDailyLog(req.body);
      res.json(log);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // Materials
  app.get('/api/projects/:id/materials', (req, res) => {
    const materials = MaterialService.getProjectMaterials(Number(req.params.id));
    res.json(materials);
  });

  app.post('/api/materials', (req, res) => {
    try {
      const material = MaterialService.createMaterial(req.body);
      res.json(material);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.put('/api/materials/:id', (req, res) => {
    try {
      const material = MaterialService.updateMaterial(Number(req.params.id), req.body);
      res.json(material);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.delete('/api/materials/:id', (req, res) => {
    try {
      MaterialService.deleteMaterial(Number(req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // Purchases
  app.get('/api/projects/:id/purchases', (req, res) => {
    const purchases = PurchaseService.getProjectPurchases(Number(req.params.id));
    res.json(purchases);
  });

  app.post('/api/purchases', (req, res) => {
    try {
      const purchase = PurchaseService.createPurchase(req.body);
      res.json(purchase);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.delete('/api/purchases/:id', (req, res) => {
    try {
      PurchaseService.deletePurchase(Number(req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // Warehouse
  app.get('/api/projects/:id/warehouse/exits', (req, res) => {
    const exits = WarehouseService.getProjectExits(Number(req.params.id));
    res.json(exits);
  });

  app.post('/api/warehouse/exits', (req, res) => {
    try {
      const exit = WarehouseService.createExit(req.body);
      res.json(exit);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  app.get('/api/projects/:id/warehouse/waste', (req, res) => {
    const waste = WarehouseService.getProjectWaste(Number(req.params.id));
    res.json(waste);
  });

  app.post('/api/warehouse/waste', (req, res) => {
    try {
      const waste = WarehouseService.createWaste(req.body);
      res.json(waste);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });

  // Dashboard Stats
  app.get('/api/projects/:id/dashboard', (req, res) => {
    const projectId = Number(req.params.id);
    const progress = TrackingService.getProjectProgress(projectId);
    const costByStage = BudgetService.getCostByStage(projectId);
    
    res.json({
      progress,
      costByStage
    });
  });

  app.get('/api/projects/:id/report/excel', async (req, res) => {
    try {
      const workbook = await ReportService.generateProjectReport(Number(req.params.id));
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=relatorio.xlsx');
      await workbook.xlsx.write(res);
      res.end();
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });
  
  // Seed Data Endpoint (For Demo)
  app.post('/api/seed', (req, res) => {
    const existing = db.prepare('SELECT count(*) as c FROM projects').get() as {c: number};
    if (existing.c > 0) return res.json({ message: 'Dados já semeados' });

    const project = ProjectService.createProject({
      name: 'Residencial Villa Verde',
      client: 'Construtora Horizonte',
      type: 'Residencial Multifamiliar',
      address: 'Av. das Flores, 123',
      built_area: 2500,
      start_date: '2024-01-15',
      end_date: '2025-06-30',
      contract_value: 4500000,
      status: 'in_progress'
    });

    const stages = [
      { name: 'Serviços Preliminares', order: 1 },
      { name: 'Fundação', order: 2 },
      { name: 'Estrutura', order: 3 },
      { name: 'Alvenaria', order: 4 },
      { name: 'Instalações', order: 5 },
      { name: 'Acabamento', order: 6 }
    ];

    stages.forEach(s => {
      const stmt = db.prepare('INSERT INTO stages (project_id, name, display_order) VALUES (?, ?, ?)');
      const stageInfo = stmt.run(project.id, s.name, s.order);
      
      // Add dummy activities
      const actStmt = db.prepare(`
        INSERT INTO activities (stage_id, description, unit, planned_quantity, planned_unit_cost, planned_duration)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      for(let i=1; i<=3; i++) {
          actStmt.run(stageInfo.lastInsertRowid, `Atividade ${i} - ${s.name}`, 'm2', 100, 50 + Math.random() * 100, 10);
      }
    });

    res.json({ message: 'Dados semeados com sucesso' });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
