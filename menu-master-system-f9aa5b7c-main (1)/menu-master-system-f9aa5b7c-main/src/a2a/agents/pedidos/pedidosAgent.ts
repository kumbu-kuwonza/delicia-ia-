import { registerA2AMethod, A2AMethodHandler } from '@/a2a/core/handler';
import { A2AMessageSendParams, A2AAgentProfile, A2AMessage, A2AMessagePart } from '@/types/integrations';
import { z } from 'zod';
import { a2aClient } from '@/a2a/core/a2aClient'; // Adicionado para futuros TODOs de notificação

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

// Schema para os itens do pedido
const OrderItemSchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().positive(),
  // Poderia adicionar price aqui se o cliente puder definir, ou buscar do cardápio
});

// Schema para o payload de criação de pedido (assumindo que vem no `json` part da mensagem)
const CreateOrderPayloadSchema = z.object({
  items: z.array(OrderItemSchema),
  customerId: z.string().optional(), // ID do cliente, pode vir do CRM ou de um login
  // Outros detalhes como endereço de entrega, observações, etc.
  deliveryAddress: z.string().optional(),
  notes: z.string().optional(),
});

const handleMessageSend: A2AMethodHandler = async (params: unknown, agentId: string) => {
  const messageSendParamsSchema = z.object({ message: z.custom<A2AMessage>() });
  const parsedParams = messageSendParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    console.error(`[PedidosAgent:${agentId}] Erro de validação inicial em message/send:`, parsedParams.error.format());
    throw { code: -32602, message: 'Parâmetros de message/send inválidos.', data: parsedParams.error.format() };
  }
  const message = parsedParams.data.message;
  console.log(`[PedidosAgent:${agentId}] Recebido message/send:`, message);

  try {
    const textPartContent = message.parts.find(p => p.type === 'text')?.text?.toLowerCase();
    const jsonPayloadPart = message.parts.find(p => p.type === 'json')?.json;

    // Criar um novo pedido (exemplo com payload JSON)
    // A condição `textPartContent?.includes('novo pedido')` pode ser um gatilho, 
    // mas o payload real do pedido viria do `jsonPayloadPart`.
    if (textPartContent?.includes('novo pedido') && jsonPayloadPart) {
      const validatedOrderPayload = CreateOrderPayloadSchema.parse(jsonPayloadPart);
      
      const newOrderId = `order-${Date.now()}`;
      // TODO: Calcular total real com base nos itens (consultar CardapioAgent para preços)
      const calculatedTotal = validatedOrderPayload.items.reduce((sum, item) => sum + (item.quantity * 10), 0); // Preço placeholder

      const newOrder = {
        id: newOrderId,
        items: validatedOrderPayload.items,
        status: 'received', // Status inicial
        total: calculatedTotal, 
        customerId: validatedOrderPayload.customerId || message.messageId, // Fallback para messageId se não houver customerId
        deliveryAddress: validatedOrderPayload.deliveryAddress,
        notes: validatedOrderPayload.notes,
        createdAt: new Date().toISOString(),
      };
      ordersDatabase[newOrderId] = newOrder;
      console.log(`[PedidosAgent:${agentId}] Novo pedido criado: ${newOrderId}`, newOrder);

      // TODO: Simular envio de atualização de status via message/stream para outros agentes (ex: WhatsAppAgent, CozinhaAgent)
      // Exemplo: await a2aClient.sendStream('whatsapp', 'whatsapp-principal', { type: 'order_status_update', orderId: newOrderId, status: 'received', customerPhone: '...'});
      // Exemplo: await a2aClient.sendStream('cozinha', 'cozinha-1', { type: 'new_order', orderDetails: newOrder });

      return { responseFor: message.messageId, orderConfirmation: newOrder };
    }

    // Consultar status de um pedido (exemplo com extração do texto)
    if (textPartContent?.includes('status do pedido')) {
      const orderIdMatch = textPartContent.match(/order-\d+/); // Simplista, idealmente o ID viria de um param estruturado
      if (orderIdMatch) {
        const orderId = orderIdMatch[0];
        const order = ordersDatabase[orderId];
        if (order) {
          return { responseFor: message.messageId, orderStatus: order };
        }
        return { responseFor: message.messageId, error: `Pedido ${orderId} não encontrado.` };
      }
    }

    return { responseFor: message.messageId, reply: 'Solicitação não compreendida pelo PedidosAgent.' };

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[PedidosAgent:${agentId}] Erro de validação Zod em message/send:`, error.errors);
      throw { code: -32602, message: 'Payload do pedido inválido.', data: error.format() };
    }
    console.error(`[PedidosAgent:${agentId}] Erro em message/send:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        throw error;
    }
    throw { code: -32000, message: 'Erro interno do servidor ao processar message/send no PedidosAgent.' };
  }
};

/**
 * Handler para o método A2A 'message/stream' (simulado, para receber atualizações, ex: da cozinha).
 */
const OrderStreamUpdateSchema = z.object({
  orderId: z.string(),
  newStatus: z.string(), // Poderia ser um enum: z.enum(['preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered', 'cancelled'])
  message: z.string().optional(), // Mensagem adicional da cozinha, por exemplo
  eventId: z.string().optional(), // ID do evento de stream para ack
});

