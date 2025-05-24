import { registerA2AMethod, A2AMethodHandler } from '@/a2a/core/handler';
import { A2AMessageSendParams, A2AMessage, A2AMessagePart, A2AAgentProfile } from '@/types/integrations';

const AGENT_ID_PREFIX = 'estoque-agent';

// Simulação de um banco de dados ou cache para o estoque
const inventoryDatabase: Record<string, { id: string; name: string; quantity: number; status: 'available' | 'low_stock' | 'unavailable' }> = {
  'item-1': { id: 'item-1', name: 'Ingrediente Pizza A', quantity: 100, status: 'available' },
  'item-2': { id: 'item-2', name: 'Ingrediente Bebida B', quantity: 5, status: 'low_stock' },
  'item-3': { id: 'item-3', name: 'Ingrediente Sobremesa C', quantity: 0, status: 'unavailable' },
};

/**
 * Handler para o método A2A 'message/send' direcionado ao EstoqueAgent.
 * Poderia ser usado para consultas gerais sobre o estoque.
 */
const handleMessageSend: A2AMethodHandler = async (params: A2AMessageSendParams, agentId: string) => {
  console.log(`[EstoqueAgent:${agentId}] Recebido message/send:`, params.message);
  // Lógica para processar a mensagem. Ex: consulta de item específico.
  const part = params.message.parts.find(p => p.type === 'text');
  if (part && part.text?.includes('status do item-1')) {
    return { responseFor: params.message.messageId, itemStatus: inventoryDatabase['item-1'] };
  }
  return { responseFor: params.message.messageId, reply: 'Mensagem recebida pelo EstoqueAgent.' };
};

/**
 * Handler para o método A2A 'tasks/get' para consultar disponibilidade de um item.
 */
const handleTasksGet: A2AMethodHandler = async (params: { itemId?: string }, agentId: string) => {
  console.log(`[EstoqueAgent:${agentId}] Chamado tasks/get com params:`, params);
  if (!params.itemId) {
    throw { code: 2001, message: 'Parâmetro itemId é obrigatório para tasks/get no EstoqueAgent.' };
  }
  const item = inventoryDatabase[params.itemId];
  if (item) {
    return {
      taskId: `task-estoque-${params.itemId}`,
      status: 'completed', // Simulado
      result: {
        itemId: item.id,
        quantity: item.quantity,
        status: item.status,
        available: item.quantity > 0,
      }
    };
  }
  throw { code: 2002, message: `Item com ID '${params.itemId}' não encontrado no estoque.` };
};

/**
 * Handler para o método A2A 'message/stream' (simulado, pois o EstoqueAgent envia, não recebe streams neste contexto primário).
 * Em um cenário real, o EstoqueAgent enviaria streams para o CardapioAgent.
 * Esta função é um placeholder se o EstoqueAgent precisasse *receber* streams.
 */
const handleMessageStreamReceive: A2AMethodHandler = async (params: any, agentId: string) => {
  console.log(`[EstoqueAgent:${agentId}] Recebido message/stream (placeholder):`, params);
  // Normalmente, o EstoqueAgent *envia* streams, não os recebe.
  // Este handler seria para um caso de uso onde ele também é um consumidor de streams.
  return { status: 'success', message: 'Stream recebido pelo EstoqueAgent (simulado).' };
};

/**
 * Função para simular o envio de uma atualização de estoque via message/stream para outro agente (ex: CardapioAgent).
 * Esta não é um handler de método A2A de entrada, mas uma lógica interna do agente.
 */
export const sendStockUpdateToCardapioAgent = async (itemId: string, newQuantity: number) => {
  const item = inventoryDatabase[itemId];
  if (!item) return;

  item.quantity = newQuantity;
  if (newQuantity === 0) item.status = 'unavailable';
  else if (newQuantity < 10) item.status = 'low_stock';
  else item.status = 'available';

  const updatePayload = {
    itemId: item.id,
    newStockStatus: item.status,
    available: item.quantity > 0,
    quantity: item.quantity
  };

  console.log(`[EstoqueAgent] Simulando envio de message/stream para CardapioAgent:`, updatePayload);
  // Em uma implementação real, aqui ocorreria uma chamada HTTP POST para o endpoint A2A do CardapioAgent
  // com o método 'message/stream' e o payload acima.
  // Ex: await a2aClient.sendStream('cardapio-agent-instance-id', 'message/stream', updatePayload);
  // Por agora, apenas logamos a intenção.
};


/**
 * Handler para o método A2A 'agent/authenticatedExtendedCard'.
 * Retorna o perfil e capacidades do EstoqueAgent.
 */
const handleAuthenticatedExtendedCard: A2AMethodHandler = async (params: any, agentId: string) => {
  console.log(`[EstoqueAgent:${agentId}] Chamado agent/authenticatedExtendedCard com params:`, params);
  const profile: A2AAgentProfile = {
    agentId: `${AGENT_ID_PREFIX}-${agentId}`,
    name: 'EstoqueAgent - Gerenciador de Estoque',
    description: 'Monitora ingredientes e disponibilidade de produtos, notificando outros agentes sobre mudanças.',
    capabilities: [
      { method: 'message/send', description: 'Para consultas gerais sobre o estoque.' },
      { method: 'tasks/get', description: 'Consulta disponibilidade e status de itens específicos.' },
      // { method: 'message/stream', description: 'Envia atualizações de estoque em tempo real (este agente é o PRODUTOR do stream).' },
      { method: 'agent/authenticatedExtendedCard', description: 'Retorna o perfil e capacidades deste agente.' },
    ],
  };
  return profile;
};

export const EstoqueAgent = {
  initialize: () => {
    registerA2AMethod('message/send', handleMessageSend); // Genérico, para ser usado pelo handler central
    registerA2AMethod('tasks/get', handleTasksGet);       // Genérico
    // O EstoqueAgent primariamente *envia* message/stream, não o registra como um método de entrada comum aqui.
    // Se ele também precisasse *receber* streams de outros agentes, um handler seria registrado.
    // registerA2AMethod('message/stream', handleMessageStreamReceive); // Exemplo se recebesse streams
    registerA2AMethod('agent/authenticatedExtendedCard', handleAuthenticatedExtendedCard); // Genérico

    console.log('[EstoqueAgent] Métodos A2A registrados.');

    // Simulação de uma mudança no estoque para teste
    // setTimeout(() => sendStockUpdateToCardapioAgent('item-2', 2), 5000);
    // setTimeout(() => sendStockUpdateToCardapioAgent('item-1', 0), 10000);
  }
};

console.log('[EstoqueAgent] Módulo carregado.');