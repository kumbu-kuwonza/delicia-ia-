import { registerA2AMethod, A2AMethodHandler } from '@/a2a/core/handler';
import { A2AMessageSendParams, A2AAgentProfile, A2AMessage } from '@/types/integrations';
import { z } from 'zod';

const AGENT_ID_PREFIX = 'analytics-agent';

// Simulação de um local para armazenar dados coletados ou métricas
const analyticsDataStore: Record<string, any> = {};

/**
 * Handler para o método A2A 'message/send' direcionado ao AnalyticsAgent.
 * Usado para coletar dados de outros agentes.
 */
const handleMessageSend: A2AMethodHandler = async (params: A2AMessageSendParams, agentId: string) => {
  console.log(`[AnalyticsAgent:${agentId}] Recebido message/send:`, params.message);
  const message = params.message;
  const sourceAgent = message.parts.find(p => p.type === 'text' && p.text?.startsWith('sourceAgent:'))?.text?.split(':')[1]?.trim();

  // Armazenar os dados recebidos (simulado)
  if (sourceAgent) {
    analyticsDataStore[sourceAgent] = analyticsDataStore[sourceAgent] || [];
    analyticsDataStore[sourceAgent].push(message.parts);
    console.log(`[AnalyticsAgent:${agentId}] Dados coletados do agente ${sourceAgent}.`);
  }

  return { responseFor: message.messageId, reply: 'Dados recebidos pelo AnalyticsAgent.' };
};

/**
 * Handler para o método A2A 'tasks/get' para gerar relatórios ou buscar insights.
 */
const AnalyticsTasksGetParamsSchema = z.object({
  reportType: z.string().optional(), // Ex: 'sales_summary', 'user_activity'
  query: z.string().optional(),      // Para consultas mais específicas
  // Adicionar outros filtros como dateRange, etc.
}).refine(data => data.reportType || data.query, {
  message: "Pelo menos reportType ou query deve ser fornecido.",
});

const handleTasksGet: A2AMethodHandler = async (params: unknown, agentId: string) => {
  try {
    const validatedParams = AnalyticsTasksGetParamsSchema.parse(params);
    console.log(`[AnalyticsAgent:${agentId}] Chamado tasks/get com params:`, validatedParams);

    if (validatedParams.reportType === 'sales_summary') {
      // Lógica para gerar um relatório de resumo de vendas (simulado)
      const summary = { totalSales: 1500, topItems: ['Pizza Margherita', 'Refrigerante'], generatedAt: new Date().toISOString() };
      return {
        taskId: `task-analytics-sales-summary-${Date.now()}`,
        status: 'completed',
        result: summary
      };
    }
    // Lógica para outras consultas ou relatórios baseados em validatedParams.query
    return {
      taskId: `task-analytics-query-${Date.now()}`,
      status: 'completed',
      result: { info: `Consulta genérica processada para query: ${validatedParams.query || 'não especificada'}`, data: analyticsDataStore }
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[AnalyticsAgent:${agentId}] Erro de validação em tasks/get:`, error.errors);
      throw { code: -32602, message: 'Parâmetros inválidos para tasks/get.', data: error.format() };
    }
    console.error(`[AnalyticsAgent:${agentId}] Erro em tasks/get:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        throw error;
    }
    throw { code: -32000, message: 'Erro interno do servidor ao processar tasks/get no AnalyticsAgent.' };
  }
};

/**
 * Handler para o método A2A 'message/stream' para enviar insights ou dados em tempo real.
 * Um cliente (ex: DashboardAgent) chamaria este método para receber um fluxo de dados.
 */
const AnalyticsMessageStreamParamsSchema = z.object({
  streamType: z.enum(['live_metrics', 'alert_events']), // Tipos de stream suportados
  filter: z.any().optional(), // Filtros específicos para o stream (ex: para live_metrics de um item específico)
  // eventId: z.string().optional(), // Se o cliente enviar um ID para ack do início do stream
});