const handleMessageStream: A2AMethodHandler = async (params: unknown, agentId: string) => {
  try {
    const validatedUpdate = OrderStreamUpdateSchema.parse(params);
    console.log(`[PedidosAgent:${agentId}] Recebido message/stream (ex: atualização de status da cozinha):`, validatedUpdate);
    
    const order = ordersDatabase[validatedUpdate.orderId];
    if (order) {
      order.status = validatedUpdate.newStatus;
      console.log(`[PedidosAgent:${agentId}] Status do pedido ${validatedUpdate.orderId} atualizado para ${validatedUpdate.newStatus}.`);
      
      // TODO: Notificar outros agentes (ex: WhatsAppAgent para o cliente, AnalyticsAgent)
      // Ex: await a2aClient.sendStream('whatsapp', 'whatsapp-principal', 
      //   { type: 'order_status_update', orderId: validatedUpdate.orderId, status: validatedUpdate.newStatus, customerPhone: order.customerPhone });
      // Ex: await a2aClient.sendStream('analytics', 'analytics-main', { type: 'order_event', event: 'status_change', orderDetails: order });
      
      return { status: 'received', processed: true, eventAck: validatedUpdate.eventId };
    }
    console.error(`[PedidosAgent:${agentId}] Pedido ${validatedUpdate.orderId} não encontrado para atualização de stream.`);
    return { status: 'received', processed: false, error: `Pedido ${validatedUpdate.orderId} não encontrado.`, eventAck: validatedUpdate.eventId };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[PedidosAgent:${agentId}] Erro de validação em message/stream:`, error.errors);
      // Para stream, não lançamos erro JSON-RPC, mas retornamos um ack de falha no processamento.
      // O erro já foi logado. O originador do stream pode decidir como tratar o NACK.
      return { status: 'received', processed: false, error: 'Parâmetros de stream inválidos.', data: error.format(), eventAck: (params as any)?.eventId };
    }
    console.error(`[PedidosAgent:${agentId}] Erro não Zod em message/stream:`, error);
    return { status: 'received', processed: false, error: 'Erro interno ao processar stream.', eventAck: (params as any)?.eventId };
  }
};

/**
 * Handler para o método A2A 'tasks/subscribe' (simulado).
 * O PedidosAgent poderia permitir que outros agentes (ex: Cozinha) se inscrevessem para receber notificações de novos pedidos.
 */
const TasksSubscribeParamsSchema = z.object({
  eventName: z.enum(['newOrderNotification', 'orderStatusUpdate']), // Exemplo de eventos
  // callbackUrl: z.string().url().optional(), // Se a notificação for via webhook para o assinante
});

const handleTasksSubscribe: A2AMethodHandler = async (params: unknown, agentId: string) => {
  try {
    const validatedParams = TasksSubscribeParamsSchema.parse(params);
    console.log(`[PedidosAgent:${agentId}] Chamado tasks/subscribe com params:`, validatedParams);

    if (validatedParams.eventName === 'newOrderNotification') {
      console.log(`[PedidosAgent:${agentId}] Agente (ex: Cozinha) inscrito para notificações de '${validatedParams.eventName}' (simulado).`);
      // TODO: Armazenar a subscrição (quem se inscreveu, para qual evento, callback, etc.)
      return { subscriptionId: `sub-order-${Date.now()}`, status: 'subscribed', event: validatedParams.eventName };
    }
    // Adicionar lógica para outros eventNames
    throw { code: 4001, message: `Evento '${validatedParams.eventName}' para subscrição não suportado.` };

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[PedidosAgent:${agentId}] Erro de validação em tasks/subscribe:`, error.errors);
      throw { code: -32602, message: 'Parâmetros inválidos para tasks/subscribe.', data: error.format() };
    }
    console.error(`[PedidosAgent:${agentId}] Erro em tasks/subscribe:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        throw error;
    }
    throw { code: -32000, message: 'Erro interno do servidor ao processar tasks/subscribe no PedidosAgent.' };
  }
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
      { method: 'pedidos/message/send', description: 'Para criar novos pedidos ou consultar status de pedidos existentes.' },
      { method: 'pedidos/message/stream', description: 'Recebe atualizações de status (ex: da cozinha) e envia atualizações para outros agentes (ex: cliente via WhatsAppAgent).' },
      { method: 'pedidos/tasks/subscribe', description: 'Permite que outros agentes se inscrevam para notificações (ex: novos pedidos para a cozinha).' },
      { method: 'agent/authenticatedExtendedCard', description: 'Retorna o perfil e capacidades deste agente.' },
    ],
  };
  return profile;
};

export const PedidosAgent = {
  initialize: () => {
    registerA2AMethod('pedidos/message/send', handleMessageSend);
    registerA2AMethod('pedidos/message/stream', handleMessageStream);
    registerA2AMethod('pedidos/tasks/subscribe', handleTasksSubscribe);
    registerA2AMethod('agent/authenticatedExtendedCard', handleAuthenticatedExtendedCard); // Sem prefixo
    console.log('[PedidosAgent] Métodos A2A registrados com prefixo "pedidos/".');
  }
};

console.log('[PedidosAgent] Módulo carregado.');