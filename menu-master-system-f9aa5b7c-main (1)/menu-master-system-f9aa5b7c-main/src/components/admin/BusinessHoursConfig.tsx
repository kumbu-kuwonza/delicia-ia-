import { useForm } from 'react-hook-form';
import { OperatingHoursInput } from '@/types';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash } from 'lucide-react';

export const BusinessHoursConfig = () => {
  const form = useForm<OperatingHoursInput>({
    defaultValues: {
      monday: [{ open: '', close: '', isOpen: false }],
      tuesday: [{ open: '', close: '', isOpen: false }],
      wednesday: [{ open: '', close: '', isOpen: false }],
      thursday: [{ open: '', close: '', isOpen: false }],
      friday: [{ open: '', close: '', isOpen: false }],
      saturday: [{ open: '', close: '', isOpen: false }],
      sunday: [{ open: '', close: '', isOpen: false }]
    }
  });

  const renderDayFields = (day: keyof OperatingHoursInput) => (
    <div className="space-y-4 border p-4 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{day.charAt(0).toUpperCase() + day.slice(1)}</h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => form.setValue(day, [...form.getValues(day), { open: '', close: '', isOpen: false }])}
        >
          <Plus className="h-4 w-4 mr-2" /> Adicionar Horário
        </Button>
      </div>
      
      {form.watch(day).map((_, index) => (
        <div key={index} className="flex gap-4 items-end">
          <FormField
            control={form.control}
            name={`${day}.${index}.isOpen`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>Aberto</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${day}.${index}.open`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Abertura</FormLabel>
                <FormControl>
                  <Input type="time" {...field} disabled={!form.watch(`${day}.${index}.isOpen`)} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${day}.${index}.close`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fechamento</FormLabel>
                <FormControl>
                  <Input type="time" {...field} disabled={!form.watch(`${day}.${index}.isOpen`)} />
                </FormControl>
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const current = form.getValues(day);
              form.setValue(day, current.filter((_, i) => i !== index));
            }}
          >
            <Trash className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ))}
    </div>
  ));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => console.log(data))} className="space-y-6">
        {Object.keys(form.getValues()).map((day) =>
          renderDayFields(day as keyof OperatingHoursInput)
        )}
        <div className="flex justify-end">
          <Button type="submit">Salvar Alterações</Button>
        </div>
      </form>
    </Form>
  );
};