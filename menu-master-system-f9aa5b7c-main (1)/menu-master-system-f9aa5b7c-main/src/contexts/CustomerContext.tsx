
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, LoyaltyConfig } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface CustomerContextType {
  customer: Customer | null;
  setCustomer: (customer: Customer) => void;
  addPoints: (points: number) => void;
  usePoints: (points: number) => boolean;
  isLoggedIn: boolean;
  logout: () => void;
  isEligibleForLoyalty: () => boolean;
  getCustomerTier: (points?: number) => 'bronze' | 'silver' | 'gold' | 'platinum';
  loyaltyConfig: LoyaltyConfig;
  updateLoyaltyConfig: (config: LoyaltyConfig) => void;
  getAllCustomers: () => Customer[];
}

const defaultCustomer: Customer = {
  name: '',
  phone: '',
  address: '',
  points: 0,
  totalOrders: 0,
  totalSpent: 0,
  isActive: true,
  registrationDate: new Date(),
  loyaltyTier: 'bronze',
};

const defaultLoyaltyConfig: LoyaltyConfig = {
  pointsPerCurrency: 10, // 10 pontos por R$1
  minSpendForPoints: 10, // Gasto mínimo de R$10 para ganhar pontos
  minOrdersForLoyalty: 3, // Mínimo de 3 pedidos para participar do programa
  tierThresholds: {
    silver: 1000, // 1000 pontos para prata
    gold: 5000, // 5000 pontos para ouro
    platinum: 10000 // 10000 pontos para platina
  },
  tierBenefits: {
    bronze: { pointMultiplier: 1 }, // 1x pontos
    silver: { pointMultiplier: 1.2 }, // 1.2x pontos
    gold: { pointMultiplier: 1.5 }, // 1.5x pontos
    platinum: { pointMultiplier: 2 } // 2x pontos
  }
};

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomerState] = useState<Customer | null>(null);
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>(defaultLoyaltyConfig);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const { toast } = useToast();

  // Load customer from local storage on mount
  useEffect(() => {
    const savedCustomer = localStorage.getItem('customer');
    if (savedCustomer) {
      try {
        setCustomerState(JSON.parse(savedCustomer));
      } catch (e) {
        console.error('Failed to parse customer from localStorage:', e);
      }
    }
    
    const savedLoyaltyConfig = localStorage.getItem('loyaltyConfig');
    if (savedLoyaltyConfig) {
      try {
        setLoyaltyConfig(JSON.parse(savedLoyaltyConfig));
      } catch (e) {
        console.error('Failed to parse loyalty config from localStorage:', e);
      }
    }
    
    const savedCustomers = localStorage.getItem('customers');
    if (savedCustomers) {
      try {
        setCustomers(JSON.parse(savedCustomers));
      } catch (e) {
        console.error('Failed to parse customers from localStorage:', e);
      }
    }
  }, []);

  // Save customer to local storage when it changes
  useEffect(() => {
    if (customer) {
      localStorage.setItem('customer', JSON.stringify(customer));
    }
  }, [customer]);
  
  // Save loyalty config to local storage when it changes
  useEffect(() => {
    localStorage.setItem('loyaltyConfig', JSON.stringify(loyaltyConfig));
  }, [loyaltyConfig]);
  
  // Save all customers to local storage when they change
  useEffect(() => {
    if (customers.length > 0) {
      localStorage.setItem('customers', JSON.stringify(customers));
    }
  }, [customers]);

  const setCustomer = (newCustomer: Customer) => {
    // Ensure the customer has all required fields
    const completeCustomer = {
      ...defaultCustomer,
      ...newCustomer,
      registrationDate: newCustomer.registrationDate || new Date(),
      totalOrders: newCustomer.totalOrders || 0,
      totalSpent: newCustomer.totalSpent || 0,
      isActive: true,
      loyaltyTier: getCustomerTier(newCustomer.points)
    };
    
    setCustomerState(completeCustomer);
    
    // Also update or add this customer to the customers array
    const existingCustomerIndex = customers.findIndex(c => c.id === completeCustomer.id || c.phone === completeCustomer.phone);
    
    if (existingCustomerIndex >= 0) {
      // Update existing customer
      const updatedCustomers = [...customers];
      updatedCustomers[existingCustomerIndex] = completeCustomer;
      setCustomers(updatedCustomers);
    } else {
      // Add new customer with ID if it doesn't have one
      const customerWithId = {
        ...completeCustomer,
        id: completeCustomer.id || `cust-${Date.now()}`
      };
      setCustomers([...customers, customerWithId]);
    }
    
    toast({
      title: "Bem-vindo!",
      description: `Olá, ${completeCustomer.name}! Você tem ${completeCustomer.points} pontos de fidelidade.`,
    });
  };

  const addPoints = (basePoints: number) => {
    if (!customer) return;
    
    // Apply tier multiplier if customer is eligible for loyalty program
    let pointsToAdd = basePoints;
    if (isEligibleForLoyalty()) {
      const tier = getCustomerTier(customer.points);
      const multiplier = loyaltyConfig.tierBenefits[tier].pointMultiplier;
      pointsToAdd = Math.round(basePoints * multiplier);
    }
    
    setCustomerState(prev => {
      if (!prev) return { ...defaultCustomer, points: pointsToAdd };
      
      const newPoints = prev.points + pointsToAdd;
      const newTier = getCustomerTier(newPoints);
      
      // Check if customer advanced to a new tier
      const oldTier = prev.loyaltyTier || 'bronze';
      if (newTier !== oldTier) {
        toast({
          title: "Parabéns! Novo nível alcançado!",
          description: `Você avançou para o nível ${newTier === 'platinum' ? 'Platina' : newTier === 'gold' ? 'Ouro' : 'Prata'}!`,
          variant: "default",
        });
      }
      
      return { 
        ...prev, 
        points: newPoints,
        loyaltyTier: newTier
      };
    });
    
    toast({
      title: "Pontos adicionados",
      description: `Você ganhou ${pointsToAdd} pontos de fidelidade!`,
    });
  };

  const usePoints = (points: number): boolean => {
    if (!customer || customer.points < points) return false;
    
    setCustomerState(prev => {
      if (!prev) return null;
      
      const newPoints = prev.points - points;
      const newTier = getCustomerTier(newPoints);
      
      // Check if customer dropped to a lower tier
      const oldTier = prev.loyaltyTier || 'bronze';
      if (newTier !== oldTier) {
        toast({
          title: "Alteração de nível",
          description: `Seu nível de fidelidade mudou para ${newTier === 'bronze' ? 'Bronze' : newTier === 'silver' ? 'Prata' : newTier === 'gold' ? 'Ouro' : 'Platina'}.`,
        });
      }
      
      return {
        ...prev, 
        points: newPoints,
        loyaltyTier: newTier
      };
    });
    
    toast({
      title: "Pontos utilizados",
      description: `Você utilizou ${points} pontos de fidelidade.`,
    });
    
    return true;
  };

  const logout = () => {
    setCustomerState(null);
    localStorage.removeItem('customer');
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta.",
    });
  };
  
  const isEligibleForLoyalty = (): boolean => {
    if (!customer) return false;
    
    return (customer.totalOrders || 0) >= loyaltyConfig.minOrdersForLoyalty;
  };
  
  const getCustomerTier = (points?: number): 'bronze' | 'silver' | 'gold' | 'platinum' => {
    const customerPoints = points !== undefined ? points : (customer?.points || 0);
    
    if (customerPoints >= loyaltyConfig.tierThresholds.platinum) {
      return 'platinum';
    } else if (customerPoints >= loyaltyConfig.tierThresholds.gold) {
      return 'gold';
    } else if (customerPoints >= loyaltyConfig.tierThresholds.silver) {
      return 'silver';
    } else {
      return 'bronze';
    }
  };
  
  const updateLoyaltyConfig = (config: LoyaltyConfig) => {
    setLoyaltyConfig(config);
    
    // Update all customer tiers
    const updatedCustomers = customers.map(c => ({
      ...c,
      loyaltyTier: getCustomerTierForPoints(c.points, config)
    }));
    
    setCustomers(updatedCustomers);
    
    // Update current customer if they exist
    if (customer) {
      setCustomerState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          loyaltyTier: getCustomerTierForPoints(prev.points, config)
        };
      });
    }
  };
  
  // Helper function to determine tier based on points and config
  const getCustomerTierForPoints = (points: number, config: LoyaltyConfig): 'bronze' | 'silver' | 'gold' | 'platinum' => {
    if (points >= config.tierThresholds.platinum) {
      return 'platinum';
    } else if (points >= config.tierThresholds.gold) {
      return 'gold';
    } else if (points >= config.tierThresholds.silver) {
      return 'silver';
    } else {
      return 'bronze';
    }
  };
  
  // Function to get all customers (for admin panel)
  const getAllCustomers = (): Customer[] => {
    return customers;
  };

  return (
    <CustomerContext.Provider value={{
      customer,
      setCustomer,
      addPoints,
      usePoints,
      isLoggedIn: !!customer,
      logout,
      isEligibleForLoyalty,
      getCustomerTier,
      loyaltyConfig,
      updateLoyaltyConfig,
      getAllCustomers,
    }}>
      {children}
    </CustomerContext.Provider>
  );
}

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};
