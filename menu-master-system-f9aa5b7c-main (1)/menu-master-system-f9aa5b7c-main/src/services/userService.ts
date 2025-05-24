import { User, UserRole } from '@/types';

// Mock de dados de usuários para simular uma API
const mockUsers: User[] = [
  {
    id: 'user1',
    name: 'Admin Master',
    email: 'admin.master@example.com',
    role: UserRole.ADMIN,
    isActive: true,
    createdAt: new Date('2023-01-15T09:30:00Z'),
    updatedAt: new Date('2023-10-20T14:00:00Z'),
  },
  {
    id: 'user2',
    name: 'Gerente Silva',
    email: 'gerente.silva@example.com',
    role: UserRole.MANAGER,
    restaurantId: 'rest1',
    isActive: true,
    createdAt: new Date('2023-03-22T11:00:00Z'),
    updatedAt: new Date('2023-11-05T10:15:00Z'),
  },
  {
    id: 'user3',
    name: 'Atendente Souza',
    email: 'atendente.souza@example.com',
    role: UserRole.STAFF,
    restaurantId: 'rest1',
    isActive: true,
    createdAt: new Date('2023-05-10T08:45:00Z'),
    updatedAt: new Date('2023-05-10T08:45:00Z'),
  },
  {
    id: 'user4',
    name: 'Cozinheiro Chef',
    email: 'chef.cozinha@example.com',
    role: UserRole.KITCHEN,
    restaurantId: 'rest1',
    isActive: false,
    createdAt: new Date('2023-02-01T16:20:00Z'),
    updatedAt: new Date('2023-09-01T12:00:00Z'),
  },
  {
    id: 'user5',
    name: 'Cliente Fiel',
    email: 'cliente.fiel@example.com',
    role: UserRole.CUSTOMER,
    isActive: true,
    createdAt: new Date('2024-01-10T19:00:00Z'),
    updatedAt: new Date('2024-01-10T19:00:00Z'),
  },
];

/**
 * Simula a busca de todos os usuários.
 * @returns Uma promessa que resolve para uma lista de usuários.
 */
export const fetchUsers = async (): Promise<User[]> => {
  console.log('Buscando usuários (mock)...');
  // Simula um atraso de rede
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...mockUsers]; // Retorna uma cópia para evitar mutações diretas do mock
};

/**
 * Simula a criação de um novo usuário.
 * @param userData Dados do usuário a ser criado.
 * @returns Uma promessa que resolve para o usuário criado.
 */
export const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
  console.log('Criando usuário (mock):', userData);
  await new Promise(resolve => setTimeout(resolve, 300));
  const newUser: User = {
    ...userData,
    id: `user${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockUsers.push(newUser);
  return newUser;
};

/**
 * Simula a atualização de um usuário existente.
 * @param userId ID do usuário a ser atualizado.
 * @param userData Dados para atualizar o usuário.
 * @returns Uma promessa que resolve para o usuário atualizado.
 */
export const updateUser = async (userId: string, userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>): Promise<User | null> => {
  console.log(`Atualizando usuário ${userId} (mock):`, userData);
  await new Promise(resolve => setTimeout(resolve, 300));
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    console.error(`Usuário ${userId} não encontrado para atualização.`);
    return null;
  }
  mockUsers[userIndex] = { ...mockUsers[userIndex], ...userData, updatedAt: new Date() };
  return mockUsers[userIndex];
};

/**
 * Simula a deleção de um usuário.
 * @param userId ID do usuário a ser deletado.
 * @returns Uma promessa que resolve para true se bem-sucedido, false caso contrário.
 */
export const deleteUser = async (userId: string): Promise<boolean> => {
  console.log(`Deletando usuário ${userId} (mock)...`);
  await new Promise(resolve => setTimeout(resolve, 300));
  const userIndex = mockUsers.findIndex(u => u.id === userId);
  if (userIndex === -1) {
    console.error(`Usuário ${userId} não encontrado para deleção.`);
    return false;
  }
  mockUsers.splice(userIndex, 1);
  return true;
};