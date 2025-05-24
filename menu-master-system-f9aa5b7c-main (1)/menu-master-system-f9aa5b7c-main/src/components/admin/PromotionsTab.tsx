
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash, Plus, Images, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Promotion } from '@/types';
import { promotions as initialPromotions } from '@/data/menu';

export const PromotionsTab: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState<Partial<Promotion>>({});
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleOpenDialog = (promotion?: Promotion) => {
    if (promotion) {
      setCurrentPromotion({ ...promotion });
      setIsEditing(true);
    } else {
      setCurrentPromotion({
        id: Math.max(0, ...promotions.map(p => p.id)) + 1,
        title: '',
        description: '',
        image: '',
        badgeText: '',
        buttonText: '',
        url: '',
        active: true
      });
      setIsEditing(false);
    }
    setIsDialogOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentPromotion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setCurrentPromotion(prev => ({
      ...prev,
      active: checked
    }));
  };

  const handleSave = () => {
    if (!currentPromotion.title || !currentPromotion.description || !currentPromotion.image) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    if (isEditing) {
      setPromotions(prev => 
        prev.map(p => p.id === currentPromotion.id ? currentPromotion as Promotion : p)
      );
      toast({
        title: "Promoção atualizada",
        description: "A promoção foi atualizada com sucesso."
      });
    } else {
      setPromotions(prev => [...prev, currentPromotion as Promotion]);
      toast({
        title: "Promoção criada",
        description: "Nova promoção adicionada com sucesso."
      });
    }
    setIsDialogOpen(false);
  };

  const handleDelete = (id: number) => {
    setPromotions(prev => prev.filter(p => p.id !== id));
    toast({
      title: "Promoção removida",
      description: "A promoção foi removida com sucesso."
    });
  };

  const handlePreview = () => {
    toast({
      title: "Visualização",
      description: "Visualização da promoção ativada. Verifique a home page.",
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciamento de Promoções</CardTitle>
          <CardDescription>
            Configure as promoções e anúncios exibidos no carousel da página principal.
          </CardDescription>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Nova Promoção
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">ID</TableHead>
              <TableHead className="w-[200px]">Título</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-[100px]">Tipo</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="text-right w-[120px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promotions.map((promo) => (
              <TableRow key={promo.id}>
                <TableCell>{promo.id}</TableCell>
                <TableCell className="font-medium">{promo.title}</TableCell>
                <TableCell className="truncate max-w-[200px]">{promo.description}</TableCell>
                <TableCell>
                  <Badge variant="outline">{promo.badgeText}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={promo.active === false ? "secondary" : "default"}>
                    {promo.active === false ? "Inativo" : "Ativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(promo)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(promo.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-4 flex justify-end">
          <Button onClick={handlePreview} className="flex items-center gap-2">
            <Eye className="h-4 w-4" /> Visualizar na Home
          </Button>
        </div>
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Promoção" : "Nova Promoção"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Título*
              </Label>
              <Input
                id="title"
                name="title"
                value={currentPromotion.title}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Descrição*
              </Label>
              <Textarea
                id="description"
                name="description"
                value={currentPromotion.description}
                onChange={handleChange}
                className="col-span-3"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="image" className="text-right">
                Imagem URL*
              </Label>
              <div className="col-span-3 flex gap-2">
                <Input
                  id="image"
                  name="image"
                  value={currentPromotion.image}
                  onChange={handleChange}
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <Images className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="badgeText" className="text-right">
                Tipo
              </Label>
              <Input
                id="badgeText"
                name="badgeText"
                placeholder="Ex: NOVO, PROMOÇÃO"
                value={currentPromotion.badgeText}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="buttonText" className="text-right">
                Texto do Botão
              </Label>
              <Input
                id="buttonText"
                name="buttonText"
                placeholder="Ex: Ver Detalhes"
                value={currentPromotion.buttonText}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="url" className="text-right">
                URL
              </Label>
              <Input
                id="url"
                name="url"
                placeholder="Ex: /promocoes/nome-da-promo"
                value={currentPromotion.url}
                onChange={handleChange}
                className="col-span-3"
              />
            </div>

            <Separator />

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="active" className="text-right">
                Ativo
              </Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={currentPromotion.active !== false}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="active">
                  {currentPromotion.active !== false ? "Ativo" : "Inativo"}
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
