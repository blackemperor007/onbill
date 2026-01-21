"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { format, subMonths, subDays, eachMonthOfInterval } from "date-fns";
import { fr } from 'date-fns/locale';
import { 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  CreditCard,
  Building,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Loader2,
  MoreVertical,
  Eye,
  Download,
  BarChart3,
  Percent,
  TrendingUpIcon
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartInvoice } from "../_components/invoices/ChartInvoice";

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
  client: {
    name: string;
  };
}

interface DashboardData {
  totalRevenue: number;
  totalInvoice: number;
  paidInvoice: number;
  unpaidInvoice: number;
  unpaidAmount: number;
  recentInvoices: Invoice[];
  chartData: {
    month: string;
    revenue: number;
    invoices: number;
  }[];
  totalClients: number;
  totalProducts: number;
  recentPayments: {
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    client: {
      name: string;
    };
  }[];
}

interface InvoiceChartData {
  date: string;
  totalRevenue: number;
  paidRevenue: number;
  unpaidRevenue: number;
  invoices: number;
  paidInvoices: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [chartInvoiceData, setChartInvoiceData] = useState<InvoiceChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("30days");

  const fetchData = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      
      console.log("Fetching dashboard data...");
      const response = await fetch("/api/dashboard");
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log("Dashboard data received:", responseData);
      
