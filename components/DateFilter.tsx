'use client';

import { Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CustomDatePicker } from './CustomDatePicker';
export type PeriodFilter = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

// Tipo DateRange compatível com react-day-picker
export interface DateRange {
  from: Date | undefined;
  to?: Date | undefined;
}

interface DateFilterProps {
  selectedPeriod: PeriodFilter;
  onPeriodChange: (period: PeriodFilter) => void;
  customDateRange?: DateRange;
  onDateRangeChange?: (dateRange: DateRange | undefined) => void;
}

export function DateFilter({
  selectedPeriod,
  onPeriodChange,
  customDateRange,
  onDateRangeChange
}: DateFilterProps) {
  const periods: { value: PeriodFilter; label: string }[] = [
    { value: 'all', label: 'Todos' },
    { value: 'today', label: 'Hoje' },
    { value: 'week', label: 'Esta Semana' },
    { value: 'month', label: 'Este Mês' },
    { value: 'year', label: 'Este Ano' },
    { value: 'custom', label: 'Personalizado' },
  ];

  const handleDateRangeChange = (dateRange: DateRange | undefined) => {
    if (onDateRangeChange) {
      onDateRangeChange(dateRange);
      if (dateRange?.from && dateRange?.to) {
        onPeriodChange('custom');
      }
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Período:</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {periods.map((period) => (
                <button
                  key={period.value}
                  onClick={() => onPeriodChange(period.value)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedPeriod === period.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          {/* Seletor de data customizado */}
          {selectedPeriod === 'custom' && onDateRangeChange && (
            <div className="flex items-center gap-2 pl-2">
              <span className="text-sm text-muted-foreground">Selecione o intervalo:</span>
              <CustomDatePicker
                dateRange={customDateRange}
                onDateRangeChange={handleDateRangeChange}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Função auxiliar para filtrar dados por período
export function filterByPeriod<T extends { data: string }>(
  items: T[],
  period: PeriodFilter,
  dateRange?: DateRange
): T[] {
  if (period === 'all') return items;

  // Filtro personalizado por intervalo de datas
  if (period === 'custom' && dateRange?.from && dateRange?.to) {
    const fromDate = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate());
    const toDate = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate());

    return items.filter((item) => {
      if (!item.data) return false;

      const datePart = item.data.split(' ')[0];
      const [day, month, year] = datePart.split('/').map(Number);
      const itemDate = new Date(year, month - 1, day);

      return itemDate >= fromDate && itemDate <= toDate;
    });
  }

  if (period === 'custom') return items; // Se não tiver dateRange, retorna tudo

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return items.filter((item) => {
    if (!item.data) return false;

    // Parse da data no formato "DD/MM/YYYY HH:MM:SS" ou "DD/MM/YYYY"
    const datePart = item.data.split(' ')[0];
    const [day, month, year] = datePart.split('/').map(Number);
    const itemDate = new Date(year, month - 1, day);

    switch (period) {
      case 'today':
        return (
          itemDate.getDate() === today.getDate() &&
          itemDate.getMonth() === today.getMonth() &&
          itemDate.getFullYear() === today.getFullYear()
        );

      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return itemDate >= weekAgo && itemDate <= now;

      case 'month':
        return (
          itemDate.getMonth() === today.getMonth() &&
          itemDate.getFullYear() === today.getFullYear()
        );

      case 'year':
        return itemDate.getFullYear() === today.getFullYear();

      default:
        return true;
    }
  });
}
