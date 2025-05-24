import React, { useState, useEffect } from 'react';
import { Order } from '@/types';
import { OrderCard } from './OrderCard';
import { printOrderService } from '@/services/printOrderService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Volume2, VolumeX, Bell } from 'lucide-react';
import './OrderManagement.css';

// Definição das colunas do Kanban
const COLUMNS = [
  { id: 'new', title: 'Novos Pedidos' },
  { id: 'preparing', title: 'Em Preparação' },
  { id: 'ready', title: 'Prontos para Entrega' },
  { id: 'delivered', title: 'Entregues' }
];

interface OrderManagementProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: Order['status'], cancellationReason?: string) => void;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ orders, onUpdateStatus }) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [lastOrderCount, setLastOrderCount] = useState<number>(0);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  
  // Agrupar pedidos por status
  const ordersByStatus = COLUMNS.reduce((acc, column) => {
    acc[column.id as Order['status']] = orders.filter(order => order.status === column.id);
    return acc;
  }, {} as Record<Order['status'], Order[]>);

  // Efeito para tocar som quando novos pedidos chegarem
  useEffect(() => {
    const newOrdersCount = ordersByStatus.new.length;
    
    if (newOrdersCount > lastOrderCount && soundEnabled) {
      playNotificationSound();
      setShowNotification(true);
      
      // Esconder notificação após 5 segundos
      setTimeout(() => setShowNotification(false), 5000);
    }
    
    setLastOrderCount(newOrdersCount);
  }, [ordersByStatus.new.length, lastOrderCount, soundEnabled]);

  // Função para tocar som de notificação
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(830, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(700, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Erro ao tocar som de notificação:', error);
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

  // Função para mover um pedido para outro status
  const moveOrder = (orderId: string, newStatus: Order['status'], cancellationReason?: string) => {
    onUpdateStatus(orderId, newStatus, cancellationReason);
  };

  return (
    <div className="order-management">
      {/* Controle de som e notificação de novos pedidos */}
      <div className="flex justify-between items-center mb-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="flex items-center gap-2"
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          {soundEnabled ? 'Som Ativado' : 'Som Desativado'}
        </Button>
        
        {showNotification && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-2 rounded animate-pulse">
            Novo(s) pedido(s) recebido(s)!
          </div>
        )}
      </div>

      {/* Painel Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map(column => (
          <div key={column.id} className="kanban-column">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              {column.title}
              <span className="ml-2 bg-gray-200 text-gray-800 text-xs font-semibold rounded-full px-2 py-1">
                {ordersByStatus[column.id as Order['status']]?.length || 0}
              </span>
            </h3>
            
            <div className="space-y-3 kanban-column-content">
              {ordersByStatus[column.id as Order['status']]?.length > 0 ? (
                ordersByStatus[column.id as Order['status']].map(order => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    orders={orders}
                    onUpdateStatus={moveOrder}
                    onPrint={handlePrint}
                  />
                ))
              ) : (
                <Card className="p-4 text-center text-gray-500 border-dashed">
                  Nenhum pedido
                </Card>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderManagement;