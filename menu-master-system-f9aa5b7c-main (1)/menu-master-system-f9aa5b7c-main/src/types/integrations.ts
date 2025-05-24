export interface EvoAIConfig {
  apiKey: string;
  agentUrl: string; // Legacy or direct agent URL
  enabled: boolean;
  useA2AProtocol?: boolean; // To enable A2A specific communication
  a2aEndpoint?: string; // A2A specific endpoint, e.g., for JSON-RPC
  agentId?: string; // A2A Agent ID
  capabilities?: {
    streaming?: boolean;
    pushNotifications?: boolean;
    stateTransitionHistory?: boolean;
    // A2A specific capabilities can be added here if needed
  };
  defaultInputModes?: string[]; // e.g., ['text', 'json_form']
  defaultOutputModes?: string[]; // e.g., ['text', 'json']
}

export interface N8NConfig {
  webhookUrl: string;
  apiKey?: string; // Opcional, dependendo da configuração do webhook N8N
  enabled: boolean;
}

export interface IntegrationSettings {
  evoAI?: EvoAIConfig;
  n8n?: N8NConfig;
  // Opção para definir qual integração usar para finalizar o pedido no WhatsApp
  whatsAppOrderFinalizationMethod: 'evoai' | 'n8n' | 'manual' | 'none';
}

// Exemplo de como os dados do agente EvoAI fornecidos podem ser mapeados
export interface EvoAIAgentInfo {
  name: string;
  description: string;
  url: string;
  provider: {
    organization: string;
    url: string;
  };
  version: string;
  documentationUrl: string;
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    stateTransitionHistory: boolean;
  };
  securitySchemes: {
    apiKey: {
      type: string;
      in: string;
      name: string;
    };
  };
  security: Array<{[key: string]: any[]}>;
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
    examples: string[];
    inputModes: string[];
    outputModes: string[];
  }>;
}

// Estruturas Genéricas A2A v0.3.0

export interface A2AMessagePartFile {
  name: string;
  mimeType: string;
  bytes: string; // Base64 encoded content
}

export interface A2AMessagePart {
  type: 'text' | 'file';
  text?: string;
  file?: A2AMessagePartFile;
}

export interface A2AMessage {
  role: 'user' | 'assistant' | 'system';
  parts: A2AMessagePart[];
  messageId: string; // uuid-v4
}

export interface A2AJsonRpcBaseRequest<T = any> {
  jsonrpc: '2.0';
  id: string; // req-[timestamp] or other unique ID
  method: string; // [a2a-method]
  params?: T;
}

export interface A2AMessageSendParams {
  message: A2AMessage;
  // Outros parâmetros específicos do método message/send podem ser adicionados aqui
}

export interface A2AJsonRpcMessageSendRequest extends A2AJsonRpcBaseRequest<A2AMessageSendParams> {}

export interface A2AJsonRpcErrorObject {
  code: number;
  message: string;
  data?: any;
}

export interface A2AJsonRpcBaseResponse<T = any> {
  jsonrpc: '2.0';
  id: string | null;
  result?: T;
  error?: A2AJsonRpcErrorObject;
}

// Adicionar outras interfaces para tasks/get, agent/authenticatedExtendedCard etc. conforme necessário

export interface A2AAgentCapability {
  method: string; // e.g., 'message/send', 'tasks/get'
  description?: string;
  // Outros detalhes da capacidade
}

export interface A2AAgentProfile {
  agentId: string;
  name: string;
  description?: string;
  capabilities: A2AAgentCapability[];
  // Outras informações do perfil do agente
}

// Fim das Estruturas Genéricas A2A v0.3.0

export interface EvoAIAgentInfo {
  name: string;
  description: string;
  url: string;
  provider: {
    organization: string;
    url: string;
  };
  version: string;
  documentationUrl: string;
  capabilities: {
    streaming: boolean;
    pushNotifications: boolean;
    stateTransitionHistory: boolean;
  };
  securitySchemes: {
    apiKey: {
      type: string;
      in: string;
      name: string;
    };
  };
  security: Array<{[key: string]: any[]}>;
  defaultInputModes: string[];
  defaultOutputModes: string[];
  skills: Array<{
    id: string;
    name: string;
    description: string;
    tags: string[];
    examples: string[];
    inputModes: string[];
    outputModes: string[];
  }>;
}