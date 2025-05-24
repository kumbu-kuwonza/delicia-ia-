
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoyaltyConfigForm } from '@/components/admin/LoyaltyConfigForm';

interface LoyaltyTabProps {
  onSaveLoyaltyConfig: () => void;
}

export const LoyaltyTab: React.FC<LoyaltyTabProps> = ({ onSaveLoyaltyConfig }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração do Programa de Fidelidade</CardTitle>
        <CardDescription>
          Defina as regras e parâmetros do programa de fidelidade.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoyaltyConfigForm onSave={onSaveLoyaltyConfig} />
      </CardContent>
    </Card>
  );
};
