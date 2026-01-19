"use client"
import {
  Home,
  FileText,
  Users,
  Package,
  CreditCard,
  Settings,
  Bell,
  HelpCircle,
  Plus,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import Link from "next/link";
import { Logo } from "@/components/home/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AppSidebar = () => {
  const mainItems = [
    {
      title: "Tableau de bord",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Factures",
      url: "/invoices",
      icon: FileText,
    },
    {
      title: "Clients",
      url: "/clients",
      icon: Users,
    },
    {
      title: "Produits",
      url: "/products",
      icon: Package,
    },
    {
      title: "Paiements",
      url: "/payments",
      icon: CreditCard,
    },
  ];

  const secondaryItems = [
    {
      title: "Paramètres",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: Bell,
    },
    {
      title: "Aide",
      url: "/help",
      icon: HelpCircle,
    },
  ];

  const quickActions = [
    {
      title: "Nouvelle facture",
      url: "/invoices/new",
      icon: FileText,
      variant: "default" as const,
    },
    {
      title: "Nouveau client",
      url: "/clients/new",
      icon: Users,
      variant: "outline" as const,
    },
    {
      title: "Nouveau produit",
      url: "/products/new",
      icon: Package,
      variant: "outline" as const,
    },
  ];

  return (
    <Sidebar collapsible="icon">
      {/* Header avec logo */}
      <SidebarHeader className="border-border/50">
        <div className="flex items-center gap-2 px-4 py-3">
          <Logo />
        </div>
      </SidebarHeader>
      
      <SidebarSeparator />
      
      {/* Contenu principal */}
      <SidebarContent className="flex-1">
        {/* Menu principal */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
            Menu principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link 
                      href={item.url} 
                      className="flex items-center gap-3"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Actions rapides */}
        <SidebarGroup>
          <div className="flex items-center justify-between">
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Actions rapides
            </SidebarGroupLabel>
            <SidebarGroupAction asChild>
              <Link 
                href="/invoices/new" 
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <Plus className="h-3 w-3" />
                <span className="sr-only">Nouveau</span>
              </Link>
            </SidebarGroupAction>
          </div>
          <SidebarGroupContent>
            <div className="space-y-1 px-1">
              {quickActions.map((action) => (
                <Button
                  key={action.title}
                  variant={action.variant}
                  size="sm"
                  className="w-full justify-start gap-2"
                  asChild
                >
                  <Link href={action.url}>
                    <action.icon className="h-3.5 w-3.5" />
                    <span>{action.title}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Menu secondaire */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
            Autres
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link 
                      href={item.url} 
                      className="flex items-center gap-3"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-border/50">
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground text-center">
            © {new Date().getFullYear()} OneBill
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;