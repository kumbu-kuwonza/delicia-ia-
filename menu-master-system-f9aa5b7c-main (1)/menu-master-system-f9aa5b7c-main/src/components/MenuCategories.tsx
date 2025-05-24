
import React from 'react';
import { categories } from '@/data/menu';
import { cn } from '@/lib/utils';
import { 
  ChefHat, 
  Pizza, 
  Utensils, 
  Sandwich, 
  Coffee, 
  IceCream, 
  Salad, 
  Fish, 
  Beef, 
  Wine
} from 'lucide-react';

interface MenuCategoriesProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
}

// Map category IDs to their respective icons
const categoryIcons: Record<string, React.ReactNode> = {
  'main-dishes': <ChefHat className="h-4 w-4 mr-2" />,
  'pizzas': <Pizza className="h-4 w-4 mr-2" />,
  'burgers': <Beef className="h-4 w-4 mr-2" />,
  'japanese': <Fish className="h-4 w-4 mr-2" />,
  'seafood': <Fish className="h-4 w-4 mr-2" />,
  'salads': <Salad className="h-4 w-4 mr-2" />,
  'sides': <Sandwich className="h-4 w-4 mr-2" />,
  'drinks': <Wine className="h-4 w-4 mr-2" />,
  'desserts': <IceCream className="h-4 w-4 mr-2" />,
  'coffee': <Coffee className="h-4 w-4 mr-2" />,
};

const MenuCategories: React.FC<MenuCategoriesProps> = ({ 
  selectedCategory, 
  onSelectCategory 
}) => {
  return (
    <div className="py-4 overflow-x-auto sticky top-0 bg-white z-10 shadow-sm">
      <div className="flex space-x-2 pb-2">
        {categories.map(category => (
          <button
            key={category.id}
            className={cn(
              "flex items-center px-4 py-2 rounded-full transition-colors whitespace-nowrap",
              selectedCategory === category.id 
                ? "bg-restaurant-primary text-white shadow-md" 
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            )}
            onClick={() => onSelectCategory(category.id)}
          >
            {categoryIcons[category.id] || <Utensils className="h-4 w-4 mr-2" />}
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MenuCategories;
