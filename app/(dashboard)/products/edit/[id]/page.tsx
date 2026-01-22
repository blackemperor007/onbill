// app/dashboard/products/edit/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Package, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
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
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formData, setFormData] = useState<Product>({
    id: "",
    name: "",
    description: "",
    price: 0,
    createdAt: "",
    updatedAt: "",
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/products/${productId}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setFormData(data.data);
        } else {
          toast.error(data.error || "Produit non trouvé");
          router.push("/products");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Erreur de connexion");
        router.push("/products");
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description?.trim() || null,
          price: formData.price,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Produit mis à jour avec succès");
        router.push("/products");
        router.refresh();
      } else {
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Erreur de connexion");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Produit supprimé avec succès");
        router.push("/products");
        router.refresh();
      } else {
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Erreur de connexion");
    } finally {
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-9 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Modifier le produit</h1>
            <p className="text-muted-foreground mt-1">
              Modifiez les informations du produit
            </p>
          </div>
        </div>
        
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
              <AlertDialogDescription>
                Êtes-vous sûr de vouloir supprimer le produit "{formData.name}" ? 
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du produit</CardTitle>
          <CardDescription>
            Modifiez les informations du produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            {/* Nom du produit */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Nom du produit <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Formation React"
                required
                disabled={isSaving}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ""}
                onChange={handleChange}
                placeholder="Description détaillée du produit..."
                rows={4}
                disabled={isSaving}
              />
            </div>

            {/* Prix */}
            <div className="space-y-2">
              <Label htmlFor="price">
                Prix <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                  disabled={isSaving}
                  className="pl-8"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-muted-foreground">€</span>
                </div>
              </div>
            </div>

            {/* Informations système */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Date de création</Label>
                <p className="text-sm">
                  {new Date(formData.createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-muted-foreground">Dernière modification</Label>
                <p className="text-sm">
                  {new Date(formData.updatedAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSaving}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-2">
                {isSaving ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Sauvegarder les modifications
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}