
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { mockStats, mockOrders } from '@/data/menu';
import Header from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { cn, formatCurrency } from '@/lib/utils';
import { AutomationControl } from '@/components/AutomationControl';

const Dashboard = () => {
  const { totalOrders, totalRevenue, averageOrderValue, popularItems } = mockStats;
  
  // Data for the popular items chart
  const pieChartData = popularItems.map(item => ({
    name: item.name,
    value: item.count
  }));
  
  // Data for the revenue by hour chart
  const hourlyRevenue = [
    { hour: '9h', value: 450 },
    { hour: '10h', value: 780 },
    { hour: '11h', value: 1250 },
    { hour: '12h', value: 1800 },
    { hour: '13h', value: 1650 },
    { hour: '14h', value: 1200 },
    { hour: '15h', value: 750 },
    { hour: '16h', value: 950 },
    { hour: '17h', value: 1100 },
    { hour: '18h', value: 1450 },
    { hour: '19h', value: 1750 },
    { hour: '20h', value: 1400 },
    { hour: '21h', value: 1050 },
    { hour: '22h', value: 650 },
  ];
  
  const COLORS = ['#FF5A5F', '#FFB74D', '#4CAF50', '#2196F3', '#9C27B0'];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <AutomationControl />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Total de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalOrders}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Receita Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Valor Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(averageOrderValue)}</div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Itens Mais Vendidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#FF5A5F"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} vendas`, 'Quantidade']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Receita por Hora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis tickFormatter={(value) => `${value / 1000}k`} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Receita']} />
                    <Bar dataKey="value" fill="#FF5A5F" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">ID</th>
                    <th className="text-left py-3 px-4">Cliente</th>
                    <th className="text-left py-3 px-4">Data/Hora</th>
                    <th className="text-left py-3 px-4">Itens</th>
                    <th className="text-left py-3 px-4">Total</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockOrders.map(order => (
                    <tr key={order.id} className="border-b">
                      <td className="py-3 px-4">#{order.id}</td>
                      <td className="py-3 px-4">{order.customer.name}</td>
                      <td className="py-3 px-4">{format(new Date(order.createdAt), 'dd/MM HH:mm')}</td>
                      <td className="py-3 px-4">{order.items.reduce((acc, item) => acc + item.quantity, 0)} itens</td>
                      <td className="py-3 px-4">{formatCurrency(order.total)}</td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          order.status === 'new' ? "bg-restaurant-primary/20 text-restaurant-primary" :
                          order.status === 'preparing' ? "bg-restaurant-secondary/20 text-restaurant-secondary" :
                          order.status === 'ready' ? "bg-green-100 text-green-800" :
                          "bg-gray-100 text-gray-800"
                        )}>
                          {order.status === 'new' ? 'Novo' :
                           order.status === 'preparing' ? 'Preparando' :
                           order.status === 'ready' ? 'Pronto' : 'Entregue'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
