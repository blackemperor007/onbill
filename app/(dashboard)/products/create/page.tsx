// app/dashboard/products/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function CreateProductPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "0",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price) || 0,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Produit créé avec succès");
        router.push("/products");
        router.refresh();
      } else {
        toast.error(data.error || "Erreur lors de la création du produit");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      toast.error("Erreur de connexion au serveur");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header avec bouton retour */}
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
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Nouveau produit</h1>
          <p className="text-muted-foreground mt-1">
            Ajoutez un nouveau produit à votre catalogue
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations du produit</CardTitle>
          <CardDescription>
            Remplissez les informations du produit
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
                disabled={isLoading}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Description détaillée du produit..."
                rows={4}
                disabled={isLoading}
              />
              <p className="text-sm text-muted-foreground">
                Optionnel - Décrivez votre produit pour faciliter son identification
              </p>
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
                  disabled={isLoading}
                  className="pl-8"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <span className="text-muted-foreground">€</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Prix unitaire du produit
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading} className="gap-2">
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Créer le produit
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Aperçu */}
      <Card>
        <CardHeader>
          <CardTitle>Aperçu du produit</CardTitle>
          <CardDescription>
            À quoi ressemblera votre produit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4 p-4 border rounded-lg">
            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold">
                {formData.name || "Nom du produit"}
              </h3>
              {formData.description && (
                <p className="text-sm text-muted-foreground">
                  {formData.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {parseFloat(formData.price || "0").toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}