import React, { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, Plus, Minus, Trash, CheckCircle, MessageCircle } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface ShoppingCartProps {
  onCheckout: () => void;
  className?: string;
}

const CartItem = ({ 
  id, 
  name, 
  price, 
  quantity, 
  updateQuantity, 
  removeItem 
}: { 
  id: number;
  name: string;
  price: number;
  quantity: number;
  updateQuantity: (id: number, quantity: number) => void;
  removeItem: (id: number) => void;
}) => {
  return (
    <div className="cart-item">
      <div className="flex-1">
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-600">{formatCurrency(price)} cada</p>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="quantity-control">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7" 
            onClick={() => updateQuantity(id, quantity - 1)}
          >
            <Minus className="h-3 w-3" />
          </Button>
          
          <span className="w-6 text-center">{quantity}</span>
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-7 w-7" 
            onClick={() => updateQuantity(id, quantity + 1)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        <span className="text-restaurant-primary font-medium">
          {formatCurrency(price * quantity)}
        </span>
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-gray-400 hover:text-red-500" 
          onClick={() => removeItem(id)}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

const ShoppingCartComponent: React.FC<ShoppingCartProps> = ({ 
  onCheckout,
  className 
}) => {
  const { cart, updateQuantity, removeFromCart, cartTotal } = useCart();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [useWhatsapp, setUseWhatsapp] = useState(false);
  
  const sendToWhatsApp = () => {
    if (cart.length === 0) return;
    
    // Format the order for WhatsApp
    const phoneNumber = '5500000000000'; // Default phone number, would be configured in admin panel
    
    let message = 'Olá! Gostaria de fazer o seguinte pedido:\n\n';
    
    // Add cart items to message
    cart.forEach(item => {
      message += `${item.quantity}x ${item.product.name} - ${formatCurrency(item.product.price * item.quantity)}\n`;
    });
    
    // Add total
    message += `\nTotal: ${formatCurrency(cartTotal)}`;
    
    // Add customer notes section
    message += '\n\nInformações para entrega:';
    message += '\nNome: ';
    message += '\nEndereço: ';
    message += '\nForma de pagamento: ';
    
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Pedido enviado para WhatsApp",
      description: "Continue a conversa para finalizar seu pedido."
    });
  };

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <ShoppingCart className="mr-2 h-5 w-5" />
          Meu Pedido
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
            <ShoppingCart className="h-12 w-12 mb-4 opacity-20" />
            <p className="mb-2">Seu carrinho está vazio</p>
            <p className="text-sm">Selecione itens do menu para começar seu pedido</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-350px)] md:h-[calc(100vh-320px)]">
            <div className="space-y-1">
              {cart.map(item => (
                <CartItem
                  key={item.product.id}
                  id={item.product.id}
                  name={item.product.name}
                  price={item.product.price}
                  quantity={item.quantity}
                  updateQuantity={updateQuantity}
                  removeItem={removeFromCart}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
      
      {cart.length > 0 && (
        <>
          <Separator />
          <CardFooter className="flex flex-col pt-6">
            <div className="w-full flex justify-between items-center mb-4">
              <span className="font-semibold text-lg">Total</span>
              <span className="font-bold text-xl text-restaurant-primary">
                {formatCurrency(cartTotal)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2 w-full mb-4">
              <Switch 
                id="whatsapp-checkout"
                checked={useWhatsapp}
                onCheckedChange={setUseWhatsapp}
              />
              <Label htmlFor="whatsapp-checkout">Finalizar via WhatsApp</Label>
            </div>
            
            {useWhatsapp ? (
              <Button 
                onClick={sendToWhatsApp} 
                className="w-full bg-green-500 hover:bg-green-600 text-white"
                disabled={cart.length === 0}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Finalizar no WhatsApp
              </Button>
            ) : (
              <Button 
                onClick={onCheckout} 
                className="w-full bg-restaurant-primary hover:bg-restaurant-primary/90 text-white"
                disabled={cart.length === 0}
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Finalizar Pedido
              </Button>
            )}
          </CardFooter>
        </>
      )}
    </Card>
  );
};

export default ShoppingCartComponent;
