import { registerA2AMethod, A2AMethodHandler } from '@/a2a/core/handler';
import { A2AMessageSendParams, A2AAgentProfile, A2AMessage, A2AMessagePart } from '@/types/integrations';
import { z } from 'zod';
import { a2aClient } from '@/a2a/core/a2aClient';

const AGENT_ID_PREFIX = 'promocao-agent';

// Simulação de um banco de dados ou cache para promoções
const promotionsDatabase: Record<string, any> = {
  'promo-1': { id: 'promo-1', name: 'Desconto de Fim de Semana', description: '10% de desconto em todas as pizzas.', type: 'percentage', value: 10, target: 'category_pizza', active: true },
  'promo-2': { id: 'promo-2', name: 'Leve 2 Pague 1 Refrigerantes', description: 'Compre 1 refrigerante e leve outro grátis.', type: 'bogo', target: 'item_refri_grande', active: false },
};

/**
 * Handler para o método A2A 'message/send' direcionado ao PromocaoAgent.
 * Usado para criar, atualizar ou gerenciar promoções, ou para receber gatilhos de outros agentes.
 */

// Schema para criação de promoção
const CreatePromoPayloadSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.enum(['percentage', 'bogo', 'fixed_discount']), // Adicionar outros tipos se necessário
  value: z.number().optional(), // Obrigatório para percentage e fixed_discount
  target: z.string().optional(), // Ex: 'category_pizza', 'item_refri_grande'
  targetType: z.enum(['item', 'category', 'global']).optional(),
  targetValue: z.string().optional(), // ID do item ou categoria
  active: z.boolean().optional().default(false),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Schema para o payload JSON dentro de 'parts' para (de)activate_promo e update_promo
const PromoIdPayloadSchema = z.object({
  promoId: z.string().min(1, "promoId não pode ser vazio"),
});

// Schema genérico para A2AMessageSendParams para validação inicial
const MessageSendParamsSchema = z.object({
   message: z.custom<A2AMessage>((val) => {
    // Aqui você pode adicionar uma validação mais robusta para a estrutura A2AMessage se necessário
    // Por enquanto, apenas verificamos se é um objeto e tem as propriedades messageId, role e parts.
    return typeof val === 'object' && val !== null &&
           'messageId' in val && 'role' in val && 'parts' in val && Array.isArray((val as A2AMessage).parts);
  }),
});


const handleMessageSend: A2AMethodHandler = async (params: unknown, agentId: string) => {
  const parsedParams = MessageSendParamsSchema.safeParse(params);

  if (!parsedParams.success) {
    console.error(`[PromocaoAgent:${agentId}] Erro de validação inicial em message/send:`, parsedParams.error.format());
    // Para erros de estrutura básica da mensagem, lançamos um erro JSON-RPC
    throw { 
      code: -32602, 
      message: 'Estrutura da requisição message/send inválida.', 
      data: parsedParams.error.format() 
    };
  }
  const message = parsedParams.data.message;
  console.log(`[PromocaoAgent:${agentId}] Recebido message/send:`, message);

  try {
    const actionPart = message.parts.find(p => p.type === 'text' && p.text?.startsWith('action:'));
    const triggerPart = message.parts.find(p => p.type === 'text' && p.text?.startsWith('trigger:'));
    const payloadPart = message.parts.find(p => p.type === 'json');

    // Lógica para gerenciar promoções (criar, atualizar, etc.)
    if (actionPart?.text === 'action:create_promo') {
      if (!payloadPart || !payloadPart.json) {
        // Lançar erro JSON-RPC compatível
        throw { code: -32602, message: 'Payload JSON é obrigatório para action:create_promo.' };
      }
      const validatedPayload = CreatePromoPayloadSchema.parse(payloadPart.json);
      const newPromoId = `promo-${Date.now()}`;
      const newPromo = { ...validatedPayload, id: newPromoId };
      promotionsDatabase[newPromoId] = newPromo;
      console.log(`[PromocaoAgent:${agentId}] Promoção '${newPromo.name}' (ID: ${newPromoId}) criada.`);
      
      if (newPromo.active) {
        // Notificar CardapioAgent se a promoção for criada ativa
        try {
          await a2aClient.sendStream(
            'cardapio', 'cardapio-principal',
            { 
              type: 'promotion_update', promoId: newPromo.id, active: true, 
              itemId: newPromo.targetType === 'item' ? newPromo.targetValue : undefined,
              promotionDetails: newPromo, eventId: `promo-create-${newPromo.id}-${Date.now()}`
            }
          );
          console.log(`[PromocaoAgent:${agentId}] Notificação de NOVA promoção ATIVA enviada para CardapioAgent para promoId: ${newPromo.id}`);
        } catch (clientError) {
          console.error(`[PromocaoAgent:${agentId}] Erro ao notificar CardapioAgent sobre nova promoção ativa ${newPromo.id}:`, clientError);
        }
      }
      return { responseFor: message.messageId, status: `Promoção ${newPromoId} criada.`, promoId: newPromoId };
    }
    
    // Lógica para ativar/desativar promoção
    if (actionPart?.text === 'action:activate_promo' || actionPart?.text === 'action:deactivate_promo') {
      if (!payloadPart || !payloadPart.json) {
        throw { code: -32602, message: 'Payload JSON é obrigatório para esta ação.' };
      }

      const { promoId } = PromoIdPayloadSchema.parse(payloadPart.json);
      const promotion = promotionsDatabase[promoId];

      if (!promotion) {
        // Lançar erro JSON-RPC compatível
        throw { code: 6001, message: `Promoção com ID '${promoId}' não encontrada.` };
      }

      const newStatus = actionPart.text === 'action:activate_promo';
      if (promotion.active === newStatus) {
        return { 
          responseFor: message.messageId, 
          status: `Promoção ${promoId} já está ${newStatus ? 'ativa' : 'inativa'}.` 
        };
      }

      promotion.active = newStatus;
      console.log(`[PromocaoAgent:${agentId}] Promoção '${promotion.name}' (ID: ${promoId}) foi ${newStatus ? 'ATIVADA' : 'DESATIVADA'}.`);

      // Notificar CardapioAgent sobre a mudança
      try {
        await a2aClient.sendStream(
          'cardapio', 
          'cardapio-principal', 
          {
            type: 'promotion_update',
            promoId: promoId,
            active: newStatus,
            itemId: promotion.targetType === 'item' ? promotion.targetValue : undefined,
            // Se a promoção for desativada, talvez não precise enviar promotionDetails, ou enviar um subconjunto.
            promotionDetails: newStatus ? promotion : { id: promoId, active: newStatus }, 
            eventId: `promo-status-${promoId}-${Date.now()}`
          }
        );
        console.log(`[PromocaoAgent:${agentId}] Notificação de status da promoção (${newStatus ? 'ATIVA' : 'INATIVA'}) enviada para CardapioAgent para promoId: ${promoId}`);
      } catch (clientError) {
        console.error(`[PromocaoAgent:${agentId}] Erro ao notificar CardapioAgent sobre status da promoção ${promoId}:`, clientError);
      }

      return { 
        responseFor: message.messageId, 
        status: `Promoção ${promoId} ${newStatus ? 'ativada' : 'desativada'} com sucesso.` 
      };
    }
    
    // Lógica para ativar/desativar promoção
    if (actionPart?.text === 'action:activate_promo' || actionPart?.text === 'action:deactivate_promo') {
      if (!payloadPart || !payloadPart.json) {
        throw { code: -32602, message: 'Payload JSON é obrigatório para esta ação.' };
      }

      const { promoId } = PromoIdPayloadSchema.parse(payloadPart.json);
      const promotion = promotionsDatabase[promoId];

      if (!promotion) {
        throw { code: 6001, message: `Promoção com ID '${promoId}' não encontrada.` };
      }

      const newStatus = actionPart.text === 'action:activate_promo';
      if (promotion.active === newStatus) {
        return { 
          responseFor: message.messageId, 
          status: `Promoção ${promoId} já está ${newStatus ? 'ativa' : 'inativa'}.` 
        };
      }

      promotion.active = newStatus;
      console.log(`[PromocaoAgent:${agentId}] Promoção '${promotion.name}' (ID: ${promoId}) foi ${newStatus ? 'ATIVADA' : 'DESATIVADA'}.`);

      // Notificar CardapioAgent sobre a mudança
      try {
        await a2aClient.sendStream(
          'cardapio', 
          'cardapio-principal', 
          {
            type: 'promotion_update',
            promoId: promoId,
            active: newStatus,
            itemId: promotion.targetType === 'item' ? promotion.targetValue : undefined,
            promotionDetails: newStatus ? promotion : { id: promoId, active: newStatus }, 
            eventId: `promo-status-${promoId}-${Date.now()}`
          }
        );
        console.log(`[PromocaoAgent:${agentId}] Notificação de status da promoção (${newStatus ? 'ATIVA' : 'INATIVA'}) enviada para CardapioAgent para promoId: ${promoId}`);
      } catch (clientError) {
        console.error(`[PromocaoAgent:${agentId}] Erro ao notificar CardapioAgent sobre status da promoção ${promoId}:`, clientError);
      }

      return { 
        responseFor: message.messageId, 
        status: `Promoção ${promoId} ${newStatus ? 'ativada' : 'desativada'} com sucesso.` 
      };
    }
    // TODO: Adicionar lógica para 'action:update_promo' com validação Zod

    // Lógica para receber gatilhos (ex: de AnalyticsAgent para promoções automáticas)
    if (triggerPart && payloadPart?.json) {
      const triggerData = payloadPart.json as any; // TODO: Validar triggerData com Zod se a estrutura for conhecida
      console.log(`[PromocaoAgent:${agentId}] Recebido gatilho '${triggerPart.text}' com dados:`, triggerData);

      if (triggerPart.text === 'trigger:low_sales_item') {
        const itemToPromote = triggerData.itemId; // Supondo que AnalyticsAgent envia itemId
        if (!itemToPromote) {
          console.warn(`[PromocaoAgent:${agentId}] Gatilho 'low_sales_item' recebido sem itemId.`);
          return { responseFor: message.messageId, error: 'Gatilho low_sales_item sem itemId.' };
        }
        
        let promotionActivatedOrCreated = false;
        for (const promoId in promotionsDatabase) {
          const promo = promotionsDatabase[promoId];
          if ((promo.target === itemToPromote || promo.target === `item_${itemToPromote}` || (promo.targetType === 'item' && promo.targetValue === itemToPromote)) && !promo.active) {
            promo.active = true;
            console.log(`[PromocaoAgent:${agentId}] Promoção existente '${promo.name}' (ID: ${promo.id}) ativada para o item ${itemToPromote}.`);
            try {
              await a2aClient.sendStream(
                'cardapio', 
                'cardapio-principal', 
                { 
                  type: 'promotion_update', 
                  promoId: promo.id, 
                  active: true, 
                  itemId: itemToPromote, 
                  promotionDetails: promo,
                  eventId: `promo-update-${promo.id}-${Date.now()}`
                }
              );
              console.log(`[PromocaoAgent:${agentId}] Notificação de promoção ATIVADA enviada para CardapioAgent para promoId: ${promo.id}`);
            } catch (clientError) {
              console.error(`[PromocaoAgent:${agentId}] Erro ao notificar CardapioAgent sobre ativação da promoção ${promo.id}:`, clientError);
            }
            promotionActivatedOrCreated = true;
            return { responseFor: message.messageId, status: `Promoção ${promo.id} ativada para ${itemToPromote}.` };
          }
        }

        if (!promotionActivatedOrCreated) {
          const autoPromoId = `auto-promo-${itemToPromote.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
          const autoPromo = {
            id: autoPromoId,
            name: `Promoção Automática para ${triggerData.itemName || itemToPromote}`,
            description: `Desconto especial para ${triggerData.itemName || itemToPromote}. (Gerado automaticamente)`,
            type: 'percentage', value: 15, target: itemToPromote, targetType: 'item', targetValue: itemToPromote,
            active: true, autoGenerated: true, startDate: new Date().toISOString(),
          };
          promotionsDatabase[autoPromoId] = autoPromo;
          console.log(`[PromocaoAgent:${agentId}] Nova promoção automática '${autoPromo.name}' (ID: ${autoPromoId}) criada e ativada para o item ${itemToPromote}.`);
          try {
            await a2aClient.sendStream(
              'cardapio', 
              'cardapio-principal',
              { 
                type: 'promotion_update', 
                promoId: autoPromo.id, 
                active: true, 
                itemId: itemToPromote, 
                promotionDetails: autoPromo,
                eventId: `promo-update-${autoPromo.id}-${Date.now()}`
              }
            );
            console.log(`[PromocaoAgent:${agentId}] Notificação de NOVA promoção enviada para CardapioAgent para promoId: ${autoPromo.id}`);
          } catch (clientError) {
            console.error(`[PromocaoAgent:${agentId}] Erro ao notificar CardapioAgent sobre nova promoção ${autoPromo.id}:`, clientError);
          }
          return { responseFor: message.messageId, status: `Nova promoção automática ${autoPromoId} criada e ativada para ${itemToPromote}.`, promoId: autoPromoId };
        }
      }
      return { responseFor: message.messageId, reply: `Gatilho '${triggerPart.text}' processado.` };
    }

    // Se nenhuma ação ou gatilho corresponder
    console.warn(`[PromocaoAgent:${agentId}] Nenhuma ação ou gatilho reconhecido para a mensagem:`, message);
    throw { code: -32601, message: 'Ação de promoção ou gatilho não reconhecido, ou dados insuficientes.' };

  } catch (error) {
    // Tratamento de erro aprimorado para retornar erros JSON-RPC
    if (error instanceof z.ZodError) {
      console.error(`[PromocaoAgent:${agentId}] Erro de validação Zod em message/send:`, error.errors);
      throw { 
        code: -32602, // Invalid params
        message: 'Parâmetros de payload inválidos para a ação.', 
        data: error.format() 
      };
    }
    // Se o erro já for um objeto de erro JSON-RPC, propague-o
    if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        throw error;
    }
    // Para outros erros inesperados
    console.error(`[PromocaoAgent:${agentId}] Erro inesperado em message/send:`, error);
    throw { 
      code: -32000, // Internal server error
      message: 'Erro interno do servidor ao processar message/send no PromocaoAgent.' 
    };
  }
};

/**
 * Handler para o método A2A 'tasks/get' para buscar informações sobre promoções.
 */
const TasksGetParamsSchema = z.object({
  promotionId: z.string().optional(),
  listActive: z.boolean().optional(),
});

const handleTasksGet: A2AMethodHandler = async (params: unknown, agentId: string) => {
  try {
    const validatedParams = TasksGetParamsSchema.parse(params);
    console.log(`[PromocaoAgent:${agentId}] Chamado tasks/get com params:`, validatedParams);

    if (validatedParams.promotionId) {
      const promotion = promotionsDatabase[validatedParams.promotionId];
      if (promotion) {
        return {
          taskId: `task-promo-${validatedParams.promotionId}`,
          status: 'completed',
          result: promotion
        };
      }
      throw { code: 6001, message: `Promoção com ID '${validatedParams.promotionId}' não encontrada.` };
    }
    if (validatedParams.listActive) {
      const activePromotions = Object.values(promotionsDatabase).filter(p => p.active);
      return {
        taskId: `task-promo-list-active-${Date.now()}`,
        status: 'completed',
        result: activePromotions
      };
    }
    // Retornar todas as promoções por padrão se nenhum filtro específico for fornecido
    return {
      taskId: `task-promo-list-all-${Date.now()}`,
      status: 'completed',
      result: Object.values(promotionsDatabase)
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[PromocaoAgent:${agentId}] Erro de validação em tasks/get:`, error.errors);
      throw { code: -32602, message: 'Parâmetros inválidos para tasks/get.', data: error.format() };
    }
    console.error(`[PromocaoAgent:${agentId}] Erro em tasks/get:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        throw error;
    }
    throw { code: -32000, message: 'Erro interno do servidor ao processar tasks/get no PromocaoAgent.' };
  }
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
    description: 'Gerencia promoções, campanhas e ofertas especiais, com capacidade para personalização e automação.',
    capabilities: [
      { method: 'promocao/message/send', description: 'Para criar, atualizar, ativar ou desativar promoções.' },
      { method: 'promocao/tasks/get', description: 'Para buscar informações sobre promoções ativas ou específicas.' },
      { method: 'agent/authenticatedExtendedCard', description: 'Retorna o perfil e capacidades deste agente.' },
      // Em uma implementação real, poderia ter 'tasks/subscribe' para ser notificado sobre eventos que disparam promoções
    ],
  };
  return profile;
};

export const PromocaoAgent = {
  initialize: () => {
    registerA2AMethod('promocao/message/send', handleMessageSend);
    registerA2AMethod('promocao/tasks/get', handleTasksGet);
    registerA2AMethod('agent/authenticatedExtendedCard', handleAuthenticatedExtendedCard); // Sem prefixo
    console.log('[PromocaoAgent] Métodos A2A registrados com prefixo "promocao/".');
  }
};

console.log('[PromocaoAgent] Módulo carregado.');