
import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Menu, 
  LayoutDashboard, 
  Package, 
  Tags, 
  BarChart3, 
  LogOut,
  Home
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import ProtectedRoute from './ProtectedRoute';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: LayoutDashboard,
      path: '/admin',
      value: 'dashboard'
    },
    {
      title: 'Categorias',
      icon: Tags,
      path: '/admin/categories',
      value: 'categories'
    },
    {
      title: 'Cardápio',
      icon: Package,
      path: '/admin/menu',
      value: 'menu'
    },
    {
      title: 'Vendas',
      icon: BarChart3,
      path: '/admin/sales',
      value: 'sales'
    }
  ];

  const getCurrentTabValue = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.value : 'dashboard';
  };

  const handleTabChange = (value: string) => {
    const item = menuItems.find(item => item.value === value);
    if (item) {
      navigate(item.path);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img 
              src="/lovable-uploads/d8797de3-f66c-4df1-be7a-6f33464353d3.png" 
              alt="Logo" 
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold">Admin Panel</h2>
            <p className="text-sm text-gray-500">Hillsong Lounge</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Button
              key={item.path}
              variant={location.pathname === item.path ? "default" : "ghost"}
              className="w-full justify-start gap-3"
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Button>
          ))}
        </div>
      </nav>

      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3"
          onClick={() => {
            navigate('/');
            setSidebarOpen(false);
          }}
        >
          <Home className="h-4 w-4" />
          Ver Cardápio
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Top Header Level */}
        <header className="bg-white border-b shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Logo and Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <img 
                  src="/lovable-uploads/d8797de3-f66c-4df1-be7a-6f33464353d3.png" 
                  alt="Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <p className="text-sm text-gray-500">Hillsong Lounge</p>
              </div>
            </div>

            {/* Action Buttons - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => navigate('/')}
              >
                <Home className="h-4 w-4" />
                Ver Cardápio
              </Button>
              <Button
                variant="outline"
                className="gap-2 text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <SidebarContent />
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Second Level Navigation */}
        <div className="bg-white border-b">
          <div className="px-6 py-2">
            <div className="hidden md:flex">
              <Tabs value={getCurrentTabValue()} onValueChange={handleTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-4 bg-gray-50">
                  {menuItems.map((item) => (
                    <TabsTrigger key={item.value} value={item.value} className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default AdminLayout;
