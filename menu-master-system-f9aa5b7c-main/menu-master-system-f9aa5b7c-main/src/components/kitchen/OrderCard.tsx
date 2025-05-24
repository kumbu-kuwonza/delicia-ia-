
import React, { useState } from 'react';
import { Order } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, CheckCircle, Clock, User, MapPin, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { StatusBadge } from './StatusBadge';
import { formatCurrency } from '@/lib/utils';
import { CustomerInfoCard } from './CustomerInfoCard';

interface OrderCardProps {
  order: Order;
  orders: Order[];
  onUpdateStatus: (orderId: string, status: Order['status']) => void;
  onPrint: (order: Order) => void;
}

export const OrderCard = ({ order, orders, onUpdateStatus, onPrint }: OrderCardProps) => {
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  
  // Count total orders by this customer
  const customerOrderCount = orders.filter(
    o => o.customer.phone === order.customer.phone
  ).length;
  
  return (
    <Card key={order.id} className={`kitchen-order ${order.status} h-full`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Pedido #{order.id}</CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-sm text-gray-500">
                {format(new Date(order.createdAt), 'HH:mm')}
              </p>
              <StatusBadge status={order.status} />
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="space-y-3">
          <div className="bg-gray-50 p-2 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-500 mr-1" />
                <span className="font-medium">{order.customer.name}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs"
                onClick={() => setShowCustomerDetails(!showCustomerDetails)}
              >
                {showCustomerDetails ? 'Ocultar' : 'Detalhes'} 
              </Button>
            </div>
            
            {!showCustomerDetails ? (
              <div className="grid grid-cols-2 gap-1 text-sm">
                <div className="flex items-center">
                  <Phone className="h-3 w-3 text-gray-400 mr-1" />
                  <span className="text-gray-600">{order.customer.phone}</span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-gray-500">
                    {customerOrderCount > 1 ? `${customerOrderCount} pedidos` : '1° pedido'}
                  </span>
                </div>
              </div>
            ) : (
              <CustomerInfoCard customer={order.customer} orders={orders} />
            )}
          </div>
          
          <div className="space-y-1">
            <div className="text-sm font-medium">Itens do pedido:</div>
            {order.items.map(item => (
              <div key={`${order.id}-${item.product.id}`} className="flex justify-between">
                <span>
                  {item.quantity}x {item.product.name}
                </span>
                <span className="text-sm text-gray-600">
                  ~{item.product.prepTime} min
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <div className="flex space-x-2">
          {order.status === 'new' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onUpdateStatus(order.id, 'preparing')}
            >
              <Clock className="h-4 w-4 mr-1" />
              Preparar
            </Button>
          )}
          
          {order.status === 'preparing' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onUpdateStatus(order.id, 'ready')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Pronto
            </Button>
          )}
          
          {order.status === 'ready' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onUpdateStatus(order.id, 'delivered')}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Entregue
            </Button>
          )}
        </div>
        
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onPrint(order)}
        >
          <Printer className="h-4 w-4 mr-1" />
          Imprimir
        </Button>
      </CardFooter>
    </Card>
  );
};
