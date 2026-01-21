// app/dashboard/clients/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Save,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CreateClientPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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

    // Valider le nom (obligatoire selon le schéma)
    if (!formData.name.trim()) {
      newErrors.name = "Le nom du client est obligatoire";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Le nom doit contenir au moins 2 caractères";
    }

    // Valider l'email (optionnel mais doit être valide si fourni)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Veuillez entrer une adresse email valide";
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

    const promise = new Promise(async (resolve, reject) => {
      try {
        setIsSubmitting(true);
        
        // Préparer les données selon le schéma
        const cleanData = {
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
        };
        
        const response = await fetch("/api/clients", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cleanData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Erreur lors de la création du client");
        }

        // Rediriger après succès
        setTimeout(() => {
          router.push("/clients");
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
      loading: 'Création du client en cours...',
      success: (result: any) => {
        return `${formData.name} a été créé avec succès !`;
      },
      error: (error) => {
        return error instanceof Error ? error.message : "Une erreur est survenue";
      },
    });
  };

  const getInitials = () => {
    if (!formData.name) return "?";
    return formData.name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            if (Object.values(formData).some(value => value !== "")) {
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
          <h1 className="text-3xl font-bold tracking-tight">Nouveau client</h1>
          <p className="text-muted-foreground mt-1">
            Ajoutez un nouveau client à votre base de données
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6">
          {/* Carte principale - Informations du client */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Informations du client</CardTitle>
              </div>
              <CardDescription>
                Renseignez les informations de votre nouveau client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Nom - Champ obligatoire */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nom complet *
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="John Doe"
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
                  Nom complet du client (obligatoire)
                </p>
              </div>

              {/* Email et Téléphone */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Adresse email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="client@exemple.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="h-11"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Pour l'envoi des factures (optionnel)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Téléphone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+33 1 23 45 67 89"
                    value={formData.phone}
                    onChange={handleChange}
                    className="h-11"
                  />
                  <p className="text-sm text-muted-foreground">
                    Numéro de contact (optionnel)
                  </p>
                </div>
              </div>

              {/* Adresse */}
              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adresse
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="123 Rue de l'Exemple, 75001 Paris, France"
                  value={formData.address}
                  onChange={handleChange}
                  className="min-h-[120px] resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  Adresse postale du client (optionnel)
                </p>
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
              <p>Seul le nom est obligatoire, les autres champs sont facultatifs.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (Object.values(formData).some(value => value !== "")) {
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
                disabled={isSubmitting}
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
                    Créer le client
                  </>
                )}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>

      {/* Aperçu en temps réel */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Aperçu</CardTitle>
          <CardDescription>
            Comment apparaîtra votre client dans la liste
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-semibold">
                {getInitials()}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="font-medium">
                {formData.name || "Nom du client"}
              </h3>
              {formData.email && (
                <p className="text-sm text-muted-foreground">
                  📧 {formData.email}
                </p>
              )}
              {formData.phone && (
                <p className="text-sm text-muted-foreground">
                  📞 {formData.phone}
                </p>
              )}
              {formData.address && (
                <p className="text-sm text-muted-foreground truncate">
                  📍 {formData.address}
                </p>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Aujourd'hui
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}