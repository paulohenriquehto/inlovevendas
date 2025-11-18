'use client';

import { useState, useMemo } from 'react';
import { calculateMetrics } from '@/lib/csvProcessor';
import { DashboardMetrics } from '@/lib/types';
import { MetricCard } from '@/components/MetricCard';
import { DateFilter, PeriodFilter, DateRange, filterByPeriod } from '@/components/DateFilter';
import { DollarSign, ShoppingCart, TrendingUp, Package } from 'lucide-react';
import { useNuvemShoppingVendas } from '@/hooks/useVendas';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function NuvemShoppingDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  // Usar React Query hook
  const { data: allVendas, isLoading: loading, isError } = useNuvemShoppingVendas();

  // Calcular vendas filtradas e métricas usando useMemo
  const { vendas, metrics } = useMemo(() => {
    if (!allVendas) return { vendas: [], metrics: null };

    const filteredVendas = filterByPeriod(allVendas, selectedPeriod, customDateRange);
    const calculatedMetrics = calculateMetrics(filteredVendas);

    return { vendas: filteredVendas, metrics: calculatedMetrics };
  }, [allVendas, selectedPeriod, customDateRange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Carregando dados...</div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">Erro ao carregar dados</div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">
            inlovestore
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Dashboard - Nuvem Shopping</h1>
          <p className="text-muted-foreground">
            Análise completa das vendas com {vendas.length} registros
            {selectedPeriod !== 'all' && (
              <span className="ml-2 text-primary font-medium">
                (filtrado)
              </span>
            )}
          </p>
        </div>

        {/* Filtro de Período */}
        <DateFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          customDateRange={customDateRange}
          onDateRangeChange={setCustomDateRange}
        />

        {/* KPIs principais */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Receita Total"
            value={formatCurrency(metrics.receitaTotal)}
            description="Valor total de vendas"
            icon={DollarSign}
          />
          <MetricCard
            title="Total de Pedidos"
            value={metrics.totalPedidos.toLocaleString('pt-BR')}
            description="Número de pedidos únicos"
            icon={ShoppingCart}
          />
          <MetricCard
            title="Ticket Médio"
            value={formatCurrency(metrics.ticketMedio)}
            description="Valor médio por pedido"
            icon={TrendingUp}
          />
          <MetricCard
            title="Produtos Vendidos"
            value={metrics.totalVendas.toLocaleString('pt-BR')}
            description="Total de itens vendidos"
            icon={Package}
          />
        </div>

        {/* Gráfico de Vendas ao longo do tempo */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={metrics.vendasPorDia}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="data"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'total') return formatCurrency(value);
                    return value;
                  }}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="total"
                  stroke="#8884d8"
                  name="Receita (R$)"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="quantidade"
                  stroke="#82ca9d"
                  name="Quantidade de Pedidos"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Status de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Status de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={metrics.pedidosPorStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {metrics.pedidosPorStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Formas de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle>Formas de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics.formasPagamento}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="forma" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="quantidade" fill="#8884d8" name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top 10 Produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={metrics.produtosMaisVendidos} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="produto"
                  type="category"
                  width={250}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'receita') return formatCurrency(value);
                    return value;
                  }}
                />
                <Legend />
                <Bar dataKey="quantidade" fill="#82ca9d" name="Quantidade" />
                <Bar dataKey="receita" fill="#8884d8" name="Receita (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vendas por Estado */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={metrics.vendasPorEstado}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="estado" angle={-45} textAnchor="end" height={100} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'receita') return formatCurrency(value);
                    return value;
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="quantidade" fill="#82ca9d" name="Quantidade de Pedidos" />
                <Bar yAxisId="right" dataKey="receita" fill="#8884d8" name="Receita (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vendas por Canal */}
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={metrics.vendasPorCanal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="canal" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === 'receita') return formatCurrency(value);
                    return value;
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="quantidade" fill="#00C49F" name="Quantidade" />
                <Bar yAxisId="right" dataKey="receita" fill="#FF8042" name="Receita (R$)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
