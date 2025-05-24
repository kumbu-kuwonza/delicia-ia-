import { CardapioAgent } from './cardapioAgent'; // Ajuste o caminho se necessário
import { A2AMethodHandler, clearA2AMethods } from '@/a2a/core/handler';
import { A2AAgentProfile, A2AMessageSendParams, A2AMessage } from '@/types/integrations'; 
import { z } from 'zod'; 

// Mock para o core handler
const mockRegisteredMethods: Record<string, A2AMethodHandler> = {};
jest.mock('@/a2a/core/handler', () => ({
  ...jest.requireActual('@/a2a/core/handler'), // Mantém implementações reais como isValidApiKey
  registerA2AMethod: jest.fn((methodName: string, handler: A2AMethodHandler) => {
    mockRegisteredMethods[methodName] = handler;
  }),
  clearA2AMethods: jest.fn(() => {
    for (const key in mockRegisteredMethods) {
      delete mockRegisteredMethods[key];
    }
  }),
}));

// Mock para a2aClient (se o CardapioAgent começar a usá-lo para enviar mensagens)
// jest.mock('@/a2a/core/a2aClient', () => ({
//   a2aClient: {
//     sendStream: jest.fn().mockResolvedValue({ success: true }),
//     // Mock outros métodos do cliente se necessário
//   },
// }));

const TEST_AGENT_INSTANCE_ID = 'cardapio-test-1';
const TEST_API_KEY = 'sk-super-secret-key-admin'; // Chave válida para handlers que a usam

// Função auxiliar para simular o banco de dados interno, se necessário para resetar estado
// Esta é uma abordagem. Outra seria exportar o menuDatabase do agente e modificá-lo diretamente
// ou adicionar um método de reset no próprio agente para testes.
let internalMenuDatabaseCopy: Record<string, any>;
const getInitialMenuDatabaseState = () => ({
    'menu-123': {
      id: 'menu-123',
      name: 'Cardápio Principal',
      items: [
        { id: 'item-1', name: 'Pizza Margherita', price: 25.00, available: true, stockStatus: 'available', activePromotionId: null },
        { id: 'item-2', name: 'Refrigerante', price: 5.00, available: true, stockStatus: 'available', activePromotionId: null },
        { id: 'item-3', name: 'Sobremesa Especial', price: 15.00, available: false, stockStatus: 'unavailable', activePromotionId: null },
      ],
      activeGeneralPromotions: {}
    },
  });

