import React, { useState } from 'react';
import { Customer, Order } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Users, Clock, Award, Ban, Tag, Send, Filter, Search, Mail, Phone, MessageSquare } from 'lucide-react';
import { format, subDays } from 'date-fns';

// Função para formatar valores monetários
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

interface CustomerSegmentationProps {
  customers: Customer[];
  orders: Order[];
  onSendPromotion?: (customerIds: string[], promotionData: any) => void;
}

type CustomerSegment = 'novo' | 'regular' | 'vip' | 'inativo';

interface SegmentedCustomer extends Customer {
  segment: CustomerSegment;
  lastOrderDate: Date | null;
  daysSinceLastOrder: number | null;
  totalSpent: number;
  totalOrders: number;
}

export const CustomerSegmentation = ({ customers, orders, onSendPromotion }: CustomerSegmentationProps) => {
  const [activeTab, setActiveTab] = useState<CustomerSegment>('novo');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showPromotionForm, setShowPromotionForm] = useState(false);
  const [promotionData, setPromotionData] = useState({
    title: '',
    message: '',
    discount: '10',
    expirationDays: '7',
    channel: 'whatsapp' // Mantém 'whatsapp' como padrão, mas a lógica de envio será de simulação
  });
  const [simulationResult, setSimulationResult] = useState<string | null>(null); // Novo estado para resultado da simulação

  // Processar clientes e adicionar informações de segmentação
  const processCustomers = (): SegmentedCustomer[] => {
    return customers.map(customer => {
      // Filtrar pedidos deste cliente
      const customerOrders = orders.filter(order => order.customer.phone === customer.phone);
      
      // Calcular data do último pedido
      const lastOrderDate = customerOrders.length > 0 
        ? new Date(Math.max(...customerOrders.map(o => new Date(o.createdAt).getTime())))
        : null;
      
      // Calcular dias desde o último pedido
      const daysSinceLastOrder = lastOrderDate 
        ? Math.floor((new Date().getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      
      // Calcular total gasto
      const totalSpent = customerOrders.reduce((total, order) => total + order.total, 0);
      
      // Determinar segmento do cliente
      let segment: CustomerSegment = 'novo';
      
      if (customerOrders.length === 0) {
        segment = 'novo';
      } else if (daysSinceLastOrder && daysSinceLastOrder > 30) {
        segment = 'inativo';
      } else if (customerOrders.length > 10 || totalSpent > 1000) {
        segment = 'vip';
      } else {
        segment = 'regular';
      }
      
      return {
        ...customer,
        segment,
        lastOrderDate,
        daysSinceLastOrder,
        totalSpent,
        totalOrders: customerOrders.length
      };
    });
  };

  const segmentedCustomers = processCustomers();
  
  // Filtrar clientes por segmento e termo de busca
  const filteredCustomers = segmentedCustomers
    .filter(customer => customer.segment === activeTab)
    .filter(customer => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.phone.includes(searchTerm) ||
        (customer.email && customer.email.toLowerCase().includes(searchLower))
      );
    });

  // Obter cores e ícones para cada segmento
  const getSegmentInfo = (segment: CustomerSegment) => {
    switch (segment) {
      case 'novo':
        return { 
          color: 'bg-blue-50 text-blue-700 border-blue-200', 
          icon: <User className="h-4 w-4 mr-1" />,
          description: 'Clientes que ainda não fizeram pedidos'
        };
      case 'regular':
        return { 
          color: 'bg-green-50 text-green-700 border-green-200', 
          icon: <Award className="h-4 w-4 mr-1" />,
          description: 'Clientes com pedidos regulares'
        };
      case 'vip':
        return { 
          color: 'bg-purple-50 text-purple-700 border-purple-200', 
          icon: <Award className="h-4 w-4 mr-1" />,
          description: 'Clientes frequentes com alto valor de compra'
        };
      case 'inativo':
        return { 
          color: 'bg-amber-50 text-amber-700 border-amber-200', 
          icon: <Clock className="h-4 w-4 mr-1" />,
          description: 'Clientes sem pedidos há mais de 30 dias'
        };
      default:
        return { 
          color: 'bg-gray-50 text-gray-700 border-gray-200', 
          icon: <User className="h-4 w-4 mr-1" />,
          description: ''
        };
    }
  };

  // Contagem de clientes por segmento
  const segmentCounts = {
    novo: segmentedCustomers.filter(c => c.segment === 'novo').length,
    regular: segmentedCustomers.filter(c => c.segment === 'regular').length,
    vip: segmentedCustomers.filter(c => c.segment === 'vip').length,
    inativo: segmentedCustomers.filter(c => c.segment === 'inativo').length
  };

  // Manipular seleção de clientes
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomers(prev => {
      if (prev.includes(customerId)) {
        return prev.filter(id => id !== customerId);
      } else {
        return [...prev, customerId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id || c.phone));
    }
  };

  // Manipular envio de promoção
  const handleSendPromotion = () => {
    if (selectedCustomers.length > 0) {
      // Simulação de envio
      const simulatedMessage = `
        Simulação de Campanha:
        ------------------------
        Título: ${promotionData.title}
        Mensagem: ${promotionData.message}
        Desconto: ${promotionData.discount}%
        Expira em: ${promotionData.expirationDays} dias
        Canal: ${promotionData.channel}
        Clientes Selecionados: ${selectedCustomers.length}
        ------------------------
        IDs dos Clientes: ${selectedCustomers.join(', ')}
      `;
      setSimulationResult(simulatedMessage);
      // Não chama mais onSendPromotion diretamente para simulação
      // if (onSendPromotion) {
      //   onSendPromotion(selectedCustomers, promotionData);
      // }
      setShowPromotionForm(false); // Fecha o formulário após simular
      // setSelectedCustomers([]); // Pode ser útil manter selecionado para nova simulação ou limpar
      // setPromotionData({ // Resetar ou não o formulário é uma decisão de UX
      //   title: '',
      //   message: '',
      //   discount: '10',
      //   expirationDays: '7',
      //   channel: 'whatsapp'
      // });
    }
  };

  const activeSegmentInfo = getSegmentInfo(activeTab);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Segmentação de Clientes</CardTitle>
        <CardDescription>
          Gerencie seus clientes por segmentos e envie campanhas direcionadas
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="novo" value={activeTab} onValueChange={(value) => setActiveTab(value as CustomerSegment)}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="novo" className="flex items-center">
                <User className="h-4 w-4 mr-1" /> 
                Novos ({segmentCounts.novo})
              </TabsTrigger>
              <TabsTrigger value="regular" className="flex items-center">
                <Users className="h-4 w-4 mr-1" /> 
                Regulares ({segmentCounts.regular})
              </TabsTrigger>
              <TabsTrigger value="vip" className="flex items-center">
                <Award className="h-4 w-4 mr-1" /> 
                VIPs ({segmentCounts.vip})
              </TabsTrigger>
              <TabsTrigger value="inativo" className="flex items-center">
                <Clock className="h-4 w-4 mr-1" /> 
                Inativos ({segmentCounts.inativo})
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar clientes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9 w-[200px]"
                />
              </div>
              
              {selectedCustomers.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowPromotionForm(true)}
                  className="h-9"
                >
                  <Tag className="h-4 w-4 mr-1" /> 
                  Criar Campanha ({selectedCustomers.length})
                </Button>
              )}
            </div>
          </div>
          
          <div className="bg-muted/50 p-3 rounded-md mb-4">
            <div className="flex items-center">
              {activeSegmentInfo.icon}
              <span className="font-medium">Clientes {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
              <span className="text-sm text-muted-foreground ml-2">({activeSegmentInfo.description})</span>
            </div>
          </div>
          
          {showPromotionForm ? (
            <div className="bg-card border rounded-md p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Nova Campanha de Marketing</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowPromotionForm(false)}>
                  <Ban className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título da Campanha</Label>
                  <Input
                    id="title"
                    value={promotionData.title}
                    onChange={(e) => setPromotionData({...promotionData, title: e.target.value})}
                    placeholder="Ex: Oferta Especial para Você!"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="channel">Canal de Envio</Label>
                  <Select 
                    value={promotionData.channel} 
                    onValueChange={(value) => setPromotionData({...promotionData, channel: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o canal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          WhatsApp
                        </div>
                      </SelectItem>
                      <SelectItem value="email">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="sms">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2" />
                          SMS
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea
                    id="message"
                    value={promotionData.message}
                    onChange={(e) => setPromotionData({...promotionData, message: e.target.value})}
                    placeholder="Escreva a mensagem da sua campanha aqui..."
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="discount">Desconto (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    value={promotionData.discount}
                    onChange={(e) => setPromotionData({...promotionData, discount: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="expiration">Validade (dias)</Label>
                  <Input
                    id="expiration"
                    type="number"
                    min="1"
                    value={promotionData.expirationDays}
                    onChange={(e) => setPromotionData({...promotionData, expirationDays: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="pt-2 flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Enviando para {selectedCustomers.length} cliente(s) {activeTab}
                </div>
                <Button onClick={handleSendPromotion}>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Campanha
                </Button>
              </div>
            </div>
          ) : (
            <div className="border rounded-md">
              <div className="grid grid-cols-[25px_1fr_1fr_100px_100px_80px] p-3 border-b bg-muted/50 text-sm font-medium">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </div>
                <div>Nome</div>
                <div>Contato</div>
                <div className="text-right">Total Gasto</div>
                <div className="text-right">Último Pedido</div>
                <div className="text-center">Pedidos</div>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => (
                    <div 
                      key={customer.id || customer.phone} 
                      className="grid grid-cols-[25px_1fr_1fr_100px_100px_80px] p-3 border-b hover:bg-muted/30 text-sm"
                    >
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          checked={selectedCustomers.includes(customer.id || customer.phone)}
                          onChange={() => handleSelectCustomer(customer.id || customer.phone)}
                          className="rounded"
                        />
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">{customer.name}</span>
                      </div>
                      <div>
                        <div>{customer.phone}</div>
                        {customer.email && <div className="text-xs text-muted-foreground">{customer.email}</div>}
                      </div>
                      <div className="text-right">
                        {formatCurrency(customer.totalSpent)}
                      </div>
                      <div className="text-right text-xs">
                        {customer.lastOrderDate 
                          ? format(new Date(customer.lastOrderDate), 'dd/MM/yyyy')
                          : '-'}
                      </div>
                      <div className="text-center">
                        {customer.totalOrders}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    Nenhum cliente encontrado neste segmento.
                  </div>
                )}
              </div>
            </div>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
};