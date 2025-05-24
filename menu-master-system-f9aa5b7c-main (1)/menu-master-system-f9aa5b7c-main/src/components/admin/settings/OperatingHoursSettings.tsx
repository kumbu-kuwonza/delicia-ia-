import React, { useState, useEffect } from 'react';
import { OperatingHoursInput, DayHours } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { PlusCircle, Trash2, Clock } from 'lucide-react';

const daysOfWeek = [
  { key: 'monday', label: 'Segunda-feira' },
  { key: 'tuesday', label: 'Terça-feira' },
  { key: 'wednesday', label: 'Quarta-feira' },
  { key: 'thursday', label: 'Quinta-feira' },
  { key: 'friday', label: 'Sexta-feira' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
] as const;

type DayKey = typeof daysOfWeek[number]['key'];

const initialDayHours: DayHours = { open: '09:00', close: '18:00', isOpen: true };

const initialOperatingHours: OperatingHoursInput = {
  monday: [{ ...initialDayHours }],
  tuesday: [{ ...initialDayHours }],
  wednesday: [{ ...initialDayHours }],
  thursday: [{ ...initialDayHours }],
  friday: [{ ...initialDayHours }],
  saturday: [{ ...initialDayHours, open: '10:00', close: '22:00' }],
  sunday: [{ isOpen: false, open: '', close: '' }],
};

import { getRestaurantSettings, updateRestaurantSettings } from '@/services/restaurantService';

const OperatingHoursSettings: React.FC = () => {
  const [operatingHours, setOperatingHours] = useState<OperatingHoursInput>(initialOperatingHours); // Manter initial para fallback ou UI inicial
  const [isLoading, setIsLoading] = useState(true); // Iniciar como true para carregar dados
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const settings = await getRestaurantSettings();
        if (settings && settings.operatingHours) {
          // Validar e preencher se algum dia não estiver presente no DTO do backend
          const completeHours: OperatingHoursInput = { ...initialOperatingHours };
          let hasChanges = false;
          for (const dayKey of daysOfWeek.map(d => d.key)) {
            if (settings.operatingHours[dayKey]) {
              completeHours[dayKey] = settings.operatingHours[dayKey];
            } else {
              // Se um dia não vier do backend, usamos o inicial (ex: domingo fechado por padrão)
              // Isso garante que a UI sempre tenha todos os dias para configurar
              completeHours[dayKey] = initialOperatingHours[dayKey]; 
              hasChanges = true; // Indica que precisamos potencialmente salvar essa estrutura completa de volta
            }
          }
          setOperatingHours(completeHours);
          if (hasChanges) {
            console.warn("Alguns dias não foram retornados pelo backend, usando valores iniciais. Considere salvar para persistir a estrutura completa.");
          }
        } else {
          // Se não houver settings.operatingHours, usa o initialOperatingHours completo
          setOperatingHours(initialOperatingHours);
          console.warn("Nenhum horário de funcionamento encontrado no backend, usando valores iniciais. Considere salvar para persistir.");
        }
      } catch (err) {
        setError('Falha ao carregar horários de funcionamento.');
        console.error(err);
        // Manter initialOperatingHours em caso de erro para a UI não quebrar
        setOperatingHours(initialOperatingHours);
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, []);

  const handleDayToggle = (day: DayKey, dayIndex: number, checked: boolean) => {
    setOperatingHours(prev => {
      const updatedDay = [...prev[day]];
      updatedDay[dayIndex] = { ...updatedDay[dayIndex], isOpen: checked };
      if (!checked) {
        // Se fechar, pode-se limpar os horários ou manter para reativar fácil
        // updatedDay[dayIndex].open = '';
        // updatedDay[dayIndex].close = '';
      }
      return { ...prev, [day]: updatedDay };
    });
  };

  const handleTimeChange = (day: DayKey, dayIndex: number, field: 'open' | 'close', value: string) => {
    setOperatingHours(prev => {
      const updatedDay = [...prev[day]];
      updatedDay[dayIndex] = { ...updatedDay[dayIndex], [field]: value };
      return { ...prev, [day]: updatedDay };
    });
  };

  const addTimeSlot = (day: DayKey) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: [...prev[day], { ...initialDayHours, open: '', close: '' }],
    }));
  };

  const removeTimeSlot = (day: DayKey, index: number) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: prev[day].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await updateRestaurantSettings({ operatingHours });
      console.log('Horários salvos:', operatingHours);
      alert('Horários de funcionamento salvos com sucesso!'); // TODO: Substituir por toast
    } catch (err) {
      setError('Falha ao salvar horários de funcionamento.');
      console.error(err);
      alert('Erro ao salvar. Tente novamente.'); // TODO: Substituir por toast
    }
    setIsLoading(false);
  };

  if (isLoading) { 
    return <p className="text-center p-4">Carregando configurações de horário...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-6 w-6 mr-2 text-restaurant-primary" />
          Horários de Funcionamento
        </CardTitle>
        <CardDescription>
          Defina os horários em que seu estabelecimento está aberto para receber pedidos.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6 pt-6">
          {daysOfWeek.map(({ key, label }) => (
            <div key={key} className="p-4 border rounded-md bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-gray-300">{label}</h3>
              {operatingHours[key].map((slot, index) => (
                <div key={index} className="space-y-3 mb-4 pb-4 border-b last:border-b-0 last:pb-0 last:mb-0">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`${key}-${index}-isOpen`} className="text-sm font-medium">
                      {operatingHours[key].length > 1 ? `Intervalo ${index + 1}` : 'Funcionamento'}
                    </Label>
                    <Switch
                      id={`${key}-${index}-isOpen`}
                      checked={slot.isOpen}
                      onCheckedChange={(checked) => handleDayToggle(key, index, checked)}
                    />
                  </div>
                  {slot.isOpen && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`${key}-${index}-open`}>Abre às</Label>
                        <Input
                          id={`${key}-${index}-open`}
                          type="time"
                          value={slot.open}
                          onChange={(e) => handleTimeChange(key, index, 'open', e.target.value)}
                          disabled={!slot.isOpen}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${key}-${index}-close`}>Fecha às</Label>
                        <Input
                          id={`${key}-${index}-close`}
                          type="time"
                          value={slot.close}
                          onChange={(e) => handleTimeChange(key, index, 'close', e.target.value)}
                          disabled={!slot.isOpen}
                        />
                      </div>
                    </div>
                  )}
                  {operatingHours[key].length > 1 && (
                     <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTimeSlot(key, index)}
                        className="text-red-500 hover:text-red-700 mt-1 float-right"
                        disabled={operatingHours[key].length <= 1 && !slot.isOpen}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Remover Intervalo
                      </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addTimeSlot(key)}
                className="mt-2 text-restaurant-secondary border-restaurant-secondary hover:bg-restaurant-secondary/10"
              >
                <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Intervalo
              </Button>
            </div>
          ))}
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
            {isLoading ? 'Salvando...' : 'Salvar Horários'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default OperatingHoursSettings;