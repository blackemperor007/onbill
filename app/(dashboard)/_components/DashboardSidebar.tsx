import {
  Home,
  FileText,
  Users,
  Package,
  CreditCard,
  BarChart3,
  Settings,
  User2,
  LogOut,
  Building,
  Calendar,
  Bell,
  HelpCircle,
  FileSpreadsheet,
  DollarSign,
  Edit,
  Pencil,
  ImageIcon,
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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import Link from "next/link";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignOutButton, UserButton, useUser } from "@clerk/nextjs";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";

// Fonction pour récupérer les statistiques
async function getDashboardStats(companyId: string) {
  if (!companyId) return null;

  const [invoiceCount, clientCount, productCount, pendingInvoices] = await Promise.all([
    prisma.invoice.count({ where: { companyId } }),
    prisma.client.count({ where: { companyId } }),
    prisma.product.count({ where: { companyId } }),
    prisma.invoice.count({ where: { companyId, status: "PENDING" } }),
  ]);

  return {
    invoiceCount,
    clientCount,
    productCount,
    pendingInvoices,
  };
}

export default async function DashboardSidebar() {
  // const { isLoaded: isUserLoaded } = useUser();
  const { userId } = await auth();
  
  if (!userId) return null;

  // Récupérer l'utilisateur et sa company depuis la base de données
  const user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: { 
      company: {
        select: {
          id: true,
          companyName: true,
          companyEmail: true,
          logo: true,
          phone: true,
          address: true,
          currency: true,
          language: true,
        }
      } 
    }
  });

  if (!user?.company) return null;

  // Récupérer les statistiques
  const stats = await getDashboardStats(user.company.id);

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
      badge: stats?.invoiceCount,
    },
    {
      title: "Clients",
      url: "/clients",
      icon: Users,
      badge: stats?.clientCount,
    },
    {
      title: "Produits",
      url: "/products",
      icon: Package,
      badge: stats?.productCount,
    },
    {
      title: "Paiements",
      url: "/payments",
      icon: CreditCard,
    },
    {
      title: "Rapports",
      url: "/reports",
      icon: BarChart3,
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
      title: "Aide & Support",
      url: "/help",
      icon: HelpCircle,
    },
  ];

  // Loading state
  // if (!isUserLoaded || isLoading) {
  //   return (
  //     <Sidebar collapsible="icon">
  //       {/* Header skeleton */}
  //       <SidebarHeader className="border-border/50">
  //         <div className="flex items-center gap-2 px-4 py-3">
  //           <Skeleton className="h-8 w-8 rounded-lg" />
  //           <Skeleton className="h-5 w-24" />
  //         </div>
  //       </SidebarHeader>
        
  //       <SidebarSeparator />
        
  //       <SidebarContent>
  //         {/* Menu principal skeleton */}
  //         <SidebarGroup>
  //           <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
  //             <Skeleton className="h-3 w-20" />
  //           </SidebarGroupLabel>
  //           <SidebarGroupContent>
  //             <div className="space-y-2 px-2">
  //               {[...Array(6)].map((_, i) => (
  //                 <div key={i} className="flex items-center gap-3 px-2 py-2">
  //                   <Skeleton className="h-4 w-4 rounded" />
  //                   <Skeleton className="h-4 flex-1" />
  //                 </div>
  //               ))}
  //             </div>
  //           </SidebarGroupContent>
  //         </SidebarGroup>

  //         {/* Actions rapides skeleton */}
  //         <SidebarGroup>
  //           <div className="flex items-center justify-between px-3 py-1">
  //             <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
  //               <Skeleton className="h-3 w-24" />
  //             </SidebarGroupLabel>
  //             <Skeleton className="h-3 w-3 rounded-full" />
  //           </div>
  //           <SidebarGroupContent>
  //             <div className="space-y-1 px-3 py-1">
  //               {[...Array(3)].map((_, i) => (
  //                 <div key={i} className="flex items-center gap-2 px-3 py-2">
  //                   <Skeleton className="h-4 w-4 rounded" />
  //                   <Skeleton className="h-4 w-32" />
  //                 </div>
  //               ))}
  //             </div>
  //           </SidebarGroupContent>
  //         </SidebarGroup>

  //         {/* Aperçu financier skeleton */}
  //         <SidebarGroup>
  //           <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
  //             <Skeleton className="h-3 w-24" />
  //           </SidebarGroupLabel>
  //           <SidebarGroupContent>
  //             <div className="space-y-3 px-3 py-2">
  //               {[...Array(3)].map((_, i) => (
  //                 <div key={i} className="flex items-center justify-between">
  //                   <Skeleton className="h-4 w-16" />
  //                   <Skeleton className="h-4 w-10" />
  //                 </div>
  //               ))}
  //             </div>
  //           </SidebarGroupContent>
  //         </SidebarGroup>

  //         {/* Menu secondaire skeleton */}
  //         <SidebarGroup>
  //           <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
  //             <Skeleton className="h-3 w-16" />
  //           </SidebarGroupLabel>
  //           <SidebarGroupContent>
  //             <div className="space-y-2 px-2">
  //               {[...Array(3)].map((_, i) => (
  //                 <div key={i} className="flex items-center gap-3 px-2 py-2">
  //                   <Skeleton className="h-4 w-4 rounded" />
  //                   <Skeleton className="h-4 flex-1" />
  //                 </div>
  //               ))}
  //             </div>
  //           </SidebarGroupContent>
  //         </SidebarGroup>
  //       </SidebarContent>

  //       {/* Footer skeleton */}
  //       <SidebarFooter className="border-t px-3 py-2">
  //         <div className="flex items-center gap-3">
  //           <Skeleton className="h-8 w-8 rounded-full" />
  //           <div className="flex-1 space-y-1">
  //             <Skeleton className="h-3 w-24" />
  //             <Skeleton className="h-3 w-16" />
  //           </div>
  //         </div>
  //       </SidebarFooter>
  //     </Sidebar>
  //   );
  // }


  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-border/50">
        <div className="flex items-center gap-2 px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center group-hover:from-primary/90 group-hover:to-primary/70 transition-colors">
              <FileSpreadsheet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground group-hover:text-foreground/80 transition-colors">
              OneBill
            </span>
          </Link>
        </div>
      </SidebarHeader>
      
      <SidebarSeparator />
      
      {/* Section entreprise avec bouton d'édition */}
     
      
      <SidebarContent>
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
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Actions rapides */}
        <SidebarGroup>
          <div className="flex items-center justify-between px-3 py-1">
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Actions rapides
            </SidebarGroupLabel>
            <SidebarGroupAction asChild>
              <Link 
                href="/invoices/new" 
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                <FileText className="h-3 w-3" />
                <span className="sr-only">Nouveau</span>
              </Link>
            </SidebarGroupAction>
          </div>
          <SidebarGroupContent>
            <div className="space-y-1 px-3 py-1">
              <Link 
                href="/invoices/new"
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <FileText className="h-4 w-4" />
                Nouvelle facture
              </Link>
              <Link 
                href="/clients/new"
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <Users className="h-4 w-4" />
                Nouveau client
              </Link>
              <Link 
                href="/products/new"
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
              >
                <Package className="h-4 w-4" />
                Nouveau produit
              </Link>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Aperçu financier */}
        {stats && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Aperçu financier
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-2 px-3 py-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">En attente</span>
                  <span className="font-semibold text-amber-600">
                    {stats.pendingInvoices} factures
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Clients</span>
                  <span className="font-semibold text-blue-600">
                    {stats.clientCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Produits</span>
                  <span className="font-semibold text-green-600">
                    {stats.productCount}
                  </span>
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

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
                    <Link href={item.url} className="flex items-center gap-3">
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

      {/* Footer utilisateur */}
      <SidebarFooter className="border-t px-3 py-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-2">
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8"
                  }
                }}
              />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">
                  {user.name || user.email?.split('@')[0] || "Utilisateur"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.company.companyName || "Entreprise"}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.name || "Utilisateur"}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/user-profile">
                <User2 className="h-4 w-4 mr-2" />
                Mon profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/company">
                <Building className="h-4 w-4 mr-2" />
                Mon entreprise
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                Paramètres
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <SignOutButton>
                <button className="flex items-center w-full">
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </button>
              </SignOutButton>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

