import React, { useState, useEffect } from 'react';
import { Order, Customer, CartItem } from '@/types';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { notifyOrderStatusChangeToEvoAI } from '@/services/evoAiService';
import { notifyOrderStatusChangeToN8N } from '@/services/n8nService';
import { loadIntegrationSettings } from '@/components/admin/settings/IntegrationsSettings'; // Para verificar qual serviço usar

// Mock data - em um cenário real, isso viria de uma API
const mockOrders: Order[] = [
  {
    id: 'ORD001',
    items: [
      { product: { id: 1, name: 'Pizza Margherita', description: '', price: 30, image: '', category: 'pizzas', prepTime: 15, available: true }, quantity: 1 },
      { product: { id: 2, name: 'Coca-Cola', description: '', price: 5, image: '', category: 'drinks', prepTime: 0, available: true }, quantity: 2 },
    ],
    customer: { name: 'João Silva', phone: '11999998888', address: 'Rua Fictícia, 123', points: 100 },
    total: 40,
    pointsUsed: 0,
    pointsEarned: 4,
    status: 'new',
    createdAt: new Date(),
    updatedAt: new Date(),
    deliveryMethod: 'delivery',
  },
  {
    id: 'ORD002',
    items: [
      { product: { id: 3, name: 'Hambúrguer Clássico', description: '', price: 25, image: '', category: 'burgers', prepTime: 10, available: true }, quantity: 2 },
    ],
    customer: { name: 'Maria Oliveira', phone: '21988887777', address: 'Avenida Teste, 456', points: 50 },
    total: 50,
    pointsUsed: 10,
    pointsEarned: 4,
    status: 'preparing',
    createdAt: new Date(Date.now() - 3600000), // 1 hour ago
    updatedAt: new Date(),
    deliveryMethod: 'pickup',
  },
];

const OrderManagement: React.FC = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [loading, setLoading] = useState<boolean>(false);

  // Função para simular a busca de pedidos
  useEffect(() => {
    // Em um app real, buscaria da API
    // setLoading(true);
    // fetchOrders().then(data => {
    //   setOrders(data);
    //   setLoading(false);
    // }).catch(err => {
    //   toast({ title: 'Erro ao buscar pedidos', description: err.message, variant: 'destructive' });
    //   setLoading(false);
    // });
  }, []);

  // Carregar configurações de integração para saber qual serviço usar para notificações
  // Esta é uma simplificação. Em um app maior, isso poderia vir de um contexto ou estado global.
  const integrationSettings = loadIntegrationSettings();

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    const orderToUpdate = orders.find(order => order.id === orderId);
    if (!orderToUpdate) {
      toast({ title: 'Erro', description: 'Pedido não encontrado.', variant: 'destructive' });
      return;
    }

    const updatedOrder = { ...orderToUpdate, status: newStatus, updatedAt: new Date() };

    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId ? updatedOrder : order
      )
    );

    toast({
      title: 'Status do Pedido Atualizado',
      description: `O pedido ${orderId} foi atualizado para ${newStatus}.`,
    });

    // Enviar notificações com base nas configurações
    try {
      if (integrationSettings.evoAI?.enabled) {
        await notifyOrderStatusChangeToEvoAI(updatedOrder);
        console.log(`Notificação de status para EvoAI enviada para o pedido ${orderId}`);
      }
      if (integrationSettings.n8n?.enabled) {
        await notifyOrderStatusChangeToN8N(updatedOrder);
        console.log(`Notificação de status para N8N enviada para o pedido ${orderId}`);
      }
    } catch (error) {
      console.error('Erro ao enviar notificação de mudança de status:', error);
      toast({
        title: 'Erro na Notificação Externa',
        description: 'O status do pedido foi atualizado localmente, mas houve um erro ao enviar a notificação externa.',
        variant: 'destructive',
      });
      // Não vamos reverter o status local, pois a atualização principal ocorreu.
      // O log de erro é importante aqui para depuração.
    }
  };

  const getStatusBadgeVariant = (status: Order['status']) => {
    switch (status) {
      case 'new': return 'secondary';
      case 'preparing': return 'warning';
      case 'ready': return 'info';
      case 'out_for_delivery': return 'default';
      case 'delivered': return 'success';
      case 'canceled': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'new': return <ShoppingBag className="h-4 w-4 mr-2" />;
      case 'preparing': return <Clock className="h-4 w-4 mr-2" />;
      case 'ready': return <CheckCircle className="h-4 w-4 mr-2 text-blue-500" />;
      case 'out_for_delivery': return <Truck className="h-4 w-4 mr-2" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 mr-2 text-green-500" />;
      case 'canceled': return <XCircle className="h-4 w-4 mr-2 text-red-500" />;
      default: return null;
    }
  };

  if (loading) {
    return <p>Carregando pedidos...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Pedidos</CardTitle>
        <CardDescription>Acompanhe e atualize o status dos pedidos em tempo real.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Pedido</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status Atual</TableHead>
              <TableHead>Atualizar Status</TableHead>
              <TableHead>Última Atualização</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.customer.name}</TableCell>
                <TableCell>R$ {order.total.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(order.status)} className="flex items-center">
                    {getStatusIcon(order.status)}
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select 
                    value={order.status}
                    onValueChange={(newStatus) => handleStatusChange(order.id, newStatus as Order['status'])}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Mudar status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo</SelectItem>
                      <SelectItem value="preparing">Em Preparo</SelectItem>
                      <SelectItem value="ready">Pronto para Entrega/Retirada</SelectItem>
                      <SelectItem value="out_for_delivery">Saiu para Entrega</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="canceled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>{new Date(order.updatedAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default OrderManagement;