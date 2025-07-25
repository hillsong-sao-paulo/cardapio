
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Package, DollarSign, ShoppingCart, TrendingUp, CalendarIcon } from 'lucide-react';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useSales } from '@/hooks/useSales';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard: React.FC = () => {
  const { data: menuItems = [] } = useMenuItems();
  const { data: sales = [] } = useSales();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const totalItems = menuItems.length;
  const totalStock = menuItems.reduce((sum, item) => sum + item.stock, 0);
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);

  // Filtrar vendas por data selecionada
  const salesOnSelectedDate = React.useMemo(() => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    return sales.filter(sale => {
      const saleDate = format(new Date(sale.created_at), 'yyyy-MM-dd');
      return saleDate === selectedDateStr;
    });
  }, [sales, selectedDate]);

  // Processar dados para o gráfico de vendas por hora
  const salesByHour = React.useMemo(() => {
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      hourLabel: `${i.toString().padStart(2, '0')}:00`,
      total: 0
    }));

    salesOnSelectedDate.forEach(sale => {
      const hour = new Date(sale.created_at).getHours();
      hourlyData[hour].total += sale.total;
    });

    return hourlyData;
  }, [salesOnSelectedDate]);

  const dailyRevenue = salesOnSelectedDate.reduce((sum, sale) => sum + sale.total, 0);
  const dailySales = salesOnSelectedDate.length;

  return (
    <div className="max-w-[1280px] mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens no Cardápio</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Vendas por Hora */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Vendas por Hora (R$)</CardTitle>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                      setIsCalendarOpen(false);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="text-sm text-muted-foreground mt-2">
            Vendas do dia: {dailySales} • Receita: R$ {dailyRevenue.toFixed(2)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hourLabel" 
                  tick={{ fontSize: 12 }}
                  interval={1}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `R$ ${value.toFixed(0)}`}
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

      {/* Vendas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">Venda #{sale.id.slice(-8)}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(sale.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">R$ {sale.total.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">
                    {sale.sale_items?.length || 0} itens
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
