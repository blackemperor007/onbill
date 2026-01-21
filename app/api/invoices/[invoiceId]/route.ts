// app/api/invoices/[invoiceId]/route.ts (méthode DELETE)
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Récupérer l'utilisateur et sa company
    const user = await prisma.user.findFirst({
      where: { clerkUserId: userId },
      include: { company: true }
    });

    if (!user || !user.company) {
      return NextResponse.json(
        { error: 'Aucune société associée' },
        { status: 400 }
      );
    }

    // Récupérer la facture avec toutes les relations
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        companyId: user.company.id, // Vérifier l'appartenance
      },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            companyEmail: true,
            address: true,
            phone: true,
            logo: true,
            currency: true,
          }
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
          }
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            reference: true,
          },
          orderBy: {
            paymentDate: 'desc'
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}


export async function DELETE(
  request: Request,
  { params }: { params: { invoiceId: string } }
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
    const invoiceId = params.invoiceId;

    // Vérifier que la facture existe et appartient à la company
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        companyId,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Facture non trouvée ou non autorisée' 
        },
        { status: 404 }
      );
    }

    // Supprimer d'abord les items de la facture
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId },
    });

    // Supprimer les paiements associés
    await prisma.payment.deleteMany({
      where: { invoiceId },
    });

    // Supprimer la facture
    await prisma.invoice.delete({
      where: { id: invoiceId },
    });

    return NextResponse.json({
      success: true,
      message: 'Facture supprimée avec succès',
    });

  } catch (error) {
    console.error('Error deleting invoice:', error);
    
    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Facture non trouvée' 
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