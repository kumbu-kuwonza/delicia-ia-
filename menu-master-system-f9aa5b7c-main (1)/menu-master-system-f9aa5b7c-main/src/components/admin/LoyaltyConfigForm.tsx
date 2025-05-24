
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LoyaltyConfig } from '@/types';
import { useToast } from '@/components/ui/use-toast';

interface LoyaltyConfigFormProps {
  initialConfig?: LoyaltyConfig;
  onSave: (config: LoyaltyConfig) => void;
}

const defaultConfig: LoyaltyConfig = {
  pointsPerCurrency: 10, // 10 points per R$1
  minSpendForPoints: 10, // R$10 minimum to earn points
  minOrdersForLoyalty: 3, // 3 orders minimum to join loyalty program
  tierThresholds: {
    silver: 1000,
    gold: 5000,
    platinum: 10000
  },
  tierBenefits: {
    bronze: { pointMultiplier: 1 },
    silver: { pointMultiplier: 1.2 },
    gold: { pointMultiplier: 1.5 },
    platinum: { pointMultiplier: 2 }
  }
};

export const LoyaltyConfigForm: React.FC<LoyaltyConfigFormProps> = ({ 
  initialConfig = defaultConfig,
  onSave 
}) => {
  const [config, setConfig] = useState<LoyaltyConfig>(initialConfig);
  const { toast } = useToast();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>, 
    section?: keyof LoyaltyConfig,
    subSection?: string
  ) => {
    const { name, value } = e.target;
    
    if (section && subSection) {
      // Handle nested objects like tierBenefits.bronze.pointMultiplier
      setConfig(prev => {
        // Use default config if prev is null or undefined
        const currentConfig = prev || defaultConfig;
        const updatedConfig = { ...currentConfig };
        
        if (section === 'tierBenefits') {
          const tierKey = subSection as 'bronze' | 'silver' | 'gold' | 'platinum';
          if (updatedConfig.tierBenefits) {
            updatedConfig.tierBenefits = {
              ...updatedConfig.tierBenefits,
              [tierKey]: {
                ...updatedConfig.tierBenefits[tierKey],
                [name]: parseFloat(value)
              }
            };
          }
        }
        
        return updatedConfig;
      });
    } else if (section) {
      // Handle first level nested properties like tierThresholds.silver
      setConfig(prev => {
        // Use default config if prev is null or undefined
        const currentConfig = prev || defaultConfig;
        const updatedConfig = { ...currentConfig };
        
        if (section === 'tierThresholds' && updatedConfig.tierThresholds) {
          updatedConfig.tierThresholds = {
            ...updatedConfig.tierThresholds,
            [name]: parseFloat(value)
          };
        }
        
        return updatedConfig;
      });
    } else {
      // Handle direct properties
      setConfig(prev => {
        // Use default config if prev is null or undefined
        const currentConfig = prev || defaultConfig;
        return {
          ...currentConfig,
          [name]: parseFloat(value)
        };
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
    toast({
      title: "Configurações salvas",
      description: "As configurações do programa de pontos foram atualizadas com sucesso.",
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configurações do Programa de Fidelidade</CardTitle>
        <CardDescription>
          Configure como os clientes ganham e usam pontos no seu programa de fidelidade.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="pointsPerCurrency">Pontos por Real gasto</Label>
              <Input
                id="pointsPerCurrency"
                name="pointsPerCurrency"
                type="number"
                value={config.pointsPerCurrency}
                onChange={(e) => handleChange(e)}
                min="1"
                step="1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Ex: 10 pontos por R$1 gasto
              </p>
            </div>

            <div>
              <Label htmlFor="minSpendForPoints">Gasto mínimo para ganhar pontos (R$)</Label>
              <Input
                id="minSpendForPoints"
                name="minSpendForPoints"
                type="number"
                value={config.minSpendForPoints}
                onChange={(e) => handleChange(e)}
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <Label htmlFor="minOrdersForLoyalty">Pedidos mínimos para participar do programa</Label>
              <Input
                id="minOrdersForLoyalty"
                name="minOrdersForLoyalty"
                type="number"
                value={config.minOrdersForLoyalty}
                onChange={(e) => handleChange(e)}
                min="0"
                step="1"
              />
            </div>

            <Separator className="my-4" />
            
            <h3 className="font-medium text-sm">Limites de Níveis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="silver">Pontos para nível Prata</Label>
                <Input
                  id="silver"
                  name="silver"
                  type="number"
                  value={config.tierThresholds.silver}
                  onChange={(e) => handleChange(e, 'tierThresholds')}
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <Label htmlFor="gold">Pontos para nível Ouro</Label>
                <Input
                  id="gold"
                  name="gold"
                  type="number"
                  value={config.tierThresholds.gold}
                  onChange={(e) => handleChange(e, 'tierThresholds')}
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <Label htmlFor="platinum">Pontos para nível Platina</Label>
                <Input
                  id="platinum"
                  name="platinum"
                  type="number"
                  value={config.tierThresholds.platinum}
                  onChange={(e) => handleChange(e, 'tierThresholds')}
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <Separator className="my-4" />

            <h3 className="font-medium text-sm">Benefícios por Nível (Multiplicador de Pontos)</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="bronzeMultiplier">Bronze (x)</Label>
                <Input
                  id="bronzeMultiplier"
                  name="pointMultiplier"
                  type="number"
                  value={config.tierBenefits.bronze.pointMultiplier}
                  onChange={(e) => handleChange(e, 'tierBenefits', 'bronze')}
                  min="1"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="silverMultiplier">Prata (x)</Label>
                <Input
                  id="silverMultiplier"
                  name="pointMultiplier"
                  type="number"
                  value={config.tierBenefits.silver.pointMultiplier}
                  onChange={(e) => handleChange(e, 'tierBenefits', 'silver')}
                  min="1"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="goldMultiplier">Ouro (x)</Label>
                <Input
                  id="goldMultiplier"
                  name="pointMultiplier"
                  type="number"
                  value={config.tierBenefits.gold.pointMultiplier}
                  onChange={(e) => handleChange(e, 'tierBenefits', 'gold')}
                  min="1"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="platinumMultiplier">Platina (x)</Label>
                <Input
                  id="platinumMultiplier"
                  name="pointMultiplier"
                  type="number"
                  value={config.tierBenefits.platinum.pointMultiplier}
                  onChange={(e) => handleChange(e, 'tierBenefits', 'platinum')}
                  min="1"
                  step="0.1"
                />
              </div>
            </div>
          </div>
          
          <Button type="submit" className="w-full">Salvar Configurações</Button>
        </form>
      </CardContent>
    </Card>
  );
};
