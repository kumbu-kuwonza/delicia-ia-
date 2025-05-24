
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  prepTime: number; // In minutes
  available: boolean;
  discount?: number; // Optional percentage discount
  featured?: boolean; // Optional flag for featured items
  allergens?: string[]; // Optional array of allergen information
  nutritionalInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export interface CartItem {
  product: Product;
  quantity: number;
  specialInstructions?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  order?: number; // For controlling display order
}

export interface Customer {
  id?: string;
  name: string;
  phone: string;
  address: string;
  points: number;
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: Date;
  loyaltyTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  registrationDate?: Date;
  isActive?: boolean;
  email?: string;
  notificationPreferences?: {
    email: boolean;
    sms: boolean;
    push: boolean;
    whatsapp: boolean;
  };
  favoriteItems?: number[]; // Array of product IDs
  favoriteRestaurants?: string[]; // Array of restaurant IDs
  birthDate?: Date;
}

export interface Order {
  id: string;
  items: CartItem[];
  customer: Customer;
  total: number;
  pointsUsed: number;
  pointsEarned: number;
  status: 'new' | 'preparing' | 'ready' | 'delivered';
  createdAt: Date;
  updatedAt: Date;
  restaurantId?: string; // Which restaurant fulfilled the order
  deliveryMethod?: 'pickup' | 'delivery' | 'dine-in';
  paymentMethod?: 'cash' | 'credit' | 'debit' | 'online' | 'points';
  specialInstructions?: string;
  deliveryAddress?: string;
  deliveryFee?: number;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
}

export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  popularItems: { name: string; count: number }[];
  recentOrders: Order[];
}

export interface Restaurant {
  id?: string;
  name: string;
  owner: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  subscriptionStatus: 'active' | 'pending' | 'cancelled';
  subscriptionPlan: 'basic' | 'standard' | 'premium';
  registrationDate: Date;
  businessHours?: BusinessHours;
  categories?: string[]; // Array of category IDs used by this restaurant
  loyaltyEnabled?: boolean; // Whether this restaurant has enabled loyalty
  customLoyaltyConfig?: LoyaltyConfig; // Restaurant-specific loyalty config
  deliveryOptions?: {
    pickup: boolean;
    delivery: boolean;
    dineIn: boolean;
  };
  deliveryRadius?: number; // in km
  minimumOrderValue?: number;
  notificationSettings?: {
    newOrder: boolean;
    orderStatus: boolean;
    lowInventory: boolean;
  };
}

export interface BusinessHours {
  monday: { open: string, close: string, isOpen: boolean }[];
  tuesday: { open: string, close: string, isOpen: boolean }[];
  wednesday: { open: string, close: string, isOpen: boolean }[];
  thursday: { open: string, close: string, isOpen: boolean }[];
  friday: { open: string, close: string, isOpen: boolean }[];
  saturday: { open: string, close: string, isOpen: boolean }[];
  sunday: { open: string, close: string, isOpen: boolean }[];
}

export interface LoyaltyConfig {
  pointsPerCurrency: number; // How many points per currency unit (e.g., 1 point per R$1)
  minSpendForPoints: number; // Minimum spend to start earning points
  minOrdersForLoyalty: number; // Minimum orders to participate in loyalty program
  tierThresholds: {
    silver: number; // Points needed for silver tier
    gold: number; // Points needed for gold tier
    platinum: number; // Points needed for platinum tier
  };
  tierBenefits: {
    bronze: { pointMultiplier: number; }; // e.g., 1x points earned
    silver: { pointMultiplier: number; }; // e.g., 1.2x points earned
    gold: { pointMultiplier: number; }; // e.g., 1.5x points earned
    platinum: { pointMultiplier: number; }; // e.g., 2x points earned
  };
  // New fields
  redemptionRules?: {
    minPointsForRedemption: number;
    pointsToCurrencyRatio: number; // How many points equal 1 unit of currency
    maxDiscountPercentage?: number;
    restrictedDates?: Date[];
    restrictedCategories?: string[];
  };
  expirationRules?: {
    pointsExpire: boolean;
    expirationMonths: number;
  };
  specialPromotions?: {
    birthdayBonus: number; // extra points on birthday orders
    firstOrderBonus: number; // extra points on first order
    referralBonus: number; // points for referring a friend
  };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'loyalty' | 'promotion' | 'system';
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  action?: {
    type: 'link' | 'button';
    label: string;
    url?: string;
  };
}

export interface NotificationPreferences {
  restaurantId: string;
  loyaltyUpdates: boolean;
  orderStatus: boolean;
  specialOffers: boolean;
  newsletter: boolean;
}

export interface Promotion {
  id: number;
  title: string;
  description: string;
  image: string;
  badgeText: string;
  buttonText: string;
  url: string;
  active?: boolean;  // Adicionado a propriedade active como opcional
}
