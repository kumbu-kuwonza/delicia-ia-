import { registerA2AMethod, A2AMethodHandler } from '@/a2a/core/handler';
import { A2AMessageSendParams, A2AMessage, A2AMessagePart, A2AAgentProfile } from '@/types/integrations';

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
const handleGetMenuDetails: A2AMethodHandler = async (params: { menuId?: string }, agentId: string) => {
  console.log(`[CardapioAgent:${agentId}] Chamado cardapio/getMenuDetails com params:`, params);
  const menuId = params.menuId || 'menu-123'; // Pega um ID padrão se nenhum for fornecido
  const menu = menuDatabase[menuId];
  if (menu) {
    return menu;
  }
  throw { code: 1001, message: `Cardápio com ID '${menuId}' não encontrado.`, data: { requestedMenuId: menuId } };
};

/**
 * Handler para o método A2A 'message/stream' recebido pelo CardapioAgent.
 * Usado para receber atualizações de disponibilidade do EstoqueAgent.
 */
const handleMessageStream: A2AMethodHandler = async (params: any, agentId: string) => {
  console.log(`[CardapioAgent:${agentId}] Recebido message/stream:`, params);
  const { type, itemId, newStockStatus, available, promoId, active, promotionDetails } = params;

  if (type === 'stock_update' && itemId && newStockStatus !== undefined) {
    const menuItem = menuDatabase['menu-123']?.items.find((item: any) => item.id === itemId);
    if (menuItem) {
      menuItem.stockStatus = newStockStatus;
      if (available !== undefined) {
        menuItem.available = available;
      }
      console.log(`[CardapioAgent:${agentId}] Item ${itemId} atualizado para stockStatus: ${newStockStatus}, available: ${menuItem.available}`);
      return { status: 'success', message: `Item ${itemId} stock atualizado.` };
    }
    return { status: 'error', message: `Item ${itemId} não encontrado para atualização de estoque.` };
  } else if (type === 'promotion_update' && promoId) {
    console.log(`[CardapioAgent:${agentId}] Recebida atualização de promoção '${promoId}':`, params);
    if (itemId) { // Promoção específica para um item
      const menuItem = menuDatabase['menu-123']?.items.find((item: any) => item.id === itemId);
      if (menuItem) {
        menuItem.activePromotionId = active ? promoId : null;
        // menuItem.promotionDetails = active ? promotionDetails : null; // Opcional: armazenar mais detalhes
        console.log(`[CardapioAgent:${agentId}] Promoção ${promoId} (ativa: ${active}) atualizada para o item ${itemId}.`);
        return { status: 'success', message: `Promoção ${promoId} atualizada para item ${itemId}.` };
      }
      return { status: 'error', message: `Item ${itemId} não encontrado para atualização de promoção.` };
    } else { // Promoção geral ou que afeta múltiplos itens (lógica mais complexa não implementada aqui)
      // Exemplo: atualizar uma lista de promoções gerais ativas
      if (active) {
        menuDatabase['menu-123'].activeGeneralPromotions[promoId] = promotionDetails || { active: true };
      } else {
        delete menuDatabase['menu-123'].activeGeneralPromotions[promoId];
      }
      console.log(`[CardapioAgent:${agentId}] Promoção geral ${promoId} (ativa: ${active}) atualizada.`);
      return { status: 'success', message: `Promoção geral ${promoId} atualizada.` };
    }
  }
  return { status: 'warning', message: 'Tipo de stream não reconhecido ou dados insuficientes.' };
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
    registerA2AMethod(`${AGENT_ID_PREFIX}/message/send`, handleMessageSend);
    registerA2AMethod(`${AGENT_ID_PREFIX}/message/stream`, handleMessageStream); // Para receber streams
    registerA2AMethod(`${AGENT_ID_PREFIX}/cardapio/getMenuDetails`, handleGetMenuDetails);
    registerA2AMethod(`${AGENT_ID_PREFIX}/tasks/get`, handleTasksGet);
    registerA2AMethod(`${AGENT_ID_PREFIX}/agent/authenticatedExtendedCard`, handleAuthenticatedExtendedCard);
    // Poderia ser apenas 'message/send', etc., se o roteamento no core handler for mais genérico
    // e usar o agentId para diferenciar. A estrutura atual do handler.ts não diferencia por agentId no registro.
    // Para simplificar, vamos assumir que os métodos são registrados globalmente por enquanto
    // e o `agentId` no `processA2ARequest` é usado para direcionar a lógica dentro do handler.
    // Ou, cada agente registra métodos prefixados com seu tipo, ex: 'cardapio/getMenu'

    // Registro dos métodos com nomes mais genéricos para serem usados pelo handler central
    // O handler central usará o `agentId` da URL para saber qual agente está sendo chamado.
    // Se o `agentType` da URL (ex: /api/v1/a2a/cardapio/{agent-id}) for usado para rotear para este módulo,
    // então os métodos podem ser registrados sem prefixo específico do agente.

    // Exemplo de registro para o handler central (assumindo que o a2aServer.ts importa e chama initialize())
    // Estes são os métodos que o CardapioAgent expõe.
    registerA2AMethod('message/send', handleMessageSend); // Genérico, o handler decide se é para este agente
    registerA2AMethod('message/stream', handleMessageStream); // Genérico
    registerA2AMethod('cardapio/getMenuDetails', handleGetMenuDetails); // Específico do cardápio
    registerA2AMethod('tasks/get', handleTasksGet); // Genérico
    registerA2AMethod('agent/authenticatedExtendedCard', handleAuthenticatedExtendedCard); // Genérico

    console.log('[CardapioAgent] Métodos A2A registrados.');
  }
};

// Para que o a2aServer.ts possa inicializar este agente:
// CardapioAgent.initialize(); // Isso seria chamado no a2aServer.ts

console.log('[CardapioAgent] Módulo carregado.');