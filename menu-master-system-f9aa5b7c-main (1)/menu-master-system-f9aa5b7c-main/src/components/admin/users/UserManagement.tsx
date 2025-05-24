import React, { useState, useEffect } from 'react';
import { fetchUsers, createUser, updateUser, deleteUser } from '@/services/userService';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import UserTable from './UserTable';
import UserForm from './UserForm';



const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const fetchedUsers = await fetchUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        // TODO: Adicionar tratamento de erro para o usuário (ex: toast)
      }
    };
    loadUsers();
  }, []);

  const handleAddNewUser = () => {
    setSelectedUser(null);
    setShowUserForm(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowUserForm(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await deleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
        console.log(`Usuário ${userId} deletado.`);
        // TODO: Adicionar toast de sucesso
      } catch (error) {
        console.error(`Erro ao deletar usuário ${userId}:`, error);
        // TODO: Adicionar toast de erro
      }
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const updatedUser = await updateUser(userId, { isActive });
      if (updatedUser) {
        setUsers(users.map(user => (user.id === userId ? updatedUser : user)));
        console.log(`Usuário ${userId} status alterado para ${isActive}.`);
        // TODO: Adicionar toast de sucesso
      }
    } catch (error) {
      console.error(`Erro ao alterar status do usuário ${userId}:`, error);
      // TODO: Adicionar toast de erro
    }
  };

  const handleSaveUser = async (userData: User) => {
    try {
      if (userData.id) {
        const updated = await updateUser(userData.id, userData);
        if (updated) {
          setUsers(users.map(u => (u.id === userData.id ? updated : u)));
          console.log('Usuário atualizado:', updated);
        }
      } else {
        // Removendo id, createdAt e updatedAt para a criação, pois são gerados pelo serviço
        const { id, createdAt, updatedAt, ...newUserData } = userData;
        const created = await createUser(newUserData as Omit<User, 'id' | 'createdAt' | 'updatedAt'>);
        setUsers([...users, created]);
        console.log('Usuário criado:', created);
      }
      setShowUserForm(false);
      setSelectedUser(null);
      // TODO: Adicionar toast de sucesso
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      // TODO: Adicionar toast de erro
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Gestão de Usuários</h1>
        <Button onClick={handleAddNewUser}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Usuário
        </Button>
      </div>

      {showUserForm && (
        <UserForm
          user={selectedUser}
          onSave={handleSaveUser}
          onCancel={() => setShowUserForm(false)}
        />
      )}

      {!showUserForm && (
        <UserTable
          users={users}
          onEdit={handleEditUser}
          onDelete={handleDeleteUser}
          onToggleActive={handleToggleActive} 
        />
      )}
    </div>
  );
};

export default UserManagement;