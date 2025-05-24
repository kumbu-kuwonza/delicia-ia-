
import React, { useState, useEffect } from 'react';
import { Order } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, CheckCircle, Clock, User, MapPin, Phone, AlertCircle, AlertTriangle, XCircle, Coffee } from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { StatusBadge } from './StatusBadge';
import { formatCurrency } from '@/lib/utils';
import { CustomerInfoCard } from './CustomerInfoCard';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface OrderCardProps {
  order: Order;
  orders: Order[];
  onUpdateStatus: (orderId: string, status: Order['status'], cancellationReason?: string) => void;
  onPrint: (order: Order) => void;
}

export const OrderCard = ({ order, orders, onUpdateStatus, onPrint }: OrderCardProps) => {
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  
  // Count total orders by this customer
  const customerOrderCount = orders.filter(
    o => o.customer.phone === order.customer.phone
  ).length;
  
  // Calculate waiting time in minutes
  const waitingTime = differenceInMinutes(new Date(), new Date(order.createdAt));
  
  // Define thresholds for waiting time alerts
  const isLongWait = order.status !== 'delivered' && order.status !== 'canceled' && waitingTime > 30;
  const isCriticalWait = order.status !== 'delivered' && order.status !== 'canceled' && waitingTime > 45;
  
  // Flash alert for orders with critical waiting time
  useEffect(() => {
    if (isCriticalWait) {
      const interval = setInterval(() => {
        setIsAlertVisible(prev => !prev);
      }, 1000);
      
      return () => clearInterval(interval);
    } else {
      setIsAlertVisible(false);
    }
  }, [isCriticalWait]);
  
  // Handle order cancellation
  const handleCancelOrder = () => {
    if (cancellationReason.trim()) {
      onUpdateStatus(order.id, 'canceled', cancellationReason);
      setShowCancelDialog(false);
      setCancellationReason('');
    }
  };
  
  return (
    <Card key={order.id} className={`kitchen-order ${order.status} h-full`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className={`flex items-center ${isAlertVisible ? 'text-red-600' : ''}`}>
              Pedido #{order.id}
              {isCriticalWait && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertTriangle className={`h-5 w-5 ml-2 ${isAlertVisible ? 'text-red-600' : 'text-amber-500'}`} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Pedido em espera por {waitingTime} minutos!</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-sm text-gray-500">
                {format(new Date(order.createdAt), 'HH:mm')}
              </p>
              <StatusBadge status={order.status} />
              <Badge 
                variant="outline" 
                className={`text-xs ${isCriticalWait ? 'bg-red-50 text-red-700 border-red-200' : isLongWait ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}
              >
                <Clock className="h-3 w-3 mr-1" />
                {waitingTime} min
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-2">
        <div className="space-y-3">
          {order.status === 'canceled' && order.cancellationReason && (
            <div className="bg-red-50 p-2 rounded-md border border-red-200">
              <div className="flex items-center text-red-700 mb-1">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Pedido Cancelado</span>
              </div>
              <p className="text-sm text-red-600">
                Motivo: {order.cancellationReason}
              </p>
            </div>
          )}
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
                
                {/* Exibir preferências alimentares e alergias se disponíveis */}
                {(order.customer.allergies && order.customer.allergies.length > 0 || order.customer.dietaryRestrictions && order.customer.dietaryRestrictions.length > 0 || order.customer.preferences) && (
                  <div className="col-span-2 mt-1 pt-1 border-t border-gray-100">
                    <div className="flex flex-wrap gap-1">
                      {order.customer.preferences && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                <Coffee className="h-3 w-3 mr-1" /> Preferências
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Preferências: {order.customer.preferences}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {order.customer.allergies && order.customer.allergies.length > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                <AlertTriangle className="h-3 w-3 mr-1" /> Alergias
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Alergias: {order.customer.allergies.join(', ')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {order.customer.dietaryRestrictions && order.customer.dietaryRestrictions.length > 0 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                <Ban className="h-3 w-3 mr-1" /> Restrições
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Restrições: {order.customer.dietaryRestrictions.join(', ')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {order.specialInstructions && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                                <AlertCircle className="h-3 w-3 mr-1" /> Instruções
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{order.specialInstructions}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                )}
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
              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
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
              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
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
              className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Entregar
            </Button>
          )}
          
          {(order.status === 'delivered' || order.status === 'canceled') && (
            <span className="text-sm text-gray-500 italic flex items-center">
              {order.status === 'delivered' ? 'Pedido entregue' : 'Pedido cancelado'}
            </span>
          )}
        </div>
        
        <div className="flex space-x-2">
          {order.status !== 'canceled' && order.status !== 'delivered' && (
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Cancelar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancelar Pedido #{order.id}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <label htmlFor="cancellation-reason" className="block text-sm font-medium mb-2">
                    Motivo do Cancelamento
                  </label>
                  <Textarea
                    id="cancellation-reason"
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    placeholder="Informe o motivo do cancelamento"
                    className="w-full"
                  />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setShowCancelDialog(false)}>Voltar</Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleCancelOrder}
                    disabled={!cancellationReason.trim()}
                  >
                    Confirmar Cancelamento
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          {order.status !== 'canceled' && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => onPrint(order)}
            >
              <Printer className="h-4 w-4 mr-1" />
              Imprimir
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
