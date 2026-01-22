// app/dashboard/clients/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  User,
  Mail,
  Phone,
  MapPin,
  FileText,
  Users,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { DataTable } from "@/components/ui/data-table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    invoices: number;
    payments: number;
  };
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      
      const response = await fetch(`/api/clients?${params.toString()}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setClients(data.data || []);
      } else {
        toast.error(data.error || "Erreur lors du chargement des clients");
        setClients([]);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
      toast.error("Erreur de connexion au serveur");
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [debouncedSearch]);

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/clients/${clientToDelete}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || "Client supprimé avec succès");
        // Retirer le client supprimé de la liste
        setClients(prev => prev.filter(client => client.id !== clientToDelete));
        // Réinitialiser la sélection si ce client était sélectionné
        setSelectedClients(prev => prev.filter(id => id !== clientToDelete));
      } else {
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting client:", error);
      toast.error("Erreur de connexion au serveur");
    } finally {
      setClientToDelete(null);
      setShowDeleteDialog(false);
      setIsDeleting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedClients.length === 0) {
      toast.error("Aucun client sélectionné");
      return;
    }

    try {
      const toastId = toast.loading("Suppression en cours...");
      
      const response = await fetch("/api/clients", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientIds: selectedClients }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`${selectedClients.length} client(s) supprimé(s) avec succès`, {
          id: toastId
        });
        // Retirer les clients supprimés de la liste
        setClients(prev => prev.filter(client => !selectedClients.includes(client.id)));
        setSelectedClients([]);
      } else {
        toast.error(data.error || "Erreur lors de la suppression", {
          id: toastId
        });
      }
    } catch (error) {
      console.error("Error bulk deleting clients:", error);
      toast.error("Erreur de connexion au serveur");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Colonne avec boutons d'action visibles
  const ActionButtons = ({ clientId, clientName }: { clientId: string, clientName: string }) => {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/clients/edit/${clientId}`);
          }}
          title="Modifier"
          className="h-8 w-8"
        >
          <Edit className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setClientToDelete(clientId);
            setShowDeleteDialog(true);
          }}
          title="Supprimer"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
              <span className="sr-only">Plus d'options</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={() => router.push(`/clients/${clientId}`)}>
              <Eye className="h-4 w-4 mr-2" />
              Voir les détails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/invoices/create?clientId=${clientId}`)}>
              <FileText className="h-4 w-4 mr-2" />
              Créer une facture
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {
                setClientToDelete(clientId);
                setShowDeleteDialog(true);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const columns: ColumnDef<Client>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => {
            table.toggleAllPageRowsSelected(!!e.target.checked);
            const allRowIds = table.getRowModel().rows.map(row => row.original.id);
            setSelectedClients(e.target.checked ? allRowIds : []);
          }}
          className="h-4 w-4 rounded border-gray-300"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => {
            e.stopPropagation();
            row.toggleSelected(!!e.target.checked);
            const clientId = row.original.id;
            setSelectedClients(prev => 
              e.target.checked 
                ? [...prev, clientId]
                : prev.filter(id => id !== clientId)
            );
          }}
          className="h-4 w-4 rounded border-gray-300"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Client",
      cell: ({ row }) => {
        const client = row.original;
        const initials = getInitials(client.name);
        const invoiceCount = client._count?.invoices || 0;

        return (
          <div 
            className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded transition-colors"
            onClick={() => router.push(`/clients/${client.id}`)}
          >
            <Avatar className="h-9 w-9 border">
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{client.name}</p>
              {client.email && (
                <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                  <Mail className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </p>
              )}
              {invoiceCount > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <FileText className="h-3 w-3 text-primary" />
                  <span className="text-xs text-primary">
                    {invoiceCount} facture{invoiceCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }) => {
        const client = row.original;
        return (
          <div className="space-y-1">
            {client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{client.phone}</span>
              </div>
            )}
            {client.address && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                <span className="text-muted-foreground line-clamp-2 truncate">
                  {client.address}
                </span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "invoices",
      header: "Factures",
      cell: ({ row }) => {
        const invoiceCount = row.original._count?.invoices || 0;
        return (
          <div className="text-center">
            <Badge variant={invoiceCount > 0 ? "default" : "secondary"} className="min-w-[60px]">
              {invoiceCount} facture{invoiceCount !== 1 ? "s" : ""}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date d'ajout",
      cell: ({ row }) => {
        try {
          return (
            <div className="text-sm text-muted-foreground">
              {format(new Date(row.original.createdAt), "dd/MM/yyyy")}
            </div>
          );
        } catch {
          return <div className="text-sm text-muted-foreground">-</div>;
        }
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const client = row.original;
        return (
          <ActionButtons clientId={client.id} clientName={client.name} />
        );
      },
    },
  ];

  // Skeleton loading
  if (isLoading && clients.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-64" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dialog pour la suppression d'un seul client
  const DeleteDialog = () => (
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
          <AlertDialogDescription>
            {clientToDelete && clients.find(c => c.id === clientToDelete)?._count?.invoices ? (
              <>
                Êtes-vous sûr de vouloir supprimer le client "{clients.find(c => c.id === clientToDelete)?.name}" ? 
                Cette action supprimera également toutes les factures associées à ce client.
              </>
            ) : (
              <>
                Êtes-vous sûr de vouloir supprimer le client "{clients.find(c => c.id === clientToDelete)?.name}" ? 
                Cette action est irréversible.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDeleteClient}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Suppression...
              </>
            ) : (
              "Supprimer"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Dialog pour la suppression en masse
  const BulkDeleteDialog = () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={selectedClients.length === 0}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer ({selectedClients.length})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression multiple</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer {selectedClients.length} client(s) sélectionné(s) ?
            Cette action est irréversible et supprimera également toutes les factures associées.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleBulkDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <>
      <DeleteDialog />
      
      <div className="p-6 space-y-6">
        {/* Header avec titre à gauche et bouton à droite */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground mt-1">
              Gérez votre liste de clients
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BulkDeleteDialog />
            <Button onClick={() => router.push("/clients/create")} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouveau client
            </Button>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
              <p className="text-xs text-muted-foreground">Tous vos clients</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avec factures</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.filter(c => (c._count?.invoices || 0) > 0).length}
              </div>
              <p className="text-xs text-muted-foreground">Clients actifs</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sans email</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.filter(c => !c.email).length}
              </div>
              <p className="text-xs text-muted-foreground">À compléter</p>
            </CardContent>
          </Card>
        </div>

        {/* Tableau des clients */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Liste des clients</CardTitle>
                <CardDescription>
                  {clients.length} client{clients.length !== 1 ? "s" : ""} trouvé{clients.length !== 1 ? "s" : ""}
                  {selectedClients.length > 0 && ` • ${selectedClients.length} sélectionné(s)`}
                </CardDescription>
              </div>
              <div className="relative w-full md:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client..."
                  className="pl-10 w-full md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {clients.length === 0 && !isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">Aucun client</h3>
                <p className="text-muted-foreground mt-1 mb-4">
                  {searchQuery 
                    ? "Aucun client ne correspond à votre recherche" 
                    : "Commencez par ajouter votre premier client"}
                </p>
                <Button onClick={() => router.push("/clients/create")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un client
                </Button>
              </div>
            ) : (
              <DataTable
                columns={columns}
                data={clients}
                searchKey="name"
                searchPlaceholder="Rechercher par nom, email..."
                isLoading={isLoading}
                onRowClick={(row) => router.push(`/clients/${row.id}`)}
                emptyState={
                  <div className="py-12 text-center">
                    <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Aucun résultat</h3>
                    <p className="text-muted-foreground mb-4">
                      Aucun client ne correspond à votre recherche
                    </p>
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                      Réinitialiser la recherche
                    </Button>
                  </div>
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}