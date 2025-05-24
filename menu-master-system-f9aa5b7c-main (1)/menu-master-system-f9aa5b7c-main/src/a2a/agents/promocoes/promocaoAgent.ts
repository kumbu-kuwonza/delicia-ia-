import { registerA2AMethod, A2AMethodHandler } from '@/a2a/core/handler';
import { A2AMessageSendParams, A2AAgentProfile, A2AMessage } from '@/types/integrations';

const AGENT_ID_PREFIX = 'promocao-agent';

// Simulação de um banco de dados ou cache para promoções
const promotionsDatabase: Record<string, any> = {
  'promo-1': { id: 'promo-1', name: 'Desconto de Segunda', description: '10% de desconto em pizzas às segundas.', isActive: true, targetAudience: 'all' },
  'promo-2': { id: 'promo-2', name: 'Combo Casal', description: 'Pizza Grande + 2 Refrigerantes por R$50.', isActive: false, targetAudience: 'couples' },
};

/**
 * Handler para o método A2A 'message/send' direcionado ao PromocaoAgent.
 * Pode ser usado para ativar/desativar promoções ou consultar promoções ativas.
 */
const handleMessageSend: A2AMethodHandler = async (params: A2AMessageSendParams, agentId: string) => {
  console.log(`[PromocaoAgent:${agentId}] Recebido message/send:`, params.message);
  const messageText = params.message.parts.find(p => p.type === 'text')?.text?.toLowerCase();

  if (messageText?.includes('ativar promo-2')) {
    promotionsDatabase['promo-2'].isActive = true;
    // Simular notificação para CardapioAgent
    console.log(`[PromocaoAgent:${agentId}] Promoção 'promo-2' ativada. Notificando CardapioAgent (simulado).`);
    // Em um cenário real: await a2aClient.sendMessage('cardapio-agent-id', 'message/send', { message: { role: 'system', parts: [{type: 'text', text: 'Promoção promo-2 ativada'}], messageId: 'uuid' } });
    return { responseFor: params.message.messageId, status: 'Promoção promo-2 ativada.' };
  }

  if (messageText?.includes('quais promoções ativas')) {
    const activePromos = Object.values(promotionsDatabase).filter(p => p.isActive);
    return { responseFor: params.message.messageId, activePromotions: activePromos };
  }

  return { responseFor: params.message.messageId, reply: 'Mensagem recebida pelo PromocaoAgent.' };
};

/**
 * Handler para o método A2A 'tasks/subscribe' (simulado).
 * O PromocaoAgent poderia se inscrever em eventos do AnalyticsAgent para analisar padrões de vendas.
 */
const handleTasksSubscribe: A2AMethodHandler = async (params: { eventName?: string }, agentId: string) => {
  console.log(`[PromocaoAgent:${agentId}] Chamado tasks/subscribe com params:`, params);
  if (params.eventName === 'lowSalesAlert') {
    // Lógica para se inscrever no evento
    console.log(`[PromocaoAgent:${agentId}] Inscrito para receber alertas de baixa venda do AnalyticsAgent (simulado).`);
    return { subscriptionId: `sub-${Date.now()}`, status: 'subscribed', event: params.eventName };
  }
  throw { code: 3001, message: 'Nome do evento para subscrição inválido ou não suportado.' };
};

/**
 * Handler para o método A2A 'agent/authenticatedExtendedCard'.
 * Retorna o perfil e capacidades do PromocaoAgent.
 */
const handleAuthenticatedExtendedCard: A2AMethodHandler = async (params: any, agentId: string) => {
  console.log(`[PromocaoAgent:${agentId}] Chamado agent/authenticatedExtendedCard com params:`, params);
  const profile: A2AAgentProfile = {
    agentId: `${AGENT_ID_PREFIX}-${agentId}`,
    name: 'PromocaoAgent - Gerenciador de Promoções Dinâmicas',
    description: 'Analisa padrões de vendas, gerencia campanhas promocionais e personaliza ofertas.',
    capabilities: [
      { method: 'message/send', description: 'Para ativar/desativar promoções e consultar promoções ativas.' },
      { method: 'tasks/subscribe', description: 'Permite se inscrever em eventos de outros agentes (ex: AnalyticsAgent para padrões de vendas).' },
      { method: 'agent/authenticatedExtendedCard', description: 'Retorna o perfil e capacidades deste agente.' },
      // Futuramente: integração com CRMAgent para personalizar ofertas
    ],
  };
  return profile;
};

export const PromocaoAgent = {
  initialize: () => {
    registerA2AMethod('message/send', handleMessageSend);
    registerA2AMethod('tasks/subscribe', handleTasksSubscribe);
    registerA2AMethod('agent/authenticatedExtendedCard', handleAuthenticatedExtendedCard);
    console.log('[PromocaoAgent] Métodos A2A registrados.');
  }
};

console.log('[PromocaoAgent] Módulo carregado.');