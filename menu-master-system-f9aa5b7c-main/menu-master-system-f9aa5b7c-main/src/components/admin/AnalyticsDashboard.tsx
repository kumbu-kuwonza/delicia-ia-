
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/types';

interface AnalyticsDashboardProps {
  customers: Customer[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
const TIER_COLORS = {
  'bronze': '#CD7F32',
  'silver': '#C0C0C0',
  'gold': '#FFD700',
  'platinum': '#E5E4E2'
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ customers }) => {
  // Calculate metrics
  const activeCustomers = customers.filter(c => c.isActive).length;
  const totalCustomers = customers.length;
  const activePercentage = totalCustomers ? Math.round((activeCustomers / totalCustomers) * 100) : 0;
  
  const totalPoints = customers.reduce((sum, customer) => sum + customer.points, 0);
  const avgPoints = customers.length ? Math.round(totalPoints / customers.length) : 0;
  
  // Group customers by tier
  const tierDistribution = [
    { name: 'Bronze', value: customers.filter(c => c.loyaltyTier === 'bronze').length },
    { name: 'Prata', value: customers.filter(c => c.loyaltyTier === 'silver').length },
    { name: 'Ouro', value: customers.filter(c => c.loyaltyTier === 'gold').length },
    { name: 'Platina', value: customers.filter(c => c.loyaltyTier === 'platinum').length }
  ];
  
  // Orders per customer (top 10)
  const orderData = customers
    .filter(c => c.totalOrders && c.totalOrders > 0)
    .sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))
    .slice(0, 10)
    .map(c => ({
      name: c.name.split(' ')[0],
      orders: c.totalOrders || 0
    }));
  
  // Monthly registrations (mock data - would be calculated from actual dates in real implementation)
  const currentMonth = new Date().getMonth();
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const registrationData = Array(6).fill(0).map((_, i) => {
    const monthIndex = (currentMonth - 5 + i) % 12;
    const monthName = monthNames[monthIndex >= 0 ? monthIndex : monthIndex + 12];
    
    // Count registrations for this month (simplified for example)
    let count = 0;
    if (customers.length) {
      count = Math.floor(Math.random() * (customers.length / 3)) + 1; // Mock data
    }
    
    return {
      month: monthName,
      registrations: count
    };
  });
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Badge variant={activePercentage > 70 ? "default" : "outline"}>
                {activePercentage}% ativos
              </Badge>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pontos Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Média: {avgPoints} por cliente
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes Premium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.loyaltyTier === 'gold' || c.loyaltyTier === 'platinum').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ouro + Platina
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pedidos Realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.reduce((sum, c) => sum + (c.totalOrders || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="customers">Perfil de Clientes</TabsTrigger>
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="growth">Crescimento</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Níveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tierDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {tierDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Clientes com Mais Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={orderData}
                    layout="vertical"
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" />
                    <Tooltip />
                    <Bar dataKey="orders" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Novos Clientes por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={registrationData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="registrations" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
