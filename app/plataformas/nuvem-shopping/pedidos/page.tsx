'use client';

import { useEffect, useState } from 'react';
import { loadCSVData } from '@/lib/csvProcessor';
import { Venda } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DateFilter, PeriodFilter, DateRange, filterByPeriod } from '@/components/DateFilter';
import { Search, MapPin } from 'lucide-react';
import { OrderDetailsModal } from '@/components/OrderDetailsModal';
import { Badge } from '@/components/ui/badge';

export default function NuvemShoppingPedidosPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [allVendas, setAllVendas] = useState<Venda[]>([]);
  const [filteredVendas, setFilteredVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>('');
  const [selectedOrderItems, setSelectedOrderItems] = useState<Venda[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await loadCSVData('nuvem-shopping');
        // Agrupar por pedido (pegar apenas a primeira linha de cada pedido)
        const pedidosMap = new Map<string, Venda>();
        data.forEach(venda => {
          if (venda.numeroPedido && !pedidosMap.has(venda.numeroPedido)) {
            pedidosMap.set(venda.numeroPedido, venda);
          }
        });
        const pedidosUnicos = Array.from(pedidosMap.values());
        setAllVendas(pedidosUnicos);
        setVendas(pedidosUnicos);
        setFilteredVendas(pedidosUnicos);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Aplicar filtro de período
  useEffect(() => {
    if (allVendas.length > 0) {
      const periodFiltered = filterByPeriod(allVendas, selectedPeriod, customDateRange);
      setVendas(periodFiltered);
    }
  }, [selectedPeriod, customDateRange, allVendas]);

  // Aplicar busca
  useEffect(() => {
    if (searchTerm) {
      const filtered = vendas.filter(venda => {
        const searchLower = searchTerm.toLowerCase();
        return (
          venda.numeroPedido?.toLowerCase().includes(searchLower) ||
          venda.nomeComprador?.toLowerCase().includes(searchLower) ||
          venda.email?.toLowerCase().includes(searchLower) ||
          venda.cidade?.toLowerCase().includes(searchLower) ||
          venda.estado?.toLowerCase().includes(searchLower) ||
          venda.statusPagamento?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredVendas(filtered);
      setCurrentPage(1);
    } else {
      setFilteredVendas(vendas);
    }
  }, [searchTerm, vendas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Carregando dados...</div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split(' ')[0].split('/');
    if (parts.length === 3) {
      return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
    return dateStr;
  };

  // Funções para o modal de detalhes do pedido
  const handleOrderClick = async (orderNumber: string) => {
    try {
      // Buscar todos os itens do pedido
      const allData = await loadCSVData('nuvem-shopping');
      const orderItems = allData.filter(venda => venda.numeroPedido === orderNumber);
      
      setSelectedOrderNumber(orderNumber);
      setSelectedOrderItems(orderItems);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes do pedido:', error);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrderNumber('');
    setSelectedOrderItems([]);
  };

  // Paginação
  const totalPages = Math.ceil(filteredVendas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVendas = filteredVendas.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Pedidos - Nuvem Shopping</h1>
          <p className="text-muted-foreground">
            Total de {filteredVendas.length} pedidos
            {selectedPeriod !== 'all' && (
              <span className="ml-2 text-primary font-medium">
                (filtrado por período)
              </span>
            )}
          </p>
        </div>

        {/* Filtro de Período */}
        <DateFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          customDateRange={customDateRange}
          onDateRangeChange={setCustomDateRange}
        />

        {/* Busca */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por número do pedido, cliente, email, cidade, estado ou status..."
                className="w-full pl-10 pr-4 py-2 border rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabela / Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes dos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop: Tabela */}
            {!isMobile ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status Pgto</TableHead>
                      <TableHead>Status Envio</TableHead>
                      <TableHead>Canal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentVendas.map((venda, index) => (
                      <TableRow
                        key={`${venda.numeroPedido}-${index}`}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleOrderClick(venda.numeroPedido)}
                      >
                        <TableCell className="font-medium">#{venda.numeroPedido}</TableCell>
                        <TableCell>{formatDate(venda.data)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{venda.nomeComprador}</span>
                            <span className="text-xs text-muted-foreground">{venda.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {venda.cidade && venda.estado ? (
                            <div className="flex flex-col">
                              <span>{venda.cidade}</span>
                              <span className="text-xs text-muted-foreground">{venda.estado}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Retirada em loja</span>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(venda.total)}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              venda.statusPagamento === 'Confirmado'
                                ? 'bg-green-100 text-green-800'
                                : venda.statusPagamento === 'Pendente'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {venda.statusPagamento}
                          </span>
                        </TableCell>
                        <TableCell>{venda.statusEnvio}</TableCell>
                        <TableCell>
                          {venda.canal ? (
                            <span>{venda.canal}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Não informado</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              /* Mobile: Cards */
              <div className="space-y-4">
                {currentVendas.map((venda, index) => (
                  <div
                    key={`${venda.numeroPedido}-${index}`}
                    className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleOrderClick(venda.numeroPedido)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-lg">#{venda.numeroPedido}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(venda.data)}</p>
                      </div>
                      <Badge
                        variant={venda.statusPagamento === 'Confirmado' ? 'default' : 'secondary'}
                        className={
                          venda.statusPagamento === 'Confirmado'
                            ? 'bg-green-100 text-green-800'
                            : venda.statusPagamento === 'Pendente'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {venda.statusPagamento}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="font-medium">{venda.nomeComprador}</p>
                        <p className="text-xs text-muted-foreground">{venda.email}</p>
                      </div>

                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {venda.cidade && venda.estado ? (
                          <span>{venda.cidade}, {venda.estado}</span>
                        ) : (
                          <span className="italic text-muted-foreground">Retirada em loja</span>
                        )}
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="font-bold text-lg">{formatCurrency(venda.total)}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Envio: {venda.statusEnvio}</span>
                        {venda.canal && <span className="text-muted-foreground">Canal: {venda.canal}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex flex-col md:flex-row items-center justify-between mt-4 gap-3">
                {/* Texto de informação - escondido no mobile */}
                <p className="hidden md:block text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredVendas.length)} de{' '}
                  {filteredVendas.length} pedidos
                </p>

                <div className="flex gap-2 flex-wrap justify-center">
                  <Button
                    variant="outline"
                    size={isMobile ? 'sm' : 'sm'}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={isMobile ? 'text-xs px-2' : ''}
                  >
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(isMobile ? 3 : 5, totalPages) }, (_, i) => {
                      let pageNum;
                      const maxPages = isMobile ? 3 : 5;
                      const halfMax = Math.floor(maxPages / 2);

                      if (totalPages <= maxPages) {
                        pageNum = i + 1;
                      } else if (currentPage <= halfMax + 1) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - halfMax) {
                        pageNum = totalPages - maxPages + i + 1;
                      } else {
                        pageNum = currentPage - halfMax + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? 'default' : 'outline'}
                          size={isMobile ? 'sm' : 'sm'}
                          onClick={() => setCurrentPage(pageNum)}
                          className={isMobile ? 'h-8 w-8 p-0 text-xs' : ''}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size={isMobile ? 'sm' : 'sm'}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={isMobile ? 'text-xs px-2' : ''}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Detalhes do Pedido */}
        <OrderDetailsModal
          isOpen={isModalOpen}
          onClose={closeModal}
          orderNumber={selectedOrderNumber}
          orderItems={selectedOrderItems}
        />
      </div>
    </div>
  );
}
