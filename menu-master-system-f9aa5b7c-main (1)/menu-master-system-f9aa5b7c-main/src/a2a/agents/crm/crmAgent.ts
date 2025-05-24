import { registerA2AMethod, A2AMethodHandler } from '@/a2a/core/handler';
import { A2AMessageSendParams, A2AAgentProfile, A2AMessage } from '@/types/integrations';
import { z } from 'zod';

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
// Schema para o payload de atualização de preferências (exemplo)
const UpdatePreferencesPayloadSchema = z.object({
  preferences: z.array(z.string()),
});

const handleMessageSend: A2AMethodHandler = async (params: unknown, agentId: string) => {
  const messageSendParamsSchema = z.object({ message: z.custom<A2AMessage>() });
  const parsedParams = messageSendParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    console.error(`[CRMAgent:${agentId}] Erro de validação inicial em message/send:`, parsedParams.error.format());
    throw { code: -32602, message: 'Parâmetros de message/send inválidos.', data: parsedParams.error.format() };
  }
  const message = parsedParams.data.message;
  console.log(`[CRMAgent:${agentId}] Recebido message/send:`, message);
  
  try {
    const customerIdPart = message.parts.find(p => p.type === 'text' && p.text?.startsWith('customerId:'));
    const customerId = customerIdPart?.text?.split(':')[1]?.trim();
    
    const actionUpdatePrefs = message.parts.some(p => p.type === 'text' && p.text?.includes('action:update_preferences'));
    const jsonPayloadPart = message.parts.find(p => p.type === 'json')?.json;

    if (customerId && actionUpdatePrefs && jsonPayloadPart) {
      if (!crmDatabase[customerId]) {
        throw { code: 5003, message: `Cliente com ID '${customerId}' não encontrado para atualização de preferências.` };
      }
      const validatedPayload = UpdatePreferencesPayloadSchema.parse(jsonPayloadPart);
      crmDatabase[customerId].preferences = validatedPayload.preferences; 
      console.log(`[CRMAgent:${agentId}] Preferências do cliente ${customerId} atualizadas para:`, validatedPayload.preferences);
      return { responseFor: message.messageId, status: `Preferências de ${customerId} atualizadas.` };
    }
    
    // TODO: Adicionar outras ações para message/send, como 'action:record_interaction' com seu próprio schema Zod
    
    return { responseFor: message.messageId, reply: 'Ação não reconhecida ou dados insuficientes no CRMAgent message/send.' };

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[CRMAgent:${agentId}] Erro de validação Zod em message/send:`, error.errors);
      throw { code: -32602, message: 'Payload inválido para a ação de message/send.', data: error.format() };
    }
    console.error(`[CRMAgent:${agentId}] Erro em message/send:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        throw error;
    }
    throw { code: -32000, message: 'Erro interno do servidor ao processar message/send no CRMAgent.' };
  }
};

/**
 * Handler para o método A2A 'tasks/get' para buscar dados de clientes.
 */
const CrmTasksGetParamsSchema = z.object({
  customerId: z.string().optional(),
  segment: z.string().optional(),
}).refine(data => data.customerId || data.segment, {
  message: "Pelo menos customerId ou segment deve ser fornecido.",
});

const handleTasksGet: A2AMethodHandler = async (params: unknown, agentId: string) => {
  try {
    const validatedParams = CrmTasksGetParamsSchema.parse(params);
    console.log(`[CRMAgent:${agentId}] Chamado tasks/get com params:`, validatedParams);

    if (validatedParams.customerId) {
      const customerData = crmDatabase[validatedParams.customerId];
      if (customerData) {
        return {
          taskId: `task-crm-${validatedParams.customerId}`,
          status: 'completed',
          result: customerData
        };
      }
      throw { code: 5001, message: `Cliente com ID '${validatedParams.customerId}' não encontrado.` };
    }
    if (validatedParams.segment) {
      // Lógica para segmentar clientes (simulado)
      const segmentedCustomers = Object.values(crmDatabase).filter(c => {
        // Assegura que c.preferences existe e é um array antes de chamar .includes()
        return Array.isArray(c.preferences) && c.preferences.includes(validatedParams.segment || '');
      });
      return {
        taskId: `task-crm-segment-${validatedParams.segment}`,
        status: 'completed',
        result: segmentedCustomers
      };
    }
    // Esta linha não deve ser alcançada devido ao .refine, mas por segurança:
    throw { code: 5002, message: 'Parâmetro customerId ou segment é obrigatório para tasks/get no CRMAgent.' };

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[CRMAgent:${agentId}] Erro de validação em tasks/get:`, error.errors);
      throw { code: -32602, message: 'Parâmetros inválidos para tasks/get.', data: error.format() };
    }
    console.error(`[CRMAgent:${agentId}] Erro em tasks/get:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        throw error;
    }
    throw { code: -32000, message: 'Erro interno do servidor ao processar tasks/get no CRMAgent.' };
  }
};

