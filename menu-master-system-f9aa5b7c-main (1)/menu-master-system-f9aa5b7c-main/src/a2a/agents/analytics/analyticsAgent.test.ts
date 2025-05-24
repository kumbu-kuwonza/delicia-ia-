import { AnalyticsAgent } from './analyticsAgent';
import { A2AMethodHandler, registerA2AMethod, clearA2AMethods } from '@/a2a/core/handler';
import { A2AAgentProfile } from '@/types/integrations';

// Mock para registerA2AMethod e clearA2AMethods para isolar os testes
const mockRegisteredMethods: Record<string, A2AMethodHandler> = {};

jest.mock('@/a2a/core/handler', () => ({
  ...jest.requireActual('@/a2a/core/handler'), // Importa e mantém as implementações originais que não estão sendo mockadas
  registerA2AMethod: jest.fn((methodName: string, handler: A2AMethodHandler) => {
    mockRegisteredMethods[methodName] = handler;
  }),
  clearA2AMethods: jest.fn(() => {
    for (const key in mockRegisteredMethods) {
      delete mockRegisteredMethods[key];
    }
  }),
  // Se getA2AMethodHandler for usado diretamente nos testes (improvável para este agente), mockar também.
}));

const AGENT_ID_PREFIX = 'analytics-agent';
const TEST_AGENT_INSTANCE_ID = 'test-instance-123';

