
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Customer } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CustomersListProps {
  customers: Customer[];
  onActivateCustomer?: (customer: Customer) => void;
}

// Helper function to get badge color based on loyalty tier
const getLoyaltyBadgeColor = (tier?: string) => {
  switch (tier) {
    case 'platinum':
      return 'bg-violet-100 text-violet-800 hover:bg-violet-200';
    case 'gold':
      return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
    case 'silver':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    default:
      return 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200';
  }
};

export const CustomersList: React.FC<CustomersListProps> = ({ 
  customers = [],
  onActivateCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState<string>('all');

  const filteredCustomers = customers.filter(customer => {
    // Apply search filter
    const matchesSearch = 
      !searchTerm || 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);
    
    // Apply tier filter
    const matchesTier = filterTier === 'all' || customer.loyaltyTier === filterTier;
    
    // Apply tab filter (active/inactive)
    const matchesTab = 
      currentTab === 'all' || 
      (currentTab === 'active' && customer.isActive) ||
      (currentTab === 'inactive' && !customer.isActive);
    
    return matchesSearch && matchesTier && matchesTab;
  });
  
  const totalCustomers = filteredCustomers.length;
  const activeCustomers = filteredCustomers.filter(c => c.isActive).length;
  const loyalCustomers = filteredCustomers.filter(c => (c.totalOrders || 0) > 3).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clientes Fiéis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loyalCustomers}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Clientes</CardTitle>
          <div className="flex flex-col md:flex-row gap-3 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar por nome ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterTier} onValueChange={setFilterTier}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os níveis</SelectItem>
                <SelectItem value="bronze">Bronze</SelectItem>
                <SelectItem value="silver">Prata</SelectItem>
                <SelectItem value="gold">Ouro</SelectItem>
                <SelectItem value="platinum">Platina</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
            </Button>
            <Button variant="outline">
              <UserPlus className="h-4 w-4 mr-1" /> Adicionar Cliente
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                Todos Clientes
              </TabsTrigger>
              <TabsTrigger value="active">
                Clientes Ativos
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Clientes Inativos
              </TabsTrigger>
            </TabsList>

            <TabsContent value={currentTab} className="mt-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Pontos</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead>Último Pedido</TableHead>
                      <TableHead>Total Gasto</TableHead>
                      <TableHead>Pedidos</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                          Nenhum cliente encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map((customer) => (
                        <TableRow key={customer.id || customer.phone}>
                          <TableCell>
                            <div className="font-medium">{customer.name}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{customer.phone}</div>
                            <div className="text-xs text-muted-foreground">{customer.address}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{customer.points}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getLoyaltyBadgeColor(customer.loyaltyTier)} variant="outline">
                              {customer.loyaltyTier === 'platinum' ? 'Platina' : 
                               customer.loyaltyTier === 'gold' ? 'Ouro' : 
                               customer.loyaltyTier === 'silver' ? 'Prata' : 'Bronze'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {customer.lastOrderDate ? 
                              formatDistanceToNow(new Date(customer.lastOrderDate), { addSuffix: true, locale: ptBR }) : 
                              'Nunca'}
                          </TableCell>
                          <TableCell>
                            R$ {customer.totalSpent?.toFixed(2) || '0.00'}
                          </TableCell>
                          <TableCell>
                            {customer.totalOrders || 0}
                          </TableCell>
                          <TableCell className="text-right">
                            {!customer.isActive && onActivateCustomer && (
                              <Button size="sm" variant="outline" onClick={() => onActivateCustomer(customer)}>
                                Ativar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
