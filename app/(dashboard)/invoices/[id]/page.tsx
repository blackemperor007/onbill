'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  Mail, 
  FileText, 
  Building, 
  User, 
  MapPin, 
  Phone, 
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Euro,
  FileEdit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

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
  createdAt: string;
  updatedAt: string;
  
  company: {
    id: string;
    companyName: string | null;
    companyEmail: string | null;
    address: string | null;
    phone: string | null;
    logo: string | null;
    currency: string;
  };
  
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    subtotal: number;
    taxAmount: number;
    total: number;
    product?: {
      id: string;
      name: string;
    };
  }>;
  
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    reference: string | null;
  }>;
}

export default function InvoiceDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const invoiceId = params.id as string;

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoiceId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Facture non trouvée');
      }
      
      const data: Invoice = await response.json();
      setInvoice(data);
    } catch (error) {
      console.error('Error fetching invoice:', error);
      toast.error(error instanceof Error ? error.message : 'Impossible de charger la facture');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setGeneratingPDF(true);
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (!response.ok) {
        throw new Error('Erreur lors de la génération du PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `facture-${invoice?.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('PDF téléchargé avec succès');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    if (!invoice?.client.email) {
      toast.error('Le client n\'a pas d\'email enregistré');
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: invoice.client.email }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi');
      }

      toast.success('Facture envoyée par email');
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: invoice?.company.currency || 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      PENDING: { variant: 'secondary', label: 'En attente' },
      PAID: { variant: 'default', label: 'Payée' },
      OVERDUE: { variant: 'destructive', label: 'En retard' },
      CANCELLED: { variant: 'outline', label: 'Annulée' },
      DRAFT: { variant: 'outline', label: 'Brouillon' },
    };
    
    return statusConfig[status] || { variant: 'outline', label: status };
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-9 w-9" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        
        <div className="grid gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Facture non trouvée</h1>
            <p className="text-muted-foreground mt-1">
              La facture demandée n'existe pas ou a été supprimée
            </p>
          </div>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Facture introuvable</h3>
            <p className="text-muted-foreground mb-6 text-center">
              La facture que vous cherchez n'existe pas ou vous n'y avez pas accès
            </p>
            <Button onClick={() => router.push('/invoices')}>
              Retour aux factures
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusBadge = getStatusBadge(invoice.status);
  const isPaid = invoice.status === 'PAID';
  const isOverdue = invoice.status === 'OVERDUE';

  return (
    <div className="container mx-auto py-6 px-4 max-w-6xl">
      {/* Header avec navigation et actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Facture #{invoice.invoiceNumber}</h1>
              <Badge variant={statusBadge.variant}>
                {statusBadge.label}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              Émise le {formatDate(invoice.issueDate)} • Échéance le {formatDate(invoice.dueDate)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/invoices/edit/${invoice.id}`)}
            className="gap-2"
          >
            <FileEdit className="h-4 w-4" />
            Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={generatingPDF}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            PDF
          </Button>
          {invoice.client.email && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendEmail}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Envoyer
            </Button>
          )}
        </div>
      </div>

      {/* En-tête de facture style "document" */}
      <Card className="mb-6 border-2">
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            {/* Logo et informations de l'entreprise */}
            <div className="mb-6 md:mb-0">
              {invoice.company.logo ? (
                <div className="mb-4">
                  <img 
                    src={invoice.company.logo} 
                    alt={invoice.company.companyName || 'Logo'} 
                    className="h-12 object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-4">
                  <Building className="h-8 w-8 text-primary" />
                  <h2 className="text-2xl font-bold">
                    {invoice.company.companyName || 'Votre entreprise'}
                  </h2>
                </div>
              )}
              
              <div className="space-y-1 text-sm">
                {invoice.company.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" />
                    <span>{invoice.company.address}</span>
                  </div>
                )}
                {invoice.company.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span>{invoice.company.phone}</span>
                  </div>
                )}
                {invoice.company.companyEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span>{invoice.company.companyEmail}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Numéro et dates de facture */}
            <div className="text-right">
              <div className="text-3xl font-bold mb-2">FACTURE</div>
              <div className="text-lg font-semibold mb-1">#{invoice.invoiceNumber}</div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center justify-end gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Date: {formatDate(invoice.issueDate)}</span>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>Échéance: {formatDate(invoice.dueDate)}</span>
                </div>
                {invoice.paidDate && (
                  <div className="flex items-center justify-end gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Payée le: {formatDate(invoice.paidDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Informations client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">FACTURÉ À</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-semibold text-lg">{invoice.client.name}</span>
                </div>
                {invoice.client.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 mt-1" />
                    <span className="text-sm">{invoice.client.address}</span>
                  </div>
                )}
                {invoice.client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span className="text-sm">{invoice.client.email}</span>
                  </div>
                )}
                {invoice.client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    <span className="text-sm">{invoice.client.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">DÉTAILS DE PAIEMENT</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Méthode: {invoice.paymentMethod}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  <span>Devise: {invoice.company.currency}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Statut: {statusBadge.label}
                </div>
              </div>
            </div>
          </div>

          {/* Tableau des articles */}
          <div className="mb-8">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Description</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead className="text-right">Prix unitaire</TableHead>
                  <TableHead className="text-right">TVA</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.description}</div>
                        {item.product && (
                          <div className="text-sm text-muted-foreground">
                            Produit: {item.product.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right">{item.taxRate}%</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Résumé et total */}
          <div className="flex justify-end">
            <div className="w-full max-w-md space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">TVA:</span>
                <span>{formatCurrency(invoice.taxAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              
              {/* Paiements */}
              {invoice.amountPaid > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payé:</span>
                      <span className="text-green-600">{formatCurrency(invoice.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Reste à payer:</span>
                      <span className={isPaid ? 'text-green-600' : isOverdue ? 'text-red-600' : ''}>
                        {formatCurrency(invoice.amountDue)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes et conditions */}
          {(invoice.notes || invoice.terms) && (
            <>
              <Separator className="my-6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {invoice.notes && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">NOTES</h4>
                    <p className="text-sm whitespace-pre-line">{invoice.notes}</p>
                  </div>
                )}
                {invoice.terms && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">CONDITIONS</h4>
                    <p className="text-sm whitespace-pre-line">{invoice.terms}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Section Paiements */}
      {invoice.payments.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Historique des paiements</CardTitle>
            <CardDescription>
              {invoice.payments.length} paiement{invoice.payments.length > 1 ? 's' : ''} effectué{invoice.payments.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invoice.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span className="text-sm font-medium">
                        {formatDate(payment.paymentDate)}
                      </span>
                      <Badge variant="outline">{payment.paymentMethod}</Badge>
                    </div>
                    {payment.reference && (
                      <div className="text-sm text-muted-foreground">
                        Réf: {payment.reference}
                      </div>
                    )}
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    +{formatCurrency(payment.amount)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions rapides */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-wrap gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => router.push(`/clients/${invoice.client.id}`)}
              className="gap-2"
            >
              <User className="h-4 w-4" />
              Voir le client
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/invoices/create?clientId=${invoice.client.id}`)}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Nouvelle facture pour ce client
            </Button>
            {!isPaid && (
              <Button
                variant="default"
                onClick={() => router.push(`/payments/create?invoiceId=${invoice.id}`)}
                className="gap-2"
              >
                <CreditCard className="h-4 w-4" />
                Enregistrer un paiement
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Styles d'impression */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #invoice-details,
          #invoice-details * {
            visibility: visible;
          }
          #invoice-details {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}