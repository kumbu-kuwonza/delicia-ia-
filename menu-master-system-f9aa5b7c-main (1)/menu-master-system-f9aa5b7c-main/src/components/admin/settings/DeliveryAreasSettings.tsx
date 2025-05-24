import React, { useState, useEffect } from 'react';
import { DeliveryArea } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, MapPin, DollarSign, PackageCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils'; // Supondo que esta função exista
import { useToast } from '@/components/ui/use-toast'; // Adicionar import do useToast

import { getDeliveryAreas, saveDeliveryArea, deleteDeliveryArea } from '@/services/restaurantService';

const DeliveryAreasSettings: React.FC = () => {
  const { toast } = useToast(); // Inicializar toast
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [currentArea, setCurrentArea] = useState<Partial<DeliveryArea> | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Iniciar como true para carregar dados
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAreas = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const areas = await getDeliveryAreas();
        setDeliveryAreas(areas);
      } catch (err) {
        setError('Falha ao carregar áreas de entrega.');
        console.error(err);
        setDeliveryAreas([]); // Define como array vazio em caso de erro
      }
      setIsLoading(false);
    };
    fetchAreas();
  }, []);

  const handleAddNewArea = () => {
    setCurrentArea({ name: '', postalCodes: [], deliveryFee: 0, minOrderValue: 0, isActive: true });
    setShowForm(true);
  };

  const handleEditArea = (area: DeliveryArea) => {
    setCurrentArea({ ...area, postalCodes: [...area.postalCodes] }); // Clonar postalCodes para edição segura
    setShowForm(true);
  };

  const handleDeleteArea = async (areaId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta área de entrega?')) {
      setIsLoading(true);
      setError(null);
      try {
        await deleteDeliveryArea(areaId);
        setDeliveryAreas(prev => prev.filter(area => area.id !== areaId));
        toast({ title: 'Sucesso', description: `Área ${areaId} deletada.` });
      } catch (err) {
        setError('Falha ao excluir área.');
        console.error(err);
        toast({ title: 'Erro', description: 'Falha ao excluir área.', variant: 'destructive' });
      }
      setIsLoading(false);
    }
  };

  const handleSaveArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentArea || !currentArea.name) {
      toast({ title: 'Erro de Validação', description: 'O nome da área é obrigatório.', variant: 'destructive' });
      return;
    }

    const deliveryFee = Number(currentArea.deliveryFee);
    if (isNaN(deliveryFee) || deliveryFee < 0) {
      toast({ title: 'Erro de Validação', description: 'A taxa de entrega deve ser um número não negativo.', variant: 'destructive' });
      return;
    }

    const minOrderValue = Number(currentArea.minOrderValue);
    if (isNaN(minOrderValue) || minOrderValue < 0) {
      toast({ title: 'Erro de Validação', description: 'O pedido mínimo deve ser um número não negativo.', variant: 'destructive' });
      return;
    }

    const postalCodesArray = typeof currentArea.postalCodes === 'string'
      ? (currentArea.postalCodes as string).split(',').map(pc => pc.trim()).filter(pc => pc)
      : (currentArea.postalCodes || []);

    // Validação simples de CEP (apenas para exemplo, pode ser mais robusta)
    const cepRegex = /^\d{5}-?\d{3}$/;
    for (const pc of postalCodesArray) {
      if (!cepRegex.test(pc)) {
        toast({ title: 'Erro de Validação', description: `CEP inválido: ${pc}. Formato esperado: XXXXX-XXX ou XXXXXXXX.`, variant: 'destructive' });
        return;
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      const areaToSave: DeliveryArea = {
        id: currentArea.id || undefined, // ID será gerado pelo backend se for novo
        name: currentArea.name || '',
        postalCodes: postalCodesArray.map(pc => pc.replace('-', '')), // Salvar CEPs sem hífen para consistência
        deliveryFee: deliveryFee,
        minOrderValue: minOrderValue,
        isActive: currentArea.isActive === undefined ? true : currentArea.isActive,
      };

      const savedArea = await saveDeliveryArea(areaToSave);
      if (currentArea.id) {
        setDeliveryAreas(prev => prev.map(a => a.id === savedArea.id ? savedArea : a));
      } else {
        setDeliveryAreas(prev => [...prev, savedArea]);
      }
      console.log('Área salva:', savedArea);
      setShowForm(false);
      setCurrentArea(null);
      toast({ title: 'Sucesso', description: 'Área de entrega salva com sucesso.' });
    } catch (err) {
      setError('Falha ao salvar área de entrega.');
      console.error(err);
      toast({ title: 'Erro', description: 'Falha ao salvar área de entrega.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCurrentArea(prev => ({
      ...prev!,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  const handlePostalCodesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentArea(prev => ({
        ...prev!,
        postalCodes: e.target.value.split(',').map(pc => pc.trim()),
    }));
  };


  if (isLoading && !showForm) { // Mostrar loading apenas se não estiver no formulário e não houver áreas ainda
    return <p className="text-center p-4">Carregando áreas de entrega...</p>;
  }

  if (error && !showForm) {
    return <p className="text-red-500 p-4">{error}</p>;
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center">
              <MapPin className="h-6 w-6 mr-2 text-restaurant-primary" />
              Áreas de Entrega
            </CardTitle>
            <CardDescription>
              Configure as regiões que seu estabelecimento atende e suas taxas.
            </CardDescription>
          </div>
          {!showForm && (
            <Button onClick={handleAddNewArea}>
              <PlusCircle className="h-4 w-4 mr-2" /> Adicionar Área
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {showForm && currentArea ? (
          <form onSubmit={handleSaveArea} className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-800/50">
            <h3 className="text-lg font-semibold mb-3">{currentArea.id ? 'Editar Área' : 'Nova Área de Entrega'}</h3>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div>
              <Label htmlFor="name">Nome da Área</Label>
              <Input id="name" name="name" value={currentArea.name || ''} onChange={handleFormChange} required />
            </div>
            <div>
              <Label htmlFor="postalCodes">CEPs (separados por vírgula)</Label>
              <Input id="postalCodes" name="postalCodes" value={(currentArea.postalCodes || []).join(', ')} onChange={handlePostalCodesChange} placeholder="Ex: 12345-000, 54321-000" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deliveryFee">Taxa de Entrega (R$)</Label>
                <Input id="deliveryFee" name="deliveryFee" type="number" step="0.01" value={currentArea.deliveryFee || ''} onChange={handleFormChange} />
              </div>
              <div>
                <Label htmlFor="minOrderValue">Pedido Mínimo (R$)</Label>
                <Input id="minOrderValue" name="minOrderValue" type="number" step="0.01" value={currentArea.minOrderValue || ''} onChange={handleFormChange} />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <Switch id="isActive" name="isActive" checked={currentArea.isActive === undefined ? true : currentArea.isActive} onCheckedChange={(checked) => setCurrentArea(prev => ({ ...prev!, isActive: checked }))} />
              <Label htmlFor="isActive">Área Ativa</Label>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setCurrentArea(null); setError(null); }}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar Área'}</Button>
            </div>
          </form>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CEPs</TableHead>
                <TableHead className="text-right">Taxa</TableHead>
                <TableHead className="text-right">Pedido Mínimo</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deliveryAreas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    Nenhuma área de entrega configurada.
                  </TableCell>
                </TableRow>
              )}
              {deliveryAreas.map((area) => (
                <TableRow key={area.id}>
                  <TableCell className="font-medium">{area.name}</TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">{(area.postalCodes || []).join(', ') || '-'}</TableCell>
                  <TableCell className="text-right">{formatCurrency(area.deliveryFee)}</TableCell>
                  <TableCell className="text-right">{area.minOrderValue ? formatCurrency(area.minOrderValue) : '-'}</TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${area.isActive ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {area.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="outline" size="icon" onClick={() => handleEditArea(area)} title="Editar">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDeleteArea(area.id)} title="Excluir" disabled={isLoading}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {deliveryAreas.length > 0 && !showForm && (
         <CardFooter className='text-sm text-gray-500'>
            Total de áreas configuradas: {deliveryAreas.length}
         </CardFooter>
      )}
    </Card>
  );
};

export default DeliveryAreasSettings;