describe('AnalyticsAgent', () => {
  beforeEach(() => {
    // Limpa os métodos registrados antes de cada teste e reinicializa o agente
    // para garantir que os handlers corretos sejam registrados para cada teste.
    clearA2AMethods();
    AnalyticsAgent.initialize(); // Isso chamará nosso mock de registerA2AMethod
  });

  describe('handleAuthenticatedExtendedCard', () => {
    it('should return the correct agent profile and capabilities', async () => {
      const handler = mockRegisteredMethods['agent/authenticatedExtendedCard'];
      expect(handler).toBeDefined();

      const expectedProfile: A2AAgentProfile = {
        agentId: `${AGENT_ID_PREFIX}-${TEST_AGENT_INSTANCE_ID}`,
        name: 'AnalyticsAgent - Processador de Dados e Insights',
        description: 'Coleta dados de outros agentes, processa-os e gera insights e relatórios.',
        capabilities: [
          { method: 'message/send', description: 'Para receber dados de outros agentes.' },
          { method: 'tasks/get', description: 'Para solicitar relatórios ou buscar insights específicos.' },
          { method: 'message/stream', description: 'Para enviar insights em tempo real para outros agentes ou sistemas.' },
          { method: 'agent/authenticatedExtendedCard', description: 'Retorna o perfil e capacidades deste agente.' },
        ],
      };

      const profile = await handler({}, TEST_AGENT_INSTANCE_ID) as A2AAgentProfile;

      expect(profile.agentId).toBe(expectedProfile.agentId);
      expect(profile.name).toBe(expectedProfile.name);
      expect(profile.description).toBe(expectedProfile.description);
      expect(profile.capabilities).toEqual(expect.arrayContaining(expectedProfile.capabilities));
      expect(profile.capabilities.length).toBe(expectedProfile.capabilities.length);
    });
  });

  describe('handleMessageSend', () => {
    const handler = mockRegisteredMethods['message/send'];

    it('should be defined', () => {
      expect(handler).toBeDefined();
    });

    it('should process and store message with sourceAgent', async () => {
      const messageParams = {
        message: {
          messageId: 'msg-123',
          role: 'user' as const,
          parts: [
            { type: 'text' as const, text: 'sourceAgent: CardapioAgent' },
            { type: 'text' as const, text: 'data: some event data' },
          ],
        },
      };

      // Reset analyticsDataStore (ou mock its access if it's not directly accessible)
      // For this test, we assume analyticsDataStore is an internal detail and we check its side-effects via console logs or return values if applicable.
      // Since handleMessageSend in the actual code logs and modifies analyticsDataStore, we'll check the response.
      // To properly test analyticsDataStore, it would need to be exported or injectable.

      const consoleSpy = jest.spyOn(console, 'log');
      const response = await handler(messageParams, TEST_AGENT_INSTANCE_ID);

      expect(response).toEqual({
        responseFor: 'msg-123',
        reply: 'Dados recebidos pelo AnalyticsAgent.',
      });
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[AnalyticsAgent:test-instance-123] Recebido message/send:'), messageParams.message);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[AnalyticsAgent:test-instance-123] Dados coletados do agente CardapioAgent.'));
      consoleSpy.mockRestore();
    });

    it('should process message without a specific sourceAgent in parts', async () => {
      const messageParams = {
        message: {
          messageId: 'msg-456',
          role: 'user' as const,
          parts: [{ type: 'text' as const, text: 'general data' }],
        },
      };
      const consoleSpy = jest.spyOn(console, 'log');
      const response = await handler(messageParams, TEST_AGENT_INSTANCE_ID);

      expect(response).toEqual({
        responseFor: 'msg-456',
        reply: 'Dados recebidos pelo AnalyticsAgent.',
      });
      // Ensure it doesn't log 'Dados coletados' if no sourceAgent is parsed
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Dados coletados do agente'));
      consoleSpy.mockRestore();
    });
  });

  describe('handleTasksGet', () => {
    const handler = mockRegisteredMethods['tasks/get'];

    it('should be defined', () => {
      expect(handler).toBeDefined();
    });

    it('should return sales summary for reportType sales_summary', async () => {
      const params = { reportType: 'sales_summary' };
      const consoleSpy = jest.spyOn(console, 'log');
      const response = await handler(params, TEST_AGENT_INSTANCE_ID) as any;

      expect(consoleSpy).toHaveBeenCalledWith(`[AnalyticsAgent:${TEST_AGENT_INSTANCE_ID}] Chamado tasks/get com params:`, params);
      expect(response.taskId).toMatch(/^task-analytics-sales-summary-\d+$/);
      expect(response.status).toBe('completed');
      expect(response.result).toEqual({ totalSales: 1500, topItems: ['Pizza Margherita', 'Refrigerante'] });
      consoleSpy.mockRestore();
    });

    it('should return generic query result for other queries', async () => {
      const params = { query: 'some_custom_query' };
      // Clear or mock analyticsDataStore if needed for a predictable state
      // For this test, we'll assume it's in its initial empty state or as modified by previous tests if not reset.
      // To ensure isolation, analyticsDataStore should ideally be reset in a beforeEach or mocked.
      // However, the current implementation of AnalyticsAgent doesn't export analyticsDataStore directly.
      const consoleSpy = jest.spyOn(console, 'log');
      const response = await handler(params, TEST_AGENT_INSTANCE_ID) as any;

      expect(consoleSpy).toHaveBeenCalledWith(`[AnalyticsAgent:${TEST_AGENT_INSTANCE_ID}] Chamado tasks/get com params:`, params);
      expect(response.taskId).toMatch(/^task-analytics-query-\d+$/);
      expect(response.status).toBe('completed');
      expect(response.result.info).toBe('Consulta genérica processada.');
      // Check if data field exists, its content might vary based on previous message/send calls
      expect(response.result.data).toBeDefined(); 
      consoleSpy.mockRestore();
    });

    it('should return generic query result when no params are provided', async () => {
        const params = {};
        const consoleSpy = jest.spyOn(console, 'log');
        const response = await handler(params, TEST_AGENT_INSTANCE_ID) as any;
  
        expect(consoleSpy).toHaveBeenCalledWith(`[AnalyticsAgent:${TEST_AGENT_INSTANCE_ID}] Chamado tasks/get com params:`, params);
        expect(response.taskId).toMatch(/^task-analytics-query-\d+$/);
        expect(response.status).toBe('completed');
        expect(response.result.info).toBe('Consulta genérica processada.');
        expect(response.result.data).toBeDefined();
        consoleSpy.mockRestore();
      });
  });

  describe('handleMessageStream', () => {
    const handler = mockRegisteredMethods['message/stream'];

    it('should be defined', () => {
      expect(handler).toBeDefined();
    });

    it('should return live metrics snapshot for streamType live_metrics', async () => {
      const params = { streamType: 'live_metrics' };
      const consoleSpy = jest.spyOn(console, 'log');
      const response = await handler(params, TEST_AGENT_INSTANCE_ID) as any;

      expect(consoleSpy).toHaveBeenCalledWith(`[AnalyticsAgent:${TEST_AGENT_INSTANCE_ID}] Chamado message/stream com params:`, params);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Enviando snapshot de live_metrics via stream (simulado)'));
      expect(response.streamId).toMatch(/^analytics-stream-\d+$/);
      expect(response.dataType).toBe('live_metrics_snapshot');
      expect(response.payload).toBeDefined();
      expect(response.payload.timestamp).toBeDefined();
      expect(response.payload.activeUsers_simulated).toBeGreaterThanOrEqual(1);
      expect(response.payload.totalMessagesProcessed).toBeDefined();
      expect(response.payload.messagesBySourceAgent).toBeDefined();
      expect(response.message).toContain('Live metrics stream initiated');
      consoleSpy.mockRestore();
    });

    it('should return alert event for streamType alert_events', async () => {
      const params = { streamType: 'alert_events' };
      const consoleSpy = jest.spyOn(console, 'log');
      const response = await handler(params, TEST_AGENT_INSTANCE_ID) as any;

      expect(consoleSpy).toHaveBeenCalledWith(`[AnalyticsAgent:${TEST_AGENT_INSTANCE_ID}] Chamado message/stream com params:`, params);
      expect(response.streamId).toMatch(/^analytics-alert-stream-\d+$/);
      expect(response.dataType).toBe('alert_event');
      expect(response.payload).toBeDefined();
      expect(response.payload.timestamp).toBeDefined();
      expect(response.payload.severity).toBe('warning');
      expect(response.payload.message).toContain('Simulated high traffic alert');
      expect(response.message).toContain('Alert events stream initiated');
      consoleSpy.mockRestore();
    });

    it('should return warning for unsupported streamType', async () => {
      const params = { streamType: 'unknown_stream' };
      const consoleSpy = jest.spyOn(console, 'log');
      const response = await handler(params, TEST_AGENT_INSTANCE_ID) as any;

      expect(consoleSpy).toHaveBeenCalledWith(`[AnalyticsAgent:${TEST_AGENT_INSTANCE_ID}] Chamado message/stream com params:`, params);
      expect(response.status).toBe('warning');
      expect(response.message).toBe('Tipo de stream não suportado ou não especificado.');
      expect(response.availableStreamTypes).toEqual(['live_metrics', 'alert_events']);
      consoleSpy.mockRestore();
    });

    it('should return warning if no streamType is provided', async () => {
        const params = {};
        const consoleSpy = jest.spyOn(console, 'log');
        const response = await handler(params, TEST_AGENT_INSTANCE_ID) as any;
  
        expect(consoleSpy).toHaveBeenCalledWith(`[AnalyticsAgent:${TEST_AGENT_INSTANCE_ID}] Chamado message/stream com params:`, params);
        expect(response.status).toBe('warning');
        expect(response.message).toBe('Tipo de stream não suportado ou não especificado.');
        expect(response.availableStreamTypes).toEqual(['live_metrics', 'alert_events']);
        consoleSpy.mockRestore();
      });
  });
});