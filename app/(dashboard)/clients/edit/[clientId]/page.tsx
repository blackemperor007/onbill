// app/dashboard/clients/edit/[clientId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin,
  Save,
  Loader2,
  AlertCircle,
  Calendar,
  FileText,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function EditClientPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [clientStats, setClientStats] = useState({
    totalInvoices: 0,
    totalPayments: 0,
    createdAt: "",
    lastInvoice: "",
  });

  useEffect(() => {
    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  const fetchClientData = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/clients/${clientId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        const client = data.data;
        
        setFormData({
          name: client.name || "",
          email: client.email || "",
          phone: client.phone || "",
          address: client.address || "",
        });

        setClientStats({
          totalInvoices: client._count?.invoices || 0,
          totalPayments: client._count?.payments || 0,
          createdAt: client.createdAt,
          lastInvoice: client.lastInvoiceDate || client.createdAt,
        });
      } else {
        toast.error(data.error || "Erreur lors du chargement du client");
        router.push("/clients");
      }
    } catch (error) {
      console.error("Error fetching client:", error);
      toast.error("Erreur de connexion au serveur");
      router.push("/clients");
    } finally {
      setIsLoading(false);
    }
  };

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
        
        // Préparer les données
        const updateData = {
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          address: formData.address.trim() || null,
        };
        
        const response = await fetch(`/api/clients/${clientId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Erreur lors de la mise à jour du client");
        }

        // Rediriger après succès
        setTimeout(() => {
          router.push("/clients");
          router.refresh();
        }, 1500);

        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        setIsSubmitting(false);
      }
    });

    toast.promise(promise, {
      loading: 'Mise à jour du client en cours...',
      success: (result: any) => {
        return `${formData.name} a été mis à jour avec succès !`;
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

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: fr });
    } catch {
      return "Date inconnue";
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-9 w-9 rounded-md" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-14 w-full" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Retour</span>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modifier le client</h1>
          <p className="text-muted-foreground mt-1">
            Modifiez les informations de {formData.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Formulaire de modification */}
        <form onSubmit={handleSubmit} className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Informations du client</CardTitle>
              </div>
              <CardDescription>
                Modifiez les informations de votre client
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
                    Pour l'envoi des factures
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
                    Numéro de contact
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
                  Adresse postale du client
                </p>
              </div>
            </CardContent>
          </Card>

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
                <p>Les modifications seront immédiatement appliquées.</p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (confirm("Vos modifications seront perdues. Continuer ?")) {
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
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>

        {/* Sidebar avec informations */}
        <div className="space-y-6">
          {/* Aperçu */}
          <Card>
            <CardHeader>
              <CardTitle>Aperçu</CardTitle>
              <CardDescription>
                Comment apparaîtra votre client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/50">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-lg">
                    {getInitials()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-lg">
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
              <CardDescription>
                Activité du client
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Factures</span>
                  </div>
                  <Badge variant="outline" className="text-lg">
                    {clientStats.totalInvoices}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">Paiements</span>
                  </div>
                  <Badge variant="outline" className="text-lg">
                    {clientStats.totalPayments}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Client depuis</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(clientStats.createdAt)}
                    </p>
                  </div>
                </div>

                {clientStats.totalInvoices > 0 && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Dernière facture</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(clientStats.lastInvoice)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => router.push(`/invoices/create?clientId=${clientId}`)}
              >
                <FileText className="h-4 w-4" />
                Créer une facture
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={() => router.push(`/clients/${clientId}`)}
              >
                <Eye className="h-4 w-4" />
                Voir les détails
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}