/**
 * Handler para o método A2A 'agent/authenticatedExtendedCard'.
 * Retorna o perfil e capacidades do CRMAgent, incluindo dados do cliente se autenticado.
 */
const AuthExtendedCardParamsSchema = z.object({
  customerId: z.string().optional(),
  // Outros parâmetros que podem ser relevantes para este método
});

const handleAuthenticatedExtendedCard: A2AMethodHandler = async (params: unknown, agentId: string, apiKey: string) => {
  try {
    const validatedParams = AuthExtendedCardParamsSchema.parse(params);
    console.log(`[CRMAgent:${agentId}] Chamado agent/authenticatedExtendedCard com params:`, validatedParams, `API Key: ${apiKey ? 'presente' : 'ausente'}`);
    
    let customerSpecificData = {};
    if (validatedParams.customerId && crmDatabase[validatedParams.customerId]) {
      // Em um cenário real, verificar se o solicitante (identificado pela apiKey, por exemplo) 
      // tem permissão para ver estes dados.
      console.log(`[CRMAgent:${agentId}] API Key ${apiKey} está tentando acessar dados do cliente ${validatedParams.customerId}. (Validação de acesso simulada)`);
      customerSpecificData = {
        customerProfile: crmDatabase[validatedParams.customerId]
      };
    }

    const profile: A2AAgentProfile & { customerSpecificData?: any } = {
      agentId: `${AGENT_ID_PREFIX}-${agentId}`,
      name: 'CRMAgent - Gerenciador de Relacionamento com o Cliente',
      description: 'Gerencia dados, preferências e histórico de clientes para personalização e segmentação.',
      capabilities: [
        { method: 'crm/message/send', description: 'Para enviar dados para personalização ou atualizar informações de clientes.' },
        { method: 'crm/tasks/get', description: 'Para buscar dados de clientes ou segmentar clientes.' },
        { method: 'agent/authenticatedExtendedCard', description: 'Retorna o perfil do agente e, se autenticado e solicitado, dados específicos do cliente.' },
      ],
      ...(customerSpecificData)
    };
    return profile;

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[CRMAgent:${agentId}] Erro de validação em agent/authenticatedExtendedCard:`, error.errors);
      throw { code: -32602, message: 'Parâmetros inválidos para agent/authenticatedExtendedCard.', data: error.format() };
    }
    console.error(`[CRMAgent:${agentId}] Erro em agent/authenticatedExtendedCard:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        throw error;
    }
    throw { code: -32000, message: 'Erro interno do servidor ao processar agent/authenticatedExtendedCard no CRMAgent.' };
  }
};

export const CRMAgent = {
  initialize: () => {
    registerA2AMethod('crm/message/send', handleMessageSend); 
    registerA2AMethod('crm/tasks/get', handleTasksGet);
    registerA2AMethod('agent/authenticatedExtendedCard', handleAuthenticatedExtendedCard); // Sem prefixo
    console.log('[CRMAgent] Métodos A2A registrados com prefixo "crm/".');
  }
};
    agentId: `${AGENT_ID_PREFIX}-${agentId}`,
    name: 'CRMAgent - Gerenciador de Relacionamento com o Cliente',
    description: 'Gerencia dados, preferências e histórico de clientes para personalização e segmentação.',
    capabilities: [
      { method: 'crm/message/send', description: 'Para enviar dados para personalização ou atualizar informações de clientes.' },
      { method: 'crm/tasks/get', description: 'Para buscar dados de clientes ou segmentar clientes.' },
      { method: 'agent/authenticatedExtendedCard', description: 'Retorna o perfil do agente e, se autenticado e solicitado, dados específicos do cliente.' },
    ],
    ...(customerSpecificData)
  };
  return profile;
};

export const CRMAgent = {
  initialize: () => {
    registerA2AMethod('crm/message/send', handleMessageSend);
    registerA2AMethod('crm/tasks/get', handleTasksGet);
    registerA2AMethod('agent/authenticatedExtendedCard', handleAuthenticatedExtendedCard); // Sem prefixo
    console.log('[CRMAgent] Métodos A2A registrados com prefixo "crm/".');
  }
};

console.log('[CRMAgent] Módulo carregado.');