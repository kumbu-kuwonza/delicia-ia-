import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from '@/components/admin/users/UserManagement';
import OrderManagement from '@/components/admin/orders/OrderManagement'; // Novo componente
import OperatingHoursSettings from '@/components/admin/settings/OperatingHoursSettings';
import DeliveryAreasSettings from '@/components/admin/settings/DeliveryAreasSettings';
import Header from '@/components/Header';
import { Users, Clock, MapPin, LayoutDashboard, ShoppingCart } from 'lucide-react'; // Adicionado ShoppingCart

const AdminDashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header /> 
      <main className="p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
            <LayoutDashboard className="mr-3 h-8 w-8 text-restaurant-primary" />
            Painel Administrativo
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie usuários, configurações operacionais e visualize métricas do seu estabelecimento.
          </p>
        </div>

        <Tabs defaultValue="orderManagement" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-4 mb-6 bg-white dark:bg-gray-800 shadow-sm"> {/* Ajustado para 4 colunas */}
            <TabsTrigger value="orderManagement" className="py-3">
              <ShoppingCart className="mr-2 h-5 w-5" /> Gerenciamento de Pedidos
            </TabsTrigger>
            <TabsTrigger value="userManagement" className="py-3">
              <Users className="mr-2 h-5 w-5" /> Gestão de Usuários
            </TabsTrigger>
            <TabsTrigger value="operatingHours" className="py-3">
              <Clock className="mr-2 h-5 w-5" /> Horários de Funcionamento
            </TabsTrigger>
            <TabsTrigger value="deliveryAreas" className="py-3">
              <MapPin className="mr-2 h-5 w-5" /> Áreas de Entrega
            </TabsTrigger>
            {/* Futuramente: Dashboard de Métricas */}
            {/* <TabsTrigger value="metricsDashboard" className="py-3">
              <BarChart className="mr-2 h-5 w-5" /> Dashboard de Métricas
            </TabsTrigger> */}
          </TabsList>

          <TabsContent value="userManagement">
            <UserManagement />
          </TabsContent>

          <TabsContent value="operatingHours">
            <OperatingHoursSettings />
          </TabsContent>

          <TabsContent value="deliveryAreas">
            <DeliveryAreasSettings />
          </TabsContent>

          <TabsContent value="orderManagement">
            <OrderManagement />
          </TabsContent>

          {/* <TabsContent value="metricsDashboard">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard de Métricas</CardTitle>
                <CardDescription>Visualização de dados de vendas, pedidos, etc.</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Implementação futura do dashboard de métricas aqui.</p>
                 Exemplo: <Dashboard /> // Se o Dashboard existente for reutilizável ou adaptável
              </CardContent>
            </Card>
          </TabsContent> */}
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboardPage;