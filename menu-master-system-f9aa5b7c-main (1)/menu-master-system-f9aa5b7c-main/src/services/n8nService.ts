import { N8NConfig } from '@/types/integrations';
import { Order, Product } from '@/types'; // Supondo que você tenha tipos Order e Product

// Esta seria a configuração carregada do painel administrativo
let currentN8NConfig: N8NConfig | null = null;

/**
 * Configura o serviço N8N com a URL do webhook e chave de API (opcional).
 * @param config Configuração do N8N.
 */
export const configureN8N = (config: N8NConfig): void => {
  currentN8NConfig = config;
  console.log('[N8NService] Configurado:', config);
};

/**
 * Envia dados para um webhook N8N.
 * @param payload Os dados a serem enviados para o N8N.
 * @param eventType Opcional. Um tipo de evento para ajudar o N8N a rotear o webhook.
 * @returns A resposta do webhook N8N (geralmente um status de sucesso).
 */
export class N8NServiceError extends Error {
  constructor(message: string, public status?: number, public details?: any) {
    super(message);
    this.name = 'N8NServiceError';
  }
}

export const sendToN8NWebhook = async (
  payload: Record<string, any>,
  eventType?: string
): Promise<any> => {
  if (!currentN8NConfig || !currentN8NConfig.enabled) {
    throw new N8NServiceError('N8N não está configurado ou habilitado.');
  }

  if (!currentN8NConfig.webhookUrl) {
    throw new N8NServiceError('URL do webhook N8N não configurada.');
  }
  if (!payload || Object.keys(payload).length === 0) {
    throw new N8NServiceError('O payload não pode estar vazio.');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (currentN8NConfig.apiKey) {
    // A forma de autenticação pode variar (ex: Bearer token, query param, etc.)
    // Ajuste conforme a configuração do seu webhook N8N.
    headers['Authorization'] = `Bearer ${currentN8NConfig.apiKey}`;
    // Ou, se for uma chave de API genérica, pode ser um header customizado:
    // headers['X-N8N-API-KEY'] = currentN8NConfig.apiKey;
  }

  const body = {
    event: eventType || 'generic_event',
    data: payload,
    timestamp: new Date().toISOString(),
  };

  try {
    console.log('[N8NService] Enviando dados para N8N:', currentN8NConfig.webhookUrl, 'com corpo:', body);
    const response = await fetch(currentN8NConfig.webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      console.error('[N8NService] Erro no webhook N8N:', response.status, errorData);
      throw new N8NServiceError(`Erro ao enviar para N8N: ${response.status}`, response.status, errorData);
    }
    
    // N8N webhooks podem não retornar um corpo JSON significativo, apenas status.
    // Se o seu workflow N8N retornar dados, você pode tentar response.json()
    const responseData = await response.text(); // Ou response.json() se aplicável
    console.log('[N8NService] Resposta do N8N:', responseData);
    return { success: true, response: responseData };
  } catch (error) {
    if (error instanceof N8NServiceError) {
      throw error;
    }
    console.error('[N8NService] Falha ao enviar para N8N:', error);
    throw new N8NServiceError(`Falha ao comunicar com N8N: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

/**
 * Formata os itens do carrinho para serem enviados ao WhatsApp via N8N.
 * @param items Itens do carrinho.
 * @param total Valor total do pedido.
 * @returns Mensagem formatada para o WhatsApp.
 */
export const formatOrderForN8NWhatsApp = (items: Array<{ product: Product; quantity: number }>, total: number): string => {
  let message = 'Olá! Gostaria de finalizar meu pedido:\n\n';
  items.forEach(item => {
    message += `${item.quantity}x ${item.product.name} - R$ ${(item.product.price * item.quantity).toFixed(2)}\n`;
  });
  message += `\nTotal: R$ ${total.toFixed(2)}\n`;
  message += '\nPor favor, confirme os itens e o total para prosseguir.';
  return message;
};

/**
 * Envia um pedido para ser processado pelo N8N (ex: para finalizar via WhatsApp).
 * @param orderDetails Detalhes do pedido (itens, total, informações do cliente, etc.).
 */
export const sendOrderToWhatsAppViaN8N = async (orderDetails: {
  items: Array<{ product: Product; quantity: number }>;
  total: number;
  customerName?: string;
  customerPhone?: string;
  // Adicione outros campos que seu workflow N8N possa precisar
}): Promise<{ success: boolean; confirmationMessage?: string }> => {
  if (!currentN8NConfig || !currentN8NConfig.enabled) {
    console.warn('[N8NService] Tentativa de enviar pedido para WhatsApp via N8N, mas a integração está desabilitada.');
    return {
      success: false,
      confirmationMessage: 'A integração com N8N para WhatsApp não está ativa ou configurada corretamente.',
    };
  }

  const formattedMessage = formatOrderForN8NWhatsApp(orderDetails.items, orderDetails.total);

  const payload = {
    order: orderDetails,
    formattedWhatsAppMessage: formattedMessage,
    customer: {
      name: orderDetails.customerName,
      phone: orderDetails.customerPhone,
    },
    // Você pode adicionar mais metadados aqui
  };

  try {
    // O eventType pode ser usado no N8N para direcionar para o workflow correto
    const response = await sendToN8NWebhook(payload, 'whatsapp_order_finalization');
    console.log('[N8NService] Pedido enviado para WhatsApp via N8N:', response);
    return {
      success: true,
      confirmationMessage: 'Seu pedido foi encaminhado para processamento via N8N. Em breve você receberá uma confirmação no WhatsApp.',
    };
  } catch (error) {
    console.error('[N8NService] Erro ao enviar pedido para WhatsApp via N8N:', error);
    const errorMessage = error instanceof N8NServiceError ? error.message : (error instanceof Error ? error.message : 'Erro desconhecido');
    return {
      success: false,
      confirmationMessage: `Falha ao enviar seu pedido para o WhatsApp via N8N: ${errorMessage}`,
    };
  }
};

/**
 * Envia uma notificação de mudança de status de pedido para o N8N.
 * @param order O pedido que teve seu status alterado.
 */
/**
 * Testa a conexão com o webhook N8N enviando um payload de teste.
 * @returns Uma promessa que resolve com a resposta do webhook ou rejeita com um erro.
 */
export const testN8NConnection = async (): Promise<any> => {
  if (!currentN8NConfig || !currentN8NConfig.enabled) {
    throw new N8NServiceError('N8N não está configurado ou habilitado para teste.');
  }
  if (!currentN8NConfig.webhookUrl) {
    throw new N8NServiceError('URL do webhook N8N não configurada para teste.');
  }

  console.log('[N8NService] Testando conexão com N8N...');
  try {
    const testPayload = { message: 'Connection Test: Ping', timestamp: new Date().toISOString() };
    // Usar sendToN8NWebhook para um teste real de ponta a ponta
    const response = await sendToN8NWebhook(testPayload, 'connection_test');
    console.log('[N8NService] Teste de conexão bem-sucedido:', response);
    return response; // Retorna a resposta do N8N para indicar sucesso
  } catch (error) {
    console.error('[N8NService] Teste de conexão falhou:', error);
    if (error instanceof N8NServiceError) throw error;
    throw new N8NServiceError(`Falha no teste de conexão N8N: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

export const notifyOrderStatusChangeToN8N = async (order: Order): Promise<void> => {
  if (!currentN8NConfig || !currentN8NConfig.enabled || !currentN8NConfig.webhookUrl) {
    console.warn('[N8NService] Notificação de status de pedido para N8N desabilitada ou não configurada.');
    return;
  }

  const payload = {
    orderId: order.id,
    status: order.status,
    customerName: order.customer.name,
    customerPhone: order.customer.phone, // Se disponível e permitido
    items: order.items.map(item => ({ name: item.product.name, quantity: item.quantity })),
    total: order.total,
    updatedAt: order.updatedAt,
    cancellationReason: order.cancellationReason, // Se aplicável
  };

  try {
    await sendToN8NWebhook(payload, 'order_status_update');
    console.log(`[N8NService] Notificação de status do pedido ${order.id} enviada para N8N.`);
  } catch (error) {
    console.error(`[N8NService] Falha ao enviar notificação de status do pedido ${order.id} para N8N:`, error);
    // Decida se quer propagar o erro ou apenas logar
  }
};