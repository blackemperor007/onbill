"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Plus, 
  Minus, 
  Trash2, 
  Save,
  FileText,
  Calendar,
  DollarSign,
  Percent,
  Package,
  Loader2,
  AlertCircle,
  Eye,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  productId?: string;
  subtotal: number;
  taxAmount: number;
  total: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  paidDate: string | null;
  paymentMethod: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes: string | null;
  terms: string | null;
  clientId: string;
  client: Client;
  items: InvoiceItem[];
}

const TAX_RATES = [
  { label: "0%", value: 0 },
  { label: "5.5%", value: 5.5 },
  { label: "10%", value: 10 },
  { label: "20%", value: 20 },
];

const PAYMENT_METHODS = [
  { label: "Espèces", value: "CASH" },
  { label: "Carte bancaire", value: "CARD" },
  { label: "Virement", value: "TRANSFER" },
  { label: "Chèque", value: "CHECK" },
  { label: "PayPal", value: "PAYPAL" },
];

const STATUS_OPTIONS = [
  { label: "Brouillon", value: "DRAFT" },
  { label: "En attente", value: "PENDING" },
  { label: "Payée", value: "PAID" },
  { label: "En retard", value: "OVERDUE" },
  { label: "Annulée", value: "CANCELLED" },
];

export default function EditInvoicePage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const router = useRouter();
  
  // États pour gérer les params
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [isLoadingParams, setIsLoadingParams] = useState(true);
  
  // États pour les données
  const [products, setProducts] = useState<Product[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // États pour le formulaire
  const [status, setStatus] = useState("PENDING");
  const [issueDate, setIssueDate] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
  });
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  
  // États pour les items
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "temp-1",
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 20,
      subtotal: 0,
      taxAmount: 0,
      total: 0,
    }
  ]);
  
  // Calcul des totaux
  const [totals, setTotals] = useState({
    subtotal: 0,
    taxAmount: 0,
    total: 0,
    amountPaid: 0,
    amountDue: 0,
  });

  // 1. Résoudre la Promise params
  useEffect(() => {
    const resolveParams = async () => {
      try {
        const resolvedParams = await params;
        setInvoiceId(resolvedParams.invoiceId);
      } catch (error) {
        console.error("Error resolving params:", error);
        toast.error("Erreur lors du chargement des paramètres");
        router.push("/dashboard/invoices");
      } finally {
        setIsLoadingParams(false);
      }
    };

    resolveParams();
  }, [params, router]);

  // 2. Charger les données quand invoiceId est disponible
  useEffect(() => {
    if (!invoiceId) return;

    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        
        // Charger la facture
        const invoiceResponse = await fetch(`/api/invoices/${invoiceId}`);
        const invoiceData = await invoiceResponse.json();
        
        if (!invoiceData.success || !invoiceData.data) {
          toast.error("Facture non trouvée");
          router.push("/dashboard/invoices");
          return;
        }
        
        const loadedInvoice = invoiceData.data;
        setInvoice(loadedInvoice);
        
        // Initialiser les états avec les données de la facture
        setStatus(loadedInvoice.status);
        setIssueDate(new Date(loadedInvoice.issueDate));
        setDueDate(new Date(loadedInvoice.dueDate));
        setPaymentMethod(loadedInvoice.paymentMethod || "CASH");
        setNotes(loadedInvoice.notes || "");
        setTerms(loadedInvoice.terms || "");
        
        // Initialiser les items
        if (loadedInvoice.items && loadedInvoice.items.length > 0) {
          setItems(loadedInvoice.items);
        }
        
        // Initialiser les totaux
        setTotals({
          subtotal: loadedInvoice.subtotal,
          taxAmount: loadedInvoice.taxAmount,
          total: loadedInvoice.total,
          amountPaid: loadedInvoice.amountPaid,
          amountDue: loadedInvoice.amountDue,
        });
        
        // Charger les produits
        const productsResponse = await fetch('/api/products');
        const productsData = await productsResponse.json();
        if (productsData.success) {
          setProducts(productsData.data || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Erreur lors du chargement des données");
        router.push("/dashboard/invoices");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, [invoiceId, router]);

  // Mise à jour des totaux quand les items changent
  useEffect(() => {
    const newSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const newTaxAmount = items.reduce((sum, item) => sum + item.taxAmount, 0);
    const newTotal = items.reduce((sum, item) => sum + item.total, 0);

    setTotals(prev => ({
      ...prev,
      subtotal: newSubtotal,
      taxAmount: newTaxAmount,
      total: newTotal,
      amountDue: newTotal - prev.amountPaid,
    }));
  }, [items]);

  // Calcul des valeurs d'un item
  const calculateItemValues = (item: InvoiceItem) => {
    const subtotal = item.quantity * item.unitPrice;
    const taxAmount = subtotal * (item.taxRate / 100);
    const total = subtotal + taxAmount;

    return {
      ...item,
      subtotal: Number(subtotal.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      total: Number(total.toFixed(2)),
    };
  };

  // Gestion des changements d'item
  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          return calculateItemValues(updatedItem);
        }
        return item;
      })
    );
  };

  // Ajouter un produit depuis la liste
  const handleAddProduct = (product: Product) => {
    const newItem: InvoiceItem = {
      id: `temp-${Date.now()}`,
      description: product.name,
      quantity: 1,
      unitPrice: product.price,
      taxRate: 20,
      productId: product.id,
      subtotal: product.price,
      taxAmount: product.price * 0.2,
      total: product.price * 1.2,
    };

    setItems([...items, calculateItemValues(newItem)]);
    toast.success(`${product.name} ajouté à la facture`);
  };

  // Ajouter un item vide
  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `temp-${Date.now()}`,
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 20,
      subtotal: 0,
      taxAmount: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  // Supprimer un item
  const handleRemoveItem = (id: string) => {
    if (items.length === 1) {
      toast.error("Une facture doit avoir au moins un item");
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  // Formater la monnaie
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Obtenir le statut avec badge
  const getStatusBadge = (status: string) => {
    const config = {
      DRAFT: { label: "Brouillon", variant: "secondary" as const, icon: <FileText className="h-3 w-3" /> },
      PENDING: { label: "En attente", variant: "outline" as const, icon: <Clock className="h-3 w-3" /> },
      PAID: { label: "Payée", variant: "default" as const, icon: <CheckCircle className="h-3 w-3" /> },
      OVERDUE: { label: "En retard", variant: "destructive" as const, icon: <AlertCircle className="h-3 w-3" /> },
      CANCELLED: { label: "Annulée", variant: "secondary" as const, icon: <XCircle className="h-3 w-3" /> },
    };

    const statusConfig = config[status as keyof typeof config] || config.PENDING;
    
    return (
      <Badge variant={statusConfig.variant} className="gap-1">
        {statusConfig.icon}
        {statusConfig.label}
      </Badge>
    );
  };

  // Soumettre la modification
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceId) {
      toast.error("ID de facture manquant");
      return;
    }

    // Validation
    if (items.length === 0) {
      toast.error("Veuillez ajouter au moins un item");
      return;
    }

    if (items.some(item => !item.description || item.unitPrice <= 0)) {
      toast.error("Veuillez compléter tous les items de la facture");
      return;
    }

    const invoiceData = {
      status,
      issueDate: issueDate.toISOString(),
      dueDate: dueDate.toISOString(),
      paymentMethod,
      notes,
      terms,
      items: items.map(item => ({
        id: item.id.startsWith('temp-') ? undefined : item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        productId: item.productId,
      })),
      subtotal: totals.subtotal,
      taxAmount: totals.taxAmount,
      total: totals.total,
      amountDue: totals.amountDue,
    };

    const promise = new Promise(async (resolve, reject) => {
      try {
        setIsSubmitting(true);
        
        const response = await fetch(`/api/invoices/${invoiceId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(invoiceData),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Erreur lors de la modification de la facture");
        }

        // Rediriger après succès
        setTimeout(() => {
          router.push(`/dashboard/invoices/${invoiceId}`);
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
      loading: 'Modification de la facture en cours...',
      success: (result: any) => {
        return `Facture ${invoice?.invoiceNumber || ''} modifiée avec succès !`;
      },
      error: (error) => {
        return error instanceof Error ? error.message : "Une erreur est survenue";
      },
    });
  };

  // États de chargement
  const isLoading = isLoadingParams || isLoadingData;

//   if (isLoading) {
//     return (
//       <div className="p-6 max-w-6xl mx-auto">
//         <div className="flex items-center gap-4 mb-6">
//           <Skeleton className="h-9 w-9 rounded-md" />
//           <div>
//             <Skeleton className="h-8 w-64 mb-2" />
//             <Skeleton className="h-4 w-48" />
//           </div>
//         </div>
        
//         <div className="grid gap-6 md:grid-cols-3">
//           <Card className="md:col-span-2">
//             <CardHeader>
//               <Skeleton className="h-6 w-48" />
//               <Skeleton className="h-4 w-64" />
//             </CardHeader>
//             <CardContent className="space-y-6">
//               <Skeleton className="h-14 w-full" />
//               <div className="grid gap-4 md:grid-cols-2">
//                 <Skeleton className="h-14 w-full" />
//                 <Skeleton className="h-14 w-full" />
//               </div>
//               <Skeleton className="h-32 w-full" />
//             </CardContent>
//           </Card>
          
//           <Card>
//             <CardHeader>
//               <Skeleton className="h-6 w-32" />
//             </CardHeader>
//             <CardContent className="space-y-4">
//               <Skeleton className="h-20 w-full" />
//               <Skeleton className="h-20 w-full" />
//               <Skeleton className="h-20 w-full" />
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     );
//   }

  if (!invoice) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Facture non trouvée</h3>
          <p className="text-muted-foreground mb-6">
            La facture que vous essayez de modifier n'existe pas ou a été supprimée.
          </p>
          <Button onClick={() => router.push("/dashboard/invoices")}>
            Retour aux factures
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header avec bouton retour */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
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
            <h1 className="text-3xl font-bold tracking-tight">Modifier la facture</h1>
            <p className="text-muted-foreground mt-1">
              #{invoice.invoiceNumber} • {invoice.client.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(invoice.status)}
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/invoices/${invoiceId}`)}
            className="gap-2"
          >
            <Eye className="h-4 w-4" />
            Voir la facture
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-3">
          {/* Section gauche - Informations et items */}
          <div className="md:col-span-2 space-y-6">
            {/* Informations client (lecture seule) */}
            <Card>
              <CardHeader>
                <CardTitle>Informations client</CardTitle>
                <CardDescription>
                  Les informations client ne peuvent pas être modifiées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Client</div>
                      <div className="text-lg font-semibold">{invoice.client.name}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Email</div>
                        <div className="text-sm">{invoice.client.email || "Non renseigné"}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Téléphone</div>
                        <div className="text-sm">{invoice.client.phone || "Non renseigné"}</div>
                      </div>
                    </div>
                    {invoice.client.address && (
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Adresse</div>
                        <div className="text-sm">{invoice.client.address}</div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates et statut */}
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de la facture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Statut</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Mode de paiement</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Sélectionnez un mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map(method => (
                          <SelectItem key={method.value} value={method.value}>
                            {method.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date d'émission</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-11 justify-start text-left font-normal",
                            !issueDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {issueDate ? format(issueDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={issueDate}
                          onSelect={(date) => date && setIssueDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Date d'échéance</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full h-11 justify-start text-left font-normal",
                            !dueDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <CalendarComponent
                          mode="single"
                          selected={dueDate}
                          onSelect={(date) => date && setDueDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Items de la facture */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Articles et services</CardTitle>
                    <CardDescription>
                      Modifiez les articles et services facturés
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddItem}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter un article
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Liste des produits disponibles */}
                  {products.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-sm font-medium mb-2 block">Ajouter un produit existant</Label>
                      <div className="flex flex-wrap gap-2">
                        {products.slice(0, 5).map(product => (
                          <Button
                            key={product.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddProduct(product)}
                            className="gap-2"
                          >
                            <Plus className="h-3 w-3" />
                            {product.name} - {formatCurrency(product.price)}
                          </Button>
                        ))}
                        {products.length > 5 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push("/dashboard/products")}
                          >
                            Voir plus...
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Table des items */}
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div key={item.id} className="p-4 border rounded-lg bg-card">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Article #{index + 1}</span>
                            {item.id.startsWith('temp-') && (
                              <Badge variant="outline" className="text-xs">Nouveau</Badge>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveItem(item.id)}
                            className="h-8 w-8"
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-12">
                          <div className="md:col-span-6 space-y-2">
                            <Label>Description *</Label>
                            <Input
                              value={item.description}
                              onChange={(e) => handleItemChange(item.id, "description", e.target.value)}
                              placeholder="Description de l'article ou service"
                              className="h-9"
                            />
                          </div>

                          <div className="md:col-span-2 space-y-2">
                            <Label>Quantité</Label>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => handleItemChange(item.id, "quantity", Math.max(0.5, item.quantity - 0.5))}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                min="0.5"
                                step="0.5"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(item.id, "quantity", parseFloat(e.target.value) || 0)}
                                className="h-9 text-center"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-9 w-9"
                                onClick={() => handleItemChange(item.id, "quantity", item.quantity + 0.5)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="md:col-span-2 space-y-2">
                            <Label>Prix unitaire (€)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                              className="h-9"
                            />
                          </div>

                          <div className="md:col-span-2 space-y-2">
                            <Label>TVA</Label>
                            <Select
                              value={item.taxRate.toString()}
                              onValueChange={(value) => handleItemChange(item.id, "taxRate", parseFloat(value))}
                            >
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TAX_RATES.map(rate => (
                                  <SelectItem key={rate.value} value={rate.value.toString()}>
                                    {rate.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Sous-totaux de l'item */}
                        <div className="mt-3 pt-3 border-t flex items-center justify-end gap-6">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Sous-total:</span>
                            <span className="ml-2 font-medium">{formatCurrency(item.subtotal)}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">TVA:</span>
                            <span className="ml-2 font-medium">{formatCurrency(item.taxAmount)}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Total:</span>
                            <span className="ml-2 font-medium text-primary">{formatCurrency(item.total)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes et conditions */}
            <Card>
              <CardHeader>
                <CardTitle>Notes et conditions</CardTitle>
                <CardDescription>
                  Informations supplémentaires pour la facture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Notes (optionnel)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes internes ou informations supplémentaires..."
                    className="min-h-[100px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Conditions de paiement (optionnel)</Label>
                  <Textarea
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    placeholder="Ex: Paiement à 30 jours, pénalités de retard..."
                    className="min-h-[80px] resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section droite - Récapitulatif */}
          <div className="space-y-6">
            {/* Récapitulatif */}
            <Card>
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
                <CardDescription>
                  Détails de la facture
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">TVA totale</span>
                    <span className="font-medium">{formatCurrency(totals.taxAmount)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(totals.total)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Déjà payé</span>
                    <span className="font-medium">{formatCurrency(invoice.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Reste à payer</span>
                    <span className={`font-medium ${totals.amountDue > 0 ? "text-destructive" : "text-green-600"}`}>
                      {formatCurrency(totals.amountDue)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Numéro</span>
                    <span className="font-medium">#{invoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Client</span>
                    <span className="font-medium text-right">
                      {invoice.client.name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date d'émission</span>
                    <span className="font-medium">
                      {format(issueDate, "dd/MM/yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Échéance</span>
                    <span className="font-medium">
                      {format(dueDate, "dd/MM/yyyy")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comparaison avec l'original */}
            <Card>
              <CardHeader>
                <CardTitle>Comparaison</CardTitle>
                <CardDescription>
                  Différences avec la version originale
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium mb-1">Ancien total</div>
                    <div className="text-lg line-through text-muted-foreground">
                      {formatCurrency(invoice.total)}
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium mb-1">Nouveau total</div>
                    <div className="text-2xl font-bold text-primary">
                      {formatCurrency(totals.total)}
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm font-medium mb-1">Nombre d'articles</div>
                    <div className="text-lg font-bold">{items.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting || items.length === 0}
                    className="w-full gap-2"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Modification...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Enregistrer les modifications
                      </>
                    )}
                  </Button>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push(`/dashboard/invoices/${invoiceId}`)}
                      disabled={isSubmitting}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={async () => {
                        if (!invoiceId) return;
                        
                        if (confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
                          try {
                            const response = await fetch(`/api/invoices/${invoiceId}`, {
                              method: 'DELETE',
                            });
                            
                            if (response.ok) {
                              toast.success("Facture supprimée avec succès");
                              router.push("/dashboard/invoices");
                              router.refresh();
                            } else {
                              const data = await response.json();
                              toast.error(data.error || "Erreur lors de la suppression");
                            }
                          } catch (error) {
                            toast.error("Erreur lors de la suppression");
                          }
                        }
                      }}
                      disabled={isSubmitting}
                      className="flex-1 gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Supprimer
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground text-center">
                    <p>Modifiez les items, dates et statut de la facture.</p>
                    <p>Le client ne peut pas être modifié après création.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}