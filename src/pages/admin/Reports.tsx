
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, BarChart2, Download, FileText } from 'lucide-react';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useSales } from '@/hooks/useSales';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import SEO from '@/components/SEO';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

const Reports: React.FC = () => {
  const { data: menuItems = [] } = useMenuItems();
  const { data: sales = [] } = useSales();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [hourRange, setHourRange] = useState<{ from: number; to: number }>({ from: 0, to: 23 });
  const [selectedItemsFilter, setSelectedItemsFilter] = useState<string>('all');

  // Filtrar vendas por data selecionada
  const filteredSales = React.useMemo(() => {
    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate.toDateString() === selectedDate.toDateString();
    });
  }, [sales, selectedDate]);

  // Processar dados para o gráfico de vendas por hora
  const salesByHour = React.useMemo(() => {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      hourLabel: `${i.toString().padStart(2, '0')}:00`,
      total: 0
    }));

    filteredSales.forEach(sale => {
      const hour = new Date(sale.created_at).getHours();
      hourlyData[hour].total += sale.total;
    });

    // Filtrar por range de horas
    return hourlyData.filter(data => data.hour >= hourRange.from && data.hour <= hourRange.to);
  }, [filteredSales, hourRange]);

  // Processar dados para relatório de vendas por item
  const salesByItem = useMemo(() => {
    const itemSales: Record<string, { name: string; quantity: number; revenue: number; sales: number }> = {};
    
    sales.forEach(sale => {
      sale.sale_items?.forEach(saleItem => {
        const itemId = saleItem.menu_item_id;
        const menuItem = menuItems.find(item => item.id === itemId);
        
        if (menuItem) {
          if (!itemSales[itemId]) {
            itemSales[itemId] = {
              name: menuItem.name,
              quantity: 0,
              revenue: 0,
              sales: 0
            };
          }
          
          itemSales[itemId].quantity += saleItem.quantity;
          itemSales[itemId].revenue += saleItem.subtotal;
          itemSales[itemId].sales += 1;
        }
      });
    });

    let result = Object.entries(itemSales).map(([id, data]) => ({
      id,
      ...data
    }));

    // Filtrar por item selecionado
    if (selectedItemsFilter !== 'all') {
      result = result.filter(item => item.id === selectedItemsFilter);
    }

    // Ordenar por receita (maior para menor)
    return result.sort((a, b) => b.revenue - a.revenue);
  }, [sales, menuItems, selectedItemsFilter]);

  // Gerar opções de horas para o select
  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i.toString().padStart(2, '0')}:00`
  }));

  // Exportar vendas por item em CSV
  const exportItemSalesCSV = () => {
    const csvContent = [
      ['Item', 'Quantidade Vendida', 'Número de Vendas', 'Receita Total'],
      ...salesByItem.map(item => [
        item.name,
        item.quantity.toString(),
        item.sales.toString(),
        `R$ ${item.revenue.toFixed(2)}`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vendas-por-item-${format(new Date(), 'dd-MM-yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar vendas por hora em CSV
  const exportHourSalesCSV = () => {
    const csvContent = [
      ['Hora', 'Total de Vendas'],
      ...salesByHour.map(data => [
        data.hourLabel,
        `R$ ${data.total.toFixed(2)}`
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `vendas-por-hora-${format(selectedDate, 'dd-MM-yyyy')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar vendas por item em PDF
  const exportItemSalesPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Relatório de Vendas por Item', 14, 15);
    doc.setFontSize(10);
    doc.text(`Data do relatório: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 25);
    
    const tableData = salesByItem.map(item => [
      item.name,
      item.quantity.toString(),
      item.sales.toString(),
      `R$ ${item.revenue.toFixed(2)}`
    ]);

    doc.autoTable({
      head: [['Item', 'Qtd. Vendida', 'Nº Vendas', 'Receita Total']],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`vendas-por-item-${format(new Date(), 'dd-MM-yyyy')}.pdf`);
  };

  // Exportar vendas por hora em PDF
  const exportHourSalesPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text('Relatório de Vendas por Hora', 14, 15);
    doc.setFontSize(10);
    doc.text(`Data: ${format(selectedDate, 'dd/MM/yyyy')}`, 14, 25);
    doc.text(`Horário: ${hourRange.from}:00 às ${hourRange.to}:00`, 14, 32);
    
    const tableData = salesByHour.map(data => [
      data.hourLabel,
      `R$ ${data.total.toFixed(2)}`
    ]);

    doc.autoTable({
      head: [['Hora', 'Total de Vendas']],
      body: tableData,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });

    doc.save(`vendas-por-hora-${format(selectedDate, 'dd-MM-yyyy')}.pdf`);
  };

  return (
    <>
      <SEO 
        title="Relatórios"
        description="Relatórios detalhados de vendas e desempenho do Hillsong Lounge - Encounterfest 2025."
        noindex={true}
      />
      
      <div className="w-full max-w-[1280px] mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Relatórios</h1>
        </div>

        {/* Relatório de Vendas por Item */}
        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="h-5 w-5" />
                Relatório de Vendas por Item
              </CardTitle>
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:gap-4 sm:space-y-0">
                <Select value={selectedItemsFilter} onValueChange={setSelectedItemsFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filtrar por item" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os itens</SelectItem>
                    {menuItems.map(item => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportItemSalesCSV}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportItemSalesPDF}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-center">Qtd. Vendida</TableHead>
                    <TableHead className="text-center">Nº de Vendas</TableHead>
                    <TableHead className="text-right">Receita Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesByItem.length > 0 ? (
                    salesByItem.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-center">{item.sales}</TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          R$ {item.revenue.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhuma venda encontrada para os filtros selecionados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Vendas por Hora */}
        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <CardTitle>Vendas por Hora (R$)</CardTitle>
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:gap-4 sm:space-y-0">
                {/* Filtro de Range de Horas */}
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Das</span>
                  <Select value={hourRange.from.toString()} onValueChange={(value) => setHourRange(prev => ({ ...prev, from: parseInt(value) }))}>
                    <SelectTrigger className="w-16 sm:w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hourOptions.map(option => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">às</span>
                  <Select value={hourRange.to.toString()} onValueChange={(value) => setHourRange(prev => ({ ...prev, to: parseInt(value) }))}>
                    <SelectTrigger className="w-16 sm:w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hourOptions.map(option => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Filtro de Data */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full sm:w-[240px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportHourSalesCSV}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={exportHourSalesPDF}
                    className="gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 sm:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByHour} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="hourLabel" 
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
                    width={50}
                  />
                  <Tooltip 
                    formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Total']}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar 
                    dataKey="total" 
                    fill="#3b82f6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Reports;
