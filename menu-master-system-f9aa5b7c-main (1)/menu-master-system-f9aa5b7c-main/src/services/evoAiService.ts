import { EvoAIConfig, EvoAIAgentInfo } from '@/types/integrations';
import { Product, Order } from '@/types'; // Adicionado Order

// Esta seria a configuração carregada do painel administrativo
let currentEvoAIConfig: EvoAIConfig | null = null;

/**
 * Configura o serviço EvoAI com as credenciais e URL do agente.
 * @param config Configuração do EvoAI.
 */
export const configureEvoAI = (config: EvoAIConfig): void => {
  currentEvoAIConfig = config;
  console.log('[EvoAIService] Configurado:', config);
};

/**
 * Envia uma mensagem para o agente EvoAI.
 * @param message A mensagem de texto a ser enviada.
 * @param context Opcional. Dados contextuais, como informações do pedido ou cardápio.
 * @returns A resposta do agente.
 */
export class EvoAIServiceError extends Error {
  constructor(message: string, public status?: number, public details?: any) {
    super(message);
    this.name = 'EvoAIServiceError';
  }
}

const generateJsonRpcId = () => `rpc-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

export const sendMessageToEvoAI = async (
  message: string, // For legacy or direct calls, this is the primary message
  context?: Record<string, any>, // Context for legacy or params for A2A
  a2aMethod?: string // Specific A2A method, e.g., 'process_text_message' or 'handle_order_update'
): Promise<any> => {
  if (!currentEvoAIConfig || !currentEvoAIConfig.enabled) {
    throw new EvoAIServiceError('EvoAI não está configurado ou habilitado.');
  }

  if (currentEvoAIConfig.useA2AProtocol) {
    if (!currentEvoAIConfig.a2aEndpoint) {
      throw new EvoAIServiceError('Endpoint A2A do EvoAI não configurado.');
    }
    if (!currentEvoAIConfig.agentId) {
      throw new EvoAIServiceError('ID do Agente A2A do EvoAI não configurado.');
    }
    // Para A2A, 'message' pode ser opcional se 'context' (params) for suficiente
    // e 'a2aMethod' é crucial.
    if (!a2aMethod) {
      throw new EvoAIServiceError('Método A2A não especificado para a chamada JSON-RPC.');
    }
  } else {
    if (!currentEvoAIConfig.agentUrl) {
      throw new EvoAIServiceError('URL do agente EvoAI (legado) não configurada.');
    }
    if (!message || message.trim() === '') {
      throw new EvoAIServiceError('A mensagem (legado) não pode estar vazia.');
    }
  }

  // API Key é sempre necessária, seja para A2A (autenticação do endpoint) ou legado.
  if (!currentEvoAIConfig.apiKey) {
    throw new EvoAIServiceError('API Key do EvoAI não configurada.');
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'x-api-key': currentEvoAIConfig.apiKey, // Pode ser usado para autenticar o endpoint A2A ou o agente legado
  };

  let body: any;
  let targetUrl: string;

  if (currentEvoAIConfig.useA2AProtocol && currentEvoAIConfig.a2aEndpoint && a2aMethod) {
    targetUrl = currentEvoAIConfig.a2aEndpoint;
    body = {
      jsonrpc: '2.0',
      method: a2aMethod, // e.g., 'agent.processMessage', 'agent.updateOrderStatus'
      params: {
        agentId: currentEvoAIConfig.agentId, // Identificador do agente A2A
        message: message, // Pode ser opcional dependendo do método A2A
        ...(context || {}), // Outros parâmetros específicos do método A2A
      },
      id: generateJsonRpcId(),
    };
    headers['X-Agent-ID'] = currentEvoAIConfig.agentId; // Cabeçalho customizado se necessário para o endpoint A2A
  } else if (currentEvoAIConfig.agentUrl) {
    targetUrl = currentEvoAIConfig.agentUrl;
    body = {
      message,
      context, // Envia o contexto para o agente legado
      // Outros parâmetros que a API do agente legado possa esperar
    };
  } else {
    // Este caso já deve ser coberto pelas validações anteriores, mas por segurança:
    throw new EvoAIServiceError('Configuração de URL do agente inválida.');
  }

  try {
    console.log(`[EvoAIService] Enviando ${currentEvoAIConfig.useA2AProtocol ? 'requisição A2A' : 'mensagem legada'} para:`, targetUrl, 'com corpo:', JSON.stringify(body, null, 2));
    const response = await fetch(targetUrl, {
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
      console.error('[EvoAIService] Erro na API:', response.status, errorData);
      const serviceType = currentEvoAIConfig.useA2AProtocol ? 'A2A' : 'EvoAI (legado)';
      throw new EvoAIServiceError(`Erro na API ${serviceType}: ${response.status}`, response.status, errorData);
    }

    const contentType = response.headers.get('content-type');
    let responseData;
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text(); // Fallback para texto se não for JSON
    }

    console.log('[EvoAIService] Resposta recebida:', responseData);

    // Para A2A, a resposta JSON-RPC deve ter 'result' ou 'error'
    if (currentEvoAIConfig.useA2AProtocol) {
      if (responseData.error) {
        console.error('[EvoAIService] Erro na resposta A2A JSON-RPC:', responseData.error);
        throw new EvoAIServiceError(`Erro retornado pelo agente A2A: ${responseData.error.message || 'Erro desconhecido'}`, response.status, responseData.error.data);
      }
      return responseData.result; // Retorna apenas a parte 'result' da resposta JSON-RPC
    }

    return responseData; // Retorna a resposta completa para chamadas legadas
  } catch (error) {
    if (error instanceof EvoAIServiceError) {
      throw error;
    }
    console.error('[EvoAIService] Falha ao enviar mensagem:', error);
    throw new EvoAIServiceError(`Falha ao comunicar com EvoAI: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

