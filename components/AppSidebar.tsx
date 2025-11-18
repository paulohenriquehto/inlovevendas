import { Store } from 'lucide-react';
import { UserNav } from '@/components/UserNav';
import { SidebarMenuClient } from '@/components/SidebarMenuClient';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from '@/components/ui/sidebar';

const plataformas = [
  {
    title: 'Nuvem Shopping',
    slug: 'nuvem-shopping',
    items: [
      { title: 'Dashboard', url: '/plataformas/nuvem-shopping' },
      { title: 'Pedidos', url: '/plataformas/nuvem-shopping/pedidos' },
    ],
  },
  {
    title: 'WordPress',
    slug: 'wordpress',
    items: [
      { title: 'Dashboard', url: '/plataformas/wordpress' },
      { title: 'Pedidos', url: '/plataformas/wordpress/pedidos' },
    ],
  },
  {
    title: 'Sistema Novo',
    slug: 'sistema-novo',
    items: [
      { title: 'Dashboard', url: '/plataformas/sistema-novo' },
      { title: 'Pedidos', url: '/plataformas/sistema-novo/pedidos' },
    ],
  },
];

interface AppSidebarProps {
  userEmail: string;
}

export function AppSidebar({ userEmail }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex flex-col gap-2">
          <div className="text-xs font-semibold text-primary uppercase tracking-wider">
            inlovestore
          </div>
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6" />
            <h2 className="text-lg font-semibold">Dashboard de Vendas</h2>
          </div>
        </div>
      </SidebarHeader>

      <UserNav userEmail={userEmail} />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Plataformas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenuClient plataformas={plataformas} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
