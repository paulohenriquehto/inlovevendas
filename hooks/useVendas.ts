'use client';

import { useQuery } from '@tanstack/react-query';
import { Venda } from '@/lib/types';
import { loadCSVData } from '@/lib/csvProcessor';
import { loadWordPressData } from '@/lib/wordpressProcessor';

// Hook para dados do WordPress
export function useWordPressVendas() {
  return useQuery({
    queryKey: ['wordpress', 'vendas'],
    queryFn: async () => {
      return loadWordPressData();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

// Hook para dados da Nuvem Shopping
export function useNuvemShoppingVendas() {
  return useQuery({
    queryKey: ['nuvem-shopping', 'vendas'],
    queryFn: async () => {
      return loadCSVData('nuvem-shopping');
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Hook para dados do Sistema Novo
export function useSistemaNovoVendas() {
  return useQuery({
    queryKey: ['sistema-novo', 'vendas'],
    queryFn: async () => {
      return loadCSVData('sistema-novo');
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Hook para todos os dados combinados
export function useAllVendas() {
  const wordpress = useWordPressVendas();
  const nuvemShopping = useNuvemShoppingVendas();
  const sistemaNovo = useSistemaNovoVendas();

  const isLoading = wordpress.isLoading || nuvemShopping.isLoading || sistemaNovo.isLoading;
  const isError = wordpress.isError || nuvemShopping.isError || sistemaNovo.isError;
  const error = wordpress.error || nuvemShopping.error || sistemaNovo.error;

  const allVendas: Venda[] = [
    ...(wordpress.data || []),
    ...(nuvemShopping.data || []),
    ...(sistemaNovo.data || []),
  ];

  return {
    data: allVendas,
    isLoading,
    isError,
    error,
    refetch: () => {
      wordpress.refetch();
      nuvemShopping.refetch();
      sistemaNovo.refetch();
    },
  };
}
