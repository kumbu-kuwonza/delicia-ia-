import { registerA2AMethod, A2AMethodHandler } from '@/a2a/core/handler';
import { A2AMessageSendParams, A2AAgentProfile, A2AMessage } from '@/types/integrations';

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
const handleTasksGet: A2AMethodHandler = async (params: { reportType?: string; query?: string }, agentId: string) => {
  console.log(`[AnalyticsAgent:${agentId}] Chamado tasks/get com params:`, params);
  if (params.reportType === 'sales_summary') {
    // Lógica para gerar um relatório de resumo de vendas (simulado)
    const summary = { totalSales: 1500, topItems: ['Pizza Margherita', 'Refrigerante'] };
    return {
      taskId: `task-analytics-sales-summary-${Date.now()}`,
      status: 'completed',
      result: summary
    };
  }
  // Lógica para outras consultas ou relatórios
  return {
    taskId: `task-analytics-query-${Date.now()}`,
    status: 'completed',
    result: { info: 'Consulta genérica processada.', data: analyticsDataStore }
  };
};

/**
 * Handler para o método A2A 'message/stream' para enviar insights ou dados em tempo real.
 * Um cliente (ex: DashboardAgent) chamaria este método para receber um fluxo de dados.
 */
const handleMessageStream: A2AMethodHandler = async (params: { streamType?: string; filter?: any }, agentId: string) => {
  console.log(`[AnalyticsAgent:${agentId}] Chamado message/stream com params:`, params);

  if (params.streamType === 'live_metrics') {
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
  if (params.streamType === 'alert_events') {
    // Simular um stream de eventos de alerta
    const simulatedAlert = {
      timestamp: new Date().toISOString(),
      severity: 'warning',
      message: 'Simulated high traffic alert on CardapioAgent.',
      source: 'AnalyticsEngine_simulated'
    };
    return {
      streamId: `analytics-alert-stream-${Date.now()}`,
      dataType: 'alert_event',
      payload: simulatedAlert,
      message: "Alert events stream initiated. Este é um evento de alerta simulado."
    };
  }

  return {
    status: 'warning',
    message: 'Tipo de stream não suportado ou não especificado.',
    availableStreamTypes: ['live_metrics', 'alert_events']
  };
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
      { method: 'message/send', description: 'Para receber dados de outros agentes.' },
      { method: 'tasks/get', description: 'Para solicitar relatórios ou buscar insights específicos.' },
      { method: 'message/stream', description: 'Para enviar insights em tempo real para outros agentes ou sistemas.' },
      { method: 'agent/authenticatedExtendedCard', description: 'Retorna o perfil e capacidades deste agente.' },
    ],
  };
  return profile;
};

export const AnalyticsAgent = {
  initialize: () => {
    registerA2AMethod('message/send', handleMessageSend);
    registerA2AMethod('tasks/get', handleTasksGet);
    registerA2AMethod('message/stream', handleMessageStream);
    registerA2AMethod('agent/authenticatedExtendedCard', handleAuthenticatedExtendedCard);
    console.log('[AnalyticsAgent] Métodos A2A registrados.');
  }
};

console.log('[AnalyticsAgent] Módulo carregado.');