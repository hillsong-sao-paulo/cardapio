
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Utensils, Cookie, GlassWater, ChefHat } from 'lucide-react';

interface CategoryTabsProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  categories?: string[];
}

const CategoryTabs: React.FC<CategoryTabsProps> = ({ 
  activeCategory, 
  onCategoryChange,
  categories = ['Todos', 'Pratos', 'Sobremesa', 'Bebidas', 'Almoço']
}) => {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Pratos':
        return Utensils;
      case 'Sobremesa':
        return Cookie;
      case 'Bebidas':
        return GlassWater;
      case 'Almoço':
        return ChefHat;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border-b border-gray-100 sticky top-[88px] z-30">
      <div className="px-4 py-3">
        <Tabs value={activeCategory} onValueChange={onCategoryChange}>
          <TabsList className="bg-gray-50 p-1 h-auto w-full justify-start scrollbar-hide overflow-x-auto">
            <div className="flex space-x-1 min-w-max">
              {categories.map((category) => {
                const Icon = getCategoryIcon(category);
                return (
                  <TabsTrigger
                    key={category}
                    value={category}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-app-blue data-[state=active]:shadow-sm"
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    {category}
                  </TabsTrigger>
                );
              })}
            </div>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default CategoryTabs;
