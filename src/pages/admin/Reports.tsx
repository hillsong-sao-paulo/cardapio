import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, BarChart2, Download, FileText, TrendingUp, ShoppingCart, DollarSign, ChefHat } from 'lucide-react';
import { downloadCsv, downloadPdf, formatMoney } from '@/lib/report-export';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useSales } from '@/hooks/useSales';
import { useKitchenOrders } from '@/hooks/useKitchenOrders';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import SEO from '@/components/SEO';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DateRange } from 'react-day-picker';

const Reports: React.FC = () => {
  const { data: menuItems = [] } = useMenuItems();
  const { data: sales = [] } = useSales();
  const { data: kitchenOrders = [] } = useKitchenOrders();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    
    return {
      from: startOfDay,
      to: endOfDay
    };
  });
  
  const [hourRange, setHourRange] = useState<{ from: number; to: number }>({ from: 0, to: 23 });
  const [selectedItemsFilter, setSelectedItemsFilter] = useState<string>('all');

  const filteredSales = React.useMemo(() => {
    if (!dateRange?.from && !dateRange?.to) return sales;
    
    return sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      const saleHour = saleDate.getHours();
      
      const adjustedToDate = dateRange.to ? new Date(dateRange.to) : null;
      if (adjustedToDate) {
        adjustedToDate.setHours(23, 59, 59, 999);
      }
      
      let isWithinDateRange = true;
      if (dateRange.from && dateRange.to) {
        isWithinDateRange = saleDate >= dateRange.from && saleDate <= adjustedToDate!;
      } else if (dateRange.from) {
        isWithinDateRange = saleDate >= dateRange.from;
      } else if (dateRange.to) {
        isWithinDateRange = saleDate <= adjustedToDate!;
      }
      
      const isWithinHourRange = saleHour >= hourRange.from && saleHour <= hourRange.to;
      
      return isWithinDateRange && isWithinHourRange;
    });
  }, [sales, dateRange, hourRange]);

  const filteredKitchenOrders = useMemo(() => {
    if (!dateRange?.from && !dateRange?.to) return kitchenOrders;
    
    return kitchenOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      const orderHour = orderDate.getHours();
      
      const adjustedToDate = dateRange.to ? new Date(dateRange.to) : null;
      if (adjustedToDate) {
        adjustedToDate.setHours(23, 59, 59, 999);
      }
      
      let isWithinDateRange = true;
      if (dateRange.from && dateRange.to) {
        isWithinDateRange = orderDate >= dateRange.from && orderDate <= adjustedToDate!;
      } else if (dateRange.from) {
        isWithinDateRange = orderDate >= dateRange.from;
      } else if (dateRange.to) {
        isWithinDateRange = orderDate <= adjustedToDate!;
      }
      
      const isWithinHourRange = orderHour >= hourRange.from && orderHour <= hourRange.to;
      
      return isWithinDateRange && isWithinHourRange;
    });
  }, [kitchenOrders, dateRange, hourRange]);

  const kitchenStats = useMemo(() => {
    const completedOrders = filteredKitchenOrders.filter(order => order.status === 'ready' && order.ready_at);
    
    const ordersWithTime = completedOrders.map(order => {
      const createdAt = new Date(order.created_at);
      const readyAt = new Date(order.ready_at!);
      const timeToReady = (readyAt.getTime() - createdAt.getTime()) / (1000 * 60); // em minutos
      
      return {
        id: order.id,
        orderNumber: order.order_number,
        createdAt,
        readyAt,
        timeToReady: Math.round(timeToReady),
        saleId: order.sale_id
      };
    });

    const averageTime = ordersWithTime.length > 0 
      ? ordersWithTime.reduce((sum, order) => sum + order.timeToReady, 0) / ordersWithTime.length 
      : 0;

    return {
      ordersWithTime: ordersWithTime.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      averageTime: Math.round(averageTime),
      totalCompleted: completedOrders.length,
      totalPending: filteredKitchenOrders.filter(order => order.status === 'new').length
    };
  }, [filteredKitchenOrders]);

  const quickStats = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = filteredSales.length;
    const totalItemsSold = filteredSales.reduce((sum, sale) => {
      return sum + (sale.sale_items?.reduce((itemSum, item) => itemSum + item.quantity, 0) || 0);
    }, 0);
    const averageTicket = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    return {
      totalRevenue,
      totalTransactions,
      totalItemsSold,
      averageTicket
    };
  }, [filteredSales]);

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

    return hourlyData.filter(data => data.hour >= hourRange.from && data.hour <= hourRange.to);
  }, [filteredSales, hourRange]);

  const salesByItem = useMemo(() => {
    const itemSales: Record<string, { name: string; quantity: number; revenue: number; sales: number }> = {};
    
    filteredSales.forEach(sale => {
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

    if (selectedItemsFilter !== 'all') {
      result = result.filter(item => item.id === selectedItemsFilter);
    }

    return result.sort((a, b) => b.revenue - a.revenue);
  }, [filteredSales, menuItems, selectedItemsFilter]);

  const itemSalesTotals = useMemo(() => {
    return salesByItem.reduce(
      (acc, item) => ({
        quantity: acc.quantity + item.quantity,
        sales: acc.sales + item.sales,
        revenue: acc.revenue + item.revenue,
      }),
      { quantity: 0, sales: 0, revenue: 0 },
    );
  }, [salesByItem]);

  const reportPeriodLabel = useMemo(() => {
    const from = dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : 'N/A';
    const to = dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : 'N/A';
    const hours = `${hourRange.from.toString().padStart(2, '0')}:00 às ${hourRange.to.toString().padStart(2, '0')}:00`;
    return `Período: ${from} até ${to} | Horário: ${hours}`;
  }, [dateRange, hourRange]);

  const reportFilenameSuffix = useMemo(() => {
    const from = dateRange?.from ? format(dateRange.from, 'dd-MM-yyyy') : 'hoje';
    const to = dateRange?.to ? format(dateRange.to, 'dd-MM-yyyy') : 'hoje';
    return `${from}-${to}`;
  }, [dateRange]);

  const hourOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i.toString().padStart(2, '0')}:00`
  }));

  const kitchenExportRows = () =>
    kitchenStats.ordersWithTime.map((order) => [
      `#${order.orderNumber}`,
      format(order.createdAt, 'dd/MM/yyyy HH:mm:ss'),
      format(order.readyAt, 'dd/MM/yyyy HH:mm:ss'),
      order.timeToReady.toString(),
    ]);

  const itemSalesExportRows = () =>
    salesByItem.map((item) => [
      item.name,
      item.quantity.toString(),
      item.sales.toString(),
      formatMoney(item.revenue),
    ]);

  const itemSalesTotalRow = () => [
    'Total',
    itemSalesTotals.quantity.toString(),
    itemSalesTotals.sales.toString(),
    formatMoney(itemSalesTotals.revenue),
  ];

  const hourSalesExportRows = () =>
    salesByHour.map((data) => [data.hourLabel, formatMoney(data.total)]);

  const hourSalesTotal = useMemo(
    () => salesByHour.reduce((sum, row) => sum + row.total, 0),
    [salesByHour],
  );

  const exportKitchenCSV = () => {
    downloadCsv(`relatorio-cozinha-${reportFilenameSuffix}.csv`, [
      ['Pedido', 'Criado em', 'Pronto em', 'Tempo (minutos)'],
      ...kitchenExportRows(),
    ]);
  };

  const exportKitchenPDF = () => {
    downloadPdf(
      `relatorio-cozinha-${reportFilenameSuffix}.pdf`,
      'Relatório da Cozinha',
      `${reportPeriodLabel}\nTempo médio: ${kitchenStats.averageTime} min | Concluídos: ${kitchenStats.totalCompleted} | Pendentes: ${kitchenStats.totalPending}`,
      {
        head: [['Pedido', 'Criado em', 'Pronto em', 'Tempo (min)']],
        body: kitchenExportRows(),
      },
    );
  };

  const exportItemSalesCSV = () => {
    downloadCsv(`vendas-por-item-${reportFilenameSuffix}.csv`, [
      ['Item', 'Quantidade Vendida', 'Número de Vendas', 'Receita Total'],
      ...itemSalesExportRows(),
      itemSalesTotalRow(),
    ]);
  };

  const exportItemSalesPDF = () => {
    downloadPdf(
      `vendas-por-item-${reportFilenameSuffix}.pdf`,
      'Relatório de Vendas por Item',
      `${reportPeriodLabel}\nReceita total: ${formatMoney(itemSalesTotals.revenue)} | Itens vendidos: ${itemSalesTotals.quantity}`,
      {
        head: [['Item', 'Qtd. vendida', 'Nº de vendas', 'Receita total']],
        body: itemSalesExportRows(),
        foot: [itemSalesTotalRow()],
      },
    );
  };

  const exportHourSalesCSV = () => {
    downloadCsv(`vendas-por-hora-${reportFilenameSuffix}.csv`, [
      ['Hora', 'Total de Vendas'],
      ...hourSalesExportRows(),
      ['Total', formatMoney(hourSalesTotal)],
    ]);
  };

  const exportHourSalesPDF = () => {
    downloadPdf(
      `vendas-por-hora-${reportFilenameSuffix}.pdf`,
      'Vendas por Hora',
      `${reportPeriodLabel}\nTotal no período: ${formatMoney(hourSalesTotal)}`,
      {
        head: [['Hora', 'Total de vendas']],
        body: hourSalesExportRows(),
        foot: [['Total', formatMoney(hourSalesTotal)]],
      },
    );
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

        <Card>
          <CardHeader>
            <CardTitle>Filtros do Relatório</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-sm font-medium">Período de Data</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange?.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from && dateRange?.to ? (
                        dateRange.from.toDateString() === dateRange.to.toDateString() ? 
                        format(dateRange.from, "dd/MM/yyyy") :
                        `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                      ) : (
                        <span>Selecionar período</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range) => {
                        if (range?.from) {
                          const startOfDay = new Date(range.from);
                          startOfDay.setHours(0, 0, 0, 0);
                          
                          const endOfDay = range.to ? new Date(range.to) : new Date(range.from);
                          endOfDay.setHours(23, 59, 59, 999);
                          
                          setDateRange({
                            from: startOfDay,
                            to: endOfDay
                          });
                        } else {
                          setDateRange(range);
                        }
                      }}
                      numberOfMonths={2}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Período de Hora</label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Das</span>
                  <Select value={hourRange.from.toString()} onValueChange={(value) => setHourRange(prev => ({ ...prev, from: parseInt(value) }))}>
                    <SelectTrigger className="w-20">
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
                  <span className="text-sm text-muted-foreground">às</span>
                  <Select value={hourRange.to.toString()} onValueChange={(value) => setHourRange(prev => ({ ...prev, to: parseInt(value) }))}>
                    <SelectTrigger className="w-20">
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
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {quickStats.totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quickStats.totalTransactions}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Itens Vendidos</CardTitle>
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {quickStats.totalItemsSold}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                R$ {quickStats.averageTicket.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  Relatório da Cozinha
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Período: {dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : 'N/A'} até {dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : 'N/A'} | 
                  Horário: {hourRange.from.toString().padStart(2, '0')}:00 às {hourRange.to.toString().padStart(2, '0')}:00
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={exportKitchenCSV} className="gap-2">
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportKitchenPDF} className="gap-2">
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Tempo Médio</div>
                <div className="text-2xl font-bold text-blue-700">
                  {kitchenStats.averageTime} min
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Pedidos Concluídos</div>
                <div className="text-2xl font-bold text-green-700">
                  {kitchenStats.totalCompleted}
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-sm text-orange-600 font-medium">Pedidos Pendentes</div>
                <div className="text-2xl font-bold text-orange-700">
                  {kitchenStats.totalPending}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Pronto em</TableHead>
                    <TableHead className="text-right">Tempo (min)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kitchenStats.ordersWithTime.length > 0 ? (
                    kitchenStats.ordersWithTime.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">#{order.orderNumber}</TableCell>
                        <TableCell>{format(order.createdAt, 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                        <TableCell>{format(order.readyAt, 'dd/MM/yyyy HH:mm:ss')}</TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs",
                            order.timeToReady <= 10 ? "bg-green-100 text-green-800" :
                            order.timeToReady <= 20 ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          )}>
                            {order.timeToReady} min
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Nenhum pedido concluído encontrado para os filtros selecionados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5" />
                  Relatório de Vendas por Item
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Período: {dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : 'N/A'} até {dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : 'N/A'} | 
                  Horário: {hourRange.from.toString().padStart(2, '0')}:00 às {hourRange.to.toString().padStart(2, '0')}:00
                </p>
              </div>
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
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={exportItemSalesCSV} className="gap-2">
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportItemSalesPDF} className="gap-2">
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
                    <>
                      {salesByItem.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-center">{item.sales}</TableCell>
                          <TableCell className="text-right font-medium text-green-600">
                            {formatMoney(item.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-semibold">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-center">{itemSalesTotals.quantity}</TableCell>
                        <TableCell className="text-center">{itemSalesTotals.sales}</TableCell>
                        <TableCell className="text-right text-green-700">
                          {formatMoney(itemSalesTotals.revenue)}
                        </TableCell>
                      </TableRow>
                    </>
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

        <Card>
          <CardHeader>
            <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
              <div>
                <CardTitle>Vendas por Hora (R$)</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Período: {dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : 'N/A'} até {dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : 'N/A'} | 
                  Horário: {hourRange.from.toString().padStart(2, '0')}:00 às {hourRange.to.toString().padStart(2, '0')}:00
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={exportHourSalesCSV} className="gap-2">
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={exportHourSalesPDF} className="gap-2">
                  <FileText className="h-4 w-4" />
                  PDF
                </Button>
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
