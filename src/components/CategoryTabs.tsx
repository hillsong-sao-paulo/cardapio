
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Utensils, Cookie, GlassWater, ChefHat } from 'lucide-react';

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ 
  activeCategory, 
  onCategoryChange 
}) => {
  const categories = [
    { id: 'Todos', label: 'Todos', icon: null },
    { id: 'Pratos', label: 'Pratos', icon: Utensils },
    { id: 'Doces', label: 'Doces', icon: Cookie },
    { id: 'Bebidas', label: 'Bebidas', icon: GlassWater },
    { id: 'Almoço', label: 'Almoço', icon: ChefHat },
  ];

  return (
    <div className="bg-white border-b border-gray-100 sticky top-[88px] z-30">
      <div className="px-4 py-3">
        <Tabs value={activeCategory} onValueChange={onCategoryChange}>
          <TabsList className="bg-gray-50 p-1 h-auto w-full justify-start overflow-x-auto">
            <div className="flex space-x-1 min-w-max">
              {categories.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-app-blue data-[state=active]:shadow-sm"
                >
                  {category.icon && (
                    <category.icon className="w-4 h-4" />
                  )}
                  {category.label}
                </TabsTrigger>
              ))}
            </div>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default CategoryTabs;
