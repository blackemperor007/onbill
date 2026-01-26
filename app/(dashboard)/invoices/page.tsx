"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  FileText,
  Download,
  Mail,
  Filter,
  Calendar,
  User,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  FilterX,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BarChart3,
  Printer,
  FileDown,
  RefreshCw,
  Loader2,
  Settings,
  SortAsc,
  SortDesc
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format, subDays, subMonths, isAfter, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  amountPaid: number;
  amountDue: number;
  paymentMethod: string;
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
}

interface InvoiceStats {
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  overdueCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [sortBy, setSortBy] = useState<string>("issueDate");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [clients, setClients] = useState<Array<{id: string, name: string}>>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [amountFrom, setAmountFrom] = useState<string>("");
  const [amountTo, setAmountTo] = useState<string>("");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder,
      });
      
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (dateFilter !== 'all') params.append('date', dateFilter);
      if (clientFilter !== 'all') params.append('clientId', clientFilter);
      
      const response = await fetch(`/api/invoices?${params.toString()}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setInvoices(data.data || []);
        setPagination(data.pagination || pagination);
        setStats(data.stats || null);
      } else {
        toast.error(data.error || "Erreur lors du chargement des factures");
        setInvoices([]);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("Erreur de connexion au serveur");
      setInvoices([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter, dateFilter, clientFilter, sortBy, sortOrder]);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients?limit=100');
      const data = await response.json();
      if (data.success) {
        setClients(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchClients();
  }, [fetchInvoices]);

  const getStatusBadge = (status: string) => {
    const variants = {
      "PAID": { 
        className: "bg-green-100 text-green-800 hover:bg-green-100 border-green-200",
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      "PENDING": { 
        className: "bg-amber-100 text-amber-800 hover:bg-amber-100 border-amber-200",
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      "OVERDUE": { 
        className: "bg-red-100 text-red-800 hover:bg-red-100 border-red-200",
        icon: <AlertCircle className="h-3 w-3 mr-1" />
      },
      "DRAFT": { 
        className: "bg-gray-100 text-gray-800 hover:bg-gray-100 border-gray-200",
        icon: <FileText className="h-3 w-3 mr-1" />
      }
    };

    const variant = variants[status as keyof typeof variants] || { 
      className: "bg-gray-100 text-gray-800 border-gray-200",
      icon: null 
    };

    const labels = {
      "PAID": "Payée",
      "PENDING": "En attente",
      "OVERDUE": "En retard",
      "DRAFT": "Brouillon"
    };

    return (
      <Badge className={`gap-1 ${variant.className}`}>
        {variant.icon}
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyDetailed = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy", { locale: fr });
    } catch {
      return "-";
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDueStatus = (dueDate: string, status: string) => {
    if (status === "PAID") return null;
    
    const daysUntilDue = getDaysUntilDue(dueDate);
    
    if (daysUntilDue < 0) {
      return (
        <Badge variant="destructive" className="text-xs">
          En retard de {Math.abs(daysUntilDue)} jour{Math.abs(daysUntilDue) > 1 ? "s" : ""}
        </Badge>
      );
    } else if (daysUntilDue <= 7) {
      return (
        <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200">
          Échéance dans {daysUntilDue} jour{daysUntilDue > 1 ? "s" : ""}
        </Badge>
      );
    }
    return null;
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Facture supprimée avec succès");
        setInvoiceToDelete(null);
        setShowDeleteDialog(false);
        fetchInvoices();
      } else {
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Erreur de connexion");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.length === 0) {
      toast.error("Aucune facture sélectionnée");
      return;
    }

    try {
      const toastId = toast.loading("Suppression en cours...");
      const response = await fetch("/api/invoices", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invoiceIds: selectedInvoices }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`${selectedInvoices.length} facture(s) supprimée(s) avec succès`, { id: toastId });
        setSelectedInvoices([]);
        fetchInvoices();
      } else {
        toast.error(data.error || "Erreur lors de la suppression", { id: toastId });
      }
    } catch (error) {
      console.error("Error bulk deleting invoices:", error);
      toast.error("Erreur de connexion");
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    try {
      const toastId = toast.loading("Mise à jour en cours...");
      const response = await fetch(`/api/invoices/${invoiceId}/paid`, {
        method: "PUT",
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Facture marquée comme payée", { id: toastId });
        fetchInvoices();
      } else {
        toast.error(data.error || "Erreur lors de la mise à jour", { id: toastId });
      }
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      toast.error("Erreur de connexion");
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/invoices/export?status=${statusFilter}&date=${dateFilter}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factures-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Export CSV réussi");
      } else {
        const data = await response.json();
        toast.error(data.error || "Erreur lors de l'export");
      }
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Erreur de connexion");
    }
  };

  const handleBulkPrint = () => {
    if (selectedInvoices.length === 0) {
      toast.error("Aucune facture sélectionnée");
      return;
    }

    // Ouvrir chaque facture PDF dans un nouvel onglet pour impression
    selectedInvoices.forEach(invoiceId => {
      window.open(`/api/invoices/${invoiceId}/pdf`, '_blank');
    });
    toast.success(`${selectedInvoices.length} facture(s) ouvertes pour impression`);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const columns: ColumnDef<Invoice>[] = [
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
      accessorKey: "invoiceNumber",
      header: () => (
        <Button
          variant="ghost"
          onClick={() => handleSort("invoiceNumber")}
          className="flex items-center gap-1 p-0 font-semibold"
        >
          N° Facture
          {sortBy === "invoiceNumber" && (
            sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="font-medium">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <FileText className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="font-semibold">{invoice.invoiceNumber}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Émise le {formatDate(invoice.issueDate)}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "client.name",
      header: () => (
        <Button
          variant="ghost"
          onClick={() => handleSort("client.name")}
          className="flex items-center gap-1 p-0 font-semibold"
        >
          Client
          {sortBy === "client.name" && (
            sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div>
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{invoice.client.name}</span>
            </div>
            {invoice.client.email && (
              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="h-3 w-3" />
                {invoice.client.email}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: () => (
        <Button
          variant="ghost"
          onClick={() => handleSort("dueDate")}
          className="flex items-center gap-1 p-0 font-semibold"
        >
          Échéance
          {sortBy === "dueDate" && (
            sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const invoice = row.original;
        const dueStatus = getDueStatus(invoice.dueDate, invoice.status);
        return (
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-medium">{formatDate(invoice.dueDate)}</span>
            </div>
            {dueStatus && (
              <div className="mt-1">{dueStatus}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "total",
      header: () => (
        <Button
          variant="ghost"
          onClick={() => handleSort("total")}
          className="flex items-center gap-1 p-0 font-semibold"
        >
          Montant
          {sortBy === "total" && (
            sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </Button>
      ),
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold">{formatCurrency(invoice.total)}</span>
            </div>
            {invoice.amountDue > 0 && invoice.status !== "PAID" && (
              <div className="text-sm text-muted-foreground mt-1">
                Reste: {formatCurrency(invoice.amountDue)}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="space-y-2">
            {getStatusBadge(invoice.status)}
            {invoice.amountDue > 0 && invoice.status !== "PAID" && (
              <Progress 
                value={(invoice.amountPaid / invoice.total) * 100} 
                className="h-1.5 w-20" 
              />
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/invoices/${invoice.id}`);
              }}
              title="Voir détails"
              className="h-8 w-8"
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Plus d'options</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}`)}>
                  <Eye className="h-4 w-4 mr-2" />
                  Voir détails
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                
                {invoice.status !== "PAID" && (
                  <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marquer comme payée
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuItem onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')}>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger PDF
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => window.open(`/api/invoices/${invoice.id}/print`, '_blank')}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimer
                </DropdownMenuItem>
                
                {invoice.client.email && (
                  <DropdownMenuItem onClick={() => {
                    // Envoyer par email
                    toast.info("Fonctionnalité d'envoi email à implémenter");
                  }}>
                    <Mail className="h-4 w-4 mr-2" />
                    Envoyer par email
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => {
                    setInvoiceToDelete(invoice.id);
                    setShowDeleteDialog(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  // Skeleton loading
  if (isLoading && invoices.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        
        {/* Stats skeleton */}
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-5 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-64" />
              </div>
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Factures</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos factures et suivez les paiements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fetchInvoices()}
            disabled={isRefreshing}
            className="gap-2"
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Actualiser
          </Button>
          <Button 
            onClick={() => router.push("/invoices/create")} 
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Nouvelle facture
          </Button>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chiffre d'affaires</CardTitle>
            <div className="p-2 rounded-lg bg-primary/10">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatCurrency(stats.totalAmount) : "€0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Total des factures
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatCurrency(stats.pendingAmount) : "€0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Montant à recevoir
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payées</CardTitle>
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatCurrency(stats.paidAmount) : "€0"}
            </div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(inv => inv.status === "PAID").length} factures
            </p>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En retard</CardTitle>
            <div className="p-2 rounded-lg bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? stats.overdueCount : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Factures en retard
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Liste des factures</CardTitle>
              <CardDescription>
                {pagination.total} facture{pagination.total !== 1 ? "s" : ""} • 
                Page {pagination.page} sur {pagination.totalPages}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Filtres principaux */}
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="PAID">Payées</SelectItem>
                    <SelectItem value="PENDING">En attente</SelectItem>
                    <SelectItem value="OVERDUE">En retard</SelectItem>
                    <SelectItem value="DRAFT">Brouillons</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes dates</SelectItem>
                    <SelectItem value="today">Aujourd'hui</SelectItem>
                    <SelectItem value="week">Cette semaine</SelectItem>
                    <SelectItem value="month">Ce mois</SelectItem>
                    <SelectItem value="overdue">En retard</SelectItem>
                    <SelectItem value="due_this_week">Échéance cette semaine</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="w-[160px]">
                    <User className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les clients</SelectItem>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(statusFilter !== "all" || dateFilter !== "all" || clientFilter !== "all") && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setStatusFilter("all");
                      setDateFilter("all");
                      setClientFilter("all");
                    }}
                    title="Réinitialiser les filtres"
                    className="h-10 w-10"
                  >
                    <FilterX className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              {/* Recherche */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher n° facture, client, description..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Actions en vrac */}
              {selectedInvoices.length > 0 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer ({selectedInvoices.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkPrint}
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimer
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedInvoices([])}
                  >
                    Annuler
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        {/* Contenu principal */}
        <CardContent>
          {invoices.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">Aucune facture</h3>
              <p className="text-muted-foreground mt-1 mb-4">
                {debouncedSearch || statusFilter !== "all" || dateFilter !== "all" || clientFilter !== "all"
                  ? "Aucune facture ne correspond à votre recherche" 
                  : "Commencez par créer votre première facture"}
              </p>
              <Button onClick={() => router.push("/invoices/create")}>
                <Plus className="h-4 w-4 mr-2" />
                Créer une facture
              </Button>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <DataTable
                  columns={columns}
                  data={invoices}
                  searchKey="invoiceNumber"
                  searchPlaceholder="Rechercher..."
                  isLoading={isLoading}
                  // onRowClick={(row) => router.push(`/invoices/${row.id}`)}
                  showSearch={false}
                />
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  Affichage de {(pagination.page - 1) * pagination.limit + 1} à{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} sur{" "}
                  {pagination.total} factures
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: 1 }))}
                    disabled={pagination.page === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium">
                    Page {pagination.page} sur {pagination.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.totalPages }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportCSV}
              className="gap-2"
            >
              <FileDown className="h-4 w-4" />
              Exporter CSV
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="view-mode" className="text-sm">Vue :</Label>
            <Select value={viewMode} onValueChange={(value: "list" | "grid") => setViewMode(value)}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">Liste</SelectItem>
                <SelectItem value="grid">Grille</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={pagination.limit.toString()} 
              onValueChange={(value) => setPagination(prev => ({ ...prev, limit: parseInt(value), page: 1 }))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
                <SelectItem value="100">100 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardFooter>
      </Card>

      {/* Dialog de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette facture ?
              Cette action est irréversible et supprimera également tous les articles associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => invoiceToDelete && handleDeleteInvoice(invoiceToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}