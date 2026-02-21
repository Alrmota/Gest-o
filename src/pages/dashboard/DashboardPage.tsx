import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, Line } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { KpiCard } from '../../components/widgets/KpiCard';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

interface DashboardStats {
  progress: {
    bac: number;
    ac: number;
    ev: number;
    cpi: number;
    spi: number;
    percent_complete: number;
  };
  costByStage: { name: string; total_cost: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects/1/dashboard')
      .then(res => {
        if (res.ok) return res.json();
        return fetch('/api/seed', { method: 'POST' }).then(() => fetch('/api/projects/1/dashboard').then(r => r.json()));
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (!stats) return <div>Nenhum dado disponível.</div>;

  const { progress, costByStage } = stats;

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          title="Avanço Físico"
          value={`${progress.percent_complete.toFixed(1)}%`}
          icon={TrendingUp}
          iconColorClass="text-blue-600"
          bgColorClass="bg-blue-50"
          progress={progress.percent_complete}
        />

        <KpiCard
          title="SPI (Prazo)"
          value={progress.spi.toFixed(2)}
          icon={Clock}
          iconColorClass={progress.spi >= 1 ? 'text-emerald-600' : 'text-red-600'}
          bgColorClass={progress.spi >= 1 ? 'bg-emerald-50' : 'bg-red-50'}
          subtitle={progress.spi >= 1 ? 'Dentro do prazo' : 'Atrasado'}
        />

        <KpiCard
          title="CPI (Custo)"
          value={progress.cpi.toFixed(2)}
          icon={CheckCircle}
          iconColorClass={progress.cpi >= 1 ? 'text-emerald-600' : 'text-red-600'}
          bgColorClass={progress.cpi >= 1 ? 'bg-emerald-50' : 'bg-red-50'}
          subtitle={progress.cpi >= 1 ? 'Dentro do orçamento' : 'Acima do orçamento'}
        />

        <KpiCard
          title="Custo Real (AC)"
          value={formatCurrency(progress.ac)}
          icon={AlertTriangle}
          iconColorClass="text-purple-600"
          bgColorClass="bg-purple-50"
          subtitle={`Previsto (BAC): ${formatCurrency(progress.bac)}`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Custo por Etapa</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costByStage} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(val) => `R$${val/1000}k`} />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip formatter={(val: number) => formatCurrency(val)} />
                <Legend />
                <Bar dataKey="total_cost" name="Custo Planejado" fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Curva S (Físico-Financeiro)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={[
                { month: 'Jan', planned: 10, actual: 10 },
                { month: 'Fev', planned: 25, actual: 22 },
                { month: 'Mar', planned: 45, actual: 40 },
                { month: 'Abr', planned: 60, actual: 55 },
                { month: 'Mai', planned: 80, actual: null },
                { month: 'Jun', planned: 100, actual: null },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis unit="%" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="planned" name="Planejado Acumulado" fill="#E0F2FE" stroke="#0284C7" />
                <Line type="monotone" dataKey="actual" name="Realizado Acumulado" stroke="#DC2626" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
