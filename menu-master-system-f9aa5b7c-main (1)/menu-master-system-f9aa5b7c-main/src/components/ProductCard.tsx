
import React, { useState } from 'react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Plus, Heart, Star, Clock, Info, ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

interface ProductCardProps {
  product: Product;
}

const ProductDetailModal = ({
  open,
  onClose,
  product,
  onAddToCart,
  onAddToFavorites
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart: (specialInstructions?: string) => void;
  onAddToFavorites: () => void;
}) => {
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  if (!open || !product) return null;
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="relative w-full h-64 rounded-md overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {product.discount && product.discount > 0 && (
            <Badge className="absolute top-2 right-2 bg-red-500">
              {product.discount}% OFF
            </Badge>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <span className="font-semibold text-restaurant-primary text-xl">
            {formatCurrency(product.price)}
          </span>
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-500 mr-1" fill="currentColor" />
            <span className="text-sm">4.8 (24 avaliações)</span>
          </div>
        </div>
        
        <p className="text-gray-700">{product.description}</p>
        
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>Tempo de preparo: {product.prepTime} min</span>
        </div>
        
        {product.allergens && product.allergens.length > 0 && (
          <div className="mt-2">
            <h4 className="text-sm font-medium mb-1">Alérgenos:</h4>
            <div className="flex flex-wrap gap-1">
              {product.allergens.map((allergen, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {allergen}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {product.nutritionalInfo && (
          <div className="mt-2">
            <h4 className="text-sm font-medium mb-1">Informação Nutricional:</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {product.nutritionalInfo.calories && (
                <div>Calorias: {product.nutritionalInfo.calories} kcal</div>
              )}
              {product.nutritionalInfo.protein && (
                <div>Proteínas: {product.nutritionalInfo.protein}g</div>
              )}
              {product.nutritionalInfo.carbs && (
                <div>Carboidratos: {product.nutritionalInfo.carbs}g</div>
              )}
              {product.nutritionalInfo.fat && (
                <div>Gorduras: {product.nutritionalInfo.fat}g</div>
              )}
            </div>
          </div>
        )}
        
        <Separator />
        
        <div>
          <label htmlFor="instructions" className="block text-sm font-medium mb-1">
            Instruções especiais:
          </label>
          <Textarea
            id="instructions"
            placeholder="Ex: Sem cebola, molho à parte, etc."
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="w-full resize-none"
            rows={3}
          />
        </div>
        
        <DialogFooter className="flex gap-2 mt-2">
          <Button 
            variant="outline" 
            onClick={onAddToFavorites}
            className="flex-shrink-0 w-10 p-0"
          >
            <Heart className="h-4 w-4" />
          </Button>
          <Button 
            className="flex-1 bg-restaurant-primary hover:bg-restaurant-primary/90 text-white" 
            onClick={() => onAddToCart(specialInstructions)}
          >
            <ShoppingCart className="h-4 w-4 mr-2" /> 
            Adicionar ao Pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [showDetail, setShowDetail] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();

  const handleAddToCart = (specialInstructions?: string) => {
    addToCart(product, specialInstructions);
    
    toast({
      title: "Adicionado ao carrinho",
      description: `${product.name} foi adicionado ao seu pedido.`,
    });
  };
  
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos",
      description: `${product.name} foi ${isFavorite ? 'removido dos' : 'adicionado aos'} favoritos.`
    });
  };

  return (
    <>
      <Card className="product-card h-full flex flex-col hover:shadow-lg transition-all cursor-pointer overflow-hidden group" onClick={() => setShowDetail(true)}>
        <div className="relative pt-[60%] overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-0 right-0 p-2 flex gap-1">
            {product.featured && (
              <Badge className="bg-yellow-500">Destaque</Badge>
            )}
            {product.discount && product.discount > 0 && (
              <Badge className="bg-red-500">-{product.discount}%</Badge>
            )}
          </div>
          {!product.available && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Badge className="bg-red-500 text-white text-sm px-2 py-1">
                Indisponível
              </Badge>
            </div>
          )}
        </div>
        
        <CardContent className="flex-grow p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg line-clamp-1">{product.name}</h3>
            <span className="font-semibold text-restaurant-primary">
              {formatCurrency(product.price)}
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{product.description}</p>
          
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              <span>{product.prepTime} min</span>
            </div>
            <div className="flex items-center">
              <Star className="h-3 w-3 text-yellow-500 mr-1" fill="currentColor" />
              <span>4.8</span>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
            className="w-full bg-restaurant-primary hover:bg-restaurant-primary/90 text-white"
            disabled={!product.available}
          >
            <Plus className="h-4 w-4 mr-2" /> Adicionar
          </Button>
        </CardFooter>
      </Card>
      
      <ProductDetailModal 
        open={showDetail} 
        onClose={() => setShowDetail(false)} 
        product={product}
        onAddToCart={(specialInstructions) => {
          handleAddToCart(specialInstructions);
          setShowDetail(false);
        }}
        onAddToFavorites={toggleFavorite}
      />
    </>
  );
};

export default ProductCard;
