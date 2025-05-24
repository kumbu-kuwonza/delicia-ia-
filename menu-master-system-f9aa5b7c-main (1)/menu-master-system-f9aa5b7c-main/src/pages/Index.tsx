
import React, { useState } from 'react';
import { products } from '@/data/menu';
import Header from '@/components/Header';
import MenuCategories from '@/components/MenuCategories';
import ProductCard from '@/components/ProductCard';
import ShoppingCart from '@/components/ShoppingCart';
import CheckoutModal from '@/components/CheckoutModal';
import PromotionCarousel from '@/components/PromotionCarousel';
import { AutomationControl } from '@/components/AutomationControl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Star, Clock, Tag } from 'lucide-react';

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState('main-dishes');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Filter products based on category, search query and active filter
  const filteredProducts = products.filter(product => {
    // Category filter
    const matchesCategory = product.category === selectedCategory;
    
    // Search filter
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Availability and feature filters
    const matchesFilter = 
      activeFilter === 'all' ||
      (activeFilter === 'available' && product.available) ||
      (activeFilter === 'featured' && product.featured) ||
      (activeFilter === 'discount' && product.discount && product.discount > 0);
    
    return matchesCategory && matchesSearch && matchesFilter;
  });
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Add the PromotionCarousel component here */}
        <PromotionCarousel />
        
        <div className="flex flex-col md:flex-row items-center justify-between my-6">
          <h1 className="text-3xl font-bold mb-4 md:mb-0">Cardápio Digital</h1>
          
          <div className="flex justify-end mb-4 md:mb-0 w-full md:w-auto">
            <AutomationControl />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm mb-6">
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Buscar produtos..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <Tabs defaultValue="all" className="mt-4" onValueChange={setActiveFilter}>
                  <TabsList className="grid grid-cols-4 gap-2">
                    <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
                    <TabsTrigger value="available" className="text-xs">Disponíveis</TabsTrigger>
                    <TabsTrigger value="featured" className="text-xs">
                      <Star className="h-3 w-3 mr-1" /> Destaques
                    </TabsTrigger>
                    <TabsTrigger value="discount" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" /> Promoções
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <MenuCategories
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </div>
            
            {filteredProducts.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-lg">
                <Search className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <h3 className="font-medium text-lg mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-500">
                  Tente mudar sua busca ou selecionar outra categoria
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
          
          <div className="lg:col-span-1">
            <ShoppingCart 
              onCheckout={() => setIsCheckoutOpen(true)}
              className="sticky top-4"
            />
          </div>
        </div>
      </main>
      
      <CheckoutModal 
        open={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
      />
    </div>
  );
};

export default Index;
