// app/dashboard/products/page.tsx
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
  Package,
  Euro,
  FileText,
  AlertCircle,
  Filter
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

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    invoiceItems: number;
  };
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      
      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setProducts(data.data || []);
      } else {
        toast.error(data.error || "Erreur lors du chargement des produits");
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Erreur de connexion au serveur");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch]);

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`/api/products/${productToDelete}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message || "Produit supprimé avec succès");
        fetchProducts();
      } else {
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Erreur de connexion");
    } finally {
      setProductToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) {
      toast.error("Aucun produit sélectionné");
      return;
    }

    try {
      toast.loading("Suppression en cours...");
      const response = await fetch("/api/products/bulk", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productIds: selectedProducts }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`${selectedProducts.length} produit(s) supprimé(s) avec succès`);
        setSelectedProducts([]);
        fetchProducts();
      } else {
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error bulk deleting products:", error);
      toast.error("Erreur de connexion");
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
  const ActionButtons = ({ productId, productName }: { productId: string, productName: string }) => {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/products/edit/${productId}`);
          }}
          title="Modifier"
          className="h-8 w-8"
        >
          <Edit className="h-4 w-4" />
        </Button>
        
        <AlertDialog open={showDeleteDialog && productToDelete === productId} onOpenChange={(open) => {
          if (!open) {
            setProductToDelete(null);
            setShowDeleteDialog(false);
          }
        }}>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setProductToDelete(productId);
                setShowDeleteDialog(true);
              }}
              title="Supprimer"
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le produit "{productName}" ? 
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setProductToDelete(null);
                setShowDeleteDialog(false);
              }}>
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteProduct}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Plus d'options</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/products/${productId}`)}>
              <Eye className="h-4 w-4 mr-2" />
              Voir les détails
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/products/edit/${productId}`)}>
              <Edit className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => {
                setProductToDelete(productId);
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

  const columns: ColumnDef<Product>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
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
          }}
          className="h-4 w-4 rounded border-gray-300"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: "Produit",
      cell: ({ row }) => {
        const product = row.original;
        const initials = getInitials(product.name);
        const usageCount = product._count?.invoiceItems || 0;

        return (
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => router.push(`/products/${product.id}`)}
          >
            <Avatar className="h-9 w-9 border">
              <AvatarFallback className="bg-blue-100 text-blue-600">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{product.name}</p>
              {product.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>
              )}
              {usageCount > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <FileText className="h-3 w-3 text-primary" />
                  <span className="text-xs text-primary">
                    Utilisé dans {usageCount} facture{usageCount > 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: "Prix",
      cell: ({ row }) => {
        const price = row.original.price;
        return (
          <div className="flex items-center gap-2">
            <Euro className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{price.toFixed(2)} €</span>
          </div>
        );
      },
    },
    {
      accessorKey: "usage",
      header: "Utilisation",
      cell: ({ row }) => {
        const usageCount = row.original._count?.invoiceItems || 0;
        return (
          <div className="text-center">
            <Badge variant={usageCount > 0 ? "default" : "secondary"} className="min-w-[70px]">
              {usageCount} fois
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
        const product = row.original;
        return (
          <ActionButtons productId={product.id} productName={product.name} />
        );
      },
    },
  ];

  // Skeleton loading
  if (isLoading && products.length === 0) {
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

  // Dialog pour la suppression en masse
  const BulkDeleteDialog = () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          disabled={selectedProducts.length === 0}
          className="gap-2"
        >
          <Trash2 className="h-4 w-4" />
          Supprimer ({selectedProducts.length})
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmer la suppression multiple</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir supprimer {selectedProducts.length} produit(s) sélectionné(s) ?
            Cette action est irréversible.
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
    <div className="p-6 space-y-6">
      {/* Header avec titre à gauche et bouton à droite */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produits</h1>
          <p className="text-muted-foreground mt-1">
            Gérez votre catalogue de produits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BulkDeleteDialog />
          <Button onClick={() => router.push("/products/create")} className="gap-2">
            <Plus className="h-4 w-4" />
            Nouveau produit
          </Button>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Produits</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">Tous vos produits</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Produits utilisés</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => (p._count?.invoiceItems || 0) > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Dans des factures</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prix moyen</CardTitle>
            <Euro className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.length > 0 
                ? (products.reduce((sum, p) => sum + p.price, 0) / products.length).toFixed(2) 
                : "0.00"} €
            </div>
            <p className="text-xs text-muted-foreground">Moyenne des prix</p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des produits */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Liste des produits</CardTitle>
              <CardDescription>
                {products.length} produit{products.length !== 1 ? "s" : ""} trouvé{products.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un produit..."
                className="pl-10 w-full md:w-[300px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <Package className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Aucun produit</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                {searchQuery 
                  ? "Aucun produit ne correspond à votre recherche" 
                  : "Commencez par ajouter votre premier produit"}
              </p>
              <Button onClick={() => router.push("/products/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un produit
              </Button>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={products}
              searchKey="name"
              searchPlaceholder="Rechercher par nom, description..."
              isLoading={isLoading}
              onRowClick={(row) => router.push(`/products/${row.id}`)}
              emptyState={
                <div className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun résultat</h3>
                  <p className="text-muted-foreground mb-4">
                    Aucun produit ne correspond à votre recherche
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
  );
}