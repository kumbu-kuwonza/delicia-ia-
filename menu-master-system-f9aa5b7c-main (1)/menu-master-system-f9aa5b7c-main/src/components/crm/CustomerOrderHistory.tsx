import React, { useEffect, useState } from 'react';
import { Order, Customer } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShoppingCart, Package, CreditCard, Hash, CalendarDays, UserCircle, DollarSign, ListOrdered } from 'lucide-react';

// import { getOrdersByCustomerId } from '@/services/orderService'; // Supondo que este serviço exista ou será criado

interface CustomerOrderHistoryProps {
  customer: Customer;
}

// Mock de dados enquanto o serviço não está pronto
const mockOrders: Order[] = [
  {
    id: '1',
    items: [
      { product: { id: 1, name: 'Pizza Margherita', description: '', price: 30, image: '', category: 'Pizzas', prepTime: 15, available: true }, quantity: 1 },
      { product: { id: 2, name: 'Coca-Cola', description: '', price: 5, image: '', category: 'Bebidas', prepTime: 0, available: true }, quantity: 2 },
    ],
    customer: { id: 'cust1', name: 'João Silva', phone: '123456789', address: 'Rua Exemplo, 123', points: 100 },
    total: 40,
    pointsUsed: 0,
    pointsEarned: 4,
    status: 'delivered',
    createdAt: new Date('2023-10-26T10:00:00Z'),
    updatedAt: new Date('2023-10-26T10:30:00Z'),
    restaurantId: 'rest1',
    deliveryMethod: 'delivery',
    paymentMethod: 'credit',
  },
  {
    id: '2',
    items: [
      { product: { id: 3, name: 'Hambúrguer Clássico', description: '', price: 25, image: '', category: 'Hambúrgueres', prepTime: 10, available: true }, quantity: 1 },
    ],
    customer: { id: 'cust1', name: 'João Silva', phone: '123456789', address: 'Rua Exemplo, 123', points: 100 },
    total: 25,
    pointsUsed: 10,
    pointsEarned: 2,
    status: 'delivered',
    createdAt: new Date('2023-11-15T19:30:00Z'),
    updatedAt: new Date('2023-11-15T20:00:00Z'),
    restaurantId: 'rest1',
    deliveryMethod: 'pickup',
    paymentMethod: 'cash',
  },
];

// Função mock para simular a busca de pedidos por cliente
const getOrdersByCustomerId = async (customerId: string): Promise<Order[]> => {
  console.log(`Buscando pedidos para o cliente ${customerId}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockOrders.filter(order => order.customer.id === customerId));
    }, 500);
  });
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const CustomerOrderHistory: React.FC<CustomerOrderHistoryProps> = ({ customer }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (customer && customer.id) {
      const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
          // const fetchedOrders = await getOrdersByCustomerId(customer.id as string);
          // setOrders(fetchedOrders);
          // Usando mock por enquanto
          setOrders(mockOrders.filter(order => order.customer.id === customer.id)); 
        } catch (err) {
          setError('Falha ao buscar histórico de pedidos.');
          console.error(err);
        }
        setLoading(false);
      };
      fetchOrders();
    } else {
      setOrders([]);
      setLoading(false);
    }
  }, [customer]);

  if (!customer || !customer.id) {
    return <p className="text-gray-500">Selecione um cliente para ver o histórico de pedidos.</p>;
  }

  if (loading) {
    return <p>Carregando histórico de pedidos...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="border-b">
        <CardTitle className="text-xl flex items-center">
          <ListOrdered className="h-6 w-6 mr-2 text-restaurant-primary" />
          Histórico de Pedidos de {customer.name}
        </CardTitle>
        <CardDescription>
          Visualize todos os pedidos realizados por {customer.name}.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {orders.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>Nenhum pedido encontrado para este cliente.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((order, index) => (
              <AccordionItem value={`order-${order.id}`} key={order.id} className={index === orders.length - 1 ? 'border-b-0' : ''}>
                <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="flex flex-1 justify-between items-center">
                    <div className="flex items-center">
                      <Hash className="h-5 w-5 mr-2 text-gray-500" />
                      <span className="font-medium">Pedido #{order.id}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={order.status === 'delivered' ? 'success' : 'warning'} className="text-xs">
                        {order.status.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                      <span className="font-semibold text-restaurant-primary">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-800/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2 text-md flex items-center">
                        <ListOrdered className="h-5 w-5 mr-2 text-restaurant-secondary" />
                        Itens do Pedido ({order.items.length})
                      </h4>
                      <Table className="bg-white dark:bg-gray-700 rounded-md shadow-sm">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-center">Qtd.</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.items.map((item, itemIndex) => (
                            <TableRow key={itemIndex}>
                              <TableCell>{item.product.name}</TableCell>
                              <TableCell className="text-center">{item.quantity}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.product.price * item.quantity)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2 text-md flex items-center">
                        <Package className="h-5 w-5 mr-2 text-restaurant-secondary" />
                        Detalhes da Entrega e Pagamento
                      </h4>
                      <div className="space-y-2 text-sm bg-white dark:bg-gray-700 p-4 rounded-md shadow-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Método de Entrega:</span>
                          <span className="font-medium">{order.deliveryMethod === 'delivery' ? 'Entrega' : 'Retirada'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Forma de Pagamento:</span>
                          <span className="font-medium">{order.paymentMethod || 'Não informado'}</span>
                        </div>
                        {order.deliveryMethod === 'delivery' && order.customer.address && (
                          <div className="pt-2 border-t mt-2">
                            <p className="text-gray-600 dark:text-gray-400">Endereço de Entrega:</p>
                            <p className="font-medium">{order.customer.address}</p>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t mt-2">
                          <span className="text-gray-600 dark:text-gray-400">Pontos Ganhos:</span>
                          <span className="font-medium text-green-600">+{order.pointsEarned || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Pontos Usados:</span>
                          <span className="font-medium text-red-600">-{order.pointsUsed || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {order.specialInstructions && (
                    <div className="mt-4 pt-3 border-t">
                        <h4 className="font-semibold text-sm mb-1">Instruções Especiais:</h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-900/30 p-2 rounded-md">{order.specialInstructions}</p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerOrderHistory;