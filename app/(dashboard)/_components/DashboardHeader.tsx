"use client";

import { Search, Bell, Settings, Moon, Sun, Building2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Skeleton } from "@/components/ui/skeleton";

interface Company {
  id: string;
  companyName: string;
  companyEmail?: string | null;
  logo?: string | null;
}

const DashboardHeader = () => {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [pageTitle, setPageTitle] = useState("Tableau de bord");
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);
  const [notification, setNotifications] = useState([]);
  const notifications = [
    { id: 1, title: "Nouveau client", message: "John Doe a été ajouté", time: "10 min" },
    { id: 2, title: "Facture impayée", message: "Facture #INV-001 en retard", time: "1h" },
    { id: 3, title: "Paiement reçu", message: "Paiement de 500€ reçu", time: "2h" },
  ];
  // Récupérer la company de l'utilisateur
  useEffect(() => {
    const fetchCompany = async () => {
      if (!isUserLoaded || !user) {
        setIsLoadingCompany(false);
        return;
      }

      try {
        setIsLoadingCompany(true);
        const response = await fetch('/api/company/current');
        
        if (response.ok) {
          const data = await response.json();
          setCompany(data.company);
        } else {
          console.error("Erreur lors de la récupération de la company");
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setIsLoadingCompany(false);
      }
    };

    fetchCompany();
  }, [isUserLoaded, user]);
  // Définir le titre de la page dynamiquement
  useEffect(() => {
    const getPageTitle = () => {
      if (pathname === "/dashboard") return "Tableau de bord";
      if (pathname.startsWith("/invoices")) return "Factures";
      if (pathname.startsWith("/clients")) return "Clients";
      if (pathname.startsWith("/products")) return "Produits";
      if (pathname.startsWith("/payments")) return "Paiements";
      if (pathname.startsWith("/settings")) return "Paramètres";
      if (pathname.startsWith("/notifications")) return "Notifications";
      if (pathname.startsWith("/help")) return "Aide";
      if (pathname.startsWith("/reports")) return "Rapports";
      if (pathname.startsWith("/team")) return "Équipe";
      if (pathname.startsWith("/calendar")) return "Calendrier";
      
      const pathSegments = pathname.split('/');
      if (pathSegments.length > 2) {
        const resource = pathSegments[1];
        const id = pathSegments[2];
        
        switch(resource) {
          case "invoices":
            return `Facture #${id}`;
          case "clients":
            return `Client ${id}`;
          case "products":
            return `Produit ${id}`;
          default:
            return "Tableau de bord";
        }
      }
      
      return "Tableau de bord";
    };

    setPageTitle(getPageTitle());
  }, [pathname]);

  // Récupérer les notifications
//   useEffect(() => {
//     const fetchNotifications = async () => {
//       if (!company?.id) return;
      
//       try {
//         const response = await fetch(`/api/notifications?companyId=${company.id}`);
//         if (response.ok) {
//           const data = await response.json();
//           setNotifications(data.notifications || []);
//           setNotificationsCount(data.unreadCount || 0);
//         }
//       } catch (error) {
//         console.error("Erreur lors de la récupération des notifications:", error);
//       }
//     };

//     fetchNotifications();
//   }, [company?.id]);

  // Gérer la recherche
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}${company?.id ? `&companyId=${company.id}` : ''}`);
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    if (!company?.id) return;
    
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: company.id })
      });
      setNotificationsCount(0);
    } catch (error) {
      console.error("Erreur lors du marquage des notifications:", error);
    }
  };

  // Loading state
  if (!isUserLoaded || isLoadingCompany) {
    return (
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-1 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>  
        </div>
        <div className="flex-1 max-w-3xl mx-4">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </nav>
    );
  }

  // Données de la company avec fallback
  const companyName = company?.companyName || "Ma Compagnie";
  const companyEmail = company?.companyEmail || user?.emailAddresses[0]?.emailAddress || "";
  const companyLogo = company?.logo;

  return (
    <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      {/* Partie gauche - Titre de la page */}
      <div className="flex items-center gap-4">
        <div className="hidden md:block">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 rounded-full bg-primary" />
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
          </div>
        </div>  
      </div>

      {/* Partie centrale - Barre de recherche */}
      <div className="flex-1 max-w-3xl mx-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={`Rechercher factures, clients, produits...`}
            className="pl-10 pr-4 py-2 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Partie droite - Informations de la company */}
      <div className="flex items-center gap-2">
        {/* Bouton thème */}
        <ModeToggle/>

        {/* Bouton notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
              <Bell className="h-5 w-5" />
              {notificationsCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  variant="destructive"
                >
                  {notificationsCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {notificationsCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-auto p-0 text-xs"
                  onClick={markAllAsRead}
                >
                  Tout marquer comme lu
                </Button>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem 
                  key={notification.id} 
                  className="flex flex-col items-start py-3 cursor-pointer hover:bg-accent"
                >
                  <div className="flex items-start justify-between w-full">
                    <span className="font-medium text-sm">{notification.title}</span>
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm text-muted-foreground">Aucune notification</p>
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="justify-center cursor-pointer">
              <Link href="/notifications" className="text-center w-full text-sm">
                Voir toutes les notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Bouton paramètres */}
        <Button variant="ghost" size="icon" className="h-9 w-9" asChild>
          <Link href={`/company/settings${company?.id ? `?id=${company.id}` : ''}`}>
            <Settings className="h-5 w-5" />
          </Link>
        </Button>

        {/* Séparateur */}
        <div className="h-6 w-px bg-border mx-1" />

        {/* Affichage de la Company - Remplace le menu utilisateur */}
        <Link 
          href={`/company/settings${company?.id ? `?id=${company.id}` : ''}`}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {/* Logo de la company */}
          <Avatar className="h-9 w-9 border">
            {companyLogo ? (
              <AvatarImage 
                src={companyLogo} 
                alt={companyName}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </AvatarFallback>
          </Avatar>
          
          {/* Nom et email de la company (sur desktop) */}
          <div className="hidden md:flex flex-col text-left">
            <span className="text-sm font-semibold leading-none">
              {companyName}
            </span>
            {companyEmail && (
              <span className="text-xs text-muted-foreground leading-none">
                {companyEmail}
              </span>
            )}
          </div>
        </Link>
      </div>
    </nav>
  );
};

export default DashboardHeader;