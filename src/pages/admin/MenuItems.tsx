
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, X, Package, PackagePlus } from 'lucide-react';
import { useMenuItems, useCreateMenuItem, useUpdateMenuItem, useDeleteMenuItem } from '@/hooks/useMenuItems';
import { useCategories } from '@/hooks/useCategories';
import { useToast } from '@/hooks/use-toast';
import { MenuItem } from '@/types/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const MenuItems: React.FC = () => {
  const { data: menuItems = [], isLoading } = useMenuItems();
  const { data: categories = [] } = useCategories();
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [showBulkStockModal, setShowBulkStockModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [bulkStockAmount, setBulkStockAmount] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category_id: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const itemData = {
        name: formData.name,
        description: formData.description || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category_id: formData.category_id || null,
        image_url: null
      };

      if (editingItem) {
        await updateMenuItem.mutateAsync({
          id: editingItem.id,
          ...itemData
        });
        toast({
          title: "Item atualizado com sucesso!",
        });
      } else {
        await createMenuItem.mutateAsync(itemData);
        toast({
          title: "Item criado com sucesso!",
        });
      }
      
      setShowForm(false);
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        category_id: ''
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      stock: item.stock.toString(),
      category_id: item.category_id || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      try {
        await deleteMenuItem.mutateAsync(id);
        toast({
          title: "Item excluído com sucesso!",
        });
      } catch (error: any) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive"
        });
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category_id: ''
    });
  };

  const updateStock = async (itemId: string, newStock: number) => {
    try {
      await updateMenuItem.mutateAsync({
        id: itemId,
        stock: newStock
      });
      toast({
        title: "Estoque atualizado!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleBulkStockUpdate = async () => {
    if (!bulkStockAmount || parseInt(bulkStockAmount) <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma quantidade válida",
        variant: "destructive"
      });
      return;
    }

    try {
      const stockToAdd = parseInt(bulkStockAmount);
      
      // Atualizar estoque de todos os itens
      await Promise.all(
        menuItems.map(item => 
          updateMenuItem.mutateAsync({
            id: item.id,
            stock: item.stock + stockToAdd
          })
        )
      );

      toast({
        title: "Estoque atualizado em massa!",
        description: `Adicionados ${stockToAdd} unidades a todos os itens`,
      });
      
      setShowBulkStockModal(false);
      setBulkStockAmount('');
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">Carregando itens do cardápio...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gerenciar Cardápio</h1>
        <div className="flex gap-2">
          <Dialog open={showBulkStockModal} onOpenChange={setShowBulkStockModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <PackagePlus className="h-4 w-4" />
                Adicionar Estoque em Massa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Estoque em Massa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk-stock">Quantidade a adicionar</Label>
                  <Input
                    id="bulk-stock"
                    type="number"
                    min="1"
                    value={bulkStockAmount}
                    onChange={(e) => setBulkStockAmount(e.target.value)}
                    placeholder="Digite a quantidade"
                  />
                  <p className="text-sm text-gray-500">
                    Esta quantidade será adicionada ao estoque atual de todos os itens.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleBulkStockUpdate}
                    disabled={updateMenuItem.isPending}
                  >
                    Adicionar Estoque
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowBulkStockModal(false);
                      setBulkStockAmount('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Item
          </Button>
        </div>
      </div>

      {/* Formulário */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingItem ? 'Editar Item' : 'Novo Item'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Item</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Digite o nome do item"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                  >
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
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição do item"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Estoque</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={createMenuItem.isPending || updateMenuItem.isPending}
                >
                  {editingItem ? 'Atualizar' : 'Criar'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Lista de Itens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {menuItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {item.category?.name || 'Sem categoria'}
                  </Badge>
                  <span className="text-lg font-bold text-green-600">
                    R$ {item.price.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span className={`font-semibold ${item.stock <= 5 ? 'text-red-600' : 'text-gray-900'}`}>
                    {item.stock}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStock(item.id, Math.max(0, item.stock - 1))}
                    >
                      -
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateStock(item.id, item.stock + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {menuItems.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500">Nenhum item no cardápio.</p>
            <Button onClick={() => setShowForm(true)} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Criar primeiro item
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MenuItems;
