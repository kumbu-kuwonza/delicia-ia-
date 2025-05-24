import { useState } from 'react';
import { User, UserRole } from '@/types';
import {
  DataTable,
  DataTableColumn,
  DataTableActions
} from '@/components/ui/data-table';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select';

type UserForm = {
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
};

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserForm>({
    name: '',
    email: '',
    role: 'atendente',
    isActive: true
  });

  const columns: DataTableColumn<User>[] = [
    { header: 'Nome', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Função', accessor: 'role' },
    { header: 'Status', accessor: (u) => u.isActive ? 'Ativo' : 'Inativo' },
    {
      header: 'Ações',
      cell: ({ row }) => (
        <DataTableActions
          onEdit={() => handleEdit(row.original)}
          onDelete={() => handleDelete(row.original.id)}
        />
      )
    }
  ];

  const handleEdit = (user: User) => {
    setSelectedUser({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    setOpenDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrar com API
    console.log('Salvar usuário:', selectedUser);
    setOpenDialog(false);
  };

  const handleDelete = async (userId?: string) => {
    if (userId) {
      // TODO: Integrar com API
      console.log('Excluir usuário:', userId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestão de Usuários</h2>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button>Novo Usuário</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedUser.email ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nome"
                value={selectedUser.name}
                onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
              />
              <Input
                label="Email"
                type="email"
                value={selectedUser.email}
                onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
              />
              <Select
                value={selectedUser.role}
                onValueChange={(value: UserRole) => setSelectedUser({...selectedUser, role: value})}
              >
                <SelectTrigger label="Função">
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="gerente">Gerente</SelectItem>
                  <SelectItem value="atendente">Atendente</SelectItem>
                  <SelectItem value="cozinha">Cozinha</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpenDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <DataTable
        columns={columns}
        data={users}
        emptyMessage="Nenhum usuário cadastrado"
      />
    </div>
  );
};