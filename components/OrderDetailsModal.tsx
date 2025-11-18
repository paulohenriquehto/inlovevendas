import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { X, Calendar, User, MapPin, CreditCard, Package, Truck, DollarSign } from 'lucide-react';
import { Venda } from '@/lib/types';

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  orderItems: Venda[];
}

export function OrderDetailsModal({ isOpen, onClose, orderNumber, orderItems }: OrderDetailsModalProps) {
  if (!orderItems || orderItems.length === 0) return null;

  // Pegar o primeiro item como representante do pedido (dados principais)
  const mainOrder = orderItems[0];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string, includeTime = false) => {
    if (!dateStr) return '-';
    
    // Se for uma data Excel (número), converter
    if (typeof dateStr === 'number') {
      const baseDate = new Date(1900, 0, 1);
      const targetDate = new Date(baseDate.getTime() + (dateStr - 2) * 24 * 60 * 60 * 1000);
      return targetDate.toLocaleDateString('pt-BR') + (includeTime ? ` ${targetDate.toLocaleTimeString('pt-BR')}` : '');
    }
    
    // Se for string no formato DD/MM/YYYY
    const parts = dateStr.split(' ')[0].split('/');
    if (parts.length === 3) {
      const date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      return date.toLocaleDateString('pt-BR') + (includeTime ? ` ${dateStr.split(' ')[1] || ''}` : '');
    }
    
    return dateStr;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmado':
      case 'completed':
      case 'processing':
        return 'bg-green-100 text-green-800';
      case 'pendente':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelado':
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calcularTotais = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.valorProduto * item.quantidadeComprada), 0);
    const desconto = mainOrder.desconto || 0;
    const frete = mainOrder.valorFrete || 0;
    const total = mainOrder.total || (subtotal + frete - desconto);
    
    return { subtotal, desconto, frete, total };
  };

  const totais = calcularTotais();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-4 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
          <SheetTitle className="text-2xl font-bold">
            Detalhes do Pedido #{orderNumber}
          </SheetTitle>
          <SheetDescription>
            Informações completas sobre o pedido selecionado
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Informações do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="font-medium">{mainOrder.nomeComprador}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                  <p className="font-medium text-blue-600">{mainOrder.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Telefone</label>
                  <p className="font-medium">{mainOrder.telefone || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CPF/CNPJ</label>
                  <p className="font-medium text-sm">{mainOrder.cpfCnpj || 'Não informado'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Status do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status do Pedido</label>
                  <Badge className={getStatusColor(mainOrder.statusPedido)}>
                    {mainOrder.statusPedido}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status do Pagamento</label>
                  <Badge className={getStatusColor(mainOrder.statusPagamento)}>
                    {mainOrder.statusPagamento}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status do Envio</label>
                  <Badge className={getStatusColor(mainOrder.statusEnvio)}>
                    {mainOrder.statusEnvio}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Datas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Datas Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data do Pedido</label>
                  <p className="font-medium">{formatDate(mainOrder.data, true)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data do Pagamento</label>
                  <p className="font-medium">{formatDate(mainOrder.dataPagamento, true)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data do Envio</label>
                  <p className="font-medium">{formatDate(mainOrder.dataEnvio, true)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Itens do Pedido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Itens do Pedido ({orderItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.nomeProduto}</h4>
                        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                      </div>
                      <Badge variant="outline">Qtd: {item.quantidadeComprada}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Preço Unit.:</span>
                        <p className="font-medium">{formatCurrency(item.valorProduto)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantidade:</span>
                        <p className="font-medium">{item.quantidadeComprada}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Item:</span>
                        <p className="font-medium">{formatCurrency(item.valorProduto * item.quantidadeComprada)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Endereço de Entrega */}
          {(mainOrder.endereco || mainOrder.cidade) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereço de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {mainOrder.endereco && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Endereço:</span>
                      <p className="font-medium">{mainOrder.endereco}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {mainOrder.numero && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Número:</span>
                        <p className="font-medium">{mainOrder.numero}</p>
                      </div>
                    )}
                    {mainOrder.complemento && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Complemento:</span>
                        <p className="font-medium">{mainOrder.complemento}</p>
                      </div>
                    )}
                    {mainOrder.bairro && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Bairro:</span>
                        <p className="font-medium">{mainOrder.bairro}</p>
                      </div>
                    )}
                    {mainOrder.cidade && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Cidade:</span>
                        <p className="font-medium">{mainOrder.cidade}</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {mainOrder.estado && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Estado:</span>
                        <p className="font-medium">{mainOrder.estado}</p>
                      </div>
                    )}
                    {mainOrder.codigoPostal && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">CEP:</span>
                        <p className="font-medium">{mainOrder.codigoPostal}</p>
                      </div>
                    )}
                    {mainOrder.pais && (
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">País:</span>
                        <p className="font-medium">{mainOrder.pais}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagamento e Envio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Forma de Pagamento:</span>
                  <p className="font-medium">{mainOrder.formaPagamento || 'Não informado'}</p>
                </div>
                {mainOrder.cupomDesconto && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Cupom de Desconto:</span>
                    <p className="font-medium text-green-600">{mainOrder.cupomDesconto}</p>
                  </div>
                )}
                {mainOrder.identificadorTransacao && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">ID da Transação:</span>
                    <p className="font-medium text-xs">{mainOrder.identificadorTransacao}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Envio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Forma de Entrega:</span>
                  <p className="font-medium">{mainOrder.formaEntrega || 'Não informado'}</p>
                </div>
                {mainOrder.codigoRastreio && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Código de Rastreamento:</span>
                    <p className="font-medium text-blue-600">{mainOrder.codigoRastreio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumo Financeiro */}
          <Card className="bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <DollarSign className="h-5 w-5" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(totais.subtotal)}</span>
                </div>
                {totais.desconto > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto:</span>
                    <span className="font-medium">-{formatCurrency(totais.desconto)}</span>
                  </div>
                )}
                {totais.frete > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frete:</span>
                    <span className="font-medium">{formatCurrency(totais.frete)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total do Pedido:</span>
                  <span className="text-blue-600">{formatCurrency(totais.total)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          {(mainOrder.anotacoesComprador || mainOrder.anotacoesVendedor) && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mainOrder.anotacoesComprador && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Observações do Comprador:</label>
                    <p className="mt-1 p-3 bg-gray-50 rounded-md">{mainOrder.anotacoesComprador}</p>
                  </div>
                )}
                {mainOrder.anotacoesVendedor && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Observações do Vendedor:</label>
                    <p className="mt-1 p-3 bg-blue-50 rounded-md">{mainOrder.anotacoesVendedor}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Rodapé com botão fechar */}
        <div className="mt-8 flex justify-end">
          <Button onClick={onClose} variant="outline">
            Fechar Detalhes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}