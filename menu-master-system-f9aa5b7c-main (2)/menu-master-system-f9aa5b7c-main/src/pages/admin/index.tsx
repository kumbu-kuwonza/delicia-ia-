
import React from 'react';
import { TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { AdminTabs } from '@/components/admin/AdminTabs';
import { DashboardTab } from '@/components/admin/DashboardTab';
import { RestaurantsTab } from '@/components/admin/RestaurantsTab';
import { CustomersTab } from '@/components/admin/CustomersTab';
import { LoyaltyTab } from '@/components/admin/LoyaltyTab';
import { PromotionsTab } from '@/components/admin/PromotionsTab';
import { SettingsTab } from '@/components/admin/SettingsTab';
import { mockCustomers, mockRestaurants } from '@/data/mockAdminData';

const AdminPanel = () => {
  const { toast } = useToast();

  const handleSaveLoyaltyConfig = () => {
    toast({
      title: "Configurações salvas",
      description: "As configurações do programa de fidelidade foram atualizadas.",
    });
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Painel Administrativo</h1>
      
      <AdminTabs defaultValue="promotions">
        <TabsContent value="dashboard">
          <DashboardTab customers={mockCustomers} />
        </TabsContent>
        
        <TabsContent value="restaurants">
          <RestaurantsTab restaurants={mockRestaurants} />
        </TabsContent>
        
        <TabsContent value="customers">
          <CustomersTab customers={mockCustomers} />
        </TabsContent>
        
        <TabsContent value="loyalty">
          <LoyaltyTab onSaveLoyaltyConfig={handleSaveLoyaltyConfig} />
        </TabsContent>
        
        <TabsContent value="promotions">
          <PromotionsTab />
        </TabsContent>
        
        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </AdminTabs>
    </div>
  );
};

export default AdminPanel;
