
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Clock, MapPin } from 'lucide-react';
import OperatingHoursSettings from './settings/OperatingHoursSettings';
import DeliveryAreasSettings from './settings/DeliveryAreasSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const SettingsTab: React.FC = () => {
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        <TabsTrigger value="general">Geral</TabsTrigger>
        <TabsTrigger value="operatingHours"><Clock className="mr-2 h-4 w-4" /> Horários</TabsTrigger>
        <TabsTrigger value="deliveryAreas"><MapPin className="mr-2 h-4 w-4" /> Áreas de Entrega</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card>
          <CardHeader>
            <CardTitle>Configurações Gerais</CardTitle>
            <CardDescription>
              Configurações gerais da plataforma de cardápios digitais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-2">
                <h3 className="text-lg font-medium">Notificações</h3>
                <Card className="p-4">
                  <div className="flex items-center gap-4">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">Configurar notificações push</p>
                      <p className="text-sm text-muted-foreground">
                        Configure as notificações push para clientes e restaurantes
                      </p>
                    </div>
                    <Button variant="outline">Configurar</Button>
                  </div>
                </Card>
              </div>
              {/* Outras configurações gerais podem ser adicionadas aqui */}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="operatingHours">
        <OperatingHoursSettings />
      </TabsContent>

      <TabsContent value="deliveryAreas">
        <DeliveryAreasSettings />
      </TabsContent>
    </Tabs>
  );
};
