
import React, { useState } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { categories, products } from '@/data/menu';
import { Plus, Trash, Edit, Pizza, ChefHat } from 'lucide-react';
import { Product, Category } from '@/types';

const MenuConfig = () => {
  const [menuItems, setMenuItems] = useState<Product[]>(products);
  const [menuCategories, setMenuCategories] = useState<Category[]>(categories);
  const [selectedTab, setSelectedTab] = useState('products');
  const [editingItem, setEditingItem] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const { toast } = useToast();
  
  // Product form state
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    image: '',
    category: 'main-dishes',
    prepTime: 15,
    available: true
  });
  
  // Category form state
  const [categoryForm, setcategoryForm] = useState<Partial<Category>>({
    id: '',
    name: ''
  });
  
  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setProductForm({
        ...productForm,
        [name]: parseFloat(value)
      });
    } else {
      setProductForm({
        ...productForm,
        [name]: value
      });
    }
  };
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setcategoryForm({
      ...categoryForm,
      [name]: value
    });
  };
  
  const handleAvailableChange = (checked: boolean) => {
    setProductForm({
      ...productForm,
      available: checked
    });
  };
  
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!productForm.name || !productForm.description || !productForm.price || !productForm.image) {
      toast({
        title: "Campos obrigatórios",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }
    
    if (editingItem) {
      // Update existing product
      const updatedItems = menuItems.map(item => 
        item.id === editingItem.id ? { ...productForm, id: item.id } as Product : item
      );
      setMenuItems(updatedItems);
      toast({
        title: "Produto atualizado",
        description: `${productForm.name} foi atualizado com sucesso.`
      });
    } else {
      // Add new product
      const newProduct: Product = {
        ...productForm as Required<Omit<Partial<Product>, 'id'>>,
        id: Date.now()
      };
      setMenuItems([...menuItems, newProduct]);
      toast({
        title: "Produto adicionado",
        description: `${productForm.name} foi adicionado ao cardápio.`
      });
    }
    
    // Reset form
    setProductForm({
      name: '',
      description: '',
      price: 0,
      image: '',
      category: 'main-dishes',
      prepTime: 15,
      available: true
    });
    setEditingItem(null);
  };
  
  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!categoryForm.id || !categoryForm.name) {
      toast({
        title: "Campos obrigatórios",
        description: "Todos os campos são obrigatórios",
        variant: "destructive"
      });
      return;
    }
    
    // Check if ID already exists
    if (!editingCategory && menuCategories.some(cat => cat.id === categoryForm.id)) {
      toast({
        title: "ID já existe",
        description: "Use um ID único para a categoria",
        variant: "destructive"
      });
      return;
    }
    
    if (editingCategory) {
      // Update existing category
      const updatedCategories = menuCategories.map(cat => 
        cat.id === editingCategory.id ? { ...categoryForm } as Category : cat
      );
      setMenuCategories(updatedCategories);
      toast({
        title: "Categoria atualizada",
        description: `${categoryForm.name} foi atualizada com sucesso.`
      });
    } else {
      // Add new category
      const newCategory: Category = {
        id: categoryForm.id as string,
        name: categoryForm.name as string
      };
      setMenuCategories([...menuCategories, newCategory]);
      toast({
        title: "Categoria adicionada",
        description: `${categoryForm.name} foi adicionada ao cardápio.`
      });
    }
    
    // Reset form
    setcategoryForm({
      id: '',
      name: ''
    });
    setEditingCategory(null);
  };
  
  const handleEditProduct = (product: Product) => {
    setEditingItem(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      image: product.image,
      category: product.category,
      prepTime: product.prepTime,
      available: product.available
    });
  };
  
  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setcategoryForm({
      id: category.id,
      name: category.name
    });
  };
  
  const handleDeleteProduct = (id: number) => {
    setMenuItems(menuItems.filter(item => item.id !== id));
    toast({
      title: "Produto removido",
      description: "O produto foi removido do cardápio."
    });
  };
  
  const handleDeleteCategory = (id: string) => {
    // Check if category is in use
    const inUse = menuItems.some(item => item.category === id);
    if (inUse) {
      toast({
        title: "Categoria em uso",
        description: "Esta categoria está sendo usada por produtos e não pode ser removida.",
        variant: "destructive"
      });
      return;
    }
    
    setMenuCategories(menuCategories.filter(cat => cat.id !== id));
    toast({
      title: "Categoria removida",
      description: "A categoria foi removida do cardápio."
    });
  };
  
  const handleCancelEdit = () => {
    if (selectedTab === 'products') {
      setEditingItem(null);
      setProductForm({
        name: '',
        description: '',
        price: 0,
        image: '',
        category: 'main-dishes',
        prepTime: 15,
        available: true
      });
    } else {
      setEditingCategory(null);
      setcategoryForm({
        id: '',
        name: ''
      });
    }
  };
  
  // Filter products by category for the UI
  const getProductsByCategory = (categoryId: string) => {
    return menuItems.filter(item => item.category === categoryId);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <ChefHat className="mr-2" /> Configuração do Cardápio
        </h1>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto mb-6">
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
          </TabsList>
          
          <TabsContent value="products">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>{editingItem ? 'Editar Produto' : 'Adicionar Produto'}</CardTitle>
                    <CardDescription>
                      {editingItem 
                        ? 'Modifique os detalhes do produto selecionado' 
                        : 'Preencha os detalhes para adicionar um novo produto ao cardápio'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form id="productForm" onSubmit={handleProductSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome do Produto*</Label>
                        <Input 
                          id="name"
                          name="name"
                          placeholder="Ex: Pizza Margherita" 
                          value={productForm.name}
                          onChange={handleProductChange}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="description">Descrição*</Label>
                        <Textarea 
                          id="description"
                          name="description"
                          placeholder="Descreva os ingredientes e o preparo..." 
                          value={productForm.description}
                          onChange={handleProductChange}
                          rows={3}
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Preço (R$)*</Label>
                          <Input 
                            id="price"
                            name="price"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00" 
                            value={productForm.price}
                            onChange={handleProductChange}
                            required
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="prepTime">Tempo de Preparo (min)*</Label>
                          <Input 
                            id="prepTime"
                            name="prepTime"
                            type="number"
                            min="1"
                            step="1"
                            placeholder="15" 
                            value={productForm.prepTime}
                            onChange={handleProductChange}
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="image">URL da Imagem*</Label>
                        <Input 
                          id="image"
                          name="image"
                          placeholder="https://example.com/image.jpg" 
                          value={productForm.image}
                          onChange={handleProductChange}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="category">Categoria*</Label>
                        <Select 
                          name="category"
                          value={productForm.category}
                          onValueChange={(value) => setProductForm({...productForm, category: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {menuCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="available"
                          checked={productForm.available}
                          onCheckedChange={handleAvailableChange}
                        />
                        <Label htmlFor="available">Produto Disponível</Label>
                      </div>
                    </form>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    {editingItem && (
                      <Button variant="outline" onClick={handleCancelEdit}>
                        Cancelar
                      </Button>
                    )}
                    <Button type="submit" form="productForm" className="flex-1">
                      {editingItem ? 'Atualizar Produto' : 'Adicionar Produto'}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Produtos no Cardápio</CardTitle>
                    <CardDescription>
                      Gerencie os produtos disponíveis no seu cardápio digital
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {menuCategories.map((category) => {
                        const categoryProducts = getProductsByCategory(category.id);
                        if (categoryProducts.length === 0) return null;
                        
                        return (
                          <div key={category.id}>
                            <h3 className="text-lg font-medium mb-2">{category.name}</h3>
                            <div className="divide-y">
                              {categoryProducts.map((product) => (
                                <div key={product.id} className="py-3 flex justify-between items-center">
                                  <div className="flex items-center">
                                    <div className="h-12 w-12 rounded overflow-hidden mr-3">
                                      <img 
                                        src={product.image} 
                                        alt={product.name} 
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div>
                                      <h4 className="font-medium">{product.name}</h4>
                                      <p className="text-sm text-gray-500">
                                        {product.available ? 'Disponível' : 'Indisponível'} • R$ {product.price.toFixed(2)}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex space-x-2">
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleEditProduct(product)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => handleDeleteProduct(product.id)}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="categories">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{editingCategory ? 'Editar Categoria' : 'Adicionar Categoria'}</CardTitle>
                  <CardDescription>
                    {editingCategory 
                      ? 'Modifique os detalhes da categoria selecionada' 
                      : 'Crie uma nova categoria para organizar seu cardápio'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form id="categoryForm" onSubmit={handleCategorySubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="id">ID da Categoria*</Label>
                      <Input 
                        id="id"
                        name="id"
                        placeholder="Ex: pizzas (sem espaços ou caracteres especiais)" 
                        value={categoryForm.id}
                        onChange={handleCategoryChange}
                        required
                        disabled={!!editingCategory} // Cannot edit ID of existing category
                      />
                      <p className="text-xs text-gray-500">Use apenas letras minúsculas, números e hífens.</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="catName">Nome da Categoria*</Label>
                      <Input 
                        id="catName"
                        name="name"
                        placeholder="Ex: Pizzas" 
                        value={categoryForm.name}
                        onChange={handleCategoryChange}
                        required
                      />
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex gap-2">
                  {editingCategory && (
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                  )}
                  <Button type="submit" form="categoryForm" className="flex-1">
                    {editingCategory ? 'Atualizar Categoria' : 'Adicionar Categoria'}
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Categorias Existentes</CardTitle>
                  <CardDescription>
                    Organize seu cardápio com categorias personalizadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {menuCategories.map((category) => (
                      <div key={category.id} className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-100 mr-3 flex items-center justify-center">
                            <Pizza className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-medium">{category.name}</h4>
                            <p className="text-xs text-gray-500">ID: {category.id}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default MenuConfig;
