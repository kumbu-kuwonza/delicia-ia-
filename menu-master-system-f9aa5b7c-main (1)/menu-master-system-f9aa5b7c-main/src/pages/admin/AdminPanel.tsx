import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/admin/UserManagement';
import { BusinessHoursConfig } from '@/components/admin/BusinessHoursConfig';
import { DeliveryAreaConfig } from '@/components/admin/DeliveryAreaConfig';
import { DashboardMetrics } from '@/components/admin/DashboardMetrics';
import { Button } from '@/components/ui/button';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types/index';
import { useCart } from '@/contexts/CartContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { ArrowLeft } from 'lucide-react';

export const AdminPanel = () => {
  const { user } = useAuth();
  const { orders } = useCart();
  const { customers } = useCustomer();

  if (user?.role !== UserRole.ADMIN) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <Link to="/">
          <Button variant="outline" size="sm" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <Link to="/admin/whatsapp">
          <Button variant="outline" size="sm">
            Configuração WhatsApp
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid grid-cols-4 w-[600px] mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="hours">Horários</TabsTrigger>
          <TabsTrigger value="areas">Áreas</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          const { orders } = useCart();
const { customers } = useCustomer();

<DashboardMetrics orders={orders} customers={customers} />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="hours">
          <BusinessHoursConfig />
        </TabsContent>

        <TabsContent value="areas">
          <DeliveryAreaConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
};