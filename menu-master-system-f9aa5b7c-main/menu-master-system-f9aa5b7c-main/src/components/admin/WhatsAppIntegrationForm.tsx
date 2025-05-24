
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
// Use MessageCircle instead of Whatsapp
import { MessageCircle } from 'lucide-react';

const WhatsAppIntegrationForm = () => {
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const [messageTemplate, setMessageTemplate] = useState(
    'Olá! Gostaria de fazer o seguinte pedido:\n\n{{items}}\n\nTotal: {{total}}\n\nInformações para entrega:\nNome: \nEndereço: \nForma de pagamento: '
  );
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Configuração salva",
        description: "A integração com WhatsApp foi configurada com sucesso."
      });
    }, 1000);
  };
  
  const testWhatsApp = () => {
    if (!phoneNumber) {
      toast({
        title: "Erro",
        description: "Por favor, insira um número de telefone.",
        variant: "destructive"
      });
      return;
    }
    
    // Format test message
    const testMessage = "Teste de integração do cardápio digital";
    const encodedMessage = encodeURIComponent(testMessage);
    
    // Create WhatsApp URL with international format
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    // Open WhatsApp in a new tab
    window.open(whatsappUrl, '_blank');
  };
  
  const testWebhook = async () => {
    if (!webhookUrl) {
      toast({
        title: "Erro",
        description: "Por favor, insira a URL do webhook do n8n.",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "no-cors", // Add this to handle CORS
        body: JSON.stringify({
          event: "test",
          message: "Test from digital menu admin panel",
          timestamp: new Date().toISOString()
        }),
      });
      
      toast({
        title: "Solicitação enviada",
        description: "O webhook foi acionado. Verifique seu fluxo n8n para confirmar o funcionamento.",
      });
    } catch (error) {
      console.error("Erro ao acionar webhook:", error);
      toast({
        title: "Erro",
        description: "Falha ao testar o webhook. Verifique a URL e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageCircle className="mr-2 h-5 w-5" />
          Integração com WhatsApp
        </CardTitle>
        <CardDescription>
          Configure a integração do cardápio digital com WhatsApp e notificações automáticas.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="whatsapp-enabled" className="text-base">Ativar WhatsApp no Checkout</Label>
              <Switch 
                id="whatsapp-enabled" 
                checked={isEnabled}
                onCheckedChange={setIsEnabled}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phone-number">Número de WhatsApp (com código do país)</Label>
              <div className="flex gap-2">
                <Input
                  id="phone-number"
                  placeholder="5511999999999"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={testWhatsApp}>
                  Testar
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Insira o número completo, incluindo código do país e DDD, sem espaços ou sinais.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="message-template">Modelo de Mensagem</Label>
              <Textarea
                id="message-template"
                placeholder="Modelo da mensagem de pedido"
                value={messageTemplate}
                onChange={(e) => setMessageTemplate(e.target.value)}
                rows={6}
              />
              <p className="text-sm text-gray-500">
                Use {"{{items}}"} para a lista de itens e {"{{total}}"} para o valor total.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="webhook-url">Webhook n8n (para notificações automáticas)</Label>
              <div className="flex gap-2">
                <Input
                  id="webhook-url"
                  placeholder="https://n8n.seu-dominio.com/webhook/xxx"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <Button type="button" variant="outline" onClick={testWebhook}>
                  Testar
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Insira a URL do webhook do n8n para enviar notificações automáticas.
              </p>
            </div>
          </div>
        </form>
      </CardContent>
      
      <CardFooter>
        <Button 
          type="submit" 
          className="w-full bg-green-500 hover:bg-green-600"
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Salvando..." : "Salvar Configurações"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WhatsAppIntegrationForm;
