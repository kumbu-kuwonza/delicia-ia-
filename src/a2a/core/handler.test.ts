import { processA2ARequest, registerA2AMethod, clearA2AMethods, A2AMethodHandler } from './handler'; // Ajuste o caminho se necessário
import { A2AJsonRpcBaseRequest, A2AJsonRpcBaseResponse } from '@/types/integrations';

const TEST_API_KEY = 'sk-super-secret-key-admin'; // Use uma das chaves válidas definidas no handler.ts
const INVALID_API_KEY = 'sk-invalid-key';

describe('A2A Core Handler', () => {
  let mockHandler: jest.Mock<any, any>; // Alterado para jest.Mock<any, any> para compatibilidade geral

  beforeEach(() => {
    clearA2AMethods(); // Limpa os handlers registrados antes de cada teste
    mockHandler = jest.fn();
  });

  // Testes para processA2ARequest
  describe('processA2ARequest', () => {
    it('should fail authentication with missing API key', async () => {
      const request: A2AJsonRpcBaseRequest = { jsonrpc: '2.0', id: '1', method: 'test/method' };
      const response = await processA2ARequest(request, 'testAgent', undefined);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(-32000);
      expect(response.error?.message).toContain('Invalid or missing API Key');
    });

    it('should fail authentication with invalid API key', async () => {
      const request: A2AJsonRpcBaseRequest = { jsonrpc: '2.0', id: '1', method: 'test/method' };
      const response = await processA2ARequest(request, 'testAgent', INVALID_API_KEY);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(-32000);
      expect(response.error?.message).toContain('Invalid or missing API Key');
    });

    it('should return parse error for invalid JSON string', async () => {
      const invalidJsonString = "{ jsonrpc: '2.0', id: 1, method: 'test/method' "; // Malformado
      const response = await processA2ARequest(invalidJsonString, 'testAgent', TEST_API_KEY);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(-32700); // Parse error
      expect(response.error?.message).toContain('Parse error');
    });
    
    it('should return invalid request for missing method', async () => {
      const request = { jsonrpc: '2.0', id: '1' }; // Method is missing
      const response = await processA2ARequest(request, 'testAgent', TEST_API_KEY);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(-32600); // Invalid Request
      expect(response.error?.message).toContain('Invalid JSON-RPC request structure');
    });
    
    it('should return invalid request for missing id', async () => {
        const request = { jsonrpc: '2.0', method: 'test/method' }; // ID is missing
        const response = await processA2ARequest(request, 'testAgent', TEST_API_KEY);
        expect(response.error).toBeDefined();
        expect(response.error?.code).toBe(-32600); // Invalid Request
        expect(response.error?.message).toContain('Invalid JSON-RPC request structure');
    });

    it('should return invalid request for missing jsonrpc version', async () => {
        const request = { id: '1', method: 'test/method' }; // jsonrpc is missing
        const response = await processA2ARequest(request, 'testAgent', TEST_API_KEY);
        expect(response.error).toBeDefined();
        expect(response.error?.code).toBe(-32600); // Invalid Request
        expect(response.error?.message).toContain('Invalid JSON-RPC request structure');
    });


    it('should return method not found if handler is not registered', async () => {
      const request: A2AJsonRpcBaseRequest = { jsonrpc: '2.0', id: '3', method: 'unregistered/method' };
      const response = await processA2ARequest(request, 'testAgent', TEST_API_KEY);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(-32601); // Method not found
    });

    it('should call the correct handler and return its result', async () => {
      const methodName = 'test/successfulMethod';
      const params = { data: 'testData' };
      const expectedResult = { success: true, data: 'handler response' };
      // Ajuste para o tipo de mockHandler
      (mockHandler as jest.Mock<Promise<any>, [any, string, string]>).mockResolvedValue(expectedResult);
      registerA2AMethod(methodName, mockHandler as A2AMethodHandler);

      const request: A2AJsonRpcBaseRequest = { jsonrpc: '2.0', id: '4', method: methodName, params };
      const response = await processA2ARequest(request, 'testAgent', TEST_API_KEY);

      expect(response.result).toEqual(expectedResult);
      expect(response.error).toBeUndefined();
      expect(mockHandler).toHaveBeenCalledWith(params, 'testAgent', TEST_API_KEY);
    });

    it('should return an error if the handler throws an error', async () => {
      const methodName = 'test/errorMethod';
      const params = { data: 'testData' };
      const handlerError = { code: -32001, message: 'Handler specific error', data: { details: 'error details' } };
      // Ajuste para o tipo de mockHandler
      (mockHandler as jest.Mock<Promise<any>, [any, string, string]>).mockRejectedValue(handlerError);
      registerA2AMethod(methodName, mockHandler as A2AMethodHandler);

      const request: A2AJsonRpcBaseRequest = { jsonrpc: '2.0', id: '5', method: methodName, params };
      const response = await processA2ARequest(request, 'testAgent', TEST_API_KEY);

      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe(handlerError.code);
      expect(response.error?.message).toBe(handlerError.message);
      expect(response.error?.data).toEqual(handlerError.data);
      expect(mockHandler).toHaveBeenCalledWith(params, 'testAgent', TEST_API_KEY);
    });
  });

  // Testes para registerA2AMethod
  describe('registerA2AMethod', () => {
    it('should register a new method', () => {
      const methodName = 'new/method';
      registerA2AMethod(methodName, mockHandler as A2AMethodHandler);
      // Ajuste para o tipo de mockHandler
      (mockHandler as jest.Mock<Promise<any>, [any, string, string]>).mockResolvedValue({ done: true });
      const request: A2AJsonRpcBaseRequest = { jsonrpc: '2.0', id: '6', method: methodName };
      return processA2ARequest(request, 'testAgent', TEST_API_KEY).then(response => {
        expect(response.result).toEqual({ done: true });
      });
    });

    it('should warn when overwriting an existing method', () => {
      const methodName = 'overwrite/method';
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {}); // Suprime o warning no console do teste

      registerA2AMethod(methodName, mockHandler as A2AMethodHandler); // Primeiro registro
      registerA2AMethod(methodName, jest.fn() as A2AMethodHandler);   // Segundo registro (sobrescrita)

      expect(consoleWarnSpy).toHaveBeenCalledWith(`[A2A Core] Método ${methodName} já registrado. Sobrescrevendo.`);
      consoleWarnSpy.mockRestore();
    });
  });
});