      if (responseData.success) {
        setData(responseData.data);
        
        // Transformer les données pour ChartInvoice
        if (responseData.data.chartData) {
          const transformedData = transformChartData(responseData.data);
          setChartInvoiceData(transformedData);
        }
      } else {
        setError(responseData.error || "Erreur lors du chargement des données");
      }
    } catch (error) {
      console.error("Erreur fetch:", error);
      setError(error instanceof Error ? error.message : "Erreur de connexion au serveur");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Fonction pour transformer les données du dashboard pour ChartInvoice
  const transformChartData = (dashboardData: DashboardData): InvoiceChartData[] => {
    const now = new Date();
    const data: InvoiceChartData[] = [];
    
    // Créer des données pour les 90 derniers jours
    for (let i = 89; i >= 0; i--) {
      const date = subDays(now, i);
      const monthData = dashboardData.chartData?.find(item => {
        const monthName = date.toLocaleDateString('fr-FR', { month: 'short' });
        return item.month.includes(monthName);
      });
      
      // Si on a des données pour ce mois, on les répartit sur les jours
      if (monthData) {
        // Simulation de répartition journalière (pour l'exemple)
        const dailyRevenue = monthData.revenue / 30;
        const dailyInvoices = monthData.invoices / 30;
        
        // Estimation des revenus payés vs impayés (70% payés pour l'exemple)
        const dailyPaidRevenue = dailyRevenue * 0.7;
        const dailyUnpaidRevenue = dailyRevenue * 0.3;
        const dailyPaidInvoices = dailyInvoices * 0.7;
        
        data.push({
          date: date.toISOString().split('T')[0],
          totalRevenue: dailyRevenue,
          paidRevenue: dailyPaidRevenue,
          unpaidRevenue: dailyUnpaidRevenue,
          invoices: Math.round(dailyInvoices),
          paidInvoices: Math.round(dailyPaidInvoices)
        });
      } else {
        // Données par défaut pour les jours sans données
        data.push({
          date: date.toISOString().split('T')[0],
          totalRevenue: 0,
          paidRevenue: 0,
          unpaidRevenue: 0,
          invoices: 0,
          paidInvoices: 0
        });
      }
    }
    
    return data;
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "PAID":
        return "default";
      case "PENDING":
        return "secondary";
      case "OVERDUE":
        return "destructive";
      case "DRAFT":
        return "outline";
      default:
        return "default";
    }
  };

  const getStatusLabel = (status: string) => {
    const statusLabels = {
      "PAID": "Payée",
      "PENDING": "En attente",
      "OVERDUE": "En retard",
      "DRAFT": "Brouillon"
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PAID":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "PENDING":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "OVERDUE":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "DRAFT":
        return <FileText className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Configuration pour ChartInvoice
  const chartConfig = {
    totalRevenue: {
      label: "Revenu total",
      color: "hsl(var(--chart-1))",
    },
    paidRevenue: {
      label: "Revenu payé",
      color: "hsl(var(--chart-2))",
    },
    unpaidRevenue: {
      label: "Revenu impayé",
      color: "hsl(var(--chart-3))",
    },
    invoices: {
      label: "Factures",
      color: "hsl(var(--chart-4))",
    },
    paidInvoices: {
      label: "Factures payées",
      color: "hsl(var(--chart-5))",
    },
  };

  const invoiceColumns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "invoiceNumber",
      header: "N° Facture",
      cell: ({ row }) => (
        <div className="font-medium">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{row.original.invoiceNumber}</span>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "client.name",
      header: "Client",
      cell: ({ row }) => (
        <div className="max-w-[150px] truncate">
          {row.original.client.name}
        </div>
      ),
    },
    {
      accessorKey: "issueDate",
      header: "Date",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {format(new Date(row.original.issueDate), "dd/MM/yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "total",
      header: "Montant",
      cell: ({ row }) => (
        <div className="font-semibold">
          {formatCurrency(row.original.total)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge variant={getStatusVariant(status)} className="gap-1">
            {getStatusIcon(status)}
            {getStatusLabel(status)}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const invoice = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.location.href = `/invoices/${invoice.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                Voir détails
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = `/invoices/${invoice.id}/pdf`}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    trend,
    trendValue,
    loading = false,
    color = "primary"
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    description?: string;
    trend?: "up" | "down" | "neutral";
    trendValue?: string;
    loading?: boolean;
    color?: "primary" | "green" | "blue" | "red" | "purple";
  }) => {
    const colorClasses = {
      primary: "bg-primary/10 text-primary",
      green: "bg-green-500/10 text-green-600",
      blue: "bg-blue-500/10 text-blue-600",
      red: "bg-red-500/10 text-red-600",
      purple: "bg-purple-500/10 text-purple-600",
    };

    return (
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-transparent to-current opacity-5 rounded-full -translate-y-16 translate-x-16" />
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-40" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">{value}</div>
              {description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {description}
                </p>
              )}
              {trend && trendValue && (
                <div className="flex items-center mt-2">
                  {trend === "up" ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                  ) : trend === "down" ? (
                    <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                  ) : (
                    <TrendingUp className="h-3 w-3 text-gray-500 mr-1" />
                  )}
                  <span className={`text-xs ${trend === "up" ? "text-green-500" : trend === "down" ? "text-red-500" : "text-gray-500"}`}>
                    {trendValue}
                  </span>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const calculateMetrics = () => {
    if (!data) return null;

    const paymentRate = data.totalInvoice > 0 
      ? Math.round((data.paidInvoice / data.totalInvoice) * 100)
      : 0;

    const averageInvoice = data.totalInvoice > 0
      ? data.totalRevenue / data.totalInvoice
      : 0;

    const overdueRate = data.totalInvoice > 0
      ? Math.round((data.unpaidInvoice / data.totalInvoice) * 100)
      : 0;

    // Calculer le taux de croissance des 30 derniers jours
    const revenueGrowth = data.chartData?.length >= 2 
      ? ((data.chartData[data.chartData.length - 1].revenue - data.chartData[data.chartData.length - 2].revenue) / data.chartData[data.chartData.length - 2].revenue) * 100
      : 0;

    return { paymentRate, averageInvoice, overdueRate, revenueGrowth };
  };

  const metrics = calculateMetrics();

  if (isLoading && !data) {
    return (
      <div className="p-6 space-y-6">
        {/* En-tête skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Cartes skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        {/* Graphique skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-80 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="max-w-lg mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-destructive/10 p-3 mb-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-muted-foreground text-center mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={fetchData} disabled={isRefreshing}>
                {isRefreshing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Réessayer
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* En-tête avec navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de bord</h1>
          <p className="text-muted-foreground">
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 derniers jours</SelectItem>
              <SelectItem value="30days">30 derniers jours</SelectItem>
              <SelectItem value="3months">3 derniers mois</SelectItem>
              <SelectItem value="6months">6 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
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
            size="sm"
            onClick={() => window.location.href = '/invoices/create'}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Nouvelle facture
          </Button>
        </div>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Chiffre d'affaires"
          value={data ? formatCurrency(data.totalRevenue) : "€0"}
          icon={DollarSign}
          description="30 derniers jours"
          trend={metrics?.revenueGrowth && metrics.revenueGrowth > 0 ? "up" : "down"}
          trendValue={metrics?.revenueGrowth ? `${metrics.revenueGrowth > 0 ? '+' : ''}${metrics.revenueGrowth.toFixed(1)}%` : "0%"}
          loading={isRefreshing && !data}
          color="primary"
        />
        <StatCard
          title="Factures"
          value={data?.totalInvoice || 0}
          icon={FileText}
          description={`${data?.paidInvoice || 0} payées`}
          trend="up"
          trendValue="+8%"
          loading={isRefreshing && !data}
          color="blue"
        />
        <StatCard
          title="Taux de paiement"
          value={metrics?.paymentRate ? `${metrics.paymentRate}%` : "0%"}
          icon={Percent}
          description={`${data?.unpaidInvoice || 0} impayées`}
          trend={data && data.paidInvoice > data.unpaidInvoice ? "up" : "down"}
          trendValue={metrics?.paymentRate ? `${metrics.paymentRate}%` : "0%"}
          loading={isRefreshing && !data}
          color="green"
        />
        <StatCard
          title="Montant dû"
          value={data ? formatCurrency(data.unpaidAmount) : "€0"}
          icon={AlertCircle}
          description={`${data?.unpaidInvoice || 0} factures`}
          trend={data && data.unpaidAmount > 0 ? "down" : "neutral"}
          trendValue={data && data.unpaidAmount > 0 ? "À collecter" : "À jour"}
          loading={isRefreshing && !data}
          color="red"
        />
      </div>

      {/* Graphique principal avec ChartInvoice */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Évolution des revenus</CardTitle>
            <CardDescription>
              Revenus totaux vs revenus payés sur 90 jours
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {metrics?.revenueGrowth && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                {metrics.revenueGrowth > 0 ? (
                  <TrendingUpIcon className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{metrics.revenueGrowth > 0 ? '+' : ''}{metrics.revenueGrowth.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {chartInvoiceData.length > 0 ? (
            <ChartInvoice 
              chartData={chartInvoiceData}
              chartConfig={chartConfig}
            />
          ) : (
            <div className="h-80 flex flex-col items-center justify-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">Aucune donnée disponible</p>
              <p className="text-sm text-muted-foreground text-center">
                Les données de performance apparaîtront après la création de factures
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tableaux et métriques secondaires */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Dernières factures */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Factures récentes</CardTitle>
                <CardDescription>
                  Les 10 dernières factures créées
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => window.location.href = '/invoices'}
                className="gap-2"
              >
                Voir toutes
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {data?.recentInvoices && data.recentInvoices.length > 0 ? (
              <>
                <DataTable
                  columns={invoiceColumns}
                  data={data.recentInvoices}
                  pagination={false}
                  showSearch={false}
                  showColumnToggle={false}
                  className="border-none"
                />
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Montant total : {formatCurrency(data.recentInvoices.reduce((sum, inv) => sum + inv.total, 0))}
                    </span>
                    <span className="text-muted-foreground">
                      {data.recentInvoices.length} factures
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="rounded-full bg-muted p-3 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-2">Aucune facture récente</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Créez votre première facture pour commencer
                </p>
                <Button 
                  onClick={() => window.location.href = '/invoices/create'}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Créer une facture
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Métriques et aperçu rapide */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Statistiques clés</CardTitle>
            <CardDescription>
              Vue d'ensemble de votre activité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Métriques principales */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Clients</span>
                </div>
                <div className="text-2xl font-bold">{data?.totalClients || 0}</div>
                <div className="text-xs text-green-500 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" />
                  +2 ce mois
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Produits</span>
                </div>
                <div className="text-2xl font-bold">{data?.totalProducts || 0}</div>
                <div className="text-xs text-blue-500 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Catalogue actif
                </div>
              </div>
            </div>

            <Separator />

            {/* Distribution des statuts */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Statut des factures</h4>
              <div className="space-y-3">
                {["PAID", "PENDING", "OVERDUE", "DRAFT"].map((status) => {
                  const count = data?.recentInvoices?.filter(
                    inv => inv.status === status
                  ).length || 0;
                  const total = data?.totalInvoice || 1;
                  const percentage = Math.round((count / total) * 100);
                  
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          <span>{getStatusLabel(status)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{count}</span>
                          <span className="text-muted-foreground text-xs">
                            ({percentage}%)
                          </span>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Derniers paiements */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Derniers paiements</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-7"
                  onClick={() => window.location.href = '/payments'}
                >
                  Tout voir →
                </Button>
              </div>
              <div className="space-y-2">
                {data?.recentPayments?.slice(0, 3).map((payment) => (
                  <div 
                    key={payment.id} 
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-md bg-green-500/10">
                        <CreditCard className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {payment.client.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(payment.paymentDate), "dd MMM", { locale: fr })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-600">
                        {formatCurrency(payment.amount)}
                      </div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {payment.paymentMethod.toLowerCase()}
                      </div>
                    </div>
                  </div>
                ))}
                {(!data?.recentPayments || data.recentPayments.length === 0) && (
                  <div className="text-center py-3">
                    <CreditCard className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">
                      Aucun paiement récent
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Statistiques rapides */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">En un coup d'œil</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Facture moyenne</span>
                  <span className="font-medium">
                    {metrics?.averageInvoice ? formatCurrency(metrics.averageInvoice) : "€0"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Taux d'impayés</span>
                  <span className="font-medium">
                    {metrics?.overdueRate ? `${metrics.overdueRate}%` : "0%"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Aperçu rapide des actions */}
      <Card>
        <CardHeader>
          <CardTitle>Accès rapide</CardTitle>
          <CardDescription>
            Actions principales pour gérer votre activité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center justify-center gap-3"
              onClick={() => window.location.href = '/invoices/create'}
            >
              <div className="p-3 rounded-full bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <div className="font-medium">Nouvelle facture</div>
                <div className="text-xs text-muted-foreground mt-1">Créer une facture</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center justify-center gap-3"
              onClick={() => window.location.href = '/clients'}
            >
              <div className="p-3 rounded-full bg-blue-500/10">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-center">
                <div className="font-medium">Gérer clients</div>
                <div className="text-xs text-muted-foreground mt-1">{data?.totalClients || 0} clients</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center justify-center gap-3"
              onClick={() => window.location.href = '/products'}
            >
              <div className="p-3 rounded-full bg-green-500/10">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-center">
                <div className="font-medium">Produits</div>
                <div className="text-xs text-muted-foreground mt-1">{data?.totalProducts || 0} produits</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col items-center justify-center gap-3"
              onClick={() => window.location.href = '/reports'}
            >
              <div className="p-3 rounded-full bg-purple-500/10">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-center">
                <div className="font-medium">Rapports</div>
                <div className="text-xs text-muted-foreground mt-1">Analyses détaillées</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message d'encouragement ou avertissement */}
      {data && data.unpaidAmount > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-yellow-100">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-yellow-800">
                  {formatCurrency(data.unpaidAmount)} en attente de paiement
                </p>
                <p className="text-sm text-yellow-600">
                  {data.unpaidInvoice} factures nécessitent votre attention
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/invoices?status=PENDING'}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              Voir les impayés
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}