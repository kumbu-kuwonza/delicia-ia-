
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Order } from '@/types';

interface StatusBadgeProps {
  status: Order['status'];
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  switch (status) {
    case 'new':
      return <Badge className="bg-restaurant-primary">Novo</Badge>;
    case 'preparing':
      return <Badge className="bg-restaurant-secondary">Preparando</Badge>;
    case 'ready':
      return <Badge className="bg-green-500">Pronto</Badge>;
    case 'delivered':
      return <Badge className="bg-gray-500">Entregue</Badge>;
    case 'canceled':
      return <Badge className="bg-red-500">Cancelado</Badge>;
    default:
      return null;
  }
};
