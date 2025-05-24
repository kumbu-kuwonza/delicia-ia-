
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Restaurant } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RestaurantsListProps {
  restaurants: Restaurant[];
  onAddRestaurant?: () => void;
  onViewRestaurant?: (id: string) => void;
}

// Helper function for subscription badge color
const getSubscriptionBadgeColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

// Helper function for plan badge color
const getPlanBadgeColor = (plan: string) => {
  switch (plan) {
    case 'premium':
      return 'bg-violet-100 text-violet-800 hover:bg-violet-200';
    case 'standard':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'basic':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

export const RestaurantsList: React.FC<RestaurantsListProps> = ({ 
  restaurants = [],
  onAddRestaurant,
  onViewRestaurant
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredRestaurants = restaurants.filter(restaurant => {
    // Apply search filter
    const matchesSearch = 
      !searchTerm || 
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      restaurant.owner.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply plan filter
    const matchesPlan = filterPlan === 'all' || restaurant.subscriptionPlan === filterPlan;
    
    // Apply status filter
    const matchesStatus = filterStatus === 'all' || restaurant.subscriptionStatus === filterStatus;
    
    return matchesSearch && matchesPlan && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Restaurantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{restaurants.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Assinaturas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {restaurants.filter(r => r.subscriptionStatus === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Planos Premium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600">
              {restaurants.filter(r => r.subscriptionPlan === 'premium').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Novos este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {restaurants.filter(r => {
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                return new Date(r.registrationDate) >= oneMonthAgo;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Restaurantes</CardTitle>
          <div className="flex flex-col md:flex-row gap-3 pt-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Buscar restaurante ou proprietário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filtrar por plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                <SelectItem value="basic">Básico</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => onAddRestaurant && onAddRestaurant()}>
              <Plus className="h-4 w-4 mr-1" /> Novo Restaurante
            </Button>
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-1" /> Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurante</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRestaurants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      Nenhum restaurante encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRestaurants.map((restaurant) => (
                    <TableRow key={restaurant.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={restaurant.logo} alt={restaurant.name} />
                            <AvatarFallback>{restaurant.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{restaurant.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{restaurant.owner}</TableCell>
                      <TableCell>
                        <div className="text-sm">{restaurant.phone}</div>
                        <div className="text-xs text-muted-foreground">{restaurant.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPlanBadgeColor(restaurant.subscriptionPlan)} variant="outline">
                          {restaurant.subscriptionPlan === 'premium' ? 'Premium' :
                           restaurant.subscriptionPlan === 'standard' ? 'Standard' : 'Básico'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSubscriptionBadgeColor(restaurant.subscriptionStatus)}>
                          {restaurant.subscriptionStatus === 'active' ? 'Ativo' :
                           restaurant.subscriptionStatus === 'pending' ? 'Pendente' : 'Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(restaurant.registrationDate), { addSuffix: true, locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => onViewRestaurant && onViewRestaurant(restaurant.id || '')}>
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
