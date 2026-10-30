import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Menu, LayoutDashboard, Package, Tags, BarChart3, LogOut, Home, User, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import ProtectedRoute from './ProtectedRoute';
import { AdminStoreProvider, useAdminStore } from '@/context/admin-store';
import { StoreControls, StoreManager } from '@/components/admin/StoreManager';
import { copyPlainText } from '@/lib/copy-text';
import { isSupabaseConfigured } from '@/lib/supabase';

const AdminLayoutView: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [storesOpen, setStoresOpen] = useState(false);
  const [mobileLinksOpen, setMobileLinksOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    signOut,
    user
  } = useAuth();
  const {
    profile
  } = useProfile();
  const {
    toast
  } = useToast();
  const { store, stores, storeId, setStoreId, loading: storesLoading } = useAdminStore();
  const openMenu = () => {
    if (isSupabaseConfigured && store?.slug) {
      navigate(`/s/${store.slug}`);
      return;
    }
    navigate('/');
  };
  const copyStoreLinks = async () => {
    if (!store) return;
    const origin = window.location.origin;
    const links = [
      `${origin}/s/${store.slug}`,
      `${origin}/s/${store.slug}/kitchen`,
      `${origin}/s/${store.slug}/orders`,
    ].join('\n');
    const copied = await copyPlainText(links);
    if (!copied) {
      setMobileLinksOpen(true);
      toast({
        title: 'Não foi possível copiar',
        description: 'Os links estão abertos logo abaixo. Segure um deles para copiar.',
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'Links da loja copiados' });
  };
  const openStoreManager = () => {
    setSidebarOpen(false);
    setStoresOpen(true);
  };
  const handleLogout = async () => {
    const {
      error
    } = await signOut();
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  const menuItems = [{
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/admin',
    value: 'dashboard'
  }, {
    title: 'Categorias',
    icon: Tags,
    path: '/admin/categories',
    value: 'categories'
  }, {
    title: 'Cardápio',
    icon: Package,
    path: '/admin/menu',
    value: 'menu'
  }, {
    title: 'Vendas',
    icon: BarChart3,
    path: '/admin/sales',
    value: 'sales'
  }, {
    title: 'Relatórios',
    icon: FileText,
    path: '/admin/reports',
    value: 'reports'
  }];
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
  const getUserInitials = () => {
    if (!user?.name) return 'AD';
    return user.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2);
  };
  const SidebarContent = () => <div className="flex h-full flex-col overflow-y-auto">
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img src="/brand/d8797de3-f66c-4df1-be7a-6f33464353d3.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Admin Panel</h2>
            <p className="text-sm text-gray-500">{profile?.name || user?.name || 'Hillsong Lounge'}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map(item => <Button key={item.path} variant={location.pathname === item.path ? "default" : "ghost"} className="w-full justify-start gap-3" onClick={() => {
          navigate(item.path);
          setSidebarOpen(false);
        }}>
              <item.icon className="h-4 w-4" />
              {item.title}
            </Button>)}
        </div>
      </nav>

      <div className="p-4 border-t space-y-2">
        {isSupabaseConfigured && (
          <div className="pb-2">
            <StoreControls
              selectId="admin-store-menu"
              linksOpen={mobileLinksOpen}
              onToggleLinks={() => setMobileLinksOpen((current) => !current)}
              onOpenStores={openStoreManager}
              stacked
            />
          </div>
        )}
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => {
        navigate('/admin/profile');
        setSidebarOpen(false);
      }}>
          <User className="h-4 w-4" />
          Perfil
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => {
        openMenu();
        setSidebarOpen(false);
      }}>
          <Home className="h-4 w-4" />
          Ver Cardápio
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-3 text-red-600 hover:text-red-700" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>;
  return <ProtectedRoute>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Top Header Level */}
        <header className="bg-white border-b shadow-sm">
          <div className="w-full max-w-[1280px] mx-auto">
            <div className="flex items-center justify-between px-4 py-4 md:px-6">
              {/* Logo and Title */}
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-8 h-8 shrink-0 rounded-full overflow-hidden">
                  <img src="/brand/d8797de3-f66c-4df1-be7a-6f33464353d3.png" alt="Logo" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-bold">Painel</h1>
                  <p className="truncate text-sm text-gray-500">{profile?.name || user?.name || 'Hillsong Lounge'}</p>
                </div>
              </div>

              {/* User Menu - Hidden on mobile */}
              <div className="hidden md:flex items-center gap-3">
                {isSupabaseConfigured && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-500" htmlFor="admin-store">Loja</label>
                    <select
                      id="admin-store"
                      className="border rounded-md px-2 py-1 text-sm bg-white"
                      value={storeId ?? ''}
                      disabled={storesLoading || stores.length === 0}
                      onChange={(event) => setStoreId(event.target.value)}
                    >
                      {stores.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.is_active ? item.name : `${item.name} (inativa)`}
                        </option>
                      ))}
                    </select>
                    <Button variant="outline" size="sm" onClick={copyStoreLinks} disabled={!store}>
                      Copiar links
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setStoresOpen(true)}>
                      Lojas
                    </Button>
                  </div>
                )}
                <Button variant="outline" className="gap-2" onClick={openMenu}>
                  <Home className="h-4 w-4" />
                  Ver Cardápio
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-blue-600 text-white text-xs">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name || 'Admin'}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/admin/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile Menu Button */}
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[min(20rem,calc(100vw-2rem))] p-0">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
            </div>

            {isSupabaseConfigured && (
              <StoreManager hideButton open={storesOpen} onOpenChange={setStoresOpen} />
            )}

            {isSupabaseConfigured && (
              <div className="border-t px-4 py-3 md:hidden">
                <StoreControls
                  selectId="admin-store-mobile"
                  linksOpen={mobileLinksOpen}
                  onToggleLinks={() => setMobileLinksOpen((current) => !current)}
                  onOpenStores={() => setStoresOpen(true)}
                />
              </div>
            )}
          </div>
        </header>

        {/* Second Level Navigation - Hide on profile page */}
        {!location.pathname.includes('/profile') && <div className="hidden border-b bg-white md:block">
            <div className="w-full max-w-[1280px] mx-auto">
              <div className="px-6 py-2">
                <div className="hidden md:flex">
                  <Tabs value={getCurrentTabValue()} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 bg-gray-50">
                      {menuItems.map(item => <TabsTrigger key={item.value} value={item.value} className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                          <item.icon className="h-4 w-4" />
                          {item.title}
                        </TabsTrigger>)}
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </div>
          </div>}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="w-full max-w-[1280px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </ProtectedRoute>;
};

const AdminLayout: React.FC = () => (
  <ProtectedRoute>
    <AdminStoreProvider>
      <AdminLayoutView />
    </AdminStoreProvider>
  </ProtectedRoute>
);

export default AdminLayout;