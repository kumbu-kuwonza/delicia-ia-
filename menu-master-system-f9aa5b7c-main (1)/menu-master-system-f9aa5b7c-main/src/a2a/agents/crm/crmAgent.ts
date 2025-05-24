import { registerA2AMethod, A2AMethodHandler } from '@/a2a/core/handler';
import { A2AMessageSendParams, A2AAgentProfile, A2AMessage } from '@/types/integrations';

const AGENT_ID_PREFIX = 'crm-agent';

// Simulação de um banco de dados ou cache para dados de clientes
const crmDatabase: Record<string, any> = {
  'cust-abc': { id: 'cust-abc', name: 'Cliente Alpha', preferences: ['pizza', 'sem cebola'], history: [{orderId: 'order-1', total: 50.00}] },
  'cust-xyz': { id: 'cust-xyz', name: 'Cliente Beta', preferences: ['refrigerante diet'], history: [{orderId: 'order-2', total: 5.00}] },
};

/**
 * Handler para o método A2A 'message/send' direcionado ao CRMAgent.
 * Usado para enviar dados para personalização ou atualizar dados do cliente.
 */
const handleMessageSend: A2AMethodHandler = async (params: A2AMessageSendParams, agentId: string) => {
  console.log(`[CRMAgent:${agentId}] Recebido message/send:`, params.message);
  const message = params.message;
  const customerId = message.parts.find(p => p.type === 'text' && p.text?.startsWith('customerId:'))?.text?.split(':')[1]?.trim();
  
  if (customerId && message.parts.some(p => p.type === 'text' && p.text?.includes('update preferences'))) {
    // Lógica para atualizar preferências do cliente (simulado)
    crmDatabase[customerId].preferences = ['nova preferencia']; 
    console.log(`[CRMAgent:${agentId}] Preferências do cliente ${customerId} atualizadas.`);
    return { responseFor: message.messageId, status: `Preferências de ${customerId} atualizadas.` };
  }
  
  return { responseFor: message.messageId, reply: 'Mensagem recebida pelo CRMAgent.' };
};

/**
 * Handler para o método A2A 'tasks/get' para buscar dados de clientes.
 */
const handleTasksGet: A2AMethodHandler = async (params: { customerId?: string; segment?: string }, agentId: string) => {
  console.log(`[CRMAgent:${agentId}] Chamado tasks/get com params:`, params);
  if (params.customerId) {
    const customerData = crmDatabase[params.customerId];
    if (customerData) {
      return {
        taskId: `task-crm-${params.customerId}`,
        status: 'completed',
        result: customerData
      };
    }
    throw { code: 5001, message: `Cliente com ID '${params.customerId}' não encontrado.` };
  }
  if (params.segment) {
    // Lógica para segmentar clientes (simulado)
    const segmentedCustomers = Object.values(crmDatabase).filter(c => c.preferences.includes(params.segment || ''));
    return {
      taskId: `task-crm-segment-${params.segment}`,
      status: 'completed',
      result: segmentedCustomers
    };
  }
  throw { code: 5002, message: 'Parâmetro customerId ou segment é obrigatório para tasks/get no CRMAgent.' };
};

/**
 * Handler para o método A2A 'agent/authenticatedExtendedCard'.
 * Retorna o perfil e capacidades do CRMAgent, incluindo dados do cliente se autenticado.
 */
const handleAuthenticatedExtendedCard: A2AMethodHandler = async (params: { customerId?: string }, agentId: string, apiKey: string) => {
  console.log(`[CRMAgent:${agentId}] Chamado agent/authenticatedExtendedCard com params:`, params, `API Key: ${apiKey ? 'presente' : 'ausente'}`);
  // A API Key poderia ser usada para validar o acesso aos dados do cliente
  
  let customerSpecificData = {};
  if (params.customerId && crmDatabase[params.customerId]) {
    // Em um cenário real, verificar se o solicitante tem permissão para ver estes dados
    customerSpecificData = {
      customerProfile: crmDatabase[params.customerId]
    };
  }

  const profile: A2AAgentProfile & { customerSpecificData?: any } = {
    agentId: `${AGENT_ID_PREFIX}-${agentId}`,
    name: 'CRMAgent - Gerenciador de Relacionamento com o Cliente',
    description: 'Gerencia dados, preferências e histórico de clientes para personalização e segmentação.',
    capabilities: [
      { method: 'message/send', description: 'Para enviar dados para personalização ou atualizar informações de clientes.' },
      { method: 'tasks/get', description: 'Para buscar dados de clientes ou segmentar clientes.' },
      { method: 'agent/authenticatedExtendedCard', description: 'Retorna o perfil do agente e, se autenticado e solicitado, dados específicos do cliente.' },
    ],
    ...(customerSpecificData)
  };
  return profile;
};

export const CRMAgent = {
  initialize: () => {
    registerA2AMethod('message/send', handleMessageSend);
    registerA2AMethod('tasks/get', handleTasksGet);
    registerA2AMethod('agent/authenticatedExtendedCard', handleAuthenticatedExtendedCard);
    console.log('[CRMAgent] Métodos A2A registrados.');
  }
};

console.log('[CRMAgent] Módulo carregado.');