import React from 'react';
import { User, UserRole } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
  onToggleActive?: (userId: string, isActive: boolean) => void; // Opcional, para ativar/desativar
}

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrador',
  manager: 'Gerente',
  staff: 'Atendente',
  kitchen: 'Cozinha',
};

const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete, onToggleActive }) => {
  if (!users || users.length === 0) {
    return <p className="text-center text-gray-500 py-8">Nenhum usuário encontrado.</p>;
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Lista de Usuários</CardTitle>
        <CardDescription>Gerencie os usuários do sistema.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Função</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Restaurante</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge 
                    variant={user.role === 'admin' ? 'destructive' : user.role === 'manager' ? 'secondary' : 'outline'}
                  >
                    {roleLabels[user.role] || user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant={user.isActive ? 'success' : 'outline'} className="cursor-pointer">
                    {user.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">{user.restaurantId || '-'}</TableCell>
                <TableCell className="text-right space-x-2">
                  {onToggleActive && (
                    <Button variant="ghost" size="icon" onClick={() => onToggleActive(user.id, !user.isActive)} title={user.isActive ? 'Desativar' : 'Ativar'}>
                      {user.isActive ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                    </Button>
                  )}
                  <Button variant="outline" size="icon" onClick={() => onEdit(user)} title="Editar">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => onDelete(user.id)} title="Excluir">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default UserTable;