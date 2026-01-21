"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { 
  DollarSign, 
  FileText, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Users,
  Package,
  CreditCard
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";

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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch("/api/dashboard");
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      if (responseData.success) {
        setData(responseData.data);
      } else {
        setError(responseData.error || "Erreur lors du chargement des données");
      }
    } catch (error) {
      console.error("Erreur fetch:", error);
      setError("Erreur de connexion au serveur");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Rafraîchir les données toutes les minutes
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "OVERDUE":
        return "bg-red-100 text-red-800 border-red-200";
      case "DRAFT":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const invoiceColumns: ColumnDef<Invoice>[] = [
    {
      accessorKey: "invoiceNumber",
      header: "N° Facture",
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.invoiceNumber}
        </div>
      ),
    },
    {
      accessorKey: "client.name",
      header: "Client",
      cell: ({ row }) => (
        <div className="text-sm">
          {row.original.client.name}
        </div>
      ),
    },
    {
      accessorKey: "issueDate",
      header: "Date",
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.issueDate), "dd/MM/yyyy")}
        </div>
      ),
    },
    {
      accessorKey: "total",
      header: "Montant",
      cell: ({ row }) => (
        <div className="font-medium">
          {formatCurrency(row.original.total)}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Statut",
      cell: ({ row }) => {
        const status = row.original.status;
        
        const statusLabels = {
          "PAID": "Payée",
          "PENDING": "En attente",
          "OVERDUE": "En retard",
          "DRAFT": "Brouillon"
        };
        
        return (
          <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${getStatusColor(status)}`}>
            {statusLabels[status as keyof typeof statusLabels] || status}
          </div>
        );
      },
    },
    {
      accessorKey: "amountDue",
      header: "Reste à payer",
      cell: ({ row }) => (
        <div className="text-sm">
          {formatCurrency(row.original.amountDue)}
        </div>
      ),
    },
  ];

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description, 
    trend 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    description?: string;
    trend?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-1">
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-xs text-green-500">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-3">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-destructive mb-4">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.698-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchData}>
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Cartes de statistiques */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Chiffre d'affaires"
          value={data ? formatCurrency(data.totalRevenue) : "€0"}
          icon={DollarSign}
          description="Total des 30 derniers jours"
          trend="+12.5%"
        />
        <StatCard
          title="Factures totales"
          value={data?.totalInvoice || 0}
          icon={FileText}
          description="Derniers 30 jours"
        />
        <StatCard
          title="Factures payées"
          value={data?.paidInvoice || 0}
          icon={CheckCircle}
          description={`${data && data.totalInvoice > 0 ? Math.round((data.paidInvoice / data.totalInvoice) * 100) : 0}% du total`}
        />
        <StatCard
          title="Factures impayées"
          value={data?.unpaidInvoice || 0}
          icon={Clock}
          description={`Montant: ${data ? formatCurrency(data.recentInvoices?.reduce((sum, inv) => sum + inv.amountDue, 0) || 0) : "€0"}`}
        />
      </div>

      {/* Graphique et statistiques supplémentaires */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Graphique du chiffre d'affaires */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Évolution du chiffre d'affaires</CardTitle>
            <CardDescription>
              Derniers 6 mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.chartData && data.chartData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <ChartTooltipContent>
                              <div className="space-y-1">
                                <p className="font-medium">
                                  {payload[0].payload.month}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Chiffre d'affaires: {formatCurrency(payload[0].value as number)}
                                </p>
                              </div>
                            </ChartTooltipContent>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar 
                      dataKey="revenue" 
                      fill="var(--chart-1)"
                      radius={[4, 4, 0, 0]}
                      name="Chiffre d'affaires"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Aucune donnée disponible</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistiques secondaires */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Vue d'ensemble</CardTitle>
            <CardDescription>
              Résumé de votre activité
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Clients</span>
                </div>
                <span className="font-medium">{data?.totalClients || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Produits</span>
                </div>
                <span className="font-medium">{data?.totalProducts || 0}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Paiements récents</span>
                </div>
                <span className="font-medium">{data?.recentPayments?.length || 0}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Derniers paiements</h4>
              <div className="space-y-2">
                {data?.recentPayments?.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between text-sm">
                    <div className="truncate mr-2">
                      {payment.client.name}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(payment.amount)}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(payment.paymentDate), "dd/MM")}
                      </div>
                    </div>
                  </div>
                ))}
                {(!data?.recentPayments || data.recentPayments.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Aucun paiement récent
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dernières factures */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Dernières factures</CardTitle>
              <CardDescription>
                Vos 10 dernières factures
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              Voir toutes
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data?.recentInvoices && data.recentInvoices.length > 0 ? (
            <DataTable
              columns={invoiceColumns}
              data={data.recentInvoices}
              pagination={false}
              showSearch={false}
              showColumnToggle={false}
            />
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Aucune facture récente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}