const handleMessageStream: A2AMethodHandler = async (params: unknown, agentId: string) => {
  try {
    const validatedParams = AnalyticsMessageStreamParamsSchema.parse(params);
    console.log(`[AnalyticsAgent:${agentId}] Chamado message/stream com params:`, validatedParams);

    if (validatedParams.streamType === 'live_metrics') {
    // Simula o envio de um snapshot de métricas atuais.
    // Em um cenário real com WebSockets, este handler poderia iniciar um loop
    // para enviar dados periodicamente através da conexão estabelecida.
    // Com a arquitetura atual de handler (retorno único), retornamos um primeiro conjunto de dados.
    const totalMessagesProcessed = Object.values(analyticsDataStore)
      .reduce((sum, messages) => sum + (Array.isArray(messages) ? messages.length : 0), 0);

    const liveMetrics = {
      timestamp: new Date().toISOString(),
      activeUsers_simulated: Math.floor(Math.random() * 100) + 1, // Simulado
      totalMessagesProcessed,
      // Exemplo de como os dados coletados poderiam ser resumidos:
      messagesBySourceAgent: Object.keys(analyticsDataStore).reduce((acc, key) => {
        acc[key] = Array.isArray(analyticsDataStore[key]) ? analyticsDataStore[key].length : 0;
        return acc;
      }, {} as Record<string, number>),
    };

    console.log(`[AnalyticsAgent:${agentId}] Enviando snapshot de live_metrics via stream (simulado).`);
    return {
      streamId: `analytics-stream-${Date.now()}`,
      dataType: 'live_metrics_snapshot',
      payload: liveMetrics,
      message: "Live metrics stream initiated. Este é o primeiro snapshot (simulado)."
    };
  }

    // Placeholder para outros tipos de stream, por exemplo, stream de eventos de alerta
    if (validatedParams.streamType === 'alert_events') {
      // Simular um stream de eventos de alerta
      const simulatedAlert = {
        timestamp: new Date().toISOString(),
        severity: 'warning',
        message: 'Simulated high traffic alert on CardapioAgent.',
        source: 'AnalyticsEngine_simulated',
        filterApplied: validatedParams.filter
      };
      return {
        streamId: `analytics-alert-stream-${Date.now()}`,
        dataType: 'alert_event',
        payload: simulatedAlert,
        message: "Alert events stream initiated. Este é um evento de alerta simulado."
      };
    }

    // Caso o streamType seja válido mas não tratado acima (improvável com Zod enum)
    // Mas mantido para robustez caso o schema mude.
    return {
      status: 'warning',
      message: `Tipo de stream '${validatedParams.streamType}' não implementado.`,
      availableStreamTypes: ['live_metrics', 'alert_events']
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[AnalyticsAgent:${agentId}] Erro de validação em message/stream:`, error.errors);
      // Para message/stream que é um PRODUTOR, um erro de parâmetro inválido deve resultar em erro JSON-RPC
      throw { code: -32602, message: 'Parâmetros inválidos para message/stream.', data: error.format() };
    }
    console.error(`[AnalyticsAgent:${agentId}] Erro em message/stream:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        throw error;
    }
    throw { code: -32000, message: 'Erro interno do servidor ao processar message/stream no AnalyticsAgent.' };
  }
};

/**
 * Handler para o método A2A 'agent/authenticatedExtendedCard'.
 * Retorna o perfil e capacidades do AnalyticsAgent.
 */
const handleAuthenticatedExtendedCard: A2AMethodHandler = async (params: any, agentId: string) => {
  console.log(`[AnalyticsAgent:${agentId}] Chamado agent/authenticatedExtendedCard com params:`, params);
  const profile: A2AAgentProfile = {
    agentId: `${AGENT_ID_PREFIX}-${agentId}`,
    name: 'AnalyticsAgent - Processador de Dados e Insights',
    description: 'Coleta dados de outros agentes, processa-os e gera insights e relatórios.',
    capabilities: [
      { method: 'analytics/message/send', description: 'Para receber dados de outros agentes.' },
      { method: 'analytics/tasks/get', description: 'Para solicitar relatórios ou buscar insights específicos.' },
      { method: 'analytics/message/stream', description: 'Para enviar insights em tempo real para outros agentes ou sistemas.' },
      { method: 'agent/authenticatedExtendedCard', description: 'Retorna o perfil e capacidades deste agente.' },
    ],
  };
  return profile;
};

export const AnalyticsAgent = {
  initialize: () => {
    registerA2AMethod('analytics/message/send', handleMessageSend); // TODO: Adicionar validação Zod para handleMessageSend
    registerA2AMethod('analytics/tasks/get', handleTasksGet);
    registerA2AMethod('analytics/message/stream', handleMessageStream);
    registerA2AMethod('agent/authenticatedExtendedCard', handleAuthenticatedExtendedCard); // Sem prefixo
    console.log('[AnalyticsAgent] Métodos A2A registrados com prefixo "analytics/".');
  }
};

console.log('[AnalyticsAgent] Módulo carregado.');