/**
 * Formata os itens do carrinho para serem enviados ao WhatsApp via EvoAI.
 * @param items Itens do carrinho.
 * @param total Valor total do pedido.
 * @returns Mensagem formatada para o WhatsApp.
 */
export const formatOrderForEvoAIWhatsApp = (items: Array<{ product: Product; quantity: number }>, total: number): string => {
  let message = 'Olá! Gostaria de finalizar meu pedido:\n\n';
  items.forEach(item => {
    message += `${item.quantity}x ${item.product.name} - R$ ${(item.product.price * item.quantity).toFixed(2)}\n`;
  });
  message += `\nTotal: R$ ${total.toFixed(2)}\n`;
  message += '\nPor favor, confirme os itens e o total para prosseguir.';
  return message;
};

/**
 * Simula o envio de um pedido para o WhatsApp através do EvoAI.
 * Em uma implementação real, isso chamaria sendMessageToEvoAI com a mensagem formatada.
 * @param orderDetails Detalhes do pedido (itens, total, informações do cliente, etc.).
 */
export const sendOrderToWhatsAppViaEvoAI = async (orderDetails: {
  items: Array<{ product: Product; quantity: number }>;
  total: number;
  customerName?: string;
  customerPhone?: string;
}): Promise<{ success: boolean; messageId?: string; confirmationMessage?: string }> => {
  if (!currentEvoAIConfig || !currentEvoAIConfig.enabled) {
    console.warn('[EvoAIService] Tentativa de enviar pedido para WhatsApp via EvoAI, mas a integração está desabilitada.');
    return {
      success: false,
      confirmationMessage: 'A integração com EvoAI para WhatsApp não está ativa ou configurada corretamente.',
    };
  }

  const formattedMessage = formatOrderForEvoAIWhatsApp(orderDetails.items, orderDetails.total);
  
  // Contexto adicional que pode ser útil para o agente EvoAI
  const context = {
    order: orderDetails,
    customer: {
      name: orderDetails.customerName,
      phone: orderDetails.customerPhone,
    },
    requestType: 'finalize_whatsapp_order',
  };

  try {
    // Aqui, a mensagem formatada seria enviada para o agente EvoAI,
    // que por sua vez interagiria com o WhatsApp.
    // A URL do agente (currentEvoAIConfig.agentUrl ou currentEvoAIConfig.a2aEndpoint) será usada internamente por sendMessageToEvoAI.
    const a2aMethod = currentEvoAIConfig.useA2AProtocol ? 'agent.handleWhatsAppOrder' : undefined;
    const response = await sendMessageToEvoAI(formattedMessage, context, a2aMethod);
    
    console.log('[EvoAIService] Pedido enviado para WhatsApp via EvoAI:', response);
    // A resposta do agente pode variar. Ajuste conforme necessário.
    return {
      success: true,
      messageId: response?.messageId || undefined, 
      confirmationMessage: response?.reply || 'Seu pedido foi encaminhado para o WhatsApp. Em breve você receberá uma confirmação do nosso agente.',
    };
  } catch (error) {
    console.error('[EvoAIService] Erro ao enviar pedido para WhatsApp via EvoAI:', error);
    const errorMessage = error instanceof EvoAIServiceError ? error.message : (error instanceof Error ? error.message : 'Erro desconhecido');
    return {
      success: false,
      confirmationMessage: `Falha ao enviar seu pedido para o WhatsApp via EvoAI: ${errorMessage}`,
    };
  }
};

