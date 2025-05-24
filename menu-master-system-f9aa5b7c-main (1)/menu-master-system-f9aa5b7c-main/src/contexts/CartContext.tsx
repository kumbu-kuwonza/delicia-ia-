
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, specialInstructions?: string) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const { toast } = useToast();

  // Load cart from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart from localStorage:', e);
      }
    }
  }, []);

  // Save cart to local storage when it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Calculate cart total
    const total = cart.reduce((sum, item) => {
      return sum + (item.product.price * item.quantity);
    }, 0);
    
    setCartTotal(total);
  }, [cart]);

  const addToCart = (product: Product, specialInstructions?: string) => {
    setCart(prevCart => {
      // If item with same product ID AND same special instructions exists, increase quantity
      const existingItemIndex = prevCart.findIndex(
        item => item.product.id === product.id && 
        item.specialInstructions === specialInstructions
      );
      
      if (existingItemIndex >= 0) {
        // Product exists in cart with same instructions, increase quantity
        return prevCart.map((item, index) => 
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      } else {
        // Product is not in cart or has different instructions, add it
        return [...prevCart, { 
          product, 
          quantity: 1,
          specialInstructions: specialInstructions || undefined
        }];
      }
    });
    
    toast({
      title: "Produto adicionado",
      description: `${product.name} foi adicionado ao carrinho`,
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => item.product.id !== productId);
      return updatedCart;
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart => {
      return prevCart.map(item => 
        item.product.id === productId 
          ? { ...item, quantity } 
          : item
      );
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
