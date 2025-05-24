import React, { useState } from 'react';
import { Customer, Order } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustomerSegmentation } from './CustomerSegmentation';
import { CustomerPreferences } from './CustomerPreferences';
import { CustomerInfoCard } from '../kitchen/CustomerInfoCard';
import { CustomerOrderHistory } from './CustomerOrderHistory';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, User, Tag, BarChart, Send, Mail, MessageSquare, Search, Filter } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CRMDashboardProps {
  customers: Customer[];
  orders: Order[];
  onUpdateCustomer?: (customer: Customer) => void;
  onSendPromotion?: (customerIds: string[], promotionData: any) => void;
}

export const CRMDashboard = ({ customers, orders, onUpdateCustomer, onSendPromotion }: CRMDashboardProps) => {
  const [activeTab, setActiveTab] = useState('segmentation');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const { toast } = useToast();

  // Função para atualizar as preferências de um cliente
  const handleUpdatePreferences = (customerId: string, preferences: any) => {
    const customer = customers.find(c => c.id === customerId || c.phone === customerId);
    
    if (customer && onUpdateCustomer) {
      const updatedCustomer = {
        ...customer,
        allergies: preferences.allergies,
        dietaryRestrictions: preferences.dietaryRestrictions,
        favoriteItems: preferences.favoriteItems,
        preferencesNotes: preferences.notes
      };
      
      onUpdateCustomer(updatedCustomer);
      
      toast({
        title: "Preferências atualizadas",
        description: `As preferências de ${customer.name} foram atualizadas com sucesso.`,
      });
    }
  };

  // Função para enviar promoção para clientes
  const handleSendPromotion = (customerIds: string[], promotionData: any) => {
    if (onSendPromotion) {
      onSendPromotion(customerIds, promotionData);
      
      toast({
        title: "Promoção enviada",
        description: `A promoção foi enviada para ${customerIds.length} cliente(s).`,
      });
    }
  };

  // Função para visualizar detalhes de um cliente
  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetails(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">CRM e Jornada do Cliente</h1>
          <p className="text-muted-foreground">Gerencie relacionamentos e acompanhe a jornada dos seus clientes</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
          <Button>
            <User className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4">
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Visão Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-500" />
                  <span>Total de Clientes</span>
                </div>
                <span className="text-xl font-bold">{customers.length}</span>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2 text-green-500" />
                  <span>Pedidos Realizados</span>
                </div>
                <span className="text-xl font-bold">{orders.length}</span>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-purple-500" />
                  <span>Clientes VIP</span>
                </div>
                <span className="text-xl font-bold">
                  {customers.filter(c => {
                    const customerOrders = orders.filter(o => o.customer.phone === c.phone);
                    const totalSpent = customerOrders.reduce((total, order) => total + order.total, 0);
                    return customerOrders.length > 10 || totalSpent > 1000;
                  }).length}
                </span>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-md flex items-center justify-between">
                <div className="flex items-center">
                  <User className="h-5 w-5 mr-2 text-amber-500" />
                  <span>Clientes Inativos</span>
                </div>
                <span className="text-xl font-bold">
                  {customers.filter(c => {
                    const customerOrders = orders.filter(o => o.customer.phone === c.phone);
                    if (customerOrders.length === 0) return false;
                    
                    const lastOrderDate = new Date(Math.max(...customerOrders.map(o => new Date(o.createdAt).getTime())));
                    const daysSinceLastOrder = Math.floor((new Date().getTime() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
                    
                    return daysSinceLastOrder > 30;
                  }).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardContent className="p-0">
            <Tabs defaultValue="segmentation" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full justify-start border-b rounded-none h-12 px-4 pt-2">
                <TabsTrigger value="segmentation" className="data-[state=active]:bg-background">
                  <Users className="h-4 w-4 mr-2" />
                  Segmentação
                </TabsTrigger>
                <TabsTrigger value="preferences" className="data-[state=active]:bg-background">
                  <Tag className="h-4 w-4 mr-2" />
                  Preferências
                </TabsTrigger>
                <TabsTrigger value="orderHistory" className="data-[state=active]:bg-background"> {/* Nova Aba */}
                  <Clock className="h-4 w-4 mr-2" /> {/* Ícone de exemplo, pode ser alterado */}
                  Histórico de Pedidos
                </TabsTrigger>
                <TabsTrigger value="campaigns" className="data-[state=active]:bg-background">
                  <Mail className="h-4 w-4 mr-2" />
                  Campanhas
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-background">
                  <BarChart className="h-4 w-4 mr-2" />
                  Análises
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="segmentation" className="p-4">
                <CustomerSegmentation 
                  customers={customers} 
                  orders={orders} 
                  onSendPromotion={handleSendPromotion}
                />
              </TabsContent>
              
              <TabsContent value="preferences" className="p-4">
                {selectedCustomer ? (
                  <CustomerPreferences 
                    customer={selectedCustomer} 
                    onUpdatePreferences={handleUpdatePreferences}
                  />
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground mb-4">Selecione um cliente para gerenciar suas preferências</p>
                    <div className="grid grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
                      {customers.map(customer => (
                        <Card key={customer.id || customer.phone} className="cursor-pointer hover:border-primary" onClick={() => setSelectedCustomer(customer)}>
                          <CardContent className="p-4">
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">{customer.phone}</div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="orderHistory" className="p-4"> {/* Novo Conteúdo da Aba */}
                {selectedCustomer ? (
                  <CustomerOrderHistory customer={selectedCustomer} />
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-muted-foreground mb-4">Selecione um cliente para ver o histórico de pedidos.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
                      {customers.map(customer => (
                        <Card key={customer.id || customer.phone} className="cursor-pointer hover:border-primary transition-all duration-200 ease-in-out" onClick={() => setSelectedCustomer(customer)}>
                          <CardHeader className="p-3">
                            <CardTitle className="text-base">{customer.name}</CardTitle>
                            <CardDescription className="text-xs">{customer.phone}</CardDescription>
                          </CardHeader>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="campaigns" className="p-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Campanhas de Marketing</CardTitle>
                    <CardDescription>
                      Crie e gerencie campanhas de marketing para seus clientes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <Card className="cursor-pointer hover:border-primary">
                        <CardContent className="p-4 flex flex-col items-center justify-center h-[200px]">
                          <Send className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="font-medium">Nova Campanha</p>
                          <p className="text-sm text-muted-foreground">Criar uma nova campanha de marketing</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-amber-50 border-amber-200">
                        <CardContent className="p-4">
                          <div className="font-medium text-amber-800 mb-2">Recuperação de Clientes Inativos</div>
                          <p className="text-sm text-amber-700 mb-4">Campanha para clientes sem pedidos há mais de 30 dias</p>
                          <div className="text-xs text-amber-600">Enviada para 12 clientes</div>
                          <div className="text-xs text-amber-600">Taxa de conversão: 25%</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                          <div className="font-medium text-blue-800 mb-2">Boas-vindas a Novos Clientes</div>
                          <p className="text-sm text-blue-700 mb-4">Campanha de boas-vindas com desconto no primeiro pedido</p>
                          <div className="text-xs text-blue-600">Enviada para 8 clientes</div>
                          <div className="text-xs text-blue-600">Taxa de conversão: 50%</div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="analytics" className="p-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Análise de Clientes</CardTitle>
                    <CardDescription>
                      Visualize métricas e tendências dos seus clientes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] flex items-center justify-center">
                      <p className="text-muted-foreground">Gráficos e análises serão implementados em breve</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <Dialog open={showCustomerDetails} onOpenChange={setShowCustomerDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
          </DialogHeader>
          
          {selectedCustomer && (
            <div className="space-y-4">
              <CustomerInfoCard customer={selectedCustomer} orders={orders} />
              
              <CustomerPreferences 
                customer={selectedCustomer} 
                onUpdatePreferences={handleUpdatePreferences}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomerDetails(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};