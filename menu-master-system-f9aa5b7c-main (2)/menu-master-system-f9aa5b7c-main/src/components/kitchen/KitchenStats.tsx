
import React from 'react';
import { Order } from '@/types';
import { differenceInMinutes } from 'date-fns';
import { Clock, ShoppingCart, Calendar } from 'lucide-react';

interface KitchenStatsProps {
  orders: Order[];
}

export const KitchenStats = ({ orders }: KitchenStatsProps) => {
  // Calculate active orders (not delivered)
  const activeOrders = orders.filter(order => order.status !== 'delivered');
  
  // Calculate average preparation time
  const completedOrders = orders.filter(order => order.status === 'delivered' || order.status === 'ready');
  const totalPrepTime = completedOrders.reduce((total, order) => {
    const prepTime = differenceInMinutes(new Date(order.updatedAt), new Date(order.createdAt));
    return total + prepTime;
  }, 0);
  
  const avgPrepTime = completedOrders.length > 0 
    ? Math.round(totalPrepTime / completedOrders.length) 
    : 0;
    
  // Calculate today's orders
  const today = new Date().setHours(0, 0, 0, 0);
  const todaysOrders = orders.filter(order => 
    new Date(order.createdAt).setHours(0, 0, 0, 0) === today
  );
  
  return (
    <div className="flex space-x-4">
      <div className="bg-white shadow-sm border border-gray-100 p-3 rounded-md flex items-center">
        <div className="bg-blue-50 p-2 rounded-full mr-3">
          <ShoppingCart className="h-4 w-4 text-blue-500" />
        </div>
        <div>
          <p className="text-sm text-gray-600">Pedidos Ativos</p>
          <p className="text-2xl font-bold">{activeOrders.length}</p>
        </div>
      </div>
      
      <div className="bg-white shadow-sm border border-gray-100 p-3 rounded-md flex items-center">
        <div className="bg-amber-50 p-2 rounded-full mr-3">
          <Clock className="h-4 w-4 text-amber-500" />
        </div>
        <div>
          <p className="text-sm text-gray-600">Tempo Médio</p>
          <p className="text-2xl font-bold">{avgPrepTime} min</p>
        </div>
      </div>
      
      <div className="bg-white shadow-sm border border-gray-100 p-3 rounded-md flex items-center">
        <div className="bg-green-50 p-2 rounded-full mr-3">
          <Calendar className="h-4 w-4 text-green-500" />
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Hoje</p>
          <p className="text-2xl font-bold">{todaysOrders.length}</p>
        </div>
      </div>
    </div>
  );
};
