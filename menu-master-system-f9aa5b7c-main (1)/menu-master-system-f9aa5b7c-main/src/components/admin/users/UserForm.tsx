import React, { useState, useEffect } from 'react';
import { User, UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';

interface UserFormProps {
  user: User | null; // Usuário existente para edição, ou null para novo usuário
  onSave: (user: User) => void;
  onCancel: () => void;
  // restaurants?: { id: string; name: string }[]; // Lista de restaurantes para associar o usuário
}

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gerente' },
  { value: 'staff', label: 'Atendente' },
  { value: 'kitchen', label: 'Cozinha' },
];

// Mock de restaurantes, idealmente viria das props
const mockRestaurants = [
  { id: 'rest1', name: 'Restaurante Principal' },
  { id: 'rest2', name: 'Filial Centro' },
];

const UserForm: React.FC<UserFormProps> = ({ user, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'staff',
    isActive: true,
    restaurantId: '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        restaurantId: user.restaurantId || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'staff',
        isActive: true,
        restaurantId: '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validação básica
    if (!formData.name || !formData.email || !formData.role) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    onSave({
      ...formData,
      id: formData.id || `new_${Date.now()}`,
      createdAt: user?.createdAt || new Date(),
      updatedAt: new Date(),
    } as User);
  };

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{user ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome Completo</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div>
            <Label htmlFor="role">Função</Label>
            <Select name="role" value={formData.role} onValueChange={(value) => handleSelectChange('role', value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma função" />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {(formData.role === 'manager' || formData.role === 'staff' || formData.role === 'kitchen') && (
            <div>
              <Label htmlFor="restaurantId">Restaurante Associado</Label>
              <Select name="restaurantId" value={formData.restaurantId || ''} onValueChange={(value) => handleSelectChange('restaurantId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um restaurante (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {mockRestaurants.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center space-x-2 pt-2">
            <Switch 
              id="isActive" 
              name="isActive" 
              checked={formData.isActive} 
              onCheckedChange={(checked) => handleSwitchChange('isActive', checked)} 
            />
            <Label htmlFor="isActive">Usuário Ativo</Label>
          </div>

          {/* TODO: Adicionar campo para senha (apenas para novos usuários ou reset) */}
          {/* TODO: Adicionar campo para permissões específicas */}

        </form>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={handleSubmit}>Salvar Usuário</Button>
      </CardFooter>
    </Card>
  );
};

export default UserForm;