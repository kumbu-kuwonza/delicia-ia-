
import React from 'react';
import { User, Clock, ShoppingCart, Package } from 'lucide-react';
import { Customer, Order } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface CustomerInfoCardProps {
  customer: Customer;
  orders: Order[];
}

export const CustomerInfoCard = ({ customer, orders }: CustomerInfoCardProps) => {
  // Filter orders for this customer
  const customerOrders = orders.filter(
    order => order.customer.phone === customer.phone
  );
  
  // Get the most frequently ordered products
  const productCounts = customerOrders.flatMap(order => 
    order.items.map(item => item.product.name)
  ).reduce((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const favoriteProducts = Object.entries(productCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 3);
  
  // Calculate days since last order
  const lastOrderDate = customerOrders.length > 0 
    ? new Date(Math.max(...customerOrders.map(o => new Date(o.createdAt).getTime())))
    : null;
    
  const daysSinceLastOrder = lastOrderDate 
    ? Math.floor((new Date().getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <User className="h-5 w-5 mr-2 text-restaurant-primary" />
          Informações do Cliente
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="text-sm">
            <p className="text-gray-500">Nome:</p>
            <p className="font-medium">{customer.name}</p>
          </div>
          <div className="text-sm">
            <p className="text-gray-500">Telefone:</p>
            <p className="font-medium">{customer.phone}</p>
          </div>
          <div className="text-sm col-span-2">
            <p className="text-gray-500">Endereço:</p>
            <p className="font-medium">{customer.address}</p>
          </div>
        </div>
        
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <h3 className="text-sm font-medium flex items-center">
            <ShoppingCart className="h-4 w-4 mr-1 text-restaurant-secondary" />
            Histórico de Compras
          </h3>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-50 p-2 rounded-md text-center">
              <p className="text-2xl font-bold">{customerOrders.length}</p>
              <p className="text-xs text-gray-500">Pedidos Realizados</p>
            </div>
            
            <div className="bg-gray-50 p-2 rounded-md text-center">
              <p className="text-2xl font-bold">
                {daysSinceLastOrder !== null ? daysSinceLastOrder : '-'}
              </p>
              <p className="text-xs text-gray-500">Dias Desde Último Pedido</p>
            </div>
          </div>
          
          <div className="pt-2">
            <h4 className="text-xs text-gray-500 mb-1">Produtos Favoritos:</h4>
            <ul className="text-sm space-y-1">
              {favoriteProducts.length > 0 ? (
                favoriteProducts.map(([name, count]) => (
                  <li key={name} className="flex justify-between">
                    <span>{name}</span>
                    <span className="font-medium">{count}x</span>
                  </li>
                ))
              ) : (
                <li className="text-gray-400">Nenhum pedido ainda</li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
