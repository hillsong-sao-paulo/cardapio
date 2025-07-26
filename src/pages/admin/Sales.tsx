
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CalendarIcon, Download, Eye, Trash2 } from 'lucide-react';
import { useSales, useDeleteSale } from '@/hooks/useSales';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import SEO from '@/components/SEO';
import { DateRange } from 'react-day-picker';
import { useToast } from '@/hooks/use-toast';
import { SaleWithItems } from '@/types/database';

const Sales: React.FC = () => {
  const { data: sales = [] } = useSales();
  const deleteSaleMutation = useDeleteSale();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedSale, setSelectedSale] = useState<SaleWithItems | null>(null);
  const [isSaleDetailOpen, setIsSaleDetailOpen] = useState(false);
  const { toast } = useToast();

  const filteredSales = React.useMemo(() => {
    if (!dateRange?.from && !dateRange?.to) return sales;
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      
      if (dateRange.from && dateRange.to) {
        return saleDate >= dateRange.from && saleDate <= dateRange.to;
      }
      
      if (dateRange.from) {
        return saleDate >= dateRange.from;
      }
      
      if (dateRange.to) {
        return saleDate <= dateRange.to;
      }
      
      return true;
    });
  }, [sales, dateRange]);

  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

  const handleDeleteSale = async (saleId: string) => {
    try {
      await deleteSaleMutation.mutateAsync(saleId);
      toast({
        title: "Venda excluída",
        description: "A venda foi excluída com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir venda",
        description: "Ocorreu um erro ao excluir a venda.",
        variant: "destructive"
      });
    }
  };

  const handleViewSale = (sale: SaleWithItems) => {
    setSelectedSale(sale);
    setIsSaleDetailOpen(true);
  };

  const exportToCSV = () => {
    const csvData = filteredSales.map(sale => ({
      id: sale.id,
      data: new Date(sale.created_at).toLocaleString('pt-BR'),
      total: sale.total,
      itens: sale.sale_items?.length || 0
    }));

    const csvContent = [
      ['ID', 'Data', 'Total', 'Itens'],
      ...csvData.map(row => [row.id, row.data, row.total, row.itens])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendas_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <SEO 
        title="Vendas - Admin"
        description="Visualizar e gerenciar vendas no painel administrativo do Hillsong Lounge - Encounterfest 2025."
        noindex={true}
      />
      
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Vendas</h1>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                      </>
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Filtrar por data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button variant="outline" onClick={exportToCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredSales.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {filteredSales.length > 0 ? (totalRevenue / filteredSales.length).toFixed(2) : '0.00'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sales List */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredSales.map((sale) => (
                <div key={sale.id} className="bg-gray-50 rounded-lg">
                  {/* Desktop Layout */}
                  <div className="hidden sm:flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">Venda #{sale.id.slice(-8)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(sale.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {sale.sale_items?.length || 0} itens
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-green-600">R$ {sale.total.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewSale(sale)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Venda</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSale(sale.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Layout */}
                  <div className="sm:hidden p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">Venda #{sale.id.slice(-8)}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(sale.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600 text-lg">R$ {sale.total.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs">
                        {sale.sale_items?.length || 0} itens
                      </Badge>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewSale(sale)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-sm mx-auto">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-base">Excluir Venda</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm">
                                Tem certeza que deseja excluir esta venda? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
                              <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSale(sale.id)}
                                className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredSales.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma venda encontrada para o período selecionado.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sale Detail Dialog */}
        <Dialog open={isSaleDetailOpen} onOpenChange={setIsSaleDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Venda #{selectedSale?.id.slice(-8)}</DialogTitle>
            </DialogHeader>
            {selectedSale && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Data da Venda</p>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedSale.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total</p>
                    <p className="text-lg font-bold text-green-600">
                      R$ {selectedSale.total.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Itens da Venda</p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedSale.sale_items?.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded p-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-1 sm:space-y-0">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.menu_item.name}</p>
                            <p className="text-xs text-gray-600">
                              {item.quantity}x R$ {item.unit_price.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm">R$ {item.subtotal.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
};

export default Sales;
