import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import prisma from '@/lib/prisma';

// Fonction pour générer le prochain numéro de facture
async function generateInvoiceNumber(companyId: string) {
  // Chercher la dernière facture de l'année en cours
  const now = new Date();
  const currentYear = now.getFullYear();
  const yearPrefix = currentYear.toString().slice(-2); // "24" pour 2024
  
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      companyId,
      invoiceNumber: {
        startsWith: `INV-${yearPrefix}`,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      invoiceNumber: true,
    },
  });

  let nextNumber = 1;
  
  if (lastInvoice?.invoiceNumber) {
    // Extraire le numéro de la dernière facture
    const match = lastInvoice.invoiceNumber.match(/INV-\d{2}-(\d+)$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    } else {
      // Si le format est différent, chercher toutes les factures pour trouver le plus grand numéro
      const allInvoices = await prisma.invoice.findMany({
        where: { companyId },
        select: { invoiceNumber: true },
      });

      const invoiceNumbers = allInvoices
        .map(inv => {
          const matches = inv.invoiceNumber.match(/(\d+)$/);
          return matches ? parseInt(matches[1]) : 0;
        })
        .filter(num => !isNaN(num));

      if (invoiceNumbers.length > 0) {
        nextNumber = Math.max(...invoiceNumbers) + 1;
      }
    }
  }

  // Format: INV-24-000001
  return `INV-${yearPrefix}-${nextNumber.toString().padStart(6, '0')}`;
}

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé' 
      }, { status: 401 });
    }

    // Récupérer l'utilisateur et sa company
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { company: true }
    });

    if (!user?.company) {
      return NextResponse.json({ 
        success: false,
        error: 'Aucune entreprise trouvée' 
      }, { status: 404 });
    }

    const companyId = user.company.id;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const dateFilter = searchParams.get('date');
    const clientId = searchParams.get('clientId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = searchParams.get('sortBy') || 'issueDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Construire les conditions de recherche
    const where: any = { companyId };

    // Filtre par statut
    if (status && status !== 'all') {
      where.status = status;
    }

    // Filtre par client
    if (clientId && clientId !== 'all') {
      where.clientId = clientId;
    }

    // Filtre par date
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      
      switch (dateFilter) {
        case 'today':
          where.issueDate = {
            gte: startOfDay(now),
            lte: endOfDay(now),
          };
          break;
          
        case 'week':
          where.issueDate = {
            gte: startOfWeek(now),
            lte: endOfWeek(now),
          };
          break;
          
        case 'month':
          where.issueDate = {
            gte: startOfMonth(now),
            lte: endOfMonth(now),
          };
          break;
          
        case 'overdue':
          where.dueDate = { lt: now };
          where.status = { in: ['PENDING', 'DRAFT'] };
          break;
          
        case 'due_this_week':
          const endOfWeekDate = endOfWeek(now);
          where.dueDate = {
            gte: now,
            lte: endOfWeekDate,
          };
          where.status = { in: ['PENDING', 'DRAFT'] };
          break;
          
        default:
          break;
      }
    }

    // Filtre par recherche
    if (search) {
      where.OR = [
        {
          invoiceNumber: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          client: {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          client: {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
        },
        {
          items: {
            some: {
              description: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    // Récupérer le total pour la pagination
    const total = await prisma.invoice.count({ where });

    // Récupérer les factures avec pagination
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          select: {
            description: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculer les statistiques
    const stats = await prisma.invoice.groupBy({
      by: ['status'],
      where: { companyId },
      _count: true,
      _sum: {
        total: true,
        amountDue: true,
      },
    });

    const statsSummary = {
      totalAmount: stats.reduce((sum, stat) => sum + (stat._sum.total || 0), 0),
      pendingAmount: stats
        .filter(stat => stat.status === 'PENDING')
        .reduce((sum, stat) => sum + (stat._sum.amountDue || 0), 0),
      paidAmount: stats
        .filter(stat => stat.status === 'PAID')
        .reduce((sum, stat) => sum + (stat._sum.total || 0), 0),
      overdueCount: stats
        .filter(stat => stat.status === 'OVERDUE')
        .reduce((sum, stat) => sum + (stat._count || 0), 0),
    };

    return NextResponse.json({ 
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: statsSummary,
    });
    
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé' 
      }, { status: 401 });
    }

    // Récupérer l'utilisateur et sa company
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { company: true }
    });

    if (!user?.company) {
      return NextResponse.json({ 
        success: false,
        error: 'Aucune entreprise trouvée' 
      }, { status: 404 });
    }

    const companyId = user.company.id;
    const data = await request.json();

    // Validation des données requises
    if (!data.clientId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Le client est obligatoire' 
        },
        { status: 400 }
      );
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Au moins un article est requis' 
        },
        { status: 400 }
      );
    }

    // Vérifier que le client existe et appartient à la company
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        companyId,
      },
    });

    if (!client) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Client non trouvé ou non autorisé' 
        },
        { status: 404 }
      );
    }

    // Générer le numéro de facture automatiquement
    const invoiceNumber = await generateInvoiceNumber(companyId);

    // Calculer les totaux
    let subtotal = 0;
    let taxAmount = 0;
    
    const invoiceItems = data.items.map((item: any) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemTax = itemSubtotal * (item.taxRate / 100);
      
      subtotal += itemSubtotal;
      taxAmount += itemTax;

      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        subtotal: itemSubtotal,
        taxAmount: itemTax,
        total: itemSubtotal + itemTax,
        productId: item.productId || null,
      };
    });

    const total = subtotal + taxAmount;

    // Créer la facture
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        status: data.status || 'DRAFT',
        issueDate: new Date(data.issueDate),
        dueDate: new Date(data.dueDate),
        paymentMethod: data.paymentMethod || 'CASH',
        notes: data.notes || null,
        terms: data.terms || null,
        subtotal,
        taxAmount,
        total,
        amountDue: data.status === 'PAID' ? 0 : total,
        amountPaid: data.status === 'PAID' ? total : 0,
        companyId,
        clientId: data.clientId,
        items: {
          create: invoiceItems,
        },
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        items: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Facture créée avec succès',
      data: invoice,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating invoice:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Une erreur est survenue avec le numéro de facture' 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé' 
      }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: { company: true }
    });

    if (!user?.company) {
      return NextResponse.json({ 
        success: false,
        error: 'Aucune entreprise trouvée' 
      }, { status: 404 });
    }

    const companyId = user.company.id;
    const data = await request.json();
    
    if (!data.invoiceIds || !Array.isArray(data.invoiceIds)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Liste des factures à supprimer manquante' 
        },
        { status: 400 }
      );
    }

    // Vérifier que toutes les factures appartiennent à la company
    const invoicesToDelete = await prisma.invoice.findMany({
      where: {
        id: { in: data.invoiceIds },
        companyId,
      },
      select: { id: true },
    });

    if (invoicesToDelete.length !== data.invoiceIds.length) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Certaines factures ne peuvent pas être supprimées' 
        },
        { status: 403 }
      );
    }

    // Supprimer les factures
    await prisma.invoice.deleteMany({
      where: {
        id: { in: data.invoiceIds },
        companyId,
      },
    });

    return NextResponse.json({
      success: true,
      message: `${data.invoiceIds.length} facture(s) supprimée(s) avec succès`,
    });

  } catch (error) {
    console.error('Error deleting invoices:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur' 
      },
      { status: 500 }
    );
  }
}