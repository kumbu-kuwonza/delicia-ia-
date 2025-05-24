
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { Customer } from '@/types';

interface DashboardTabProps {
  customers: Customer[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ customers }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard</CardTitle>
        <CardDescription>
          Visão geral do desempenho da plataforma e estatísticas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AnalyticsDashboard customers={customers} />
      </CardContent>
    </Card>
  );
};
