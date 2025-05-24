import { registerA2AMethod, A2AMethodHandler } from '@/a2a/core/handler';
import { A2AMessageSendParams, A2AMessage, A2AMessagePart, A2AAgentProfile } from '@/types/integrations';
import { z } from 'zod';

const AGENT_ID_PREFIX = 'cardapio-agent'; // Prefixo para identificar instâncias deste agente

// Simulação de um banco de dados ou cache para os cardápios
const menuDatabase: Record<string, any> = {
  'menu-123': {
    id: 'menu-123',
    name: 'Cardápio Principal',
    items: [
      { id: 'item-1', name: 'Pizza Margherita', price: 25.00, available: true, stockStatus: 'available', activePromotionId: null },
      { id: 'item-2', name: 'Refrigerante', price: 5.00, available: true, stockStatus: 'available', activePromotionId: null },
      { id: 'item-3', name: 'Sobremesa Especial', price: 15.00, available: false, stockStatus: 'unavailable', activePromotionId: null },
    ],
    activeGeneralPromotions: {} // Para promoções que não são específicas de um item
  },
};

/**
 * Handler para o método A2A 'message/send' direcionado ao CardapioAgent.
 * Poderia ser usado para consultas gerais sobre o cardápio.
 */
const handleMessageSend: A2AMethodHandler = async (params: A2AMessageSendParams, agentId: string, apiKey: string) => {
  console.log(`[CardapioAgent:${agentId}] Recebido message/send com API Key: ${apiKey ? 'presente' : 'ausente'}`);
  const message = params.message;
  // Lógica para processar a mensagem recebida.
  // Exemplo: se o texto for 'qual o cardapio?', retorna o cardápio.
  if (message.parts.some(part => part.type === 'text' && part.text?.toLowerCase().includes('qual o cardapio'))) {
    return { 
      responseFor: message.messageId,
      menu: menuDatabase['menu-123'] || { error: 'Cardápio não encontrado' }
    };
  }
  return { responseFor: message.messageId, reply: 'Mensagem recebida pelo CardapioAgent, mas não entendi sua solicitação específica.' };
};

/**
 * Handler para o método A2A 'cardapio/getMenuDetails'.
 * Retorna detalhes de um cardápio específico.
 */
const GetMenuDetailsParamsSchema = z.object({
  menuId: z.string().optional(), // menuId é opcional
});

