import { registerA2AMethod, A2AMethodHandler } from '@/a2a/core/handler';
import { A2AMessageSendParams, A2AAgentProfile, A2AMessage, A2AMessagePart, A2AMessagePartFile } from '@/types/integrations';

const AGENT_ID_PREFIX = 'whatsapp-agent';

// Simulação de interações com a API do WhatsApp

/**
 * Handler para o método A2A 'message/send' direcionado ao WhatsAppAgent.
 * Usado para enviar mensagens para clientes via WhatsApp ou receber mensagens deles.
 */
const handleMessageSend: A2AMethodHandler = async (params: A2AMessageSendParams, agentId: string) => {
  console.log(`[WhatsAppAgent:${agentId}] Recebido message/send:`, params.message);
  const message = params.message;
  const customerId = message.role === 'user' ? message.messageId : 'system-user'; // Simular ID do cliente

  // Se a mensagem for do sistema/outro agente para o cliente
  if (message.role === 'assistant' || message.role === 'system') {
    const textPart = message.parts.find(p => p.type === 'text')?.text;
    const filePart = message.parts.find(p => p.type === 'file')?.file;

    console.log(`[WhatsAppAgent:${agentId}] Enviando para cliente ${customerId} via WhatsApp (simulado):`);
    if (textPart) {
      console.log(`  Texto: ${textPart}`);
    }
    if (filePart) {
      console.log(`  Arquivo: ${filePart.name} (${filePart.mimeType})`);
      // Lógica para enviar o arquivo via API do WhatsApp
    }
    return { responseFor: message.messageId, status: 'Message sent to WhatsApp (simulated)' };
  }

  // Se a mensagem for do cliente (usuário) para o sistema
  if (message.role === 'user') {
    const textQuery = message.parts.find(p => p.type === 'text')?.text?.toLowerCase();
    console.log(`[WhatsAppAgent:${agentId}] Mensagem recebida do cliente ${customerId} via WhatsApp: "${textQuery}"`);

    // Exemplo: Cliente pergunta sobre um prato, encaminhar para CardapioAgent
    if (textQuery?.includes('detalhes do prato')) {
      const dishNameMatch = textQuery.match(/detalhes do prato (\w+)/);
      const dishName = dishNameMatch ? dishNameMatch[1] : 'desconhecido';
      console.log(`[WhatsAppAgent:${agentId}] Cliente perguntou sobre o prato '${dishName}'. Consultando CardapioAgent (simulado)...`);
      // Em um cenário real: 
      // const cardapioResponse = await a2aClient.sendMessage('cardapio-agent-id', 'message/send', 
      //   { message: { role: 'user', parts: [{type: 'text', text: `info ${dishName}`}], messageId: `wa-${message.messageId}` } }
      // );
      // await handleMessageSend({ message: { role: 'assistant', parts: [{type: 'text', text: `Cardapio diz: ${cardapioResponse.reply}`}], messageId: 'system-reply'}}, agentId);
      return { responseFor: message.messageId, reply: `Consultando CardapioAgent sobre '${dishName}'... (simulado)` };
    }
    return { responseFor: message.messageId, reply: 'Mensagem do cliente recebida e processada (simulado).' };
  }

  return { responseFor: message.messageId, reply: 'Tipo de mensagem não suportado para WhatsAppAgent.' };
};

/**
 * Handler para o método A2A 'message/stream' para receber atualizações (ex: status de pedido do PedidosAgent).
 */
const handleMessageStream: A2AMethodHandler = async (params: { orderId?: string; status?: string; customerId?: string }, agentId: string) => {
  console.log(`[WhatsAppAgent:${agentId}] Recebido message/stream (ex: atualização de status de pedido):`, params);
  if (params.orderId && params.status && params.customerId) {
    const messageToCustomer = `Olá! O status do seu pedido ${params.orderId} foi atualizado para: ${params.status}.`;
    console.log(`[WhatsAppAgent:${agentId}] Enviando atualização para cliente ${params.customerId} via WhatsApp: "${messageToCustomer}" (simulado)`);
    // Lógica para enviar a mensagem via API do WhatsApp
    return { status: 'success', message: `Atualização do pedido ${params.orderId} enviada para ${params.customerId} via WhatsApp.` };
  }
  return { status: 'warning', message: 'Dados insuficientes na atualização de stream para WhatsApp.' };
};

/**
 * Handler para o método A2A 'file/upload' (simulado).
 * O WhatsAppAgent poderia usar isso para receber um arquivo do sistema (ex: imagem de um prato do CardapioAgent)
 * para então enviar ao cliente.
 */
const handleFileUpload: A2AMethodHandler = async (params: { file: A2AMessagePartFile, customerId: string, caption?: string }, agentId: string) => {
  console.log(`[WhatsAppAgent:${agentId}] Recebido file/upload para cliente ${params.customerId}:`, params.file.name);
  // Lógica para enviar o arquivo recebido para o cliente via WhatsApp
  console.log(`[WhatsAppAgent:${agentId}] Enviando arquivo ${params.file.name} para ${params.customerId} com legenda "${params.caption || ''}" (simulado).`);
  return { status: 'success', messageId: `whatsapp-file-${Date.now()}`, description: `Arquivo ${params.file.name} enviado para ${params.customerId}.` };
};

/**
 * Handler para o método A2A 'agent/authenticatedExtendedCard'.
 * Retorna o perfil e capacidades do WhatsAppAgent.
 */
const handleAuthenticatedExtendedCard: A2AMethodHandler = async (params: any, agentId: string) => {
  console.log(`[WhatsAppAgent:${agentId}] Chamado agent/authenticatedExtendedCard com params:`, params);
  const profile: A2AAgentProfile = {
    agentId: `${AGENT_ID_PREFIX}-${agentId}`,
    name: 'WhatsAppAgent - Interface de Atendimento via WhatsApp',
    description: 'Faz a ponte entre o sistema SaaS e a API do WhatsApp para comunicação com clientes.',
    capabilities: [
      { method: 'message/send', description: 'Para enviar e receber mensagens de texto e mídia para/de clientes via WhatsApp.' },
      { method: 'message/stream', description: 'Recebe atualizações em tempo real (ex: status de pedido) para encaminhar aos clientes.' },
      { method: 'file/upload', description: 'Recebe arquivos de outros agentes para enviar aos clientes via WhatsApp (ex: imagem de prato).' },
      { method: 'agent/authenticatedExtendedCard', description: 'Retorna o perfil e capacidades deste agente.' },
    ],
  };
  return profile;
};

export const WhatsAppAgent = {
  initialize: () => {
    registerA2AMethod('message/send', handleMessageSend);
    registerA2AMethod('message/stream', handleMessageStream);
    registerA2AMethod('file/upload', handleFileUpload);
    registerA2AMethod('agent/authenticatedExtendedCard', handleAuthenticatedExtendedCard);
    console.log('[WhatsAppAgent] Métodos A2A registrados.');
  }
};

console.log('[WhatsAppAgent] Módulo carregado.');