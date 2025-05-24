import React, { useState } from 'react';
import { Customer } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Ban, Coffee, Heart, Plus, Save, Tag, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface CustomerPreferencesProps {
  customer: Customer;
  onUpdatePreferences: (customerId: string, preferences: CustomerPreferencesData) => void;
}

interface CustomerPreferencesData {
  allergies: string[];
  dietaryRestrictions: string[];
  favoriteItems: number[];
  notes: string;
}

export const CustomerPreferences = ({ customer, onUpdatePreferences }: CustomerPreferencesProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [preferences, setPreferences] = useState<CustomerPreferencesData>({
    allergies: customer.allergies || [],
    dietaryRestrictions: customer.dietaryRestrictions || [],
    favoriteItems: customer.favoriteItems || [],
    notes: customer.preferencesNotes || ''
  });
  
  const [newAllergy, setNewAllergy] = useState('');
  const [newRestriction, setNewRestriction] = useState('');
  
  // Lista de alergias comuns para sugestão
  const commonAllergies = [
    'Glúten', 'Lactose', 'Amendoim', 'Nozes', 'Soja', 'Frutos do Mar', 
    'Ovos', 'Trigo', 'Peixe', 'Mariscos', 'Mostarda', 'Gergelim'
  ];
  
  // Lista de restrições alimentares comuns
  const commonRestrictions = [
    'Vegetariano', 'Vegano', 'Sem Glúten', 'Sem Lactose', 'Baixo Carboidrato',
    'Baixo Sódio', 'Sem Açúcar', 'Kosher', 'Halal', 'Paleo', 'Cetogênica'
  ];
  
  const handleAddAllergy = (allergy: string) => {
    if (allergy.trim() && !preferences.allergies.includes(allergy.trim())) {
      setPreferences(prev => ({
        ...prev,
        allergies: [...prev.allergies, allergy.trim()]
      }));
      setNewAllergy('');
    }
  };
  
  const handleRemoveAllergy = (allergy: string) => {
    setPreferences(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy)
    }));
  };
  
  const handleAddRestriction = (restriction: string) => {
    if (restriction.trim() && !preferences.dietaryRestrictions.includes(restriction.trim())) {
      setPreferences(prev => ({
        ...prev,
        dietaryRestrictions: [...prev.dietaryRestrictions, restriction.trim()]
      }));
      setNewRestriction('');
    }
  };
  
  const handleRemoveRestriction = (restriction: string) => {
    setPreferences(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.filter(r => r !== restriction)
    }));
  };
  
  const handleSavePreferences = () => {
    onUpdatePreferences(customer.id || customer.phone, preferences);
    setIsDialogOpen(false);
  };
  
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Coffee className="h-5 w-5 mr-2 text-restaurant-primary" />
            Preferências e Restrições Alimentares
          </CardTitle>
          <CardDescription>
            Gerencie as preferências, alergias e restrições alimentares do cliente
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Alergias</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={() => setIsDialogOpen(true)}
              >
                <Plus className="h-3 w-3 mr-1" /> Editar
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-1 min-h-[40px]">
              {preferences.allergies && preferences.allergies.length > 0 ? (
                preferences.allergies.map((allergy, index) => (
                  <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <AlertCircle className="h-3 w-3 mr-1" /> {allergy}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-500">Nenhuma alergia registrada</p>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Restrições Alimentares</h3>
            <div className="flex flex-wrap gap-1 min-h-[40px]">
              {preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0 ? (
                preferences.dietaryRestrictions.map((restriction, index) => (
                  <Badge key={index} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    <Ban className="h-3 w-3 mr-1" /> {restriction}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-gray-500">Nenhuma restrição registrada</p>
              )}
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Itens Favoritos</h3>
            <div className="flex flex-wrap gap-1 min-h-[40px]">
              {preferences.favoriteItems && preferences.favoriteItems.length > 0 ? (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Heart className="h-3 w-3 mr-1" /> {preferences.favoriteItems.length} itens favoritos
                </Badge>
              ) : (
                <p className="text-sm text-gray-500">Nenhum item favorito registrado</p>
              )}
            </div>
          </div>
          
          {preferences.notes && (
            <>
              <Separator />
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Observações</h3>
                <div className="bg-gray-50 p-2 rounded-md text-sm">
                  {preferences.notes}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Preferências Alimentares</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Alergias</Label>
              <div className="flex gap-2">
                <Input 
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Adicionar alergia..."
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleAddAllergy(newAllergy)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {preferences.allergies.map((allergy, index) => (
                  <Badge key={index} variant="destructive" className="flex items-center">
                    {allergy}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 ml-1"
                      onClick={() => handleRemoveAllergy(allergy)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Sugestões de alergias comuns:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {commonAllergies.filter(ca => !preferences.allergies.includes(ca)).map(allergy => (
                  <Button 
                    key={allergy} 
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleAddAllergy(allergy)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> {allergy}
                  </Button>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Restrições Alimentares</Label>
              <div className="flex gap-2">
                <Input 
                  value={newRestriction}
                  onChange={(e) => setNewRestriction(e.target.value)}
                  placeholder="Adicionar restrição..."
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => handleAddRestriction(newRestriction)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {commonRestrictions.map((restriction) => (
                  <Badge 
                    key={restriction} 
                    variant="outline" 
                    className="cursor-pointer hover:bg-amber-100"
                    onClick={() => handleAddRestriction(restriction)}
                  >
                    {restriction}
                  </Badge>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {preferences.dietaryRestrictions.map((restriction, index) => (
                  <Badge key={index} variant="outline" className="flex items-center bg-amber-100 text-amber-800 border-amber-300">
                    {restriction}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 ml-1"
                      onClick={() => handleRemoveRestriction(restriction)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Sugestões de restrições comuns:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {commonRestrictions.filter(cr => !preferences.dietaryRestrictions.includes(cr)).map(restriction => (
                  <Button 
                    key={restriction} 
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleAddRestriction(restriction)}
                  >
                    <Plus className="h-3 w-3 mr-1" /> {restriction}
                  </Button>
                ))}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={preferences.notes}
                onChange={(e) => setPreferences(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Adicione observações sobre as preferências do cliente..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePreferences}>
              <Save className="h-4 w-4 mr-2" /> Salvar Preferências
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};