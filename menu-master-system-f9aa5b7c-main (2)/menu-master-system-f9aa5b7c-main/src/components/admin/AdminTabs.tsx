
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Users, Home, Trophy, Settings, Image } from 'lucide-react';

interface AdminTabsProps {
  defaultValue?: string;
  children: React.ReactNode;
}

export const AdminTabs: React.FC<AdminTabsProps> = ({ defaultValue = 'dashboard', children }) => {
  return (
    <Tabs defaultValue={defaultValue} className="w-full">
      <div className="border-b mb-6">
        <TabsList className="mb-[-1px]">
          <TabsTrigger value="dashboard" className="flex items-center gap-1">
            <LineChart className="w-4 h-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="restaurants" className="flex items-center gap-1">
            <Home className="w-4 h-4" /> Restaurantes
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-1">
            <Users className="w-4 h-4" /> Clientes
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="flex items-center gap-1">
            <Trophy className="w-4 h-4" /> Fidelidade
          </TabsTrigger>
          <TabsTrigger value="promotions" className="flex items-center gap-1">
            <Image className="w-4 h-4" /> Promoções
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1">
            <Settings className="w-4 h-4" /> Configurações
          </TabsTrigger>
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
};
