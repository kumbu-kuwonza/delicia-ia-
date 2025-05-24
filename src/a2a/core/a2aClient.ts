import { A2AJsonRpcBaseRequest, A2AJsonRpcBaseResponse, A2AMessageSendParams, A2AMessage } from '@/types/integrations';

// TODO: Definir uma forma de configurar os endpoints dos agentes ou um gateway A2A central.
// Exemplo: const A2A_GATEWAY_URL = process.env.A2A_GATEWAY_URL || 'http://localhost:3001/api/v1/a2a';
// Por enquanto, o endpoint será passado como parâmetro.

// TODO: Definir como a API Key será gerenciada para chamadas de cliente.
// Poderia ser uma configuração global ou por chamada.
let globalClientApiKey: string | null = null;

export const configureA2AClient = (options: { apiKey?: string }) => {
  if (options.apiKey) {
    globalClientApiKey = options.apiKey;
  }
};

const generateRpcId = (): string => `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;

async function makeA2ARequest<TParams, TResult>(
  targetAgentType: string, // Ex: 'cardapio', 'estoque'
  targetAgentId: string,   // Ex: 'cardapio-principal', 'estoque-loja1'
  method: string,          // Ex: 'cardapio/getMenuDetails', 'estoque/tasks/get'
  params?: TParams,
  apiKey?: string
): Promise<TResult> {
  // TODO: Implementar a lógica de descoberta de endpoint se não for um gateway fixo.
  // Por agora, assume-se que o a2aServer.ts é o gateway.
  const endpoint = `http://localhost:3001/api/v1/a2a/${targetAgentType}/${targetAgentId}`;
  const rpcKey = apiKey || globalClientApiKey;

  if (!rpcKey) {
    console.error('[A2AClient] API Key não fornecida para a requisição.');
    throw new Error('A2A Client: API Key is required.');
  }

  const requestBody: A2AJsonRpcBaseRequest<TParams> = {
    jsonrpc: '2.0',
    id: generateRpcId(),
    method,
    params,
  };

  console.log(`[A2AClient] Enviando requisição para ${endpoint}, método ${method}, params:`, params);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': rpcKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: await response.text() };
      }
      console.error('[A2AClient] Erro na resposta da API:', response.status, errorData);
      throw new Error(`A2A API Error (${method}): ${response.status} - ${errorData?.error?.message || errorData?.message || 'Unknown error'}`);
    }

    const a2aResponse = (await response.json()) as A2AJsonRpcBaseResponse<TResult>;

    if (a2aResponse.error) {
      console.error('[A2AClient] Erro na resposta JSON-RPC:', a2aResponse.error);
      throw new Error(`A2A RPC Error (${method}): ${a2aResponse.error.code} - ${a2aResponse.error.message}`);
    }

    if (a2aResponse.result === undefined) {
      // Embora válido para notificações, a maioria das chamadas esperará um resultado.
      // Se o resultado for opcional, o tipo TResult deve ser T | null ou T | undefined.
      console.warn(`[A2AClient] Resposta para ${method} não contém 'result'.`);
      // Dependendo da semântica do método, isso pode ser um erro ou esperado.
      // Por enquanto, retornaremos null se TResult puder ser null/undefined.
      // Se TResult não puder ser null/undefined, isso causará um erro de tipo em tempo de compilação ou um erro em tempo de execução.
      return null as TResult; 
    }
    return a2aResponse.result;

  } catch (error) {
    console.error(`[A2AClient] Falha ao fazer requisição A2A para ${method}:`, error);
    throw error; // Propaga o erro
  }
}

// Funções wrapper para métodos A2A comuns

export const a2aClient = {
  sendMessage: async (
    targetAgentType: string,
    targetAgentId: string,
    message: A2AMessage,
    // Outros parâmetros específicos do message/send se houver
    customParams?: Omit<A2AMessageSendParams, 'message'>, 
    apiKey?: string
  ): Promise<any> => { // TODO: Definir tipo de retorno esperado para sendMessage
    const method = `${targetAgentType}/message/send`; // Assumindo que o agente de destino tem um método message/send prefixado
    return makeA2ARequest(targetAgentType, targetAgentId, method, { message, ...customParams }, apiKey);
  },

  sendStream: async (
    targetAgentType: string,
    targetAgentId: string,
    streamData: any, // TODO: Definir tipo para streamData
    apiKey?: string
  ): Promise<any> => { // TODO: Definir tipo de retorno esperado para sendStream
    const method = `${targetAgentType}/message/stream`; // Assumindo que o agente de destino tem um método message/stream prefixado
    // TODO: A semântica de 'sendStream' pode variar.
    // Se for um stream unidirecional, o servidor pode apenas dar um HTTP 200 OK.
    // Se for para iniciar um stream de longa duração, esta abordagem HTTP POST simples não é suficiente.
    // Este cliente assume uma requisição HTTP POST única para enviar um "pedaço" do stream.
    console.warn('[A2AClient] sendStream é implementado como uma única requisição HTTP POST. Para streams de longa duração, considere WebSockets ou SSE.');
    return makeA2ARequest(targetAgentType, targetAgentId, method, streamData, apiKey);
  },

  getTaskResult: async <TResult>(
    targetAgentType: string,
    targetAgentId: string,
    taskId: string,
    // Outros params para tasks/get
    customParams?: Record<string, any>,
    apiKey?: string
  ): Promise<TResult> => {
    const method = `${targetAgentType}/tasks/get`; // Assumindo que o agente de destino tem um método tasks/get prefixado
    return makeA2ARequest(targetAgentType, targetAgentId, method, { taskId, ...customParams }, apiKey);
  },
  
  // TODO: Adicionar wrappers para tasks/subscribe, tasks/cancel, file/upload etc. conforme necessário.
  // Exemplo para file/upload:
  // uploadFile: async (targetAgentType: string, targetAgentId: string, fileParams: any, apiKey?: string) => {
  //   const method = `${targetAgentType}/file/upload`;
  //   return makeA2ARequest(targetAgentType, targetAgentId, method, fileParams, apiKey);
  // }
};

console.log('[A2AClient] Módulo carregado.');
