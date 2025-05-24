import { OperatingHoursInput, DeliveryArea, Restaurant } from '@/types';

// Simula um delay da API
const MOCK_API_DELAY = 500;

// Mock para configurações do restaurante (incluindo horários de funcionamento)
let mockRestaurantSettings: Partial<Restaurant> & { operatingHours?: OperatingHoursInput } = {
  id: 'rest1',
  name: 'Restaurante Exemplo',
  operatingHours: {
    monday: [{ open: '09:00', close: '18:00', isOpen: true }],
    tuesday: [{ open: '09:00', close: '18:00', isOpen: true }],
    wednesday: [{ open: '09:00', close: '18:00', isOpen: true }],
    thursday: [{ open: '09:00', close: '18:00', isOpen: true }],
    friday: [{ open: '09:00', close: '22:00', isOpen: true }],
    saturday: [{ open: '10:00', close: '23:00', isOpen: true }],
    sunday: [{ isOpen: false, open: '', close: '' }],
  }
};

// Mock para áreas de entrega
let mockDeliveryAreas: DeliveryArea[] = [
  {
    id: 'area1',
    name: 'Centro',
    postalCodes: ['12345-000', '12345-010'],
    deliveryFee: 5.00,
    minOrderValue: 20.00,
    isActive: true,
  },
  {
    id: 'area2',
    name: 'Bairro Norte',
    postalCodes: ['54321-000'],
    deliveryFee: 7.50,
    minOrderValue: 25.00,
    isActive: true,
  },
  {
    id: 'area3',
    name: 'Zona Sul (Inativa)',
    postalCodes: ['98765-000', '98765-010'],
    deliveryFee: 10.00,
    isActive: false,
  },
];

export const getRestaurantSettings = async (): Promise<Partial<Restaurant> & { operatingHours?: OperatingHoursInput }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('[RestaurantService Mock] getRestaurantSettings called');
      resolve(JSON.parse(JSON.stringify(mockRestaurantSettings))); // Retorna uma cópia para evitar mutação direta
    }, MOCK_API_DELAY);
  });
};

export const updateRestaurantSettings = async (settings: { operatingHours?: OperatingHoursInput }): Promise<Partial<Restaurant> & { operatingHours?: OperatingHoursInput }> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!settings) {
        reject(new Error('Nenhuma configuração fornecida.'));
        return;
      }
      console.log('[RestaurantService Mock] updateRestaurantSettings called with:', settings);
      mockRestaurantSettings = {
        ...mockRestaurantSettings,
        ...settings,
      };
      resolve(JSON.parse(JSON.stringify(mockRestaurantSettings)));
    }, MOCK_API_DELAY);
  });
};

export const getDeliveryAreas = async (): Promise<DeliveryArea[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('[RestaurantService Mock] getDeliveryAreas called');
      resolve(JSON.parse(JSON.stringify(mockDeliveryAreas))); // Retorna uma cópia
    }, MOCK_API_DELAY);
  });
};

export const saveDeliveryArea = async (areaData: DeliveryArea): Promise<DeliveryArea> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!areaData || !areaData.name) {
        reject(new Error('Dados da área inválidos.'));
        return;
      }
      console.log('[RestaurantService Mock] saveDeliveryArea called with:', areaData);
      const existingAreaIndex = mockDeliveryAreas.findIndex(a => a.id === areaData.id);
      if (existingAreaIndex > -1) {
        mockDeliveryAreas[existingAreaIndex] = { ...areaData };
        resolve(JSON.parse(JSON.stringify(mockDeliveryAreas[existingAreaIndex])));
      } else {
        const newArea = { ...areaData, id: areaData.id || `area_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` };
        mockDeliveryAreas.push(newArea);
        resolve(JSON.parse(JSON.stringify(newArea)));
      }
    }, MOCK_API_DELAY);
  });
};

export const deleteDeliveryArea = async (areaId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('[RestaurantService Mock] deleteDeliveryArea called for ID:', areaId);
      const initialLength = mockDeliveryAreas.length;
      mockDeliveryAreas = mockDeliveryAreas.filter(a => a.id !== areaId);
      if (mockDeliveryAreas.length < initialLength) {
        resolve();
      } else {
        reject(new Error(`Área com ID ${areaId} não encontrada.`));
      }
    }, MOCK_API_DELAY);
  });
};