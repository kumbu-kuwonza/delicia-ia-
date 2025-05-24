import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, DollarSign, Users, ShoppingBag } from 'lucide-react';

// Mock data - substitua por dados reais ou chamadas de API
const mockAdminMetrics = {
  totalSales: 12550.75,
  totalOrders: 350,
  activeCustomers: 120,
  topPerformingPromotion: 'Combo Família Feliz',
  salesToday: 850.20,
  ordersToday: 25,
};

const AdminMetricsDashboard: React.FC = () => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {mockAdminMetrics.totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <p className="text-xs text-muted-foreground">
            +R$ {mockAdminMetrics.salesToday.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} hoje
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockAdminMetrics.totalOrders}</div>
          <p className="text-xs text-muted-foreground">+{mockAdminMetrics.ordersToday} pedidos hoje</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockAdminMetrics.activeCustomers}</div>
          <p className="text-xs text-muted-foreground">Engajamento recente</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Promoção Destaque</CardTitle>
          <BarChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-semibold">{mockAdminMetrics.topPerformingPromotion}</div>
          <p className="text-xs text-muted-foreground">Mais popular entre os clientes</p>
        </CardContent>
      </Card>
      
      {/* Adicionar mais cards ou gráficos conforme necessário */}
      <Card className="col-span-1 md:col-span-2 lg:col-span-4">
        <CardHeader>
            <CardTitle>Outras Métricas</CardTitle>
            <CardDescription>Mais detalhes sobre o desempenho.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className='text-center py-8 text-gray-500'>Gráficos e dados detalhados de vendas, produtos mais vendidos, horários de pico, etc. serão implementados aqui.</p>
            {/* Exemplo: <SalesChartComponent /> */}
        </CardContent>
      </Card>

    </div>
  );
};

export default AdminMetricsDashboard;