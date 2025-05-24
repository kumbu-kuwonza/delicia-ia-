import { registerA2AMethod, A2AMethodHandler } from '@/a2a/core/handler';
import { A2AMessageSendParams, A2AMessage, A2AMessagePart, A2AAgentProfile } from '@/types/integrations';
import { z } from 'zod';

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
const TasksGetParamsSchema = z.object({
  itemId: z.string(), // itemId é obrigatório
  // Adicionar outros campos se forem relevantes para tasks/get do EstoqueAgent
});

const handleTasksGet: A2AMethodHandler = async (params: unknown, agentId: string) => {
  try {
    const validatedParams = TasksGetParamsSchema.parse(params);
    console.log(`[EstoqueAgent:${agentId}] Chamado tasks/get com params:`, validatedParams);
    
    const item = inventoryDatabase[validatedParams.itemId];
    if (item) {
      return {
        taskId: `task-estoque-${validatedParams.itemId}`,
        status: 'completed', // Simulado
        result: {
          itemId: item.id,
          quantity: item.quantity,
          status: item.status,
          available: item.quantity > 0,
        }
      };
    }
    throw { code: 2002, message: `Item com ID '${validatedParams.itemId}' não encontrado no estoque.` };

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[EstoqueAgent:${agentId}] Erro de validação em tasks/get:`, error.errors);
      throw { code: -32602, message: 'Parâmetros inválidos.', data: error.format() };
    }
    console.error(`[EstoqueAgent:${agentId}] Erro em tasks/get:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        throw error;
    }
    throw { code: -32000, message: 'Erro interno do servidor ao processar tasks/get no EstoqueAgent.' };
  }
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
import { a2aClient } from '@/a2a/core/a2aClient'; // Importar o a2aClient

export const sendStockUpdateToCardapioAgent = async (itemId: string, newQuantity: number, agentId: string = 'estoque-principal') => {
  const item = inventoryDatabase[itemId];
  if (!item) {
    console.error(`[EstoqueAgent:${agentId}] Item ${itemId} não encontrado para enviar atualização de estoque.`);
    return;
  }

  item.quantity = newQuantity;
  if (newQuantity === 0) item.status = 'unavailable';
  else if (newQuantity < 10) item.status = 'low_stock';
  else item.status = 'available';

  const updatePayload = {
    type: 'stock_update', // Tipo de evento para o CardapioAgent
    eventId: `stock-${itemId}-${Date.now()}`, // ID único para o evento de stream
    itemId: item.id,
    newStockStatus: item.status,
    available: item.quantity > 0,
    quantity: item.quantity
  };

  console.log(`[EstoqueAgent:${agentId}] Enviando message/stream para CardapioAgent:`, updatePayload);
  
  try {
    // O targetAgentId 'cardapio-principal' é um exemplo.
    // Em um sistema real, este ID seria configurável ou descoberto.
    const response = await a2aClient.sendStream(
      'cardapio', 
      'cardapio-principal', 
      updatePayload
    );
    console.log(`[EstoqueAgent:${agentId}] Resposta do CardapioAgent ao stream de estoque:`, response);
  } catch (error) {
    console.error(`[EstoqueAgent:${agentId}] Erro ao enviar atualização de estoque para CardapioAgent para item ${itemId}:`, error);
    // Considerar estratégias de retry ou fallback se a comunicação falhar.
  }
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
      { method: 'estoque/message/send', description: 'Para consultas gerais sobre o estoque.' },
      { method: 'estoque/tasks/get', description: 'Consulta disponibilidade e status de itens específicos.' },
      // { method: 'estoque/message/stream', description: 'Envia atualizações de estoque em tempo real (este agente é o PRODUTOR do stream).' },
      { method: 'agent/authenticatedExtendedCard', description: 'Retorna o perfil e capacidades deste agente.' },
    ],
  };
  return profile;
};

export const EstoqueAgent = {
  initialize: () => {
    registerA2AMethod('estoque/message/send', handleMessageSend);
    registerA2AMethod('estoque/tasks/get', handleTasksGet);
    // O EstoqueAgent primariamente *envia* message/stream. Se precisasse receber, seria 'estoque/message/stream'.
    // registerA2AMethod('estoque/message/stream', handleMessageStreamReceive); // Exemplo se recebesse streams
    registerA2AMethod('agent/authenticatedExtendedCard', handleAuthenticatedExtendedCard); // Sem prefixo

    console.log('[EstoqueAgent] Métodos A2A registrados com prefixo "estoque/".');

    // Simulação de uma mudança no estoque para teste
    // setTimeout(() => sendStockUpdateToCardapioAgent('item-2', 2), 5000);
    // setTimeout(() => sendStockUpdateToCardapioAgent('item-1', 0), 10000);
  }
};

console.log('[EstoqueAgent] Módulo carregado.');