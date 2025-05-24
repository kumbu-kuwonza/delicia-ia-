
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';

export const SettingsTab: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações da Plataforma</CardTitle>
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
        </div>
      </CardContent>
    </Card>
  );
};
