import { A2AJsonRpcBaseRequest, A2AJsonRpcBaseResponse, A2AJsonRpcErrorObject } from '@/types/integrations';

// Tipos para os handlers específicos de cada método A2A
export type A2AMethodHandler = (params: any, agentId: string, apiKey: string) => Promise<any>;

const methodHandlers: Record<string, A2AMethodHandler> = {};

/**
 * Registra um handler para um método A2A específico.
 * @param methodName O nome do método A2A (ex: 'message/send').
 * @param handler A função que irá processar o método.
 */
export const registerA2AMethod = (methodName: string, handler: A2AMethodHandler): void => {
  if (methodHandlers[methodName]) {
    console.warn(`[A2A Core] Método ${methodName} já registrado. Sobrescrevendo.`);
  }
  methodHandlers[methodName] = handler;
  console.log(`[A2A Core] Método ${methodName} registrado.`);
};

/**
 * Valida a API Key.
 * Em uma implementação real, isso verificaria a chave contra um banco de dados ou configuração segura.
 * @param apiKey A API Key recebida no header.
 * @returns true se a chave for válida, false caso contrário.
 */
const isValidApiKey = (apiKey?: string): boolean => {
  if (!apiKey) return false;
  // TODO: EM PRODUÇÃO, ESTAS CHAVES DEVEM VIR DE VARIÁVEIS DE AMBIENTE OU UM SERVIÇO DE CONFIGURAÇÃO SEGURO.
  const VALID_API_KEYS = [
    'sk-super-secret-key-admin', 
    'sk-another-valid-key-for-service-x'
  ];
  return VALID_API_KEYS.includes(apiKey);
};

/**
 * Processa uma requisição A2A JSON-RPC.
 * @param requestBody O corpo da requisição JSON-RPC.
 * @param agentId O ID do agente extraído da URL.
 * @param apiKey A API Key extraída do header x-api-key.
 * @returns Uma resposta A2A JSON-RPC.
 */
export const processA2ARequest = async (
  requestBody: any, // O corpo da requisição HTTP, que deve ser um objeto JSON-RPC
  agentId: string,
  apiKey?: string
): Promise<A2AJsonRpcBaseResponse> => {
  // 1. Validação da API Key
  if (!isValidApiKey(apiKey)) {
    return {
      jsonrpc: '2.0',
      id: requestBody?.id || null,
      error: { code: -32000, message: 'Authentication failed: Invalid or missing API Key' },
    };
  }

  // 2. Parse e Validação da Requisição JSON-RPC
  let parsedRequest: A2AJsonRpcBaseRequest;
  try {
    // Se requestBody já é um objeto (pré-parseado pelo framework web, como Express com body-parser)
    if (typeof requestBody === 'object' && requestBody !== null) {
      parsedRequest = requestBody as A2AJsonRpcBaseRequest;
    } else if (typeof requestBody === 'string') {
      parsedRequest = JSON.parse(requestBody);
    } else {
      throw new Error('Invalid request format.');
    }

    if (
      parsedRequest.jsonrpc !== '2.0' ||
      !parsedRequest.method ||
      typeof parsedRequest.method !== 'string' ||
      !parsedRequest.id // ID é obrigatório para a maioria das requisições, exceto notificações
    ) {
      throw new Error('Invalid JSON-RPC request structure.');
    }
  } catch (e: any) {
    return {
      jsonrpc: '2.0',
      id: null, // ID pode não estar disponível se o parse falhar
      error: { code: -32700, message: 'Parse error: Invalid JSON was received by the server.', data: e.message },
    };
  }

  const { method, params, id } = parsedRequest;

  // 3. Roteamento para o Handler do Método
  const handler = methodHandlers[method];
  if (!handler) {
    return {
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    };
  }

  // 4. Execução do Handler do Método
  try {
    // Passa apiKey para o handler, caso seja necessário para lógicas de permissão mais granulares
    const result = await handler(params || {}, agentId, apiKey as string);
    return {
      jsonrpc: '2.0',
      id,
      result,
    };
  } catch (error: any) {
    console.error(`[A2A Core] Error processing method ${method} for agent ${agentId}:`, error);
    const a2aError: A2AJsonRpcErrorObject = {
      code: error.code || -32000, // Código de erro específico da aplicação ou genérico
      message: error.message || 'An internal error occurred while processing the request.',
      data: error.data || (error instanceof Error ? { stack: error.stack } : null),
    };
    return {
      jsonrpc: '2.0',
      id,
      error: a2aError,
    };
  }
};

// Exemplo de como um agente específico (ex: CardapioAgent) registraria seus métodos:
// import { registerA2AMethod } from './core/handler';
//
// const handleGetMenu = async (params: any, agentId: string, apiKey: string) => {
//   // Lógica para buscar o cardápio do agente agentId
//   // apiKey pode ser usado para verificar permissões adicionais se necessário
//   console.log(`[CardapioAgent:${agentId}] handleGetMenu called with params:`, params, `apiKey: ${apiKey}`);
//   return { menuId: 'menu-123', items: [{id: 'item-1', name: 'Pizza'}] };
// };
//
// registerA2AMethod('cardapio/getMenu', handleGetMenu);

console.log('[A2A Core] Handler module loaded.');