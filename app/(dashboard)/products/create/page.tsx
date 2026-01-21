'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Package, 
  Euro, 
  Save,
  Loader2,
  AlertCircle,
  Building
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function CreateProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "0",
  });
  const [userCompany, setUserCompany] = useState<{id: string, companyName: string | null} | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Charger la company de l'utilisateur au montage
  useEffect(() => {
    const fetchUserCompany = async () => {
      try {
        setLoadingCompany(true);
        const response = await fetch("/api/companies/user");
        if (response.ok) {
          const data = await response.json();
          // L'API retourne un tableau, on prend la première company
          if (Array.isArray(data) && data.length > 0) {
            setUserCompany(data[0]);
          } else {
            toast.error("Vous devez d'abord créer une société");
            setTimeout(() => {
              router.push("/settings/company");
            }, 2000);
          }
        } else {
          throw new Error("Erreur lors du chargement de la société");
        }
      } catch (error) {
        console.error("Error fetching user company:", error);
        toast.error("Impossible de charger votre société");
      } finally {
        setLoadingCompany(false);
      }
    };

    fetchUserCompany();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Valider le nom (obligatoire)
    if (!formData.name.trim()) {
      newErrors.name = "Le nom du produit est obligatoire";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères";
    }

    // Valider le prix (obligatoire et doit être un nombre positif)
    const price = parseFloat(formData.price);
    if (!formData.price.trim()) {
      newErrors.price = "Le prix est obligatoire";
    } else if (isNaN(price)) {
      newErrors.price = "Le prix doit être un nombre valide";
    } else if (price < 0) {
      newErrors.price = "Le prix ne peut pas être négatif";
    } else if (price > 1000000) {
      newErrors.price = "Le prix est trop élevé";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    // Vérifier que l'utilisateur a une company
    if (!userCompany) {
      toast.error("Vous devez avoir une société pour créer un produit");
      return;
    }

    const promise = new Promise(async (resolve, reject) => {
      try {
        setIsSubmitting(true);
        
        // Préparer les données selon le schéma
        const cleanData = {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price),
          companyId: userCompany.id, // Automatiquement associé à la company de l'utilisateur
        };
        
        const response = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cleanData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Erreur lors de la création du produit");
        }

        // Rediriger après succès
        setTimeout(() => {
          router.push("/products");
          router.refresh(); // Rafraîchir la navigation
        }, 1500);

        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        setIsSubmitting(false);
      }
    });

    toast.promise(promise, {
      loading: 'Création du produit en cours...',
      success: (result: any) => {
        return `${formData.name} a été créé avec succès !`;
      },
      error: (error) => {
        return error instanceof Error ? error.message : "Une erreur est survenue";
      },
    });
  };

  const formatPrice = (price: string) => {
    const num = parseFloat(price);
    if (isNaN(num)) return "0,00 €";
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(num);
  };

  // Vérifier s'il y a des modifications non sauvegardées
  const hasUnsavedChanges = () => {
    return Object.values(formData).some(value => 
      value !== "" && value !== "0"
    );
  };

  // Si l'utilisateur n'a pas de company, afficher un message
  if (!userCompany && !loadingCompany) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nouveau produit</h1>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Société manquante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>Vous devez d'abord créer une société pour pouvoir ajouter des produits.</p>
              <p>Vous allez être redirigé vers la page de création de société...</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => router.push("/settings/company")}
              className="gap-2"
            >
              <Building className="h-4 w-4" />
              Créer une société
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (hasUnsavedChanges()) {
              if (confirm("Vos modifications seront perdues. Continuer ?")) {
                router.back();
              }
            } else {
              router.back();
            }
          }}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Retour</span>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nouveau produit</h1>
          <p className="text-muted-foreground mt-1">
            Ajoutez un nouveau produit à votre catalogue
          </p>
        </div>
      </div>

      {loadingCompany ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Chargement de votre société...</span>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6">
            {/* Carte principale - Informations du produit */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle>Informations du produit</CardTitle>
                  </div>
                  {userCompany && (
                    <Badge variant="outline" className="gap-1">
                      <Building className="h-3 w-3" />
                      {userCompany.companyName || "Votre société"}
                    </Badge>
                  )}
                </div>
                <CardDescription>
                  Renseignez les informations de votre nouveau produit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Société (affichage seulement) */}
                {userCompany && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Société associée
                    </Label>
                    <div className="h-11 flex items-center px-3 rounded-md border bg-muted/50">
                      <span className="font-medium">
                        {userCompany.companyName || "Votre société"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ce produit sera automatiquement associé à votre société
                    </p>
                  </div>
                )}

                {/* Nom - Champ obligatoire */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Nom du produit *
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Développement web, Maintenance, Consultation..."
                    value={formData.name}
                    onChange={handleChange}
                    className="h-11"
                    required
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.name}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Nom descriptif de votre produit ou service (obligatoire)
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Description détaillée du produit ou service..."
                    value={formData.description}
                    onChange={handleChange}
                    className="min-h-[120px] resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    Description complète du produit (optionnel)
                  </p>
                </div>

                {/* Prix - Champ obligatoire */}
                <div className="space-y-2">
                  <Label htmlFor="price" className="flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Prix HT *
                  </Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={handleChange}
                      className="h-11 pl-10"
                      required
                    />
                  </div>
                  {errors.price && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.price}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Prix hors taxes pour ce produit (obligatoire)
                    </p>
                    <p className="text-sm font-medium">
                      {formatPrice(formData.price)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Affichage des erreurs générales */}
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Veuillez corriger les erreurs dans le formulaire avant de soumettre.
              </AlertDescription>
            </Alert>
          )}

          {/* Footer avec actions */}
          <Card className="border-t">
            <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                <p>Les champs marqués d'un * sont obligatoires.</p>
                <p>Seul le nom et le prix sont obligatoires, la description est facultative.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (hasUnsavedChanges()) {
                      if (confirm("Vos modifications seront perdues. Continuer ?")) {
                        router.back();
                      }
                    } else {
                      router.back();
                    }
                  }}
                  disabled={isSubmitting}
                  className="min-w-[120px]"
                >
                  Annuler
                </Button>
                
                <Button
                  type="submit"
                  disabled={isSubmitting || !userCompany || loadingCompany}
                  className="min-w-[120px] gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
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
            </CardFooter>
          </Card>
        </form>
      )}

      {/* Aperçu en temps réel */}
      {!loadingCompany && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Aperçu</CardTitle>
            <CardDescription>
              Comment apparaîtra votre produit dans la liste
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4 p-4 border rounded-lg bg-muted/50">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-lg truncate">
                      {formData.name || "Nom du produit"}
                    </h3>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                      <Building className="h-3 w-3" />
                      {userCompany?.companyName || "Votre société"}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-primary whitespace-nowrap">
                    {formatPrice(formData.price)}
                  </div>
                </div>
                
                {formData.description && (
                  <p className="text-sm text-foreground/80 mt-3 line-clamp-2">
                    {formData.description}
                  </p>
                )}
                
                {!formData.description && (
                  <p className="text-sm text-muted-foreground italic mt-3">
                    Aucune description
                  </p>
                )}
              </div>
            </div>
            
            {/* Résumé */}
            <div className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-muted-foreground">Champs requis remplis:</p>
                  <p className="font-medium">
                    {[
                      formData.name.trim(),
                      parseFloat(formData.price) > 0
                    ].filter(Boolean).length}/2
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">Description:</p>
                  <p className="font-medium">
                    {formData.description.length > 0 ? "Oui" : "Non"}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}