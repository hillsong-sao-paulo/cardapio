import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit2, Trash2, Package, Save, X } from 'lucide-react';
import { useMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem } from '@/hooks/useMenuItems';
import { useBulkUpdateStock } from '@/hooks/useBulkUpdateStock';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import SEO from '@/components/SEO';

const MenuItems: React.FC = () => {
  const { data: menuItems = [] } = useMenuItems();
  const createItemMutation = useCreateMenuItem();
  const updateItemMutation = useUpdateMenuItem();
  const deleteItemMutation = useDeleteMenuItem();
  const bulkUpdateStockMutation = useBulkUpdateStock();
  const { data: categories = [] } = useCategories();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isBulkEditMode, setIsBulkEditMode] = useState(false);
  const [bulkStockUpdates, setBulkStockUpdates] = useState<Record<string, number>>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: '',
    image_url: ''
  });
  const { toast } = useToast();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createItemMutation.mutateAsync({
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      });
      setIsCreateOpen(false);
      setFormData({ name: '', description: '', price: '', stock: '', category_id: '', image_url: '' });
      toast({
        title: "Item criado",
        description: "O item foi criado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao criar item",
        description: "Ocorreu um erro ao criar o item.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    try {
      await updateItemMutation.mutateAsync({
        id: editingItem.id,
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock)
      });
      setIsEditOpen(false);
      setEditingItem(null);
      setFormData({ name: '', description: '', price: '', stock: '', category_id: '', image_url: '' });
      toast({
        title: "Item atualizado",
        description: "O item foi atualizado com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar item",
        description: "Ocorreu um erro ao atualizar o item.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteItemMutation.mutateAsync(id);
      toast({
        title: "Item excluído",
        description: "O item foi excluído com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir item",
        description: "Ocorreu um erro ao excluir o item.",
        variant: "destructive"
      });
    }
  };

  const handleBulkStockUpdate = (itemId: string, stock: number) => {
    setBulkStockUpdates(prev => ({
      ...prev,
      [itemId]: stock
    }));
  };

  const saveBulkStockUpdates = async () => {
    const updates = Object.entries(bulkStockUpdates).map(([id, stock]) => ({
      id,
      stock
    }));

    if (updates.length === 0) {
      toast({
        title: "Nenhuma alteração",
        description: "Nenhum estoque foi modificado.",
        variant: "destructive"
      });
      return;
    }

    try {
      await bulkUpdateStockMutation.mutateAsync(updates);
      setBulkStockUpdates({});
      setIsBulkEditMode(false);
      toast({
        title: "Estoque atualizado",
        description: `${updates.length} item(s) foram atualizados com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar estoque",
        description: "Ocorreu um erro ao atualizar o estoque.",
        variant: "destructive"
      });
    }
  };

  const cancelBulkEdit = () => {
    setBulkStockUpdates({});
    setIsBulkEditMode(false);
  };

  const openCreateDialog = () => {
    setFormData({ name: '', description: '', price: '', stock: '', category_id: '', image_url: '' });
    setIsCreateOpen(true);
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      stock: item.stock.toString(),
      category_id: item.category_id || '',
      image_url: item.image_url || ''
    });
    setIsEditOpen(true);
  };

  return (
    <>
      <SEO 
        title="Itens do Cardápio - Admin"
        description="Gerenciar itens do cardápio no painel administrativo do Hillsong Lounge - Encounterfest 2025."
        noindex={true}
      />
      
      <div className="max-w-screen-xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold">Itens do Cardápio</h1>
          
          {/* Action buttons - Mobile-first responsive layout */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {!isBulkEditMode ? (
              <>
                <Button
                  onClick={() => setIsBulkEditMode(true)}
                  variant="outline"
                  className="w-full sm:w-auto gap-2 justify-center"
                >
                  <Package className="h-4 w-4 flex-shrink-0" />
                  <span className="hidden sm:inline">Editar Estoque</span>
                  <span className="sm:hidden">Estoque</span>
                </Button>
                <Button 
                  onClick={openCreateDialog} 
                  className="w-full sm:w-auto gap-2 justify-center"
                >
                  <Plus className="h-4 w-4 flex-shrink-0" />
                  Novo Item
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={saveBulkStockUpdates}
                  disabled={bulkUpdateStockMutation.isPending || Object.keys(bulkStockUpdates).length === 0}
                  className="w-full sm:w-auto gap-2 justify-center"
                >
                  <Save className="h-4 w-4 flex-shrink-0" />
                  {bulkUpdateStockMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button
                  onClick={cancelBulkEdit}
                  variant="outline"
                  className="w-full sm:w-auto gap-2 justify-center"
                >
                  <X className="h-4 w-4 flex-shrink-0" />
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </div>

        {isBulkEditMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium text-sm sm:text-base">
              Modo de edição em massa ativado. Altere os valores de estoque e clique em "Salvar" para aplicar as mudanças.
            </p>
          </div>
        )}

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-base font-semibold mb-2">{item.name}</div>
                    {item.category?.name && (
                      <Badge variant="secondary" className="text-xs">
                        {item.category.name}
                      </Badge>
                    )}
                  </div>
                  {!isBulkEditMode && (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Item</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja excluir o item "{item.name}"? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  {item.description || 'Sem descrição'}
                </p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-lg font-bold text-green-600">
                    R$ {item.price.toFixed(2)}
                  </span>
                </div>
                
                {isBulkEditMode ? (
                  <div className="space-y-2">
                    <Label htmlFor={`stock-${item.id}`} className="text-sm font-medium">
                      Estoque
                    </Label>
                    <Input
                      id={`stock-${item.id}`}
                      type="number"
                      min="0"
                      defaultValue={item.stock}
                      onChange={(e) => handleBulkStockUpdate(item.id, parseInt(e.target.value) || 0)}
                      className="w-full"
                    />
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">
                    Estoque: {item.stock}
                  </span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Preço</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="stock">Estoque</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="image_url">URL da Imagem</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={createItemMutation.isPending}>
                  {createItemMutation.isPending ? 'Criando...' : 'Criar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-price">Preço</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-stock">Estoque</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-category">Categoria</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-image_url">URL da Imagem</Label>
                <Input
                  id="edit-image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={updateItemMutation.isPending}>
                  {updateItemMutation.isPending ? 'Atualizando...' : 'Atualizar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default MenuItems;
