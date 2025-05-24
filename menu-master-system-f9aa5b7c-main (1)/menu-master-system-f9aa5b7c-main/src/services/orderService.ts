
import { toast } from '@/components/ui/use-toast';
import { Customer } from '@/types';

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface OrderCustomer {
  id?: string;
  name: string;
  phone: string;
  address: string;
  preferences?: string;
  allergies?: string[];
  dietaryRestrictions?: string[];
}

interface OrderPayment {
  method: string;
  total: number;
  amountPaid: number;
  change: number;
  changeToPoints: boolean;
  pointsUsed: number;
  pointsEarned: number;
}

export interface OrderData {
  customer: OrderCustomer;
  items: OrderItem[];
  payment: OrderPayment;
  timestamp: string;
}

interface ProcessOrderResult {
  success: boolean;
  message?: string;
  orderId?: string;
  customer?: Customer;
}

// N8N webhook URL - In a real environment, store this in environment variables
const WEBHOOK_URL = "https://webhook.site/your-webhook-id"; // Replace with your actual N8N webhook URL

export const ProcessOrder = async (orderData: OrderData): Promise<ProcessOrderResult> => {
  try {
    console.log('Enviando pedido para processamento:', orderData);
    
    // Check if automation is enabled
    if (!isAutomationEnabled()) {
      console.log('Automação desativada. O pedido será processado manualmente.');
      
      // Return success but inform that it will be processed manually
      return {
        success: true,
        orderId: `ORD-${Date.now()}`,
        message: 'Pedido registrado. Será processado manualmente.',
        customer: processCustomerData(orderData.customer, orderData.payment.total, orderData.payment)
      };
    }
    
    // Try to send to the webhook
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
      mode: 'no-cors' // This helps with CORS issues but means you won't get a proper response
    });
    
    // Since we're using no-cors, we can't read the response status or body
    // In production, you'd use a proper API that supports CORS
    // For now, we'll assume success but in production, handle proper response validation
    
    // Process customer data for non-registered customers
    const processedCustomer = processCustomerData(orderData.customer, orderData.payment.total, orderData.payment);
    
    return {
      success: true,
      orderId: `ORD-${Date.now()}`,
      customer: processedCustomer
    };
  } catch (error) {
    console.error('Erro ao processar pedido:', error);
    return {
      success: false,
      message: 'Falha ao enviar pedido. Por favor, tente novamente.'
    };
  }
};

// Process customer data and potentially create a new customer profile
const processCustomerData = (customerData: OrderCustomer, orderTotal: number, paymentDetails?: OrderPayment): Customer => {
  // Check if customer already exists in localStorage
  const existingCustomersString = localStorage.getItem('customers');
  const existingCustomers: Customer[] = existingCustomersString ? JSON.parse(existingCustomersString) : [];
  
  // Look for customer by phone number
  const existingCustomer = existingCustomers.find(c => c.phone === customerData.phone);
  
  if (existingCustomer) {
    // Update existing customer
    const updatedCustomer: Customer = {
      ...existingCustomer,
      name: customerData.name || existingCustomer.name, // Ensure name is updated if changed
      address: customerData.address || existingCustomer.address,
      preferences: customerData.preferences || existingCustomer.preferences,
      allergies: customerData.allergies || existingCustomer.allergies,
      dietaryRestrictions: customerData.dietaryRestrictions || existingCustomer.dietaryRestrictions,
      points: existingCustomer.points + (paymentDetails?.pointsEarned || 0) - (paymentDetails?.pointsUsed || 0),
      totalOrders: (existingCustomer.totalOrders || 0) + 1,
      totalSpent: (existingCustomer.totalSpent || 0) + orderTotal,
      lastOrderDate: new Date(),
    };
    
    // Update customer in local storage
    const updatedCustomers = existingCustomers.map(c => 
      c.phone === customerData.phone ? updatedCustomer : c
    );
    localStorage.setItem('customers', JSON.stringify(updatedCustomers));
    
    return updatedCustomer;
  } else {
    // Create new customer
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      name: customerData.name,
      phone: customerData.phone,
      address: customerData.address,
      preferences: customerData.preferences,
      allergies: customerData.allergies,
      dietaryRestrictions: customerData.dietaryRestrictions,
      points: (paymentDetails?.pointsEarned || 0) + 100, // Start with 100 points + earned points
      totalOrders: 1,
      totalSpent: orderTotal,
      lastOrderDate: new Date(),
      registrationDate: new Date(),
      loyaltyTier: 'bronze',
      isActive: true
    };
    
    // Add customer to local storage
    localStorage.setItem('customers', JSON.stringify([...existingCustomers, newCustomer]));
    
    return newCustomer;
  }
};

// Function to toggle automation
let automationEnabled = true;

export const toggleAutomation = (): boolean => {
  automationEnabled = !automationEnabled;
  
  toast({
    title: automationEnabled ? "Automação Ativada" : "Automação Desativada",
    description: automationEnabled 
      ? "Os pedidos serão processados automaticamente." 
      : "Os pedidos não serão processados automaticamente.",
  });
  
  return automationEnabled;
};

export const isAutomationEnabled = (): boolean => {
  return automationEnabled;
};
