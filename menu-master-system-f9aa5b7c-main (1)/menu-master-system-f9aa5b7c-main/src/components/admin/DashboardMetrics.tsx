import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardData } from '@/hooks/useDashboard';
import { Order, Customer } from '@/types';

type DashboardMetricsProps = {
  orders: Order[];
  customers: Customer[];
};

export const DashboardMetrics = ({ orders, customers }: DashboardMetricsProps) => {
  const [dateFilter, setDateFilter] = React.useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = React.useState('all');

  const filteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    const startDate = dateFilter.start ? new Date(dateFilter.start) : null;
    const endDate = dateFilter.end ? new Date(dateFilter.end) : null;
    return (
      (!startDate || orderDate >= startDate) &&
      (!endDate || orderDate <= endDate) &&
      (statusFilter === 'all' || order.status === statusFilter)
    );
  });
  const revenueData = filteredOrders.reduce((acc, order) => {
    const date = new Date(order.createdAt).toLocaleDateString('pt-BR');
    acc[date] = (acc[date] || 0) + order.total;
    return acc;
  }, {} as Record<string, number>);

  const statusCounts = filteredOrders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.reduce((sum, order) => sum + order.total, 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(orders.reduce((sum, order) => sum + order.total, 0) / orders.length || 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.isActive).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Vendas por Dia</h3>
            <div className="flex gap-2">
              <Input
  type="date"
  className="max-w-[150px]"
  value={dateFilter.start}
  onChange={e => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
/>
<Input
  type="date"
  className="max-w-[150px]"
  value={dateFilter.end}
  onChange={e => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
/>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="15">15 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(revenueData).map(([date, value]) => ({ date, value }))}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Status dos Pedidos</h3>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Novos</SelectItem>
                <SelectItem value="preparing">Preparando</SelectItem>
                <SelectItem value="ready">Prontos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(statusCounts).map(([name, value]) => ({ name, value }))}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
              >
                {Object.keys(statusCounts).map((_, index) => (
                  <Cell key={index} fill={['#3b82f6', '#10b981', '#f59e0b'][index % 3]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};