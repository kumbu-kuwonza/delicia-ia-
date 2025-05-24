
import React, { useState, useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useCustomer } from '@/contexts/CustomerContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Coins, MessageSquare, BadgeCheck } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { ProcessOrder } from '@/services/orderService';
import LoyaltyPoints from './LoyaltyPoints';
import { Badge } from '@/components/ui/badge'; // Adicionar import para Badge
import { AlertTriangle, Ban, Coffee } from 'lucide-react'; // Adicionar ícones se necessário

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ open, onClose }) => {
  const { cart, cartTotal, clearCart } = useCart();
  const { customer, setCustomer, usePoints, addPoints, isLoggedIn, loyaltyConfig, isEligibleForLoyalty } = useCustomer();
  const { toast } = useToast();
  
  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Payment options
  const [usePointsForDiscount, setUsePointsForDiscount] = useState(false);
  const [convertChange, setConvertChange] = useState(false);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Loyalty variables
  const availablePoints = customer?.points || 0;
  const maxPointsToUse = Math.min(availablePoints, cartTotal * 10); // 10 points = R$1.00
  const pointsDiscount = usePointsForDiscount ? pointsToUse / 10 : 0;
  const finalTotal = cartTotal - pointsDiscount;
  const canEarnPoints = isLoggedIn ? isEligibleForLoyalty() : false;
  
  // Calculate change and points to earn
  const change = Number(paymentAmount) > finalTotal ? Number(paymentAmount) - finalTotal : 0;
  let pointsToEarn = 0;
  
  // Only calculate points if eligible or will be eligible
  if (canEarnPoints || (!isLoggedIn && finalTotal >= loyaltyConfig.minSpendForPoints)) {
    pointsToEarn = Math.floor(finalTotal * loyaltyConfig.pointsPerCurrency);
  }
  
  const changeInPoints = convertChange ? Math.floor(change * loyaltyConfig.pointsPerCurrency) : 0;
  
  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone);
      setAddress(customer.address || '');
    }
  }, [customer, open]);
  
  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      // If not logged in, reset all fields
      if (!isLoggedIn) {
        setName('');
        setPhone('');
        setAddress('');
      }
      setUsePointsForDiscount(false);
      setConvertChange(false);
      setPointsToUse(0);
      setPaymentAmount('');
      setPaymentMethod('cash');
    }
  }, [open, isLoggedIn]);
  
  const handlePointsSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPointsToUse(Number(e.target.value));
  };
  
  const validateForm = () => {
    if (!name.trim()) {
      toast({
        title: "Nome necessário",
        description: "Por favor, informe seu nome para continuar.",
        variant: "destructive"
      });
      return false;
    }
    
    if (!phone.trim()) {
      toast({
        title: "Telefone necessário",
        description: "Por favor, informe um número de telefone para contato.",
        variant: "destructive"
      });
      return false;
    }
    
    if (!address.trim()) {
      toast({
        title: "Endereço necessário",
        description: "Por favor, informe o endereço de entrega.",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };
  
  const handleFinishOrder = async () => {
    if (!validateForm()) return;
    
    setIsProcessing(true);
    
    // Process points if using them and logged in
    if (isLoggedIn && usePointsForDiscount && pointsToUse > 0) {
      usePoints(pointsToUse);
    }
    
    // Prepare order data
    const orderData = {
      customer: {
        id: customer?.id,
        name: name,
        phone: phone,
        address: address,
        preferences: customer?.preferences,
        allergies: customer?.allergies,
        dietaryRestrictions: customer?.dietaryRestrictions
      },
      items: cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity
      })),
      payment: {
        method: paymentMethod,
        total: finalTotal,
        amountPaid: Number(paymentAmount) || finalTotal,
        change: change,
        changeToPoints: convertChange,
        pointsUsed: usePointsForDiscount ? pointsToUse : 0,
        pointsEarned: pointsToEarn + changeInPoints
      },
      timestamp: new Date().toISOString()
    };

    try {
      // Process order
      const result = await ProcessOrder(orderData);
      
      if (result.success) {
        // If user wasn't logged in but we got a customer back, register them
        if (!isLoggedIn && result.customer) {
          setCustomer(result.customer);
          toast({
            title: "Conta criada!",
            description: `Bem-vindo ao programa de fidelidade! Você ganhou ${result.customer.points} pontos iniciais.`,
            variant: "default"
          });
        } else if (isLoggedIn) {
          // Process points earned from purchase for logged in users
          addPoints(pointsToEarn + changeInPoints);
        }
        
        toast({
          title: "Pedido enviado!",
          description: `Seu pedido #${result.orderId} foi processado. Você receberá uma confirmação via WhatsApp.`,
        });
        
        // Clear cart and close modal
        clearCart();
        onClose();
      } else {
        throw new Error(result.message || "Erro ao processar pedido");
      }
    } catch (error) {
      console.error("Erro ao processar pedido:", error);
      toast({
        title: "Erro ao enviar pedido",
        description: "Houve um problema ao processar seu pedido. Por favor, tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Finalizar Pedido</DialogTitle>
          {customer && (customer.allergies && customer.allergies.length > 0 || customer.dietaryRestrictions && customer.dietaryRestrictions.length > 0 || customer.preferences) && (
            <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
              <p className="font-semibold mb-1 text-yellow-700">Atenção às Preferências/Restrições do Cliente:</p>
              {customer.preferences && (
                <div className='flex items-center mb-1'>
                  <Coffee className="h-4 w-4 mr-2 text-blue-600" /> 
                  <span className='text-gray-700'>Preferências: {customer.preferences}</span>
                </div>
              )}
              {customer.allergies && customer.allergies.length > 0 && (
                <div className='flex items-center mb-1'>
                  <AlertTriangle className="h-4 w-4 mr-2 text-red-600 flex-shrink-0" /> 
                  <div className='flex flex-wrap gap-1'>
                    <span className='text-red-700 mr-1'>Alergias:</span>
                    {customer.allergies.map(allergy => (
                      <Badge key={allergy} variant="destructive" className="text-xs">{allergy}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {customer.dietaryRestrictions && customer.dietaryRestrictions.length > 0 && (
                <div className='flex items-center'>
                  <Ban className="h-4 w-4 mr-2 text-orange-600 flex-shrink-0" /> 
                  <div className='flex flex-wrap gap-1'>
                    <span className='text-orange-700 mr-1'>Restrições:</span>
                    {customer.dietaryRestrictions.map(restriction => (
                      <Badge key={restriction} variant="outline" className="text-xs border-orange-500 text-orange-700">{restriction}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogDescription className="mt-2">
            Revise seus itens e complete as informações para finalizar o pedido.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">Itens do Pedido</h3>
              <div className="space-y-1">
                {cart.map(item => (
                  <div key={item.product.id} className="flex justify-between">
                    <span>
                      {item.quantity}x {item.product.name}
                    </span>
                    <span>{formatCurrency(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              
              <Separator className="my-2" />
              
              <div className="flex justify-between font-medium">
                <span>Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              
              {usePointsForDiscount && pointsToUse > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Desconto (Pontos)</span>
                  <span>-{formatCurrency(pointsDiscount)}</span>
                </div>
              )}
              
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className={cn(
                  usePointsForDiscount && pointsToUse > 0 ? "text-green-600" : ""
                )}>
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>
            
            {/* Informações do cliente */}
            <div className="space-y-4 border p-4 rounded-md bg-gray-50">
              <h3 className="font-medium">Informações para entrega</h3>
              
              {!isLoggedIn ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome completo"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                </>
              ) : (
                <div className="flex items-center p-2 bg-green-50 rounded-md mb-2">
                  <BadgeCheck className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="font-medium">{customer?.name}</p>
                    <p className="text-sm text-muted-foreground">{customer?.phone}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="address">Endereço de Entrega</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Rua, número, complemento, bairro"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                <div 
                  className={cn(
                    "p-3 border rounded-md cursor-pointer text-center",
                    paymentMethod === 'cash' ? "bg-restaurant-primary/20 border-restaurant-primary" : "hover:bg-gray-50"
                  )}
                  onClick={() => setPaymentMethod('cash')}
                >
                  Dinheiro
                </div>
                <div 
                  className={cn(
                    "p-3 border rounded-md cursor-pointer text-center",
                    paymentMethod === 'card' ? "bg-restaurant-primary/20 border-restaurant-primary" : "hover:bg-gray-50"
                  )}
                  onClick={() => setPaymentMethod('card')}
                >
                  Cartão
                </div>
                <div 
                  className={cn(
                    "p-3 border rounded-md cursor-pointer text-center",
                    paymentMethod === 'pix' ? "bg-restaurant-primary/20 border-restaurant-primary" : "hover:bg-gray-50"
                  )}
                  onClick={() => setPaymentMethod('pix')}
                >
                  PIX
                </div>
                {isLoggedIn && canEarnPoints && (
                  <div 
                    className={cn(
                      "p-3 border rounded-md cursor-pointer text-center",
                      paymentMethod === 'points' ? "bg-restaurant-primary/20 border-restaurant-primary" : "hover:bg-gray-50"
                    )}
                    onClick={() => setPaymentMethod('points')}
                  >
                    Pontos
                  </div>
                )}
              </div>
            </div>
            
            {isLoggedIn && (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="use-points"
                        checked={usePointsForDiscount}
                        onCheckedChange={(checked) => setUsePointsForDiscount(!!checked)}
                        disabled={!canEarnPoints || availablePoints < 10}
                      />
                      <Label htmlFor="use-points" className="cursor-pointer">
                        Usar pontos para desconto
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <LoyaltyPoints points={availablePoints} />
                    </div>
                  </div>
                  
                  {usePointsForDiscount && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>0</span>
                        <span>{maxPointsToUse}</span>
                      </div>
                      <Input
                        type="range"
                        min="0"
                        max={maxPointsToUse}
                        step="10"
                        value={pointsToUse}
                        onChange={handlePointsSliderChange}
                        className="w-full"
                      />
                      <div className="text-center text-sm">
                        <span>Usando {pointsToUse} pontos</span>
                        <span className="block text-green-600">
                          (Desconto de {formatCurrency(pointsDiscount)})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {!canEarnPoints && (
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-md text-sm">
                    <p>Você precisa ter pelo menos {loyaltyConfig.minOrdersForLoyalty} pedidos para participar do programa de fidelidade.</p>
                  </div>
                )}
                
                {paymentMethod === 'cash' && (
                  <div className="space-y-2">
                    <Label htmlFor="payment">Valor a Pagar (para calcular troco)</Label>
                    <Input
                      id="payment"
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder="Digite o valor em R$"
                    />
                    
                    {change > 0 && (
                      <div className="flex justify-between mt-1">
                        <span>Troco:</span>
                        <span>{formatCurrency(change)}</span>
                      </div>
                    )}
                  </div>
                )}
                
                {change > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="convert-change"
                      checked={convertChange}
                      onCheckedChange={(checked) => setConvertChange(!!checked)}
                    />
                    <Label htmlFor="convert-change" className="cursor-pointer">
                      Converter troco em pontos ({changeInPoints} pontos)
                    </Label>
                  </div>
                )}
              </>
            )}
            
            {/* Pontos a ganhar */}
            <div className="bg-green-50 p-3 rounded-md">
              <div className="flex justify-between">
                <span>Pontos a receber:</span>
                <span className="font-medium">
                  {pointsToEarn + (isLoggedIn ? changeInPoints : 0)} pontos
                </span>
              </div>
              {!isLoggedIn && (
                <p className="text-sm mt-1">
                  Faça seu cadastro automaticamente ao finalizar o pedido e ganhe pontos!
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button
            className="w-full bg-green-500 hover:bg-green-600"
            onClick={handleFinishOrder}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>Processando...</>
            ) : (
              <>
                <MessageSquare className="mr-2 h-5 w-5" />
                Finalizar Pedido
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;