const handleGetMenuDetails: A2AMethodHandler = async (params: unknown, agentId: string) => {
  try {
    const validatedParams = GetMenuDetailsParamsSchema.parse(params);
    console.log(`[CardapioAgent:${agentId}] Chamado cardapio/getMenuDetails com params:`, validatedParams);
    const menuId = validatedParams.menuId || 'menu-123';
    // ... restante da lógica do handler
    const menu = menuDatabase[menuId];
    if (menu) {
      return menu;
    }
    throw { code: 1001, message: `Cardápio com ID '${menuId}' não encontrado.`, data: { requestedMenuId: menuId } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[CardapioAgent:${agentId}] Erro de validação em cardapio/getMenuDetails:`, error.errors);
      throw { code: -32602, message: 'Parâmetros inválidos.', data: error.format() };
    }
    console.error(`[CardapioAgent:${agentId}] Erro em cardapio/getMenuDetails:`, error);
    // Re-throw error se for um erro já formatado ou um erro inesperado
    if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        throw error;
    }
    throw { code: -32000, message: 'Erro interno do servidor ao processar getMenuDetails.' };
  }
};

/**
 * Handler para o método A2A 'message/stream' recebido pelo CardapioAgent.
 * Usado para receber atualizações de disponibilidade do EstoqueAgent.
 */
const handleMessageStream: A2AMethodHandler = async (params: any, agentId: string) => {
  console.log(`[CardapioAgent:${agentId}] Recebido message/stream:`, params);
  const { type, itemId, newStockStatus, available, promoId, active, promotionDetails } = params;

  // Adicionando um ID para o ack, se disponível nos params (ex: um ID de evento do stream)
  const streamEventId = params.eventId || null;

  if (type === 'stock_update' && itemId && newStockStatus !== undefined) {
    const menuItem = menuDatabase['menu-123']?.items.find((item: any) => item.id === itemId);
    if (menuItem) {
      menuItem.stockStatus = newStockStatus;
      if (available !== undefined) {
        menuItem.available = available;
      }
      console.log(`[CardapioAgent:${agentId}] Item ${itemId} atualizado para stockStatus: ${newStockStatus}, available: ${menuItem.available}`);
      return { status: 'received', processed: true, eventAck: streamEventId };
    }
    // Mesmo em caso de erro de processamento, o stream foi 'recebido'.
    // O erro pode ser logado ou tratado de outra forma, mas o ack informa que chegou.
    console.error(`[CardapioAgent:${agentId}] Item ${itemId} não encontrado para atualização de estoque via stream.`);
    return { status: 'received', processed: false, error: `Item ${itemId} não encontrado`, eventAck: streamEventId };
  } else if (type === 'promotion_update' && promoId) {
    console.log(`[CardapioAgent:${agentId}] Recebida atualização de promoção '${promoId}':`, params);
    if (itemId) { // Promoção específica para um item
      const menuItem = menuDatabase['menu-123']?.items.find((item: any) => item.id === itemId);
      if (menuItem) {
        menuItem.activePromotionId = active ? promoId : null;
        console.log(`[CardapioAgent:${agentId}] Promoção ${promoId} (ativa: ${active}) atualizada para o item ${itemId}.`);
        return { status: 'received', processed: true, eventAck: streamEventId };
      }
      console.error(`[CardapioAgent:${agentId}] Item ${itemId} não encontrado para atualização de promoção via stream.`);
      return { status: 'received', processed: false, error: `Item ${itemId} não encontrado para promoção`, eventAck: streamEventId };
    } else { // Promoção geral
      if (active) {
        menuDatabase['menu-123'].activeGeneralPromotions[promoId] = promotionDetails || { active: true };
      } else {
        delete menuDatabase['menu-123'].activeGeneralPromotions[promoId];
      }
      console.log(`[CardapioAgent:${agentId}] Promoção geral ${promoId} (ativa: ${active}) atualizada.`);
      return { status: 'received', processed: true, eventAck: streamEventId };
    }
  }
  console.warn(`[CardapioAgent:${agentId}] Tipo de stream não reconhecido ou dados insuficientes:`, params);
  return { status: 'received', processed: false, error: 'Tipo de stream não reconhecido ou dados insuficientes.', eventAck: streamEventId };
};

/**
 * Handler para o método A2A 'tasks/get' para consultar o status de um item (simulado).
 * Em um cenário real, isso poderia ser uma tarefa mais complexa.
 */
const handleTasksGet: A2AMethodHandler = async (params: { taskId?: string; itemId?: string }, agentId: string) => {
  console.log(`[CardapioAgent:${agentId}] Chamado tasks/get com params:`, params);
  if (params.itemId) {
    const menuItem = menuDatabase['menu-123']?.items.find((item: any) => item.id === params.itemId);
    if (menuItem) {
      return {
        taskId: params.taskId || `task-status-${params.itemId}`,
        status: 'completed', // Simulado
        result: {
          itemId: params.itemId,
          name: menuItem.name,
          available: menuItem.available,
          stockStatus: menuItem.stockStatus,
        }
      };
    }
    throw { code: 1002, message: `Item com ID '${params.itemId}' não encontrado para consulta de task.`, data: { requestedItemId: params.itemId } };
  }
  throw { code: 1003, message: 'Parâmetro itemId é obrigatório para tasks/get no CardapioAgent.', data: {} };
};

/**
 * Handler para o método A2A 'agent/authenticatedExtendedCard'.
 * Retorna o perfil e capacidades do CardapioAgent.
 */
const handleAuthenticatedExtendedCard: A2AMethodHandler = async (params: any, agentId: string) => {
  console.log(`[CardapioAgent:${agentId}] Chamado agent/authenticatedExtendedCard com params:`, params);
  const profile: A2AAgentProfile = {
    agentId: `${AGENT_ID_PREFIX}-${agentId}`, // O agentId da URL pode ser uma instância específica
    name: 'CardapioAgent - Gerenciador de Cardápios Digitais',
    description: 'Este agente é responsável por exibir, gerenciar e atualizar cardápios em tempo real.',
    capabilities: [
      { method: 'message/send', description: 'Para consultas gerais sobre o cardápio.' },
      { method: 'message/stream', description: 'Recebe atualizações de disponibilidade do EstoqueAgent.' },
      { method: 'cardapio/getMenuDetails', description: 'Retorna detalhes de um cardápio específico.' },
      { method: 'tasks/get', description: 'Consulta status de disponibilidade de itens (simulado).' },
      { method: 'agent/authenticatedExtendedCard', description: 'Retorna o perfil e capacidades deste agente.' },
    ],
  };
  return profile;
};


export const CardapioAgent = {
  initialize: () => {
    registerA2AMethod('cardapio/message/send', handleMessageSend);
    registerA2AMethod('cardapio/message/stream', handleMessageStream);
    registerA2AMethod('cardapio/getMenuDetails', handleGetMenuDetails);
    registerA2AMethod('cardapio/tasks/get', handleTasksGet);
    registerA2AMethod('agent/authenticatedExtendedCard', handleAuthenticatedExtendedCard); // Sem prefixo

    console.log('[CardapioAgent] Métodos A2A registrados com prefixo "cardapio/".');
  }
};

// Para que o a2aServer.ts possa inicializar este agente:
// CardapioAgent.initialize(); // Isso seria chamado no a2aServer.ts

console.log('[CardapioAgent] Módulo carregado.');