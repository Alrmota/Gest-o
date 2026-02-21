import ExcelJS from 'exceljs';
import { ProjectService, BudgetService, TrackingService } from './engineering-service.ts';

export class ReportService {
  static async generateProjectReport(projectId: number) {
    const project = ProjectService.getProjectById(projectId);
    const stages = ProjectService.getProjectStages(projectId);
    const activities = ProjectService.getProjectActivities(projectId);
    const stats = TrackingService.getProjectProgress(projectId);

    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Resumo
    const summarySheet = workbook.addWorksheet('Resumo');
    summarySheet.columns = [
      { header: 'Item', key: 'item', width: 30 },
      { header: 'Valor', key: 'value', width: 20 }
    ];
    summarySheet.addRows([
      { item: 'Projeto', value: project.name },
      { item: 'Cliente', value: project.client },
      { item: 'Status', value: project.status },
      { item: 'Progresso Físico', value: `${stats.percent_complete.toFixed(2)}%` },
      { item: 'Custo Planejado (BAC)', value: stats.bac },
      { item: 'Custo Real (AC)', value: stats.ac },
      { item: 'Valor Agregado (EV)', value: stats.ev },
      { item: 'SPI', value: stats.spi },
      { item: 'CPI', value: stats.cpi }
    ]);

    // Sheet 2: Cronograma e Orçamento
    const detailSheet = workbook.addWorksheet('Detalhes');
    detailSheet.columns = [
      { header: 'Etapa', key: 'stage', width: 20 },
      { header: 'Atividade', key: 'activity', width: 30 },
      { header: 'Unid.', key: 'unit', width: 10 },
      { header: 'Qtd.', key: 'qty', width: 10 },
      { header: 'Custo Unit.', key: 'unit_cost', width: 15 },
      { header: 'Total Planejado', key: 'total', width: 15 },
      { header: 'Duração', key: 'duration', width: 10 }
    ];

    activities.forEach((act: any) => {
      detailSheet.addRow({
        stage: act.stage_name,
        activity: act.description,
        unit: act.unit,
        qty: act.planned_quantity,
        unit_cost: act.planned_unit_cost,
        total: act.planned_quantity * act.planned_unit_cost,
        duration: act.planned_duration
      });
    });

    return workbook;
  }
}
