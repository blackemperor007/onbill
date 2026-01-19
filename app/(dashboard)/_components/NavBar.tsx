"use client";

import { Search, Bell, Settings, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "next-themes";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserButton, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [pageTitle, setPageTitle] = useState("Tableau de bord");
  const [notificationsCount, setNotificationsCount] = useState(3); // Exemple

  // Définir le titre de la page en fonction du chemin
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
      return "Tableau de bord";
    };

    setPageTitle(getPageTitle());
  }, [pathname]);

  // Gérer la recherche
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Rediriger vers la page de recherche ou filtrer les données
      console.log("Recherche:", searchQuery);
      // router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Notifications à afficher
  const notifications = [
    { id: 1, title: "Nouveau client", message: "John Doe a été ajouté", time: "10 min" },
    { id: 2, title: "Facture impayée", message: "Facture #INV-001 en retard", time: "1h" },
    { id: 3, title: "Paiement reçu", message: "Paiement de 500€ reçu", time: "2h" },
  ];

  return (
    <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      {/* Partie gauche */}
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        
        {/* Titre de la page */}
        <div className="hidden md:flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-primary" />
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
        </div>
      </div>

      {/* Partie centrale - Barre de recherche */}
      <div className="flex-1 max-w-2xl mx-4">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Rechercher factures, clients, produits..."
            className="pl-10 pr-4 py-2 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Partie droite */}
      <div className="flex items-center gap-3">
        {/* Bouton thème */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Changer de thème</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Clair
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Sombre
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              Système
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

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
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                Tout marquer comme lu
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="flex flex-col items-start py-3 cursor-pointer">
                <div className="flex items-start justify-between w-full">
                  <span className="font-medium">{notification.title}</span>
                  <span className="text-xs text-muted-foreground">{notification.time}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
              </DropdownMenuItem>
            ))}
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
          <Link href="/settings">
            <Settings className="h-5 w-5" />
          </Link>
        </Button>

        {/* Séparateur */}
        <div className="h-6 w-px bg-border mx-1" />

        {/* UserButton de Clerk */}
        {user ? (
          <div className="flex items-center gap-3">
            {/* Affichage nom utilisateur sur desktop */}
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : user.username || "Utilisateur"
                }
              </p>
              <p className="text-xs text-muted-foreground">
                {user.primaryEmailAddress?.emailAddress || ""}
              </p>
            </div>
            
            {/* UserButton Clerk */}
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                }
              }}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;