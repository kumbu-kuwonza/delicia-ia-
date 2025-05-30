import { registerA2AMethod, A2AMethodHandler } from '@/a2a/core/handler';
import { A2AMessageSendParams, A2AAgentProfile, A2AMessage } from '@/types/integrations';

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
const handleMessageSend: A2AMethodHandler = async (params: A2AMessageSendParams, agentId: string) => {
  console.log(`[PromocaoAgent:${agentId}] Recebido message/send:`, params.message);
  const message = params.message;
  const actionPart = message.parts.find(p => p.type === 'text' && p.text?.startsWith('action:'));
  const triggerPart = message.parts.find(p => p.type === 'text' && p.text?.startsWith('trigger:'));
  const payloadPart = message.parts.find(p => p.type === 'json'); // Supondo que os dados/payload vêm como JSON

  // Lógica para gerenciar promoções (criar, atualizar, etc.)
  if (actionPart?.text === 'action:create_promo' && payloadPart?.json) {
    const newPromoData = payloadPart.json as any;
    const newPromoId = `promo-${Date.now()}`;
    const newPromo = { ...newPromoData, id: newPromoId, active: newPromoData.active !== undefined ? newPromoData.active : false };
    promotionsDatabase[newPromoId] = newPromo;
    console.log(`[PromocaoAgent:${agentId}] Promoção '${newPromo.name}' (ID: ${newPromoId}) criada.`);
    return { responseFor: message.messageId, status: `Promoção ${newPromoId} criada.`, promoId: newPromoId };
  }
  // TODO: Adicionar mais lógicas para 'action:update_promo', 'action:activate_promo', 'action:deactivate_promo'

  // Lógica para receber gatilhos (ex: de AnalyticsAgent para promoções automáticas)
  if (triggerPart && payloadPart?.json) {
    const triggerData = payloadPart.json as any;
    console.log(`[PromocaoAgent:${agentId}] Recebido gatilho '${triggerPart.text}' com dados:`, triggerData);

    if (triggerPart.text === 'trigger:low_sales_item') {
      const itemToPromote = triggerData.itemId;
      if (!itemToPromote) {
        console.warn(`[PromocaoAgent:${agentId}] Gatilho 'low_sales_item' recebido sem itemId.`);
        return { responseFor: message.messageId, error: 'Gatilho low_sales_item sem itemId.' };
      }
      
      let promotionActivatedOrCreated = false;
      // Tenta ativar uma promoção existente para o item alvo que esteja inativa
      for (const promoId in promotionsDatabase) {
        const promo = promotionsDatabase[promoId];
        if ((promo.target === itemToPromote || promo.target === `item_${itemToPromote}` || (promo.targetType === 'item' && promo.targetValue === itemToPromote)) && !promo.active) {
          promo.active = true;
          console.log(`[PromocaoAgent:${agentId}] Promoção existente '${promo.name}' (ID: ${promo.id}) ativada para o item ${itemToPromote}.`);
          // TODO: Enviar message/send ou message/stream para CardapioAgent para refletir a promoção no cardápio.
          // Ex: await a2aClient.sendMessage('cardapio-agent-default', 'message/stream', { type: 'promotion_update', promoId: promo.id, active: true, itemId: itemToPromote });
          promotionActivatedOrCreated = true;
          return { responseFor: message.messageId, status: `Promoção ${promo.id} ativada para ${itemToPromote}.` };
        }
      }

      // Se nenhuma promoção existente foi ativada, cria uma nova promoção automática
      if (!promotionActivatedOrCreated) {
        const autoPromoId = `auto-promo-${itemToPromote.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now()}`;
        const autoPromo = {
          id: autoPromoId,
          name: `Promoção Automática para ${triggerData.itemName || itemToPromote}`,
          description: `Desconto especial para ${triggerData.itemName || itemToPromote} devido à baixa saída. (Gerado automaticamente)`,
          type: 'percentage', // Exemplo de tipo de promoção
          value: 15, // Exemplo de valor (15%)
          target: itemToPromote, // Ou targetType: 'item', targetValue: itemToPromote
          targetType: 'item',
          targetValue: itemToPromote,
          active: true,
          autoGenerated: true,
          startDate: new Date().toISOString(),
          // endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Ex: válida por 7 dias
        };
        promotionsDatabase[autoPromoId] = autoPromo;
        console.log(`[PromocaoAgent:${agentId}] Nova promoção automática '${autoPromo.name}' (ID: ${autoPromoId}) criada e ativada para o item ${itemToPromote}.`);
        // TODO: Enviar message/send ou message/stream para CardapioAgent
        return { responseFor: message.messageId, status: `Nova promoção automática ${autoPromoId} criada e ativada para ${itemToPromote}.`, promoId: autoPromoId };
      }
    }
    // Adicionar outros tipos de gatilhos aqui (ex: 'trigger:customer_segment_opportunity')
    return { responseFor: message.messageId, reply: `Gatilho '${triggerPart.text}' processado.` };
  }

  return { responseFor: message.messageId, reply: 'Ação de promoção ou gatilho não reconhecido, ou dados insuficientes.' };
};

/**
 * Handler para o método A2A 'tasks/get' para buscar informações sobre promoções.
 */
const handleTasksGet: A2AMethodHandler = async (params: { promotionId?: string; listActive?: boolean }, agentId: string) => {
  console.log(`[PromocaoAgent:${agentId}] Chamado tasks/get com params:`, params);
  if (params.promotionId) {
    const promotion = promotionsDatabase[params.promotionId];
    if (promotion) {
      return {
        taskId: `task-promo-${params.promotionId}`,
        status: 'completed',
        result: promotion
      };
    }
    throw { code: 6001, message: `Promoção com ID '${params.promotionId}' não encontrada.` };
  }
  if (params.listActive) {
    const activePromotions = Object.values(promotionsDatabase).filter(p => p.active);
    return {
      taskId: `task-promo-list-active-${Date.now()}`,
      status: 'completed',
      result: activePromotions
    };
  }
  // Retornar todas as promoções por padrão
  return {
    taskId: `task-promo-list-all-${Date.now()}`,
    status: 'completed',
    result: Object.values(promotionsDatabase)
  };
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
      { method: 'message/send', description: 'Para criar, atualizar, ativar ou desativar promoções.' },
      { method: 'tasks/get', description: 'Para buscar informações sobre promoções ativas ou específicas.' },
      { method: 'agent/authenticatedExtendedCard', description: 'Retorna o perfil e capacidades deste agente.' },
      // Em uma implementação real, poderia ter 'tasks/subscribe' para ser notificado sobre eventos que disparam promoções
    ],
  };
  return profile;
};

export const PromocaoAgent = {
  initialize: () => {
    registerA2AMethod('message/send', handleMessageSend);
    registerA2AMethod('tasks/get', handleTasksGet);
    registerA2AMethod('agent/authenticatedExtendedCard', handleAuthenticatedExtendedCard);
    console.log('[PromocaoAgent] Métodos A2A registrados.');
  }
};

console.log('[PromocaoAgent] Módulo carregado.');