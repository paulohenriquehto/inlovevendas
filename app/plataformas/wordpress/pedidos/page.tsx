'use client';

import { useEffect, useState } from 'react';
import { loadWordPressData } from '@/lib/wordpressProcessor';
import { Venda } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DateFilter, PeriodFilter, DateRange, filterByPeriod } from '@/components/DateFilter';
import { Search } from 'lucide-react';
import { OrderDetailsModal } from '@/components/OrderDetailsModal';

export default function WordPressPedidosPage() {
  const [allItems, setAllItems] = useState<Venda[]>([]); // Todos os itens (para modal)
  const [allVendas, setAllVendas] = useState<Venda[]>([]); // Todos os pedidos únicos
  const [vendas, setVendas] = useState<Venda[]>([]); // Pedidos filtrados por período
  const [filteredVendas, setFilteredVendas] = useState<Venda[]>([]); // Pedidos filtrados por busca
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>('');
  const [selectedOrderItems, setSelectedOrderItems] = useState<Venda[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        console.log('[WordPress Pedidos] Carregando dados das planilhas...');
        const data = await loadWordPressData();

        // Agrupar por pedido (pegar apenas um item por pedido para a lista)
        const pedidosMap = new Map<string, Venda>();
        data.forEach(venda => {
          if (venda.numeroPedido && !pedidosMap.has(venda.numeroPedido)) {
            pedidosMap.set(venda.numeroPedido, venda);
          }
        });

        const pedidosUnicos = Array.from(pedidosMap.values());

        // Ordenar do mais recente para o mais antigo
        pedidosUnicos.sort((a, b) => {
          const dateA = new Date(a.data || '');
          const dateB = new Date(b.data || '');
          return dateB.getTime() - dateA.getTime(); // Decrescente (mais recente primeiro)
        });

        console.log('[WordPress Pedidos] Total de pedidos únicos:', pedidosUnicos.length);

        setAllItems(data); // Guardar todos os itens para o modal
        setAllVendas(pedidosUnicos); // Guardar todos os pedidos únicos
        setVendas(pedidosUnicos);
        setFilteredVendas(pedidosUnicos);
      } catch (error) {
        console.error('Erro ao carregar dados do WordPress:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    if (allVendas.length > 0) {
      const periodFiltered = filterByPeriod(allVendas, selectedPeriod, customDateRange);
      setVendas(periodFiltered);
    }
  }, [selectedPeriod, customDateRange, allVendas]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = vendas.filter(venda => {
        const searchLower = searchTerm.toLowerCase();
        return (
          venda.numeroPedido?.toLowerCase().includes(searchLower) ||
          venda.nomeComprador?.toLowerCase().includes(searchLower) ||
          venda.email?.toLowerCase().includes(searchLower) ||
          venda.cpfCnpj?.toLowerCase().includes(searchLower) ||
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
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split(' ')[0].split('/');
    if (parts.length === 3) {
      return `${parts[0]}/${parts[1]}/${parts[2]}`;
    }
    return dateStr;
  };

  const maskCPF = (cpf: string) => {
    if (!cpf) return '-';
    const numbers = cpf.replace(/\D/g, '');
    if (numbers.length !== 11) return cpf;
    return `XXX.XXX.XXX-${numbers.slice(-2)}`;
  };

  const handleOrderClick = (orderNumber: string) => {
    const orderItems = allItems.filter(venda => venda.numeroPedido === orderNumber);
    setSelectedOrderNumber(orderNumber);
    setSelectedOrderItems(orderItems);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedOrderNumber('');
    setSelectedOrderItems([]);
  };

  const totalPages = Math.ceil(filteredVendas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVendas = filteredVendas.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Pedidos - WordPress</h1>
          <p className="text-muted-foreground">
            Total de {filteredVendas.length} pedidos
            {selectedPeriod !== 'all' && (
              <span className="ml-2 text-primary font-medium">(filtrado por período)</span>
            )}
          </p>
        </div>

        <DateFilter selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} customDateRange={customDateRange} onDateRangeChange={setCustomDateRange} />

        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por número do pedido, cliente, email, CPF, cidade, estado ou status..."
                className="w-full pl-10 pr-4 py-2 border rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes dos Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Total Pedidos</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status Pgto</TableHead>
                    <TableHead>Data Pgto</TableHead>
                    <TableHead>Status Envio</TableHead>
                    <TableHead>Canal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentVendas.map((venda, index) => (
                    <TableRow key={`${venda.numeroPedido}-${index}`} className="cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => handleOrderClick(venda.numeroPedido)}>
                      <TableCell className="font-medium">#{venda.numeroPedido}</TableCell>
                      <TableCell>{formatDate(venda.data)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{venda.nomeComprador}</span>
                          <span className="text-xs text-muted-foreground">{venda.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono">{maskCPF(venda.cpfCnpj)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={venda.primeiraCompraCliente ? 'default' : 'secondary'}>{venda.totalPedidosCliente || 1}</Badge>
                          {venda.primeiraCompraCliente && <span className="text-xs text-green-600 font-medium">Novo</span>}
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
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          venda.statusPagamento === 'Confirmado'
                            ? 'bg-green-100 text-green-800'
                            : venda.statusPagamento === 'Pendente'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>{venda.statusPagamento}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{formatDate(venda.dataPagamento)}</span>
                      </TableCell>
                      <TableCell>{venda.statusEnvio}</TableCell>
                      <TableCell>{venda.canal ? <span>{venda.canal}</span> : <span className="text-xs text-muted-foreground italic">Não informado</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">Mostrando {startIndex + 1} a {Math.min(endIndex, filteredVendas.length)} de {filteredVendas.length} pedidos</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Anterior</Button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button key={pageNum} variant={currentPage === pageNum ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(pageNum)}>{pageNum}</Button>
                      );
                    })}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>Próxima</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <OrderDetailsModal isOpen={isModalOpen} onClose={closeModal} orderNumber={selectedOrderNumber} orderItems={selectedOrderItems} />
      </div>
    </div>
  );
}
