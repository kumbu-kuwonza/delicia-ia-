import { registerA2AMethod, A2AMethodHandler } from '@/a2a/core/handler';
import { A2AMessageSendParams, A2AAgentProfile, A2AMessage, A2AMessagePart } from '@/types/integrations';

const AGENT_ID_PREFIX = 'pedidos-agent';

// Simulação de um banco de dados ou cache para pedidos
const ordersDatabase: Record<string, any> = {
  'order-1': { id: 'order-1', items: [{ itemId: 'item-1', quantity: 2 }], status: 'received', total: 50.00, customerId: 'cust-abc' },
  'order-2': { id: 'order-2', items: [{ itemId: 'item-2', quantity: 1 }], status: 'preparing', total: 5.00, customerId: 'cust-xyz' },
};

/**
 * Handler para o método A2A 'message/send' direcionado ao PedidosAgent.
 * Usado para criar novos pedidos ou consultar status.
 */
const handleMessageSend: A2AMethodHandler = async (params: A2AMessageSendParams, agentId: string) => {
  console.log(`[PedidosAgent:${agentId}] Recebido message/send:`, params.message);
  const message = params.message;
  const textPart = message.parts.find(p => p.type === 'text')?.text?.toLowerCase();

  // Exemplo: Criar um novo pedido
  if (textPart?.includes('novo pedido')) {
    // Lógica para extrair detalhes do pedido da mensagem
    const newOrderId = `order-${Date.now()}`;
    const newOrder = {
      id: newOrderId,
      items: [{ itemId: 'item-placeholder', quantity: 1 }], // Extrair da mensagem
      status: 'received',
      total: 0, // Calcular com base nos itens
      customerId: message.messageId, // Usar messageId como um customerId temporário
    };
    ordersDatabase[newOrderId] = newOrder;
    console.log(`[PedidosAgent:${agentId}] Novo pedido criado: ${newOrderId}`);
    // Simular envio de atualização de status via message/stream para outros agentes (ex: WhatsAppAgent)
    // await a2aClient.sendStream('whatsapp-agent-id', 'message/stream', { orderId: newOrderId, status: 'received' });
    return { responseFor: message.messageId, orderConfirmation: newOrder };
  }

  // Exemplo: Consultar status de um pedido
  if (textPart?.includes('status do pedido')) {
    const orderIdMatch = textPart.match(/order-\d+/);
    if (orderIdMatch) {
      const orderId = orderIdMatch[0];
      const order = ordersDatabase[orderId];
      if (order) {
        return { responseFor: message.messageId, orderStatus: order };
      }
      return { responseFor: message.messageId, error: `Pedido ${orderId} não encontrado.` };
    }
  }

  return { responseFor: message.messageId, reply: 'Mensagem recebida pelo PedidosAgent.' };
};

/**
 * Handler para o método A2A 'message/stream' (simulado, para receber atualizações, ex: da cozinha).
 */
const handleMessageStream: A2AMethodHandler = async (params: { orderId?: string; newStatus?: string }, agentId: string) => {
  console.log(`[PedidosAgent:${agentId}] Recebido message/stream (ex: atualização de status da cozinha):`, params);
  if (params.orderId && params.newStatus) {
    const order = ordersDatabase[params.orderId];
    if (order) {
      order.status = params.newStatus;
      console.log(`[PedidosAgent:${agentId}] Status do pedido ${params.orderId} atualizado para ${params.newStatus}.`);
      // Notificar outros agentes (ex: WhatsAppAgent, Cliente via UI)
      // await a2aClient.sendStream('whatsapp-agent-id', 'message/stream', { orderId: params.orderId, status: params.newStatus });
      return { status: 'success', message: `Status do pedido ${params.orderId} atualizado.` };
    }
    return { status: 'error', message: `Pedido ${params.orderId} não encontrado.` };
  }
  return { status: 'warning', message: 'Dados insuficientes na atualização de stream.' };
};

/**
 * Handler para o método A2A 'tasks/subscribe' (simulado).
 * O PedidosAgent poderia permitir que outros agentes (ex: Cozinha) se inscrevessem para receber notificações de novos pedidos.
 */
const handleTasksSubscribe: A2AMethodHandler = async (params: { eventName?: string }, agentId: string) => {
  console.log(`[PedidosAgent:${agentId}] Chamado tasks/subscribe com params:`, params);
  if (params.eventName === 'newOrderNotification') {
    console.log(`[PedidosAgent:${agentId}] Agente (ex: Cozinha) inscrito para notificações de novos pedidos (simulado).`);
    return { subscriptionId: `sub-order-${Date.now()}`, status: 'subscribed', event: params.eventName };
  }
  throw { code: 4001, message: 'Nome do evento para subscrição inválido ou não suportado.' };
};

/**
 * Handler para o método A2A 'agent/authenticatedExtendedCard'.
 * Retorna o perfil e capacidades do PedidosAgent.
 */
const handleAuthenticatedExtendedCard: A2AMethodHandler = async (params: any, agentId: string) => {
  console.log(`[PedidosAgent:${agentId}] Chamado agent/authenticatedExtendedCard com params:`, params);
  const profile: A2AAgentProfile = {
    agentId: `${AGENT_ID_PREFIX}-${agentId}`,
    name: 'PedidosAgent - Gerenciador de Pedidos',
    description: 'Gerencia o fluxo de pedidos, desde a criação até a finalização, e atualiza o status.',
    capabilities: [
      { method: 'message/send', description: 'Para criar novos pedidos ou consultar status de pedidos existentes.' },
      { method: 'message/stream', description: 'Recebe atualizações de status (ex: da cozinha) e envia atualizações para outros agentes (ex: cliente via WhatsAppAgent).' },
      { method: 'tasks/subscribe', description: 'Permite que outros agentes se inscrevam para notificações (ex: novos pedidos para a cozinha).' },
      { method: 'agent/authenticatedExtendedCard', description: 'Retorna o perfil e capacidades deste agente.' },
    ],
  };
  return profile;
};

export const PedidosAgent = {
  initialize: () => {
    registerA2AMethod('message/send', handleMessageSend);
    registerA2AMethod('message/stream', handleMessageStream);
    registerA2AMethod('tasks/subscribe', handleTasksSubscribe);
    registerA2AMethod('agent/authenticatedExtendedCard', handleAuthenticatedExtendedCard);
    console.log('[PedidosAgent] Métodos A2A registrados.');
  }
};

console.log('[PedidosAgent] Módulo carregado.');