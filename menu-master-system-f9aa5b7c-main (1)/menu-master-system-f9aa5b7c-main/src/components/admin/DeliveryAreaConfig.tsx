import { useForm } from 'react-hook-form';
import { DeliveryArea } from '@/types';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';
import { Switch } from '@/components/ui/switch';
import { MapPin, Plus, Trash } from 'lucide-react';

export const DeliveryAreaConfig = () => {
  const form = useForm<DeliveryArea>({
    defaultValues: {
      name: '',
      polygon: [],
      fee: 0,
      minOrder: 0,
      isActive: true
    }
  });

  const columns: DataTableColumn<DeliveryArea>[] = [
    { header: 'Nome', accessor: 'name' },
    { header: 'Taxa', accessor: (d) => `R$ ${d.fee.toFixed(2)}` },
    { header: 'Ped. Mínimo', accessor: (d) => `R$ ${d.minOrder.toFixed(2)}` },
    { header: 'Ativo', accessor: (d) => (d.isActive ? 'Sim' : 'Não') },
    {
      header: 'Ações',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => form.reset(row.original)}
          >
            Editar
          </Button>
          <Button variant="ghost" size="sm">
            <Trash className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => console.log(data))} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Área</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Taxa de Entrega</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pedido Mínimo</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          <div className="border p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5" />
              <h3 className="font-medium">Definir área no mapa</h3>
            </div>
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">Mapa interativo (Integrar com API de mapas)</span>
            </div>
          </div>

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Ativar esta área</FormLabel>
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline">Cancelar</Button>
            <Button type="submit"><Plus className="h-4 w-4 mr-2" /> Adicionar Área</Button>
          </div>
        </form>
      </Form>

      <DataTable
        columns={columns}
        data={[]}
        emptyMessage="Nenhuma área de entrega cadastrada"
      />
    </div>
  );
};