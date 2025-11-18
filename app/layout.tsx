import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { createClient } from "@/lib/supabase/server";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import NextTopLoader from "nextjs-toploader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard de Vendas",
  description: "Dashboard completo de análise de vendas com dados reais",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <NextTopLoader
          color="#0088FE"
          height={3}
          showSpinner={true}
          speed={200}
          shadow="0 0 10px #0088FE,0 0 5px #0088FE"
        />
        <ReactQueryProvider>
          {user ? (
            <SidebarProvider>
              <AppSidebar userEmail={user.email || 'Usuário'} />
              <main className="flex-1 w-full">
                <SidebarTrigger className="m-4" />
                {children}
              </main>
            </SidebarProvider>
          ) : (
            <main className="w-full">
              {children}
            </main>
          )}
        </ReactQueryProvider>
      </body>
    </html>
  );
}