describe('CardapioAgent', () => {
  beforeEach(() => {
    // Limpa os métodos registrados e reinicializa o agente para cada teste
    // Assegura que os handlers corretos do CardapioAgent sejam registrados novamente.
    clearA2AMethods(); 
    CardapioAgent.initialize(); 
    
    // Reseta o estado do banco de dados mockado se necessário
    // (Isso é uma simplificação. Em um agente real, você pode precisar de uma maneira de injetar ou mockar o estado do DB)
    // Por enquanto, vamos confiar que o estado inicial no cardapioAgent.ts é suficiente para a maioria dos testes
    // ou que os testes não modificam o estado de forma que interfiram uns com os outros.
    // Para testes que modificam o estado, considere mockar/resetar menuDatabase explicitamente.
    internalMenuDatabaseCopy = getInitialMenuDatabaseState();
    // Aqui, idealmente, você informaria ao CardapioAgent para usar esta cópia,
    // ou mockaria o acesso ao menuDatabase dentro dos handlers.
    // Como isso não é simples sem refatorar o agente, os testes assumirão o estado interno do agente.
  });

  describe('agent/authenticatedExtendedCard', () => {
    it('should return the correct agent profile', async () => {
      const handler = mockRegisteredMethods['agent/authenticatedExtendedCard'];
      expect(handler).toBeDefined();
      const profile = await handler({}, TEST_AGENT_INSTANCE_ID, TEST_API_KEY) as A2AAgentProfile; // apiKey pode ser irrelevante aqui
      expect(profile.name).toBe('CardapioAgent - Gerenciador de Cardápios Digitais');
      expect(profile.capabilities).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ method: 'cardapio/getMenuDetails' }),
          expect.objectContaining({ method: 'cardapio/message/send' }),
          expect.objectContaining({ method: 'cardapio/message/stream' }),
          expect.objectContaining({ method: 'cardapio/tasks/get' }),
          expect.objectContaining({ method: 'agent/authenticatedExtendedCard' })
        ])
      );
    });
  });

  describe('cardapio/getMenuDetails', () => {
    let handler: A2AMethodHandler;
    beforeEach(() => {
      handler = mockRegisteredMethods['cardapio/getMenuDetails'];
      expect(handler).toBeDefined();
    });

    it('should return default menu when no menuId is provided', async () => {
      const result = await handler({}, TEST_AGENT_INSTANCE_ID, TEST_API_KEY);
      expect(result.id).toBe('menu-123'); 
      expect(result.items).toBeDefined();
    });

    it('should return specific menu when menuId is provided', async () => {
      const result = await handler({ menuId: 'menu-123' }, TEST_AGENT_INSTANCE_ID, TEST_API_KEY);
      expect(result.id).toBe('menu-123');
    });

    it('should throw error if menuId does not exist', async () => {
      try {
        await handler({ menuId: 'non-existent-menu' }, TEST_AGENT_INSTANCE_ID, TEST_API_KEY);
      } catch (e: any) {
        expect(e.code).toBe(1001); 
        expect(e.message).toContain("Cardápio com ID 'non-existent-menu' não encontrado.");
        return;
      }
      fail('Deveria ter lançado um erro');
    });

    it('should throw validation error for invalid params type (menuId not a string)', async () => {
        try {
          await handler({ menuId: 123 }, TEST_AGENT_INSTANCE_ID, TEST_API_KEY); 
        } catch (e: any) {
          expect(e.code).toBe(-32602); 
          expect(e.message).toBe('Parâmetros inválidos.');
          expect(e.data).toBeDefined();
          expect(e.data._errors).toEqual(expect.arrayContaining([])); // Zod error formatting
          return;
        }
        fail('Deveria ter lançado um erro de validação Zod');
      });
  });

  describe('cardapio/message/stream', () => {
    let handler: A2AMethodHandler;
    let getMenuDetailsHandler: A2AMethodHandler;

    beforeEach(() => {
      handler = mockRegisteredMethods['cardapio/message/stream'];
      getMenuDetailsHandler = mockRegisteredMethods['cardapio/getMenuDetails'];
      expect(handler).toBeDefined();
      expect(getMenuDetailsHandler).toBeDefined();
      // Reset menuDatabase for message/stream tests that modify it
      // This is a simplified way to do it. In a real scenario, you might mock the database module.
      // For now, we re-initialize the agent, which should reset its internal state if it's self-contained.
      clearA2AMethods();
      CardapioAgent.initialize();
      handler = mockRegisteredMethods['cardapio/message/stream']; // Re-assign after re-initialization
      getMenuDetailsHandler = mockRegisteredMethods['cardapio/getMenuDetails'];
    });

    it('should update stock status for an item and return ack', async () => {
      const params = { type: 'stock_update', itemId: 'item-1', newStockStatus: 'unavailable', available: false, eventId: 'evt-123' };
      const response = await handler(params, TEST_AGENT_INSTANCE_ID, TEST_API_KEY);
      expect(response).toEqual({ status: 'received', processed: true, eventAck: 'evt-123' });

      const menu = await getMenuDetailsHandler({ menuId: 'menu-123' }, TEST_AGENT_INSTANCE_ID, TEST_API_KEY);
      const updatedItem = menu.items.find((item:any) => item.id === 'item-1');
      expect(updatedItem.stockStatus).toBe('unavailable');
      expect(updatedItem.available).toBe(false);
    });
    
    it('should update promotion for an item and return ack', async () => {
        const params = { type: 'promotion_update', promoId: 'new-promo-123', active: true, itemId: 'item-1', promotionDetails: { name: 'Super Sale' }, eventId: 'evt-456' };
        const response = await handler(params, TEST_AGENT_INSTANCE_ID, TEST_API_KEY);
        expect(response).toEqual({ status: 'received', processed: true, eventAck: 'evt-456' });
        
        const menu = await getMenuDetailsHandler({ menuId: 'menu-123' }, TEST_AGENT_INSTANCE_ID, TEST_API_KEY);
        const updatedItem = menu.items.find((item:any) => item.id === 'item-1');
        expect(updatedItem.activePromotionId).toBe('new-promo-123');
    });

    it('should update a general promotion and return ack', async () => {
        const params = { type: 'promotion_update', promoId: 'general-promo-789', active: true, promotionDetails: { name: 'Holiday Special' }, eventId: 'evt-789' };
        const response = await handler(params, TEST_AGENT_INSTANCE_ID, TEST_API_KEY);
        expect(response).toEqual({ status: 'received', processed: true, eventAck: 'evt-789' });

        const menu = await getMenuDetailsHandler({ menuId: 'menu-123' }, TEST_AGENT_INSTANCE_ID, TEST_API_KEY);
        expect(menu.activeGeneralPromotions['general-promo-789']).toEqual({ name: 'Holiday Special' });
    });
    
    it('should return NACK for item not found in stock_update', async () => {
        const params = { type: 'stock_update', itemId: 'item-nonexistent', newStockStatus: 'available', available: true, eventId: 'evt-err-1' };
        const response = await handler(params, TEST_AGENT_INSTANCE_ID, TEST_API_KEY);
        expect(response).toEqual({ status: 'received', processed: false, error: 'Item item-nonexistent não encontrado', eventAck: 'evt-err-1' });
    });

    it('should return NACK for item not found in promotion_update', async () => {
        const params = { type: 'promotion_update', promoId: 'promo-for-nothing', active: true, itemId: 'item-nonexistent', eventId: 'evt-err-2' };
        const response = await handler(params, TEST_AGENT_INSTANCE_ID, TEST_API_KEY);
        expect(response).toEqual({ status: 'received', processed: false, error: 'Item item-nonexistent não encontrado para promoção', eventAck: 'evt-err-2' });
    });

    it('should return NACK for unrecognized stream type', async () => {
        const params = { type: 'unknown_type', eventId: 'evt-err-3' };
        const response = await handler(params, TEST_AGENT_INSTANCE_ID, TEST_API_KEY);
        expect(response).toEqual({ status: 'received', processed: false, error: 'Tipo de stream não reconhecido ou dados insuficientes.', eventAck: 'evt-err-3' });
    });
  });
  
  describe('cardapio/message/send', () => {
    let handler: A2AMethodHandler;
    beforeEach(() => {
      handler = mockRegisteredMethods['cardapio/message/send'];
      expect(handler).toBeDefined();
    });

    it('should return menu if message asks for it', async () => {
      const message: A2AMessage = {
        messageId: 'msg-1',
        role: 'user',
        parts: [{ type: 'text', text: 'qual o cardapio principal?' }],
      };
      const params: A2AMessageSendParams = { message };
      const response = await handler(params, TEST_AGENT_INSTANCE_ID, TEST_API_KEY);
      
      expect(response.responseFor).toBe('msg-1');
      expect(response.menu).toBeDefined();
      expect(response.menu.id).toBe('menu-123');
    });

    it('should return a generic reply if message is not understood', async () => {
      const message: A2AMessage = {
        messageId: 'msg-2',
        role: 'user',
        parts: [{ type: 'text', text: 'Olá, como vai?' }],
      };
      const params: A2AMessageSendParams = { message };
      const response = await handler(params, TEST_AGENT_INSTANCE_ID, TEST_API_KEY);

      expect(response.responseFor).toBe('msg-2');
      expect(response.reply).toContain('Mensagem recebida pelo CardapioAgent, mas não entendi');
    });
  });
  
  describe('cardapio/tasks/get', () => {
    let handler: A2AMethodHandler;
    beforeEach(() => {
      handler = mockRegisteredMethods['cardapio/tasks/get'];
      expect(handler).toBeDefined();
    });

    it('should return item status if itemId is provided and exists', async () => {
      const params = { itemId: 'item-1', taskId: 'task-1' };
      const response = await handler(params, TEST_AGENT_INSTANCE_ID, TEST_API_KEY);
      
      expect(response.taskId).toBe('task-1');
      expect(response.status).toBe('completed');
      expect(response.result).toEqual({
        itemId: 'item-1',
        name: 'Pizza Margherita', // Verifique os dados do mockDatabase
        available: true,
        stockStatus: 'available',
      });
    });

    it('should throw error if itemId is provided but does not exist', async () => {
      const params = { itemId: 'item-nonexistent' };
      try {
        await handler(params, TEST_AGENT_INSTANCE_ID, TEST_API_KEY);
      } catch (e: any) {
        expect(e.code).toBe(1002);
        expect(e.message).toContain("Item com ID 'item-nonexistent' não encontrado para consulta de task.");
        return;
      }
      fail('Deveria ter lançado um erro');
    });
    
    it('should throw error if itemId is not provided', async () => {
      const params = {}; // Sem itemId
      try {
        await handler(params, TEST_AGENT_INSTANCE_ID, TEST_API_KEY);
      } catch (e: any) {
        expect(e.code).toBe(1003); // Ou -32602 se a validação Zod for adicionada aqui também
        expect(e.message).toContain('Parâmetro itemId é obrigatório para tasks/get no CardapioAgent.');
        return;
      }
      fail('Deveria ter lançado um erro');
    });
  });
});
