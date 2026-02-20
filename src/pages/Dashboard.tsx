import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, ComposedChart, Area } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

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

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard data for a default project (e.g., ID 1) or aggregate
    // For demo, we'll fetch project 1 if it exists, or seed first
    fetch('/api/projects/1/dashboard')
      .then(res => {
        if (res.ok) return res.json();
        // If 404, maybe seed
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Avanço Físico</p>
              <h3 className="text-2xl font-bold text-gray-900">{progress.percent_complete.toFixed(1)}%</h3>
            </div>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress.percent_complete}%` }}></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">SPI (Prazo)</p>
              <h3 className={`text-2xl font-bold ${progress.spi >= 1 ? 'text-emerald-600' : 'text-red-600'}`}>
                {progress.spi.toFixed(2)}
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${progress.spi >= 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              <Clock size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {progress.spi >= 1 ? 'Dentro do prazo' : 'Atrasado'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">CPI (Custo)</p>
              <h3 className={`text-2xl font-bold ${progress.cpi >= 1 ? 'text-emerald-600' : 'text-red-600'}`}>
                {progress.cpi.toFixed(2)}
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${progress.cpi >= 1 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              <CheckCircle size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {progress.cpi >= 1 ? 'Dentro do orçamento' : 'Acima do orçamento'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Custo Real (AC)</p>
              <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(progress.ac)}</h3>
            </div>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <AlertTriangle size={20} />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Previsto (BAC): {formatCurrency(progress.bac)}
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost by Stage (ABC Curve approximation) */}
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

        {/* S-Curve (Simulated) */}
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
