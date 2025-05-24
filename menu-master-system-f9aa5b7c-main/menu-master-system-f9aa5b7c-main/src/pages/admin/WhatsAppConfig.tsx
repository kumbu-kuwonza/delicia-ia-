
import React from 'react';
import WhatsAppIntegrationForm from '@/components/admin/WhatsAppIntegrationForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const WhatsAppConfig = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Link to="/admin">
          <Button variant="outline" size="sm" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Configuração do WhatsApp</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <WhatsAppIntegrationForm />
        </div>
        
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-medium mb-4">Configuração do n8n</h2>
            <p className="mb-4">
              Para configurar notificações automáticas via WhatsApp, siga estes passos:
            </p>
            <ol className="list-decimal ml-5 space-y-2">
              <li>Acesse sua instância do n8n</li>
              <li>Crie um novo workflow</li>
              <li>Adicione um trigger "Webhook"</li>
              <li>Copie a URL do webhook e cole no campo "Webhook n8n" ao lado</li>
              <li>Adicione um nó "WhatsApp" configurado com sua conta</li>
              <li>Configure o nó para enviar mensagens quando o webhook for acionado</li>
              <li>Ative o workflow</li>
            </ol>
            <div className="mt-6">
              <Button variant="outline" className="w-full">Ver documentação completa</Button>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-medium mb-4">Dicas de uso</h2>
            <ul className="list-disc ml-5 space-y-2">
              <li>Personalize a mensagem para incluir informações relevantes do pedido</li>
              <li>Configure lembretes automáticos para clientes que não concluíram pedidos</li>
              <li>Use o n8n para enviar notificações quando o status do pedido for atualizado</li>
              <li>Integre com seu sistema de gestão para atualizar o status automaticamente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppConfig;
