
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, AlertTriangle } from 'lucide-react';
import { toggleAutomation, isAutomationEnabled } from '@/services/orderService';
import { useToast } from '@/components/ui/use-toast';

export const AutomationControl = () => {
  const [enabled, setEnabled] = useState(isAutomationEnabled());
  const { toast } = useToast();
  
  const handleToggle = () => {
    const newState = toggleAutomation();
    setEnabled(newState);
    
    if (!newState) {
      toast({
        title: "Modo Manual Ativado",
        description: "Os pedidos terão que ser processados manualmente.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="flex items-center space-x-2 bg-white p-2 rounded-md shadow-sm border border-gray-100">
      <Settings className="h-4 w-4 text-gray-500" />
      <Switch 
        id="automation-mode" 
        checked={enabled} 
        onCheckedChange={handleToggle} 
      />
      <Label htmlFor="automation-mode" className="cursor-pointer text-sm font-medium">
        {enabled ? 'Automação Ativada' : 'Automação Desativada'}
      </Label>
      {!enabled && (
        <AlertTriangle className="h-4 w-4 text-amber-500" />
      )}
    </div>
  );
};
