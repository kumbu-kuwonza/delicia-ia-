
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomersList } from '@/components/admin/CustomersList';
import { Customer } from '@/types';

interface CustomersTabProps {
  customers: Customer[];
}

export const CustomersTab: React.FC<CustomersTabProps> = ({ customers }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Clientes</CardTitle>
        <CardDescription>
          Visualize e gerencie os clientes registrados na plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CustomersList customers={customers} />
      </CardContent>
    </Card>
  );
};
