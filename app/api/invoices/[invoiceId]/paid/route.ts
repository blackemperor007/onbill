// app/api/invoices/[invoiceId]/paid/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function PUT(
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

    // Mettre à jour la facture comme payée
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        amountPaid: invoice.total,
        amountDue: 0,
        paidDate: new Date(),
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Facture marquée comme payée',
      data: updatedInvoice,
    });

  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
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