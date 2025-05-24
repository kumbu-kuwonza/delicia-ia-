
import React, { useState } from 'react';
import { useCustomer } from '@/contexts/CustomerContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { Coins, User, Home, ChartBar, Settings, ClipboardList } from 'lucide-react';
import LoyaltyPoints from './LoyaltyPoints';

const Header = () => {
  const { customer, setCustomer, isLoggedIn, logout } = useCustomer();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomer({
      ...formData,
      points: 100, // Start with 100 points for new customers
    });
    setIsLoginOpen(false);
  };

  return (
    <header className="bg-white shadow-md py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-restaurant-primary text-2xl font-bold">Menu Master</span>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          {isLoggedIn && <LoyaltyPoints points={customer?.points || 0} />}
          
          <div className="flex space-x-2">
            <Link to="/">
              <Button variant="ghost" size="icon" aria-label="Home">
                <Home className="h-5 w-5" />
              </Button>
            </Link>
            
            <Link to="/kitchen">
              <Button variant="ghost" size="icon" aria-label="Kitchen">
                <ChartBar className="h-5 w-5" />
              </Button>
            </Link>
            
            <Link to="/orders">
              <Button variant="ghost" size="icon" aria-label="Order Management" title="Gestão de Pedidos">
                <ClipboardList className="h-5 w-5" />
              </Button>
            </Link>
            
            <Link to="/admin">
              <Button variant="ghost" size="icon" aria-label="Admin">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            
            {isLoggedIn ? (
              <Button variant="outline" size="sm" onClick={logout}>
                <User className="h-4 w-4 mr-2" />
                Sair
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setIsLoginOpen(true)}>
                <User className="h-4 w-4 mr-2" />
                Entrar
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Entrar ou Criar Conta</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="address">Endereço</Label>
                <Input 
                  id="address" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="submit">Continuar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </header>
  );
};

export default Header;
