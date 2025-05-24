
import React, { useState, useEffect } from 'react';
import { mockOrders } from '@/data/menu';
import { Order } from '@/types';
import Header from '@/components/Header';
import { KitchenStats } from '@/components/kitchen/KitchenStats';
import { AutomationControl } from '@/components/AutomationControl';
import OrderManagement from '@/components/kitchen/OrderManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Kitchen = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState("active");
  
  useEffect(() => {
    setOrders(mockOrders as Order[]);
    
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newOrder = { 
          ...mockOrders[Math.floor(Math.random() * mockOrders.length)],
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'new' as const
        };
        
        setOrders(prev => [newOrder as Order, ...prev]);
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  const updateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId ? { ...order, status, updatedAt: new Date() } : order
      )
    );
    
    // In a real implementation, this would send a webhook notification
    // to the N8N automation about the status change
    console.log(`Status do pedido ${orderId} atualizado para: ${status}`);
    // Here you would call a service to notify N8N about the status change
  };
  
  // Filter orders based on active tab
  const activeOrders = orders.filter(order => order.status !== 'delivered');
  const deliveredOrders = orders.filter(order => order.status === 'delivered');
  
  const displayOrders = activeTab === "active" ? activeOrders : deliveredOrders;
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">Painel da Cozinha</h1>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <AutomationControl />
            <KitchenStats orders={orders} />
          </div>
        </div>
        
        <div className="mb-6">
          <OrderManagement 
            orders={orders} 
            onUpdateStatus={updateOrderStatus} 
          />
        </div>
          
          <TabsContent value="delivered" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayOrders.length > 0 ? (
                displayOrders.map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    orders={orders}
                    onUpdateStatus={updateOrderStatus}
                    onPrint={printOrder}
                  />
                ))
              ) : (
                <div className="col-span-3 text-center py-10 text-gray-500">
                  Nenhum pedido entregue hoje
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Kitchen;
