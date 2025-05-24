import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { mockOrders } from '@/data/menu';
import { Order } from '@/types';
import Header from '@/components/Header';
import { KitchenStats } from '@/components/kitchen/KitchenStats';
import { AutomationControl } from '@/components/AutomationControl';
import { OrderCard } from '@/components/kitchen/OrderCard';
import { printOrderService } from '@/services/printOrderService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Volume2, VolumeX, Bell, Printer, RefreshCw, AlertTriangle, X } from 'lucide-react';

// Definição das colunas do Kanban
const COLUMNS = [
  { id: 'new', title: 'Novos Pedidos', color: '#f59e0b' },
  { id: 'preparing', title: 'Em Preparação', color: '#3b82f6' },
  { id: 'ready', title: 'Prontos para Entrega', color: '#10b981' },
  { id: 'delivered', title: 'Entregues', color: '#6b7280' },
  { id: 'canceled', title: 'Cancelados', color: '#ef4444' }
];

interface NotificationState {
  type: 'new' | 'alert' | 'canceled';
  message: string;
}

const OrderManagementPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastOrderCount, setLastOrderCount] = useState<number>(0);
  const [showNotification, setShowNotification] = useState<NotificationState | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState<boolean>(false);
  const [cancelOrderId, setCancelOrderId] = useState<string>('');
  const [cancelReason, setCancelReason] = useState<string>('');
  
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
  
  // Agrupar pedidos por status
  const ordersByStatus = COLUMNS.reduce((acc, column) => {
    acc[column.id as Order['status']] = orders.filter(order => order.status === column.id);
    return acc;
  }, {} as Record<Order['status'], Order[]>);
  
  // Efeito para tocar som quando novos pedidos chegarem
  useEffect(() => {
    const newOrdersCount = ordersByStatus.new?.length || 0;
    
    if (newOrdersCount > lastOrderCount && soundEnabled) {
      playNotificationSound('new');
      setShowNotification({type: 'new', message: 'Novo(s) pedido(s) recebido(s)!'});
      
      // Esconder notificação após 5 segundos
      setTimeout(() => setShowNotification(null), 5000);
    }
    
    setLastOrderCount(newOrdersCount);
  }, [ordersByStatus.new?.length, lastOrderCount, soundEnabled]);
  
  // Efeito para monitorar pedidos prontos há mais de 10 minutos
  useEffect(() => {
    const readyOrders = ordersByStatus.ready || [];
    const interval = setInterval(() => {
      const now = new Date();
      readyOrders.forEach(order => {
        const updatedTime = new Date(order.updatedAt);
        const minutesPassed = Math.floor((now.getTime() - updatedTime.getTime()) / (1000 * 60));
        
        if (minutesPassed >= 10 && soundEnabled) {
          setShowNotification({type: 'alert', message: `Pedido #${order.id} está pronto há ${minutesPassed} minutos!`});
          playNotificationSound('alert');
          
          // Esconder notificação após 5 segundos
          setTimeout(() => setShowNotification(null), 5000);
        }
      });
    }, 60000); // Verificar a cada minuto
    
    return () => clearInterval(interval);
  }, [ordersByStatus.ready, soundEnabled]);
  
  // Função para tocar som de notificação
  const playNotificationSound = (type: 'new' | 'canceled' | 'alert' = 'new') => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      if (type === 'new') {
        // Som para novos pedidos (mais agudo)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(830, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(700, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
      } else if (type === 'canceled') {
        // Som para pedidos cancelados (mais grave)
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(330, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(220, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.6);
      } else if (type === 'alert') {
        // Som para alertas (repetitivo)
        oscillator.type = 'square';
        
        // Padrão de alerta com duas notas alternadas
        oscillator.frequency.setValueAtTime(660, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(550, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.4);
        oscillator.frequency.setValueAtTime(550, audioContext.currentTime + 0.6);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.4);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.8);
      }
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
    } catch (error) {
      console.error('Erro ao tocar som de notificação:', error);
    }
  };
  
  const updateOrderStatus = (orderId: string, status: Order['status'], reason?: string) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId ? { 
          ...order, 
          status, 
          updatedAt: new Date(),
          ...(reason && { cancellationReason: reason })
        } : order
      )
    );
    
    // Em uma implementação real, isso enviaria uma notificação webhook
    // para a automação N8N sobre a mudança de status
    console.log(`Status do pedido ${orderId} atualizado para: ${status}`);
    if (reason) {
      console.log(`Motivo do cancelamento: ${reason}`);
    }
  };
  
  // Função para imprimir comanda
  const handlePrint = (order: Order) => {
    // Abrir menu de opções de impressão
    const printType = window.confirm('Deseja imprimir comanda para cozinha? Clique em OK para Cozinha ou Cancelar para Entrega');
    
    if (printType) {
      printOrderService.printKitchenOrder(order);
    } else {
      printOrderService.printDeliveryOrder(order);
    }
  };
  
  // Função para lidar com o fim do arrasto
  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    
    // Se não houver destino ou o destino for o mesmo que a origem, não fazer nada
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    // Atualizar o status do pedido
    updateOrderStatus(draggableId, destination.droppableId as Order['status']);
  };
  
  // Função para atualizar manualmente os pedidos
  const refreshOrders = () => {
    setIsRefreshing(true);
    
    // Simular uma atualização de dados
    setTimeout(() => {
      setOrders(mockOrders as Order[]);
      setIsRefreshing(false);
    }, 1000);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">Gestão de Pedidos</h1>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <AutomationControl />
            <KitchenStats orders={orders} />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm">
          {/* Controles de som e notificação */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSoundEnabled(!soundEnabled)}
                className="flex items-center gap-2"
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                {soundEnabled ? 'Som Ativado' : 'Som Desativado'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshOrders}
                className="flex items-center gap-2"
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
            
            {showNotification && (
              <div className={`p-2 rounded animate-pulse flex items-center ${
                showNotification.type === 'new' 
                  ? 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700' 
                  : showNotification.type === 'alert' 
                    ? 'bg-orange-100 border-l-4 border-orange-500 text-orange-700' 
                    : 'bg-red-100 border-l-4 border-red-500 text-red-700'
              }`}>
                {showNotification.type === 'new' && <Bell className="h-4 w-4 mr-2" />}
                {showNotification.type === 'alert' && <Clock className="h-4 w-4 mr-2" />}
                {showNotification.type === 'canceled' && <AlertTriangle className="h-4 w-4 mr-2" />}
                {showNotification.message}
              </div>
            )}
          </div>
          
          {/* Painel Kanban com DragDropContext */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {COLUMNS.map(column => (
                <div key={column.id} className="kanban-column">
                  <h3 className="text-lg font-medium mb-3 flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: column.color }}
                    />
                    {column.title}
                    <span className="ml-2 bg-gray-200 text-gray-800 text-xs font-semibold rounded-full px-2 py-1">
                      {ordersByStatus[column.id as Order['status']]?.length || 0}
                    </span>
                  </h3>
                  
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 kanban-column-content ${snapshot.isDraggingOver ? 'bg-gray-100' : ''}`}
                        style={{ minHeight: '200px', padding: '8px', borderRadius: '4px' }}
                      >
                        {ordersByStatus[column.id as Order['status']]?.length > 0 ? (
                          ordersByStatus[column.id as Order['status']].map((order, index) => (
                            <Draggable key={order.id} draggableId={order.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    ...provided.draggableProps.style,
                                    opacity: snapshot.isDragging ? 0.8 : 1
                                  }}
                                >
                                  <div className={`kitchen-order ${order.status} relative`}>
                                    <OrderCard
                                      order={order}
                                      orders={orders}
                                      onUpdateStatus={updateOrderStatus}
                                      onPrint={handlePrint}
                                    />
                                    <div className="absolute top-2 right-2 flex gap-1">
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        onClick={() => handlePrint(order)}
                                        className="h-6 w-6"
                                      >
                                        <Printer className="h-4 w-4" />
                                      </Button>
                                      {order.status !== 'canceled' && order.status !== 'delivered' && (
                                        <Button 
                                          size="icon" 
                                          variant="ghost" 
                                          onClick={() => {
                                            setCancelOrderId(order.id);
                                            setCancelDialogOpen(true);
                                          }}
                                          className="h-6 w-6 text-red-500 hover:bg-red-50"
                                        >
                                          <AlertTriangle className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))
                        ) : (
                          <Card className="p-4 text-center text-gray-500 border-dashed">
                            Nenhum pedido
                          </Card>
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
      </main>
      
      {/* Diálogo de Cancelamento de Pedido */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Cancelar Pedido
            </DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={() => setCancelDialogOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fechar</span>
            </Button>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Motivo do Cancelamento</Label>
              <Input
                id="cancel-reason"
                placeholder="Informe o motivo do cancelamento"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCancelDialogOpen(false);
                setCancelReason('');
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                updateOrderStatus(cancelOrderId, 'canceled', cancelReason);
                playNotificationSound('canceled');
                setCancelDialogOpen(false);
                setCancelReason('');
              }}
            >
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <style jsx>{`
        .kanban-column {
          background-color: #f9fafb;
          border-radius: 0.5rem;
          padding: 1rem;
          height: calc(100vh - 220px);
          overflow-y: auto;
        }
        
        .kitchen-order.new {
          border-left: 4px solid #f59e0b;
        }
        
        .kitchen-order.preparing {
          border-left: 4px solid #3b82f6;
        }
        
        .kitchen-order.ready {
          border-left: 4px solid #10b981;
        }
        
        .kitchen-order.delivered {
          border-left: 4px solid #6b7280;
          opacity: 0.8;
        }
        
        .kitchen-order.canceled {
          border-left: 4px solid #ef4444;
          opacity: 0.7;
          background-color: #fee2e2;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default OrderManagementPage;