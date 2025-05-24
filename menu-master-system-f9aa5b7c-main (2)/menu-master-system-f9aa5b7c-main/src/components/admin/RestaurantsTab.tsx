
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RestaurantsList } from '@/components/admin/RestaurantsList';
import { Restaurant } from '@/types';

interface RestaurantsTabProps {
  restaurants: Restaurant[];
}

export const RestaurantsTab: React.FC<RestaurantsTabProps> = ({ restaurants }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Restaurantes</CardTitle>
        <CardDescription>
          Gerencie os restaurantes cadastrados na plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RestaurantsList restaurants={restaurants} />
      </CardContent>
      <CardFooter>
        <Button className="ml-auto">Adicionar Restaurante</Button>
      </CardFooter>
    </Card>
  );
};
