// app/api/clients/[clientId]/route.ts (méthode GET)
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma/client';



export async function PUT(
  request: Request,
  { params }: { params: { clientId: string } }
) {
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
    const clientId = params.clientId;
    const data = await request.json();

    // Validation des données
    if (!data.name || data.name.trim() === '') {
      return NextResponse.json(
        { 
          success: false,
          error: 'Le nom du client est obligatoire' 
        },
        { status: 400 }
      );
    }

    // Vérifier que le client existe et appartient à la company
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        companyId,
      },
    });

    if (!existingClient) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Client non trouvé ou non autorisé' 
        },
        { status: 404 }
      );
    }

    // Vérifier si l'email est déjà utilisé par un autre client
    if (data.email && data.email !== existingClient.email) {
      const clientWithSameEmail = await prisma.client.findFirst({
        where: {
          companyId,
          email: data.email,
          NOT: {
            id: clientId,
          },
        },
      });

      if (clientWithSameEmail) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Un autre client utilise déjà cet email' 
          },
          { status: 409 }
        );
      }
    }

    // Mettre à jour le client
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Client mis à jour avec succès',
      data: updatedClient,
    });

  } catch (error) {
    console.error('Error updating client:', error);
    
    if (error instanceof Error && error.message.includes('Unique constraint failed')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Un client avec ces informations existe déjà' 
        },
        { status: 409 }
      );
    }

    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Client non trouvé' 
        },
        { status: 404 }
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


function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Une erreur inconnue est survenue';
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    
    console.log('Deleting client with ID:', clientId);
    
    if (!clientId || clientId.trim() === '') {
      return NextResponse.json(
        { 
          success: false,
          error: 'ID de client invalide ou manquant' 
        },
        { status: 400 }
      );
    }

    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé' 
      }, { status: 401 });
    }

    // Récupérer l'utilisateur avec sa company
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

    // Vérifier l'existence et les permissions
    const clientExists = await prisma.client.findFirst({
      where: {
        id: clientId,
        companyId: user.company.id,
      },
      select: { id: true }
    });

    if (!clientExists) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Client non trouvé ou non autorisé' 
        },
        { status: 404 }
      );
    }

    // Vérifier si le client a des factures associées
    const clientWithInvoices = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        invoices: {
          select: { 
            id: true, 
            invoiceNumber: true, 
            status: true,
            amountDue: true 
          },
          take: 5 // Limiter pour ne pas charger trop de données
        }
      }
    });

    // Empêcher la suppression si le client a des factures impayées
    if (clientWithInvoices && clientWithInvoices.invoices.length > 0) {
      // Filtrer les factures non payées (PENDING ou PARTIAL avec solde > 0)
      const facturesImpayees = clientWithInvoices.invoices.filter(invoice => {
        return invoice.status === 'PENDING' || 
               (invoice.status === 'PARTIAL' && invoice.amountDue > 0);
      });
      
      if (facturesImpayees.length > 0) {
        const montantTotalImpayé = facturesImpayees.reduce(
          (sum, invoice) => sum + invoice.amountDue, 
          0
        );
        
        return NextResponse.json(
          { 
            success: false,
            error: 'Impossible de supprimer ce client car il a des factures impayées',
            details: {
              totalInvoices: clientWithInvoices.invoices.length,
              unpaidInvoices: facturesImpayees.length,
              totalAmountDue: montantTotalImpayé,
              invoiceNumbers: facturesImpayees.map(inv => inv.invoiceNumber)
            }
          },
          { status: 400 }
        );
      }

      // Avertissement pour factures payées
      return NextResponse.json(
        { 
          success: false,
          error: 'Ce client a des factures associées (toutes payées). Voulez-vous vraiment le supprimer ?',
          details: {
            totalInvoices: clientWithInvoices.invoices.length,
            requiresConfirmation: true,
            warning: 'L\'historique des factures sera également supprimé.'
          }
        },
        { status: 400 }
      );
    }

    // Transaction pour la suppression
    await prisma.$transaction(async (tx) => {
      // Supprimer les paiements directement liés au client
      // (ceux qui ne sont pas liés à une facture)
      await tx.payment.deleteMany({
        where: { 
          clientId,
          invoiceId: null 
        }
      });
      
      // Supprimer le client (les factures et paiements liés seront supprimés par cascade)
      await tx.client.delete({
        where: { id: clientId }
      });
    });

    // Log pour audit
    console.log(`Client ${clientId} supprimé par l'utilisateur ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'Client supprimé avec succès',
      data: {
        clientId,
        deletedAt: new Date().toISOString(),
        hadInvoices: clientWithInvoices?.invoices.length || 0
      }
    });

  } catch (error) {
    console.error('Error deleting client:', error);
    
    // Gestion spécifique des erreurs Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2025':
          return NextResponse.json(
            { 
              success: false,
              error: 'Client non trouvé' 
            },
            { status: 404 }
          );
        
        case 'P2003':
          return NextResponse.json(
            { 
              success: false,
              error: 'Violation de contrainte de clé étrangère. Le client est référencé ailleurs.'
            },
            { status: 400 }
          );
        
        case 'P2002':
          return NextResponse.json(
            { 
              success: false,
              error: 'Erreur de contrainte unique'
            },
            { status: 400 }
          );
      }
    }

    // Gestion des erreurs de transaction
    if (error instanceof Prisma.PrismaClientUnknownRequestError) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Erreur lors de la transaction de suppression'
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur interne du serveur',
        details: process.env.NODE_ENV === 'development' 
          ? getErrorMessage(error) 
          : undefined
      },
      { status: 500 }
    );
  }
}

// OPTIONNEL : Route GET pour vérifier les dépendances avant suppression
export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const { clientId } = await params;
    
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false,
        error: 'Non autorisé' 
      }, { status: 401 });
    }

    // Récupérer l'utilisateur avec sa company
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

    // Récupérer le client avec ses dépendances
    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
        companyId: user.company.id,
      },
      include: {
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            amountDue: true,
            dueDate: true,
            issueDate: true
          },
          orderBy: { issueDate: 'desc' }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            invoiceId: true
          },
          orderBy: { paymentDate: 'desc' },
          take: 10
        },
        _count: {
          select: {
            invoices: true,
            payments: true
          }
        }
      }
    });

    if (!client) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Client non trouvé' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone,
          createdAt: client.createdAt
        },
        dependencies: {
          invoices: client._count.invoices,
          payments: client._count.payments,
          unpaidInvoices: client.invoices.filter(
            inv => inv.amountDue > 0
          ).length,
          totalUnpaidAmount: client.invoices.reduce(
            (sum, inv) => sum + inv.amountDue, 
            0
          )
        },
        recentInvoices: client.invoices.slice(0, 5),
        canBeDeleted: client.invoices.every(inv => inv.amountDue === 0)
      }
    });

  } catch (error) {
    console.error('Error fetching client dependencies:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la vérification des dépendances'
      },
      { status: 500 }
    );
  }
}