// Função para buscar informações do agente (exemplo, pode não ser necessário se a URL já é específica do agente)
export const getEvoAIAgentDetails = async (agentInfoUrl: string, apiKey: string): Promise<EvoAIAgentInfo> => {
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'x-api-key': apiKey,
  };

  try {
    const response = await fetch(agentInfoUrl, { // Esta URL seria a URL base + /openapi.json ou similar
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      throw new EvoAIServiceError(`Falha ao buscar detalhes do agente EvoAI: ${response.status}`, response.status, errorData);
    }
    return await response.json() as EvoAIAgentInfo;
  } catch (error) {
    if (error instanceof EvoAIServiceError) {
      throw error;
    }
    console.error('[EvoAIService] Erro ao buscar detalhes do agente:', error);
    throw new EvoAIServiceError(`Falha ao buscar detalhes do agente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};


/**
 * Exemplo de como o agente EvoAI poderia acessar dados do cardápio em tempo real.
 * O agente EvoAI, ao receber uma requisição, poderia internamente (ou através de uma função/skill específica)
 * chamar uma API do seu backend (o SaaS) para obter informações atualizadas.
 *
 * Exemplo de fluxo:
 * 1. Usuário interage com o agente EvoAI (via WhatsApp, por exemplo).
 * 2. Agente EvoAI recebe a mensagem.
 * 3. Se precisar de dados do cardápio (ex: "Quais são as pizzas disponíveis?"),
 *    o agente faz uma chamada HTTP para um endpoint do seu SaaS (ex: /api/menu/products?category=pizza).
 * 4. Seu SaaS retorna os dados do cardápio em JSON.
 * 5. O agente EvoAI usa esses dados para formular a resposta ao usuário.
 *
 * Este serviço (evoAiService.ts) é do ponto de vista do SEU SAAS se comunicando com o EvoAI.
 * O acesso em tempo real aos dados do cardápio pelo AGENTE EvoAI seria uma chamada DELE para o SEU SAAS.
 */

// Para fins de exemplo, uma função que simula o que o agente EvoAI poderia pedir ao seu backend:
/**
 * Testa a conexão com o agente EvoAI enviando uma mensagem de ping.
 * @returns Uma promessa que resolve com a resposta do agente ou rejeita com um erro.
 */
export const testEvoAIConnection = async (): Promise<any> => {
  if (!currentEvoAIConfig || !currentEvoAIConfig.enabled) {
    throw new EvoAIServiceError('EvoAI não está configurado ou habilitado para teste.');
  }
  if (!currentEvoAIConfig.apiKey) {
    throw new EvoAIServiceError('API Key do EvoAI não configurada para teste.');
  }

  let testMessage = 'Connection Test: Ping';
  let testContext = { testContext: 'ping', timestamp: new Date().toISOString() };
  let a2aTestMethod: string | undefined;

  if (currentEvoAIConfig.useA2AProtocol) {
    if (!currentEvoAIConfig.a2aEndpoint || !currentEvoAIConfig.agentId) {
      throw new EvoAIServiceError('Configurações A2A (Endpoint ou Agent ID) incompletas para teste.');
    }
    a2aTestMethod = 'agent.ping'; // Exemplo de método A2A para teste
    // Para A2A, a 'message' pode ser parte do context/params
    testContext = { ...testContext, message: testMessage }; 
    testMessage = ''; // Ou uma mensagem genérica se o método A2A não usar 'message' diretamente
    console.log('[EvoAIService] Testando conexão A2A com EvoAI...');
  } else {
    if (!currentEvoAIConfig.agentUrl) {
      throw new EvoAIServiceError('URL do agente EvoAI (legado) não configurada para teste.');
    }
    console.log('[EvoAIService] Testando conexão legada com EvoAI...');
  }

  try {
    const response = await sendMessageToEvoAI(testMessage, testContext, a2aTestMethod);
    console.log('[EvoAIService] Teste de conexão bem-sucedido:', response);
    return response; // Retorna a resposta do agente/serviço para indicar sucesso
  } catch (error) {
    console.error('[EvoAIService] Teste de conexão falhou:', error);
    if (error instanceof EvoAIServiceError) throw error;
    const serviceType = currentEvoAIConfig.useA2AProtocol ? 'A2A' : 'EvoAI (legado)';
    throw new EvoAIServiceError(`Falha no teste de conexão ${serviceType}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
};

/**
 * Envia uma notificação de mudança de status de pedido para o EvoAI.
 * @param order O pedido que teve seu status alterado.
 * @param customerPhoneNumber O número de telefone do cliente para notificação (se aplicável e diferente do pedido).
 */
export const notifyOrderStatusChangeToEvoAI = async (order: Order, customerPhoneNumber?: string): Promise<void> => {
  if (!currentEvoAIConfig || !currentEvoAIConfig.enabled) {
    console.warn('[EvoAIService] Notificação de status de pedido para EvoAI desabilitada.');
    return;
  }
  if (currentEvoAIConfig.useA2AProtocol && (!currentEvoAIConfig.a2aEndpoint || !currentEvoAIConfig.agentId)) {
     console.warn('[EvoAIService] Notificação de status de pedido para EvoAI (A2A) não configurada corretamente (endpoint ou agentId faltando).');
    return;
  }
  if (!currentEvoAIConfig.useA2AProtocol && !currentEvoAIConfig.agentUrl) {
    console.warn('[EvoAIService] Notificação de status de pedido para EvoAI (legado) não configurada (agentUrl faltando).');
    return;
  }

  const payload = {
    orderId: order.id,
    currentStatus: order.status,
    customerName: order.customer.name,
    // O agente EvoAI pode precisar do telefone do cliente para enviar a notificação via WhatsApp
    customerPhone: customerPhoneNumber || order.customer.phone, 
    items: order.items.map(item => ({ name: item.product.name, quantity: item.quantity })),
    total: order.total,
    updatedAt: order.updatedAt.toISOString(),
    restaurantId: order.restaurantId,
    // Adicionar quaisquer outros detalhes relevantes que o agente EvoAI possa precisar
  };

  // A mensagem para o agente pode ser mais natural ou estruturada
  const messageToAgent = `O status do pedido ${order.id} para o cliente ${order.customer.name} foi atualizado para ${order.status}.`;

  try {
    const a2aMethod = currentEvoAIConfig.useA2AProtocol ? 'agent.notifyOrderStatusChange' : undefined;
    const contextForMessage = {
      eventType: 'order_status_update',
      orderDetails: payload,
      // Se for A2A, messageToAgent pode ser parte do payload ou um parâmetro específico
      ...(currentEvoAIConfig.useA2AProtocol && { originalMessage: messageToAgent })
    };

    await sendMessageToEvoAI(
      currentEvoAIConfig.useA2AProtocol ? '' : messageToAgent, // Mensagem principal vazia se A2A e a info está no context
      contextForMessage,
      a2aMethod
    );
    console.log(`[EvoAIService] Notificação de status do pedido ${order.id} enviada para EvoAI.`);
  } catch (error) {
    console.error(`[EvoAIService] Falha ao enviar notificação de status do pedido ${order.id} para EvoAI:`, error);
    // Decida se quer propagar o erro ou apenas logar e continuar
  }
};

export const getRealTimeMenuDataForAgent = async (params: { category?: string; searchTerm?: string }): Promise<Product[]> => {
  // Em um cenário real, isso chamaria seu backend (ex: getProducts do restaurantService)
  console.log('[EvoAIService] Agente EvoAI solicitando dados do cardápio com params:', params);
  // Simulando uma busca no seu backend:
  // const allProducts = await getProductsFromBackend(); 
  // const filteredProducts = allProducts.filter(p => ...);
  // return filteredProducts;
  return Promise.resolve([]); // Retornar dados mockados ou reais aqui
};