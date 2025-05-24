import { registerA2AMethod, A2AMethodHandler } from '@/a2a/core/handler';
import { A2AMessageSendParams, A2AAgentProfile, A2AMessagePartFile } from '@/types/integrations';
import { z } from 'zod'; // Import Zod

const AGENT_ID_PREFIX = 'whatsapp-agent';

// TODO: Definir interface para parâmetros de file/upload se necessário
// interface A2AFileUploadParams {
//   file: A2AMessagePartFile;
//   caption?: string;
//   recipient: string; // Ex: WhatsApp ID do destinatário
// }

// TODO: Adicionar validação Zod para handleMessageSend se a estrutura do payload for definida
const handleMessageSend: A2AMethodHandler = async (params: A2AMessageSendParams, agentId: string) => {
  console.log(`[WhatsAppAgent:${agentId}] Recebido message/send:`, params.message);
  // TODO: Implementar lógica para enviar mensagens para o WhatsApp (via API externa)
  // TODO: Considerar como receber mensagens do WhatsApp (webhook -> este agente via A2A?)
  return { responseFor: params.message.messageId, reply: 'Mensagem recebida pelo WhatsAppAgent (TODO: implementar envio).' };
};

// Schema para os parâmetros esperados no stream (ex: atualização de status de pedido)
const WhatsAppStreamParamsSchema = z.object({
  type: z.string(), // Ex: 'order_status_update', 'delivery_notification'
  orderId: z.string().optional(),
  status: z.string().optional(),
  customerPhone: z.string(), // Número do cliente para enviar a mensagem
  messageContent: z.string(), // Conteúdo da mensagem a ser enviada
  eventId: z.string().optional(), // ID do evento de stream para ack
});

const handleMessageStream: A2AMethodHandler = async (params: unknown, agentId: string) => {
  try {
    const validatedParams = WhatsAppStreamParamsSchema.parse(params);
    console.log(`[WhatsAppAgent:${agentId}] Recebido message/stream:`, validatedParams);
    
    // TODO: Formatar a mensagem com base em validatedParams.type, status, etc.
    // TODO: Usar um template de mensagem se necessário.
    // TODO: Implementar o envio real da mensagem para validatedParams.customerPhone com validatedParams.messageContent
    
    console.log(`[WhatsAppAgent:${agentId}] Simulação de envio de mensagem para ${validatedParams.customerPhone}: "${validatedParams.messageContent}" (relacionado a ${validatedParams.orderId || 'N/A'})`);
    
    return { status: 'received', processed: true, eventAck: validatedParams.eventId };
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[WhatsAppAgent:${agentId}] Erro de validação em message/stream:`, error.errors);
      return { status: 'received', processed: false, error: 'Parâmetros de stream inválidos.', data: error.format(), eventAck: (params as any)?.eventId };
    }
    console.error(`[WhatsAppAgent:${agentId}] Erro não Zod em message/stream:`, error);
    return { status: 'received', processed: false, error: 'Erro interno ao processar stream.', eventAck: (params as any)?.eventId };
  }
};

// Schema para os parâmetros de file/upload
const FileUploadParamsSchema = z.object({
  file: z.custom<A2AMessagePartFile>(val => { // Validação customizada para A2AMessagePartFile
    return typeof val === 'object' && val !== null &&
           'name' in val && typeof (val as any).name === 'string' &&
           'mimeType' in val && typeof (val as any).mimeType === 'string' &&
           'bytes' in val && typeof (val as any).bytes === 'string';
  }),
  recipient: z.string(), // Ex: WhatsApp ID do destinatário
  caption: z.string().optional(),
});

const handleFileUpload: A2AMethodHandler = async (params: unknown, agentId: string) => {
  try {
    const validatedParams = FileUploadParamsSchema.parse(params);
    console.log(`[WhatsAppAgent:${agentId}] Recebido file/upload:`, validatedParams);
    
    const { file: fileDetails, recipient, caption } = validatedParams;

    // TODO: Implementar lógica para fazer upload do arquivo (ex: imagem, documento) para o WhatsApp.
    // Isso envolveria decodificar fileDetails.bytes (Base64) e usar a API do WhatsApp.
    console.log(`[WhatsAppAgent:${agentId}] Simulação de upload do arquivo ${fileDetails.name} (caption: ${caption || 'N/A'}) para ${recipient}.`);
    return {
      status: 'success', // Manter como está, pois file/upload não é um stream receptor como os outros
      message: `Arquivo ${fileDetails.name} recebido para upload (TODO: implementar upload real).`,
      fileUrl_simulated: `https://simulated.whatsapp.cdn/${fileDetails.name}`
    };

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`[WhatsAppAgent:${agentId}] Erro de validação em file/upload:`, error.errors);
      throw { code: -32602, message: 'Parâmetros inválidos para file/upload.', data: error.format() };
    }
    console.error(`[WhatsAppAgent:${agentId}] Erro em file/upload:`, error);
    if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
        throw error;
    }
    throw { code: -32000, message: 'Erro interno do servidor ao processar file/upload no WhatsAppAgent.' };
  }
};

const handleAuthenticatedExtendedCard: A2AMethodHandler = async (params: any, agentId: string) => { // TODO: Adicionar validação Zod se params forem usados
  const profile: A2AAgentProfile = {
  const recipient = params.recipient;

  if (!fileDetails || !recipient) {
    throw { code: 7001, message: 'Parâmetros file e recipient são obrigatórios para file/upload.' };
  }
  // TODO: Implementar lógica para fazer upload do arquivo (ex: imagem, documento) para o WhatsApp.
  // Isso envolveria decodificar fileDetails.bytes (Base64) e usar a API do WhatsApp.
  console.log(`[WhatsAppAgent:${agentId}] Simulação de upload do arquivo ${fileDetails.name} para ${recipient}.`);
  return {
    status: 'success',
    message: `Arquivo ${fileDetails.name} recebido para upload (TODO: implementar upload real).`,
    fileUrl_simulated: `https://simulated.whatsapp.cdn/${fileDetails.name}` // URL simulada
  };
};

const handleAuthenticatedExtendedCard: A2AMethodHandler = async (params: any, agentId: string) => {
  const profile: A2AAgentProfile = {
    agentId: `${AGENT_ID_PREFIX}-${agentId}`,
    name: 'WhatsAppAgent - Interface de Comunicação WhatsApp',
    description: 'Envia e recebe mensagens e mídias via WhatsApp.',
    capabilities: [
      { method: 'whatsapp/message/send', description: 'Envia mensagens de texto para usuários do WhatsApp.' },
      { method: 'whatsapp/message/stream', description: 'Recebe atualizações de outros agentes para notificar usuários.' },
      { method: 'whatsapp/file/upload', description: 'Faz upload de arquivos (imagens, documentos) para enviar via WhatsApp.' },
      { method: 'agent/authenticatedExtendedCard', description: 'Retorna o perfil e capacidades deste agente.' },
    ],
  };
  return profile;
};

export const WhatsAppAgent = {
  initialize: () => {
    registerA2AMethod('whatsapp/message/send', handleMessageSend);
    registerA2AMethod('whatsapp/message/stream', handleMessageStream);
    registerA2AMethod('whatsapp/file/upload', handleFileUpload);
    registerA2AMethod('agent/authenticatedExtendedCard', handleAuthenticatedExtendedCard);
    console.log('[WhatsAppAgent] Métodos A2A registrados.');
  }
};

console.log('[WhatsAppAgent] Módulo carregado.');
