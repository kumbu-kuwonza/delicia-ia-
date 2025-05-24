// Importa as dependências necessárias (assumindo que foram instaladas)
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { processA2ARequest } from './a2a/core/handler';

// Importar aqui os módulos dos agentes para que eles possam registrar seus métodos A2A
// Exemplo: import './a2a/agents/cardapio/cardapioAgent'; // Descomente e crie quando o agente existir
// Exemplo: import './a2a/agents/estoque/estoqueAgent';
// ... e assim por diante para todos os agentes

const app = express();
const PORT = process.env.A2A_PORT || 3001; // Porta configurável para o servidor A2A

// Configuração do CORS
// Em produção, restrinja para os domínios corretos
const corsOptions: cors.CorsOptions = {
  origin: '*', // Permitir todas as origens para desenvolvimento/teste inicial
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'Authorization'],
  optionsSuccessStatus: 204 // para algumas versões de navegadores legados (IE11, vários SmartTVs)
};
app.use(cors(corsOptions));

// Middleware para parsear JSON
app.use(bodyParser.json());

// Middleware para loggar requisições (opcional, mas útil para debug)
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[A2AServer] Received ${req.method} request for ${req.url}`);
  if (req.method === 'POST') {
    console.log('[A2AServer] Request body:', JSON.stringify(req.body, null, 2));
  }
  console.log('[A2AServer] Request headers:', JSON.stringify(req.headers, null, 2));
  next();
});

// Endpoint genérico para todos os agentes A2A
// O :agentType pode ser usado para carregar dinamicamente ou rotear para diferentes lógicas de agente se necessário,
// mas o handler.ts atual usa principalmente o agentId e o método da requisição JSON-RPC.
app.post('/api/v1/a2a/:agentType/:agentId', async (req: Request, res: Response) => {
  const { agentId } = req.params; // agentType pode ser usado no futuro se necessário
  const apiKey = req.header('x-api-key');

  if (!req.body) {
    return res.status(400).json({
      jsonrpc: '2.0',
      id: null,
      error: { code: -32700, message: 'Parse error: Request body is missing or not JSON.' },
    });
  }

  try {
    const a2aResponse = await processA2ARequest(req.body, agentId, apiKey);
    // Determina o código de status HTTP com base na resposta JSON-RPC
    if (a2aResponse.error) {
      // Mapeia códigos de erro JSON-RPC para códigos de status HTTP apropriados
      let statusCode = 500; // Erro interno do servidor por padrão
      if (a2aResponse.error.code === -32700) statusCode = 400; // Parse error
      if (a2aResponse.error.code === -32600) statusCode = 400; // Invalid Request
      if (a2aResponse.error.code === -32601) statusCode = 404; // Method not found
      if (a2aResponse.error.code === -32602) statusCode = 400; // Invalid params
      if (a2aResponse.error.code === -32000) statusCode = 401; // Authentication failed (exemplo)
      // Adicione mais mapeamentos conforme necessário
      return res.status(statusCode).json(a2aResponse);
    }
    return res.status(200).json(a2aResponse);
  } catch (error: any) {
    console.error(`[A2AServer] Unhandled error processing A2A request for agent ${agentId}:`, error);
    return res.status(500).json({
      jsonrpc: '2.0',
      id: req.body?.id || null,
      error: { code: -32000, message: 'Internal server error', data: error.message },
    });
  }
});

// Rota OPTIONS para preflight requests do CORS
app.options('/api/v1/a2a/:agentType/:agentId', cors(corsOptions));

// Handler para rotas não encontradas (404)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    jsonrpc: '2.0',
    id: null,
    error: { code: -32601, message: 'Endpoint not found' },
  });
});

// Handler de erro global (opcional, mas bom para capturar erros não tratados)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[A2AServer] Global error handler:', err.stack);
  res.status(500).json({
    jsonrpc: '2.0',
    id: (req.body as any)?.id || null,
    error: { code: -32000, message: 'Internal server error', data: err.message },
  });
});

export const startA2AServer = () => {
  // Aqui, os agentes deveriam registrar seus métodos A2A antes do servidor iniciar.
  // Exemplo: CardapioAgent.registerMethods();
  // Exemplo: EstoqueAgent.registerMethods();

  app.listen(PORT, () => {
    console.log(`[A2AServer] Servidor A2A rodando na porta ${PORT}`);
    console.log(`[A2AServer] Endpoints A2A disponíveis em: http://localhost:${PORT}/api/v1/a2a/{agentType}/{agentId}`);
    console.log('[A2AServer] Lembre-se de instalar as dependências (express, cors, body-parser) se ainda não o fez.');
  });
};

// Para executar este servidor de forma independente (ex: node dist/a2aServer.js após o build):
// if (require.main === module) {
//   startA2AServer();
// }

// Se este arquivo for importado (ex: pelo entry point principal da aplicação), 
// a função startA2AServer() precisará ser chamada explicitamente.

console.log('[A2AServer] Módulo do servidor A2A carregado.');