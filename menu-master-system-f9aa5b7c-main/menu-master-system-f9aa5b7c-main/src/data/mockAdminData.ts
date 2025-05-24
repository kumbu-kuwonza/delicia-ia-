
import { Customer, Restaurant } from '@/types';

// Mock data for customers
export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '11999887766',
    address: 'Rua A, 123',
    points: 450,
    loyaltyTier: 'gold',
    isActive: true,
    lastOrderDate: new Date('2024-04-25T15:30:00'),
    totalSpent: 890.5,
    totalOrders: 12
  },
  {
    id: '2',
    name: 'Maria Oliveira',
    email: 'maria@example.com',
    phone: '11988776655',
    address: 'Av. B, 456',
    points: 280,
    loyaltyTier: 'silver',
    isActive: true,
    lastOrderDate: new Date('2024-04-20T12:45:00'),
    totalSpent: 550.75,
    totalOrders: 8
  },
  {
    id: '3',
    name: 'Carlos Mendes',
    email: 'carlos@example.com',
    phone: '11977665544',
    address: 'Rua C, 789',
    points: 100,
    loyaltyTier: 'bronze',
    isActive: false,
    lastOrderDate: new Date('2024-03-15T18:20:00'),
    totalSpent: 320.25,
    totalOrders: 4
  }
];

// Mock data for restaurants
export const mockRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Pizzaria Bella Italia',
    owner: 'Roberto Ferreira',
    email: 'contato@bellaitalia.com',
    phone: '1140028922',
    address: 'Rua das Pizzas, 123',
    logo: '/placeholder.svg',
    subscriptionPlan: 'premium',
    subscriptionStatus: 'active',
    registrationDate: new Date('2023-12-10T10:00:00')
  },
  {
    id: '2',
    name: 'Burguer King',
    owner: 'Ana Souza',
    email: 'contato@burguerking.com',
    phone: '1145678901',
    address: 'Av. dos Hamburgueres, 456',
    logo: '/placeholder.svg',
    subscriptionPlan: 'standard',
    subscriptionStatus: 'active',
    registrationDate: new Date('2024-01-15T14:30:00')
  },
  {
    id: '3',
    name: 'Sushi Express',
    owner: 'Paulo Tanaka',
    email: 'contato@sushiexpress.com',
    phone: '1143219876',
    address: 'Praça Japonesa, 789',
    logo: '/placeholder.svg',
    subscriptionPlan: 'basic',
    subscriptionStatus: 'pending',
    registrationDate: new Date('2024-04-01T09:15:00')
  }
];
