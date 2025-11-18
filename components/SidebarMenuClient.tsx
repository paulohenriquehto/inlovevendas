'use client';

import { Store, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface PlataformaItem {
  title: string;
  url: string;
}

interface Plataforma {
  title: string;
  slug: string;
  items: PlataformaItem[];
}

interface SidebarMenuClientProps {
  plataformas: Plataforma[];
}

export function SidebarMenuClient({ plataformas }: SidebarMenuClientProps) {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {/* Plataformas com sub-menus */}
      {plataformas.map((plataforma) => (
        <Collapsible key={plataforma.slug} defaultOpen className="group/collapsible">
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton>
                <Store className="h-4 w-4" />
                <span>{plataforma.title}</span>
                <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {plataforma.items.map((subItem) => {
                  const isActive = pathname === subItem.url;
                  return (
                    <SidebarMenuSubItem key={subItem.url}>
                      <SidebarMenuSubButton asChild isActive={isActive}>
                        <Link href={subItem.url}>
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      ))}
    </SidebarMenu>
  );
}
