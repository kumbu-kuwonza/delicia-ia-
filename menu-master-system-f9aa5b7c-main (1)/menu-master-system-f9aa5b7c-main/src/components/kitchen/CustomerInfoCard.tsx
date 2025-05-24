
import React, { useState } from 'react';
import { User, Clock, ShoppingCart, Package, Coffee, AlertCircle, Heart, Calendar, Award, Ban, Mail, Bell, Tag, History } from 'lucide-react';
import { Customer, Order } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, subDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Função para formatar valores monetários
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

// Componente para exibir o status do pedido
const StatusBadge = ({ status, className = '' }: { status: Order['status'], className?: string }) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'new':
        return { label: 'Novo', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'preparing':
        return { label: 'Preparando', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'ready':
        return { label: 'Pronto', color: 'bg-green-100 text-green-800 border-green-200' };
      case 'delivered':
        return { label: 'Entregue', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'canceled':
        return { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-200' };
      default:
        return { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Badge variant="outline" className={`text-xs ${statusInfo.color} ${className}`}>
      {statusInfo.label}
    </Badge>
  );
};

interface CustomerInfoCardProps {
  customer: Customer;
  orders: Order[];
}

export const CustomerInfoCard = ({ customer, orders }: CustomerInfoCardProps) => {
  const [activeTab, setActiveTab] = useState('info');

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
  
  // Calculate total spent
  const totalSpent = customerOrders.reduce((total, order) => total + order.total, 0);
  
  // Determine customer segment
  const determineCustomerSegment = () => {
    if (customerOrders.length === 0) return 'novo';
    
    if (daysSinceLastOrder && daysSinceLastOrder > 30) return 'inativo';
    
    if (customerOrders.length > 10 || totalSpent > 1000) return 'vip';
    
    return 'regular';
  };
  
  const customerSegment = determineCustomerSegment();
  
  // Get segment color and icon
  const getSegmentInfo = () => {
    switch (customerSegment) {
      case 'novo':
        return { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <User className="h-3 w-3 mr-1" /> };
      case 'regular':
        return { color: 'bg-green-50 text-green-700 border-green-200', icon: <Award className="h-3 w-3 mr-1" /> };
      case 'vip':
        return { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <Award className="h-3 w-3 mr-1" /> };
      case 'inativo':
        return { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="h-3 w-3 mr-1" /> };
      default:
        return { color: 'bg-gray-50 text-gray-700 border-gray-200', icon: <User className="h-3 w-3 mr-1" /> };
    }
  };
  
  const segmentInfo = getSegmentInfo();
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <User className="h-5 w-5 mr-2 text-restaurant-primary" />
            Informações do Cliente
          </CardTitle>
          <Badge variant="outline" className={segmentInfo.color}>
            {segmentInfo.icon}
            Cliente {customerSegment.charAt(0).toUpperCase() + customerSegment.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="preferences">Preferências</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4">
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
              {customer.email && (
                <div className="text-sm col-span-2">
                  <p className="text-gray-500">Email:</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              )}
              {customer.birthDate && (
                <div className="text-sm col-span-2">
                  <p className="text-gray-500">Data de Nascimento:</p>
                  <p className="font-medium">{format(new Date(customer.birthDate), 'dd/MM/yyyy')}</p>
                </div>
              )}
            </div>
            
            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-sm font-medium flex items-center mb-2">
                <Award className="h-4 w-4 mr-1 text-restaurant-secondary" />
                Resumo do Cliente
              </h3>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-2 rounded-md text-center">
                  <p className="text-2xl font-bold">{customerOrders.length}</p>
                  <p className="text-xs text-gray-500">Pedidos Realizados</p>
                </div>
                
                <div className="bg-gray-50 p-2 rounded-md text-center">
                  <p className="text-2xl font-bold">
                    {formatCurrency(totalSpent)}
                  </p>
                  <p className="text-xs text-gray-500">Total Gasto</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="bg-gray-50 p-2 rounded-md text-center">
                  <p className="text-2xl font-bold">
                    {daysSinceLastOrder !== null ? daysSinceLastOrder : '-'}
                  </p>
                  <p className="text-xs text-gray-500">Dias Desde Último Pedido</p>
                </div>
                
                <div className="bg-gray-50 p-2 rounded-md text-center">
                  <p className="text-2xl font-bold">{customer.points || 0}</p>
                  <p className="text-xs text-gray-500">Pontos de Fidelidade</p>
                </div>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-sm font-medium flex items-center mb-2">
                <Bell className="h-4 w-4 mr-1 text-restaurant-secondary" />
                Preferências de Notificação
              </h3>
              
              <div className="flex flex-wrap gap-1">
                {customer.notificationPreferences?.email && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Mail className="h-3 w-3 mr-1" /> Email
                  </Badge>
                )}
                {customer.notificationPreferences?.sms && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Mail className="h-3 w-3 mr-1" /> SMS
                  </Badge>
                )}
                {customer.notificationPreferences?.whatsapp && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Mail className="h-3 w-3 mr-1" /> WhatsApp
                  </Badge>
                )}
                {customer.notificationPreferences?.push && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    <Bell className="h-3 w-3 mr-1" /> Push
                  </Badge>
                )}
                {!customer.notificationPreferences?.email && 
                 !customer.notificationPreferences?.sms && 
                 !customer.notificationPreferences?.whatsapp && 
                 !customer.notificationPreferences?.push && (
                  <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                    <Ban className="h-3 w-3 mr-1" /> Sem preferências definidas
                  </Badge>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="preferences" className="space-y-4">
            <div className="pt-2">
              <h3 className="text-sm font-medium flex items-center mb-2">
                <Coffee className="h-4 w-4 mr-1 text-restaurant-secondary" />
                Preferências e Restrições
              </h3>
              
              <div className="flex flex-wrap gap-1 mb-3">
                {customer.favoriteItems?.length > 0 && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Heart className="h-3 w-3 mr-1" /> 
                    Tem itens favoritos
                  </Badge>
                )}
                
                {customerOrders.some(o => o.specialInstructions) && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <AlertCircle className="h-3 w-3 mr-1" /> 
                    Tem instruções especiais
                  </Badge>
                )}
              </div>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Produtos Favoritos:</h4>
                  <ul className="text-sm space-y-1 bg-gray-50 p-2 rounded-md">
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
                
                {/* Mostrar últimas instruções especiais */}
                {customerOrders.some(o => o.specialInstructions) && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Últimas instruções especiais:</h4>
                    <div className="bg-gray-50 p-2 rounded-md">
                      {customerOrders
                        .filter(o => o.specialInstructions)
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 2)
                        .map((o, i) => (
                          <div key={i} className="mb-1 last:mb-0">
                            <p className="text-xs text-gray-500">{format(new Date(o.createdAt), 'dd/MM/yyyy')}:</p>
                            <p className="text-sm text-gray-700">{o.specialInstructions}</p>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}
                
                {/* Alergias e Restrições - Placeholder para implementação futura */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Alergias e Restrições:</h4>
                  <div className="bg-gray-50 p-2 rounded-md text-sm">
                    <p className="text-gray-400">Nenhuma informação registrada</p>
                    <Button variant="outline" size="sm" className="w-full mt-2 text-xs h-7">
                      <Tag className="h-3 w-3 mr-1" /> Adicionar Informações
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <div className="pt-2">
              <h3 className="text-sm font-medium flex items-center mb-2">
                <History className="h-4 w-4 mr-1 text-restaurant-secondary" />
                Histórico de Pedidos
              </h3>
              
              {customerOrders.length > 0 ? (
                <div className="space-y-2">
                  {customerOrders
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5)
                    .map((order, index) => (
                      <div key={order.id} className="bg-gray-50 p-2 rounded-md">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center">
                            <span className="text-xs font-medium">Pedido #{order.id}</span>
                            <StatusBadge status={order.status} className="ml-2" />
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm')}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>{order.items.reduce((acc, item) => acc + item.quantity, 0)} itens</span>
                          <span className="font-medium">{formatCurrency(order.total)}</span>
                        </div>
                      </div>
                    ))
                  }
                  
                  {customerOrders.length > 5 && (
                    <Button variant="outline" size="sm" className="w-full mt-1 text-xs">
                      Ver todos os {customerOrders.length} pedidos
                    </Button>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 p-3 rounded-md text-center">
                  <p className="text-gray-500">Nenhum pedido realizado</p>
                </div>
              )}
              
              {customerSegment === 'inativo' && (
                <div className="mt-3 bg-amber-50 p-2 rounded-md border border-amber-200">
                  <div className="flex items-center text-amber-700 mb-1">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">Cliente Inativo</span>
                  </div>
                  <p className="text-xs text-amber-600 mb-2">
                    Este cliente não faz um pedido há {daysSinceLastOrder} dias.
                  </p>
                  <Button variant="outline" size="sm" className="w-full text-xs bg-white">
                    <Tag className="h-3 w-3 mr-1" /> Enviar Promoção
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
