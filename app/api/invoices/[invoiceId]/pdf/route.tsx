// app/api/invoices/[id]/pdf/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        companyId: user.company.id,
      },
      include: {
        company: true,
        client: true,
        items: true,
      }
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Facture non trouvée' },
        { status: 404 }
      );
    }

    // Créer le PDF (similaire à votre code)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const FULL_WIDTH = 211;
    const COLOR_CODE = "#3b82f6"; // Bleu Tailwind

    // En-tête
    doc.setFillColor(COLOR_CODE);
    doc.rect(0, 0, FULL_WIDTH, 15, "F");
    
    // Logo de l'entreprise
    if (invoice.company.logo) {
      // Vous devrez convertir/charger l'image selon votre stockage
      // doc.addImage(logoData, 'PNG', 15, 20, 60, 15);
    }
    
    doc.setTextColor("#ffffff");
    doc.setFontSize(20);
    doc.text("FACTURE", FULL_WIDTH - 15, 12, { align: 'right' });
    
    doc.setTextColor("#000000");
    
    // Informations de l'entreprise
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(invoice.company.companyName || 'Votre entreprise', 15, 30);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (invoice.company.address) {
      doc.text(invoice.company.address, 15, 37);
    }
    if (invoice.company.phone) {
      doc.text(`Tél: ${invoice.company.phone}`, 15, 44);
    }
    if (invoice.company.companyEmail) {
      doc.text(`Email: ${invoice.company.companyEmail}`, 15, 51);
    }

    // Informations de la facture
    doc.text(`Facture N°: ${invoice.invoiceNumber}`, FULL_WIDTH - 15, 30, { align: 'right' });
    doc.text(`Date: ${format(new Date(invoice.issueDate), 'dd/MM/yyyy', { locale: fr })}`, FULL_WIDTH - 15, 37, { align: 'right' });
    doc.text(`Échéance: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy', { locale: fr })}`, FULL_WIDTH - 15, 44, { align: 'right' });

    // Client
    doc.setFont('helvetica', 'bold');
    doc.text("FACTURÉ À:", 15, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.client.name, 15, 72);
    if (invoice.client.address) {
      doc.text(invoice.client.address, 15, 79);
    }
    if (invoice.client.email) {
      doc.text(invoice.client.email, 15, 86);
    }

    // ... Ajoutez le reste du contenu (tableau des articles, totaux, etc.)

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="facture-${invoice.invoiceNumber}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}