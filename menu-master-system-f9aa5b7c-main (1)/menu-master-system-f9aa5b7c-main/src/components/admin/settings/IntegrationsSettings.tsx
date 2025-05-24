import React, { useState, useEffect } from 'react';
import { IntegrationSettings, EvoAIConfig, N8NConfig } from '@/types/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { configureEvoAI, testEvoAIConnection, EvoAIServiceError } from '@/services/evoAiService';
import { configureN8N, testN8NConnection, N8NServiceError } from '@/services/n8nService';
import { Zap, Settings, MessageSquare, AlertTriangle, CheckCircle, XCircle, Loader2, Play } from 'lucide-react';

// Mock para simular o carregamento e salvamento das configurações
// Em um aplicativo real, isso viria de um backend ou localStorage persistente.
const MOCK_INTEGRATION_SETTINGS_KEY = 'mockIntegrationSettings';

const getDefaultSettings = (): IntegrationSettings => ({
  evoAI: {
    apiKey: '',
    agentUrl: '', // Legacy or direct agent URL
    enabled: false,
    useA2AProtocol: false,
    a2aEndpoint: '',
    agentId: '',
  },
  n8n: {
    webhookUrl: '',
    apiKey: '',
    enabled: false,
  },
  whatsAppOrderFinalizationMethod: 'none',
});

const loadIntegrationSettings = (): IntegrationSettings => {
  try {
    const storedSettings = localStorage.getItem(MOCK_INTEGRATION_SETTINGS_KEY);
    if (storedSettings) {
      return JSON.parse(storedSettings) as IntegrationSettings;
    }
  } catch (error) {
    console.error('Falha ao carregar configurações de integração do localStorage', error);
  }
  return getDefaultSettings();
};

const saveIntegrationSettings = (settings: IntegrationSettings) => {
  try {
    localStorage.setItem(MOCK_INTEGRATION_SETTINGS_KEY, JSON.stringify(settings));
    console.log('Configurações de integração salvas:', settings);
  } catch (error) {
    console.error('Falha ao salvar configurações de integração no localStorage', error);
  }
};

const IntegrationsSettings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<IntegrationSettings>(loadIntegrationSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingEvoAI, setIsTestingEvoAI] = useState(false);
  const [isTestingN8N, setIsTestingN8N] = useState(false);

  const handleInputChange = <K extends keyof IntegrationSettings>(section: K, field: keyof NonNullable<IntegrationSettings[K]>, value: string | boolean) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleWhatsAppMethodChange = (value: IntegrationSettings['whatsAppOrderFinalizationMethod']) => {
    setSettings(prev => ({ ...prev, whatsAppOrderFinalizationMethod: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Salvar localmente (ou enviar para backend)
      saveIntegrationSettings(settings);

      // Reconfigurar os serviços com as novas configurações
      if (settings.evoAI) {
        configureEvoAI(settings.evoAI);
        toast({
          title: 'Configuração EvoAI', 
          description: `EvoAI ${settings.evoAI.enabled ? 'habilitado' : 'desabilitado'} e atualizado.`,
        });
      } else {
        // Se settings.evoAI for undefined, desabilite explicitamente
        configureEvoAI({...getDefaultSettings().evoAI, enabled: false });
         toast({
          title: 'Configuração EvoAI', 
          description: 'EvoAI desabilitado.',
          variant: 'default'
        });
      }

      if (settings.n8n) {
        configureN8N(settings.n8n);
        toast({
          title: 'Configuração N8N',
          description: `N8N ${settings.n8n.enabled ? 'habilitado' : 'desabilitado'} e atualizado.`,
        });
      } else {
        configureN8N({...getDefaultSettings().n8n, enabled: false });
        toast({
          title: 'Configuração N8N', 
          description: 'N8N desabilitado.',
          variant: 'default'
        });
      }

      toast({
        title: 'Sucesso!',
        description: 'Configurações de integração salvas e aplicadas.',
        className: 'bg-green-500 text-white',
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro ao Salvar',
        description: `Não foi possível salvar as configurações: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  const handleTestEvoAI = async () => {
    if (!settings.evoAI?.enabled || !settings.evoAI.apiKey || 
        (!settings.evoAI.agentUrl && !settings.evoAI.useA2AProtocol) || 
        (settings.evoAI.useA2AProtocol && (!settings.evoAI.a2aEndpoint || !settings.evoAI.agentId))) {
      toast({
        title: 'Configuração Incompleta para EvoAI',
        description: 'Habilite a integração, preencha a Chave de API e as URLs/IDs relevantes (A2A ou Legado) para testar.',
        variant: 'destructive',
      });
      return;
    }
    // Linha abaixo removida pois a validação acima já cobre o caso de agentUrl ser necessário ou não
    // if (!settings.evoAI?.enabled || !settings.evoAI.apiKey || !settings.evoAI.agentUrl) {
      toast({
        title: 'Configuração Incompleta',
        description: 'Habilite a integração e preencha a Chave de API e URL do Agente EvoAI para testar.',
        variant: 'destructive',
      });
      return;
    }
    setIsTestingEvoAI(true);
    // Aplicar configuração atual antes de testar
    configureEvoAI(settings.evoAI);
    try {
      await testEvoAIConnection();
      toast({
        title: 'Teste EvoAI Bem-Sucedido',
        description: 'A conexão com o agente EvoAI foi estabelecida com sucesso.',
        className: 'bg-green-500 text-white',
        icon: <CheckCircle className="h-5 w-5" />
      });
    } catch (error) {
      const errorMessage = error instanceof EvoAIServiceError 
        ? `${error.message}${error.details ? ` Detalhes: ${typeof error.details === 'string' ? error.details : JSON.stringify(error.details)}` : ''}` 
        : (error instanceof Error ? error.message : 'Erro desconhecido');
      toast({
        title: 'Falha no Teste EvoAI',
        description: `Não foi possível conectar ao EvoAI: ${errorMessage}`,
        variant: 'destructive',
        icon: <XCircle className="h-5 w-5" />
      });
    }
    setIsTestingEvoAI(false);
  };

  const handleTestN8N = async () => {
    if (!settings.n8n?.enabled || !settings.n8n.webhookUrl) {
      toast({
        title: 'Configuração Incompleta',
        description: 'Habilite a integração e preencha a URL do Webhook N8N para testar.',
        variant: 'destructive',
      });
      return;
    }
    setIsTestingN8N(true);
    // Aplicar configuração atual antes de testar
    configureN8N(settings.n8n);
    try {
      await testN8NConnection();
      toast({
        title: 'Teste N8N Bem-Sucedido',
        description: 'A conexão com o webhook N8N foi estabelecida com sucesso.',
        className: 'bg-green-500 text-white',
        icon: <CheckCircle className="h-5 w-5" />
      });
    } catch (error) {
      const errorMessage = error instanceof N8NServiceError 
        ? `${error.message}${error.details ? ` Detalhes: ${typeof error.details === 'string' ? error.details : JSON.stringify(error.details)}` : ''}` 
        : (error instanceof Error ? error.message : 'Erro desconhecido');
      toast({
        title: 'Falha no Teste N8N',
        description: `Não foi possível conectar ao N8N: ${errorMessage}`,
        variant: 'destructive',
        icon: <XCircle className="h-5 w-5" />
      });
    }
    setIsTestingN8N(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card className="shadow-lg mb-6">
        <CardHeader>
          <div className="flex items-center">
            <Zap className="h-6 w-6 mr-2 text-restaurant-primary" />
            <CardTitle>Integração com EvoAI</CardTitle>
          </div>
          <CardDescription>
            Configure o agente EvoAI para atendimento automatizado e finalização de pedidos no WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="evoAiApiKey">Chave de API (x-api-key)</Label>
            <Input 
              id="evoAiApiKey" 
              type="password"
              value={settings.evoAI?.apiKey || ''} 
              onChange={(e) => handleInputChange('evoAI', 'apiKey', e.target.value)} 
              placeholder="Sua chave de API da EvoAI"
              disabled={!settings.evoAI?.enabled}
            />
          </div>
          <div>
            <Label htmlFor="evoAiAgentUrl">URL do Agente (Legado/Direto)</Label>
            <Input 
              id="evoAiAgentUrl" 
              value={settings.evoAI?.agentUrl || ''} 
              onChange={(e) => handleInputChange('evoAI', 'agentUrl', e.target.value)} 
              placeholder="URL legado ou direto do agente"
              disabled={!settings.evoAI?.enabled || settings.evoAI?.useA2AProtocol}
            />
            <p className="text-xs text-gray-500">Usado se o protocolo A2A não estiver habilitado.</p>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Switch 
              id="evoAiUseA2A" 
              checked={settings.evoAI?.useA2AProtocol || false} 
              onCheckedChange={(checked) => handleInputChange('evoAI', 'useA2AProtocol', checked)} 
              disabled={!settings.evoAI?.enabled}
            />
            <Label htmlFor="evoAiUseA2A">Usar Protocolo A2A</Label>
          </div>
          {settings.evoAI?.useA2AProtocol && settings.evoAI?.enabled && (
            <>
              <div>
                <Label htmlFor="evoAiA2AEndpoint">Endpoint A2A (JSON-RPC)</Label>
                <Input 
                  id="evoAiA2AEndpoint" 
                  value={settings.evoAI?.a2aEndpoint || ''} 
                  onChange={(e) => handleInputChange('evoAI', 'a2aEndpoint', e.target.value)} 
                  placeholder="https://seu-servidor.com/a2a/rpc"
                  disabled={!settings.evoAI?.enabled || !settings.evoAI?.useA2AProtocol}
                />
              </div>
              <div>
                <Label htmlFor="evoAiAgentId">ID do Agente A2A</Label>
                <Input 
                  id="evoAiAgentId" 
                  value={settings.evoAI?.agentId || ''} 
                  onChange={(e) => handleInputChange('evoAI', 'agentId', e.target.value)} 
                  placeholder="ID único do seu agente A2A"
                  disabled={!settings.evoAI?.enabled || !settings.evoAI?.useA2AProtocol}
                />
              </div>
            </>
          )}
          <div className="flex items-center space-x-2 pt-2">
            <Switch 
              id="evoAiEnabled" 
              checked={settings.evoAI?.enabled || false} 
              onCheckedChange={(checked) => handleInputChange('evoAI', 'enabled', checked)} 
            />
            <Label htmlFor="evoAiEnabled">Habilitar Integração EvoAI</Label>
          </div>
           {settings.evoAI?.enabled && (
            <Button 
              type="button" 
              variant="outline"
              onClick={handleTestEvoAI} 
              disabled={isTestingEvoAI || !settings.evoAI.apiKey || (!settings.evoAI.agentUrl && !settings.evoAI.useA2AProtocol) || (settings.evoAI.useA2AProtocol && (!settings.evoAI.a2aEndpoint || !settings.evoAI.agentId))}
              className="w-full mt-2"
            >
              {isTestingEvoAI ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testando...</>
              ) : (
                <><Play className="mr-2 h-4 w-4" /> Testar Conexão EvoAI</>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg mb-6">
        <CardHeader>
          <div className="flex items-center">
            <Settings className="h-6 w-6 mr-2 text-restaurant-primary" />
            <CardTitle>Integração com N8N</CardTitle>
          </div>
          <CardDescription>
            Conecte com seus fluxos de automação N8N para notificações e processos personalizados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="n8nWebhookUrl">URL do Webhook N8N</Label>
            <Input 
              id="n8nWebhookUrl" 
              value={settings.n8n?.webhookUrl || ''} 
              onChange={(e) => handleInputChange('n8n', 'webhookUrl', e.target.value)} 
              placeholder="Sua URL de webhook do N8N"
              disabled={!settings.n8n?.enabled}
            />
          </div>
          <div>
            <Label htmlFor="n8nApiKey">Chave de API N8N (Opcional)</Label>
            <Input 
              id="n8nApiKey" 
              type="password"
              value={settings.n8n?.apiKey || ''} 
              onChange={(e) => handleInputChange('n8n', 'apiKey', e.target.value)} 
              placeholder="Chave de API, se o webhook for protegido"
              disabled={!settings.n8n?.enabled}
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Switch 
              id="n8nEnabled" 
              checked={settings.n8n?.enabled || false} 
              onCheckedChange={(checked) => handleInputChange('n8n', 'enabled', checked)} 
            />
            <Label htmlFor="n8nEnabled">Habilitar Integração N8N</Label>
          </div>
          {settings.n8n?.enabled && (
            <Button 
              type="button" 
              variant="outline"
              onClick={handleTestN8N} 
              disabled={isTestingN8N || !settings.n8n.webhookUrl}
              className="w-full mt-2"
            >
              {isTestingN8N ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Testando...</>
              ) : (
                <><Play className="mr-2 h-4 w-4" /> Testar Conexão N8N</>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg mb-6">
        <CardHeader>
          <div className="flex items-center">
            <MessageSquare className="h-6 w-6 mr-2 text-restaurant-primary" />
            <CardTitle>Finalização de Pedido via WhatsApp</CardTitle>
          </div>
          <CardDescription>
            Escolha como os pedidos do carrinho serão finalizados quando o cliente optar por WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select 
            value={settings.whatsAppOrderFinalizationMethod}
            onValueChange={handleWhatsAppMethodChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um método" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum (Desabilitado)</SelectItem>
              <SelectItem value="manual">Atendimento Humano (Manual)</SelectItem>
              <SelectItem value="evoai" disabled={!settings.evoAI?.enabled}>
                EvoAI (Requer EvoAI habilitado)
              </SelectItem>
              <SelectItem value="n8n" disabled={!settings.n8n?.enabled}>
                N8N (Requer N8N habilitado)
              </SelectItem>
            </SelectContent>
          </Select>
          {settings.whatsAppOrderFinalizationMethod === 'evoai' && !settings.evoAI?.enabled && (
            <p className="text-sm text-yellow-600 flex items-center"><AlertTriangle className='h-4 w-4 mr-1' /> EvoAI precisa estar habilitado e configurado.</p>
          )}
          {settings.whatsAppOrderFinalizationMethod === 'n8n' && !settings.n8n?.enabled && (
            <p className="text-sm text-yellow-600 flex items-center"><AlertTriangle className='h-4 w-4 mr-1' /> N8N precisa estar habilitado e configurado.</p>
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isSaving || isTestingEvoAI || isTestingN8N}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar Configurações de Integração'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
};

export default IntegrationsSettings;