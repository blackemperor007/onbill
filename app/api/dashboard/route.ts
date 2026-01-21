// app/api/dashboard/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { subDays, subMonths } from 'date-fns';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    console.log("=== API Dashboard - Début ===");
    
    const { userId } = await auth();
    console.log("User ID from Clerk:", userId);
    
    if (!userId) {
      console.log("Erreur: Aucun user ID trouvé");
      return NextResponse.json(
        { 
          success: false,
          error: 'Non autorisé' 
        },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur et sa company
    console.log("Recherche de l'utilisateur dans la base...");
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { company: true }
    });
    
    console.log("User trouvé:", user?.id);
    console.log("Company trouvée:", user?.company?.id);

    if (!user?.company) {
      console.log("Erreur: Aucune entreprise trouvée pour l'utilisateur");
      return NextResponse.json(
        { 
          success: false,
          error: 'Aucune entreprise trouvée' 
        },
        { status: 404 }
      );
    }

    const companyId = user.company.id;
    console.log("Company ID:", companyId);
    
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixMonthsAgo = subMonths(now, 6);
    
    console.log("Dates calculées:", { now, thirtyDaysAgo, sixMonthsAgo });

    // Récupérer les statistiques de manière plus simple
    console.log("Récupération des statistiques...");
    
    // 1. Statistiques de base
    const [
      totalInvoice,
      paidInvoice,
      unpaidInvoice,
      totalRevenueAgg,
      totalClients,
      totalProducts,
    ] = await Promise.all([
      prisma.invoice.count({
        where: {
          companyId,
          issueDate: { gte: thirtyDaysAgo },
        },
      }),
      prisma.invoice.count({
        where: {
          companyId,
          issueDate: { gte: thirtyDaysAgo },
          status: 'PAID',
        },
      }),
      prisma.invoice.count({
        where: {
          companyId,
          issueDate: { gte: thirtyDaysAgo },
          status: { in: ['PENDING', 'OVERDUE'] },
        },
      }),
      prisma.invoice.aggregate({
        where: {
          companyId,
          issueDate: { gte: thirtyDaysAgo },
        },
        _sum: { total: true },
      }),
      prisma.client.count({ where: { companyId } }),
      prisma.product.count({ where: { companyId } }),
    ]);
    
    console.log("Statistiques récupérées:", {
      totalInvoice,
      paidInvoice,
      unpaidInvoice,
      totalRevenue: totalRevenueAgg._sum.total
    });

    // 2. Factures récentes
    console.log("Récupération des factures récentes...");
    const recentInvoices = await prisma.invoice.findMany({
      where: { companyId },
      include: {
        client: { select: { name: true } },
      },
      orderBy: { issueDate: 'desc' },
      take: 10,
    });
    
    console.log(`${recentInvoices.length} factures récentes trouvées`);

    // 3. Paiements récents
    console.log("Récupération des paiements récents...");
    const recentPayments = await prisma.payment.findMany({
      where: { companyId },
      include: {
        client: { select: { name: true } },
      },
      orderBy: { paymentDate: 'desc' },
      take: 5,
    });
    
    console.log(`${recentPayments.length} paiements récents trouvés`);

    // 4. Données pour le graphique (version simplifiée sans requête SQL brute)
    console.log("Récupération des données du graphique...");
    const invoicesLast6Months = await prisma.invoice.findMany({
      where: {
        companyId,
        issueDate: { gte: sixMonthsAgo },
      },
      select: {
        issueDate: true,
        total: true,
      },
    });
    
    // Grouper par mois
    const monthMap = new Map<string, number>();
    invoicesLast6Months.forEach(invoice => {
      const date = new Date(invoice.issueDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + invoice.total);
    });
    
    // Générer les 6 derniers mois
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(now, i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      
      chartData.push({
        month: monthName,
        revenue: monthMap.get(monthKey) || 0,
        invoices: invoicesLast6Months.filter(inv => {
          const invDate = new Date(inv.issueDate);
          return `${invDate.getFullYear()}-${String(invDate.getMonth() + 1).padStart(2, '0')}` === monthKey;
        }).length,
      });
    }
    
    console.log("Données du graphique générées:", chartData.length, "mois");

    // Calculer le montant des factures impayées
    const unpaidInvoicesList = await prisma.invoice.findMany({
      where: {
        companyId,
        issueDate: { gte: thirtyDaysAgo },
        status: { in: ['PENDING', 'OVERDUE'] },
      },
      select: { amountDue: true },
    });
    
    const unpaidAmount = unpaidInvoicesList.reduce((sum, inv) => sum + (inv.amountDue || 0), 0);
    console.log("Montant des impayés calculé:", unpaidAmount);

    const responseData = {
      totalRevenue: totalRevenueAgg._sum.total || 0,
      totalInvoice,
      paidInvoice,
      unpaidInvoice,
      unpaidAmount,
      recentInvoices,
      chartData,
      totalClients,
      totalProducts,
      recentPayments,
    };

    console.log("=== API Dashboard - Succès ===");
    
    return NextResponse.json({
      success: true,
      data: responseData,
    });
    
  } catch (error) {
    console.error("=== API Dashboard - Erreur ===");
    console.error("Erreur complète:", error);
    
    // Afficher plus de détails sur l'erreur
    if (error instanceof Error) {
      console.error("Message d'erreur:", error.message);
      console.error("Stack trace:", error.stack);
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur',
        details: process.env.NODE_ENV === 'development' 
      },
      { status: 500 }
    );
  }
}