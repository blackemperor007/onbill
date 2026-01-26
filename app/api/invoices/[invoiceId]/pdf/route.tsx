"use client"
import confetti from 'canvas-confetti'
import html2canvas from 'html2canvas-pro'
import jsPDF from 'jspdf'
import { ArrowDownFromLine, Building, User, MapPin, Phone, Mail, Calendar } from 'lucide-react'
import React, { useRef } from 'react'

interface InvoiceItem {
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
}

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
    items: InvoiceItem[];
    payments: Array<{
        id: string;
        amount: number;
        paymentDate: string;
        paymentMethod: string;
        reference: string | null;
    }>;
}

interface Totals {
    totalHT: number;
    totalVAT: number;
    totalTTC: number;
}

interface FacturePDFProps {
    invoice: Invoice
    totals: Totals
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

function formatCurrency(amount: number, currency: string = 'Fcfa'): string {
    if (currency === 'Fcfa' || currency === 'XOF') {
        return new Intl.NumberFormat('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount) + ' Fcfa';
    }
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency || 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}

function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
        'PENDING': 'EN ATTENTE',
        'PAID': 'PAYÉE',
        'OVERDUE': 'EN RETARD',
        'CANCELLED': 'ANNULÉE',
        'DRAFT': 'BROUILLON'
    };
    return statusMap[status] || status;
}

function getStatusColor(status: string): string {
    switch (status) {
        case 'PAID': return 'text-green-600 bg-green-100';
        case 'PENDING': return 'text-yellow-600 bg-yellow-100';
        case 'OVERDUE': return 'text-red-600 bg-red-100';
        default: return 'text-gray-600 bg-gray-100';
    }
}

const InvoicePDF: React.FC<FacturePDFProps> = ({ invoice, totals }) => {
    const factureRef = useRef<HTMLDivElement>(null)

    const handleDownloadPdf = async () => {
        const element = factureRef.current
        if (element) {
            try {
                const canvas = await html2canvas(element, { 
                    scale: 3, 
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    logging: false,
                    imageTimeout: 15000
                })
                const imgData = canvas.toDataURL('image/png', 1.0)

                const pdf = new jsPDF({
                    orientation: "portrait",
                    unit: "mm",
                    format: "A4",
                    compress: true
                })

                const pdfWidth = pdf.internal.pageSize.getWidth()
                const pdfHeight = pdf.internal.pageSize.getHeight()
                const imgWidth = canvas.width
                const imgHeight = canvas.height
                
                const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
                const imgX = (pdfWidth - imgWidth * ratio) / 2
                const imgY = (pdfHeight - imgHeight * ratio) / 2

                pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
                pdf.save(`facture-${invoice.invoiceNumber}.pdf`)

                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    zIndex: 9999
                })

            } catch (error) {
                console.error('Erreur lors de la génération du PDF :', error);
            }
        }
    }

    return (
        <div className='mt-4 hidden lg:block'>
            <div className='border-base-300 border-2 border-dashed rounded-xl p-5'>
                <button
                    onClick={handleDownloadPdf}
                    className='btn btn-sm btn-accent mb-4 flex items-center gap-2'>
                    <ArrowDownFromLine className="w-4 h-4" />
                    Télécharger PDF
                </button>

                <div 
                    className='p-8 bg-white shadow-none border border-gray-300 rounded-lg'
                    ref={factureRef}
                    style={{
                        width: '210mm',
                        minHeight: '297mm',
                        margin: '0 auto',
                        boxSizing: 'border-box'
                    }}
                >
                    {/* En-tête avec logo et titre */}
                    <div className='flex justify-between items-start mb-10'>
                        {/* Logo et informations entreprise */}
                        <div className='flex-1'>
                            <div className='flex items-center gap-4 mb-4'>
                                {invoice.company.logo ? (
                                    <img 
                                        src={invoice.company.logo} 
                                        alt={invoice.company.companyName || 'Logo'} 
                                        className='h-16 w-auto object-contain'
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    <div className='flex items-center gap-3'>
                                        <div className='bg-primary text-white rounded-lg p-3'>
                                            <Building className='h-8 w-8' />
                                        </div>
                                        <h2 className='text-2xl font-bold text-gray-900'>
                                            {invoice.company.companyName || 'VOTRE ENTREPRISE'}
                                        </h2>
                                    </div>
                                )}
                            </div>
                            
                            <div className='space-y-1 text-sm text-gray-600'>
                                {invoice.company.address && (
                                    <div className='flex items-start'>
                                        <MapPin className='h-3 w-3 mr-2 mt-1 flex-shrink-0' />
                                        <span>{invoice.company.address}</span>
                                    </div>
                                )}
                                {invoice.company.phone && (
                                    <div className='flex items-center'>
                                        <Phone className='h-3 w-3 mr-2 flex-shrink-0' />
                                        <span>{invoice.company.phone}</span>
                                    </div>
                                )}
                                {invoice.company.companyEmail && (
                                    <div className='flex items-center'>
                                        <Mail className='h-3 w-3 mr-2 flex-shrink-0' />
                                        <span>{invoice.company.companyEmail}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Titre et numéro de facture */}
                        <div className='text-right'>
                            <h1 className='text-4xl font-bold text-gray-900 mb-1'>FACTURE</h1>
                            <div className='text-2xl font-semibold text-primary mb-3'>
                                #{invoice.invoiceNumber}
                            </div>
                            
                            <div className='space-y-1 text-sm'>
                                <div className='flex items-center justify-end'>
                                    <Calendar className='h-4 w-4 mr-2 text-gray-500' />
                                    <span className='font-medium'>Date: </span>
                                    <span className='ml-2'>{formatDate(invoice.issueDate)}</span>
                                </div>
                                <div className='flex items-center justify-end'>
                                    <Calendar className='h-4 w-4 mr-2 text-gray-500' />
                                    <span className='font-medium'>Échéance: </span>
                                    <span className={`ml-2 ${invoice.status === 'OVERDUE' ? 'text-red-600 font-bold' : ''}`}>
                                        {formatDate(invoice.dueDate)}
                                    </span>
                                </div>
                                {invoice.paidDate && (
                                    <div className='flex items-center justify-end text-green-600'>
                                        <Calendar className='h-4 w-4 mr-2' />
                                        <span className='font-medium'>Payée le: </span>
                                        <span className='ml-2'>{formatDate(invoice.paidDate)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Informations client et statut */}
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-10'>
                        {/* Client */}
                        <div className='md:col-span-2'>
                            <div className='bg-gray-50 p-4 rounded-lg border'>
                                <h3 className='text-sm font-bold text-gray-500 uppercase mb-3'>FACTURÉ À</h3>
                                <div className='space-y-2'>
                                    <div className='flex items-center'>
                                        <User className='h-5 w-5 mr-3 text-primary' />
                                        <span className='text-lg font-bold text-gray-900'>{invoice.client.name}</span>
                                    </div>
                                    {invoice.client.address && (
                                        <div className='flex items-start text-sm'>
                                            <MapPin className='h-3 w-3 mr-2 mt-1 flex-shrink-0 text-gray-400' />
                                            <span className='text-gray-600'>{invoice.client.address}</span>
                                        </div>
                                    )}
                                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                                        {invoice.client.email && (
                                            <div className='flex items-center text-sm'>
                                                <Mail className='h-3 w-3 mr-2 flex-shrink-0 text-gray-400' />
                                                <span className='text-gray-600'>{invoice.client.email}</span>
                                            </div>
                                        )}
                                        {invoice.client.phone && (
                                            <div className='flex items-center text-sm'>
                                                <Phone className='h-3 w-3 mr-2 flex-shrink-0 text-gray-400' />
                                                <span className='text-gray-600'>{invoice.client.phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Statut et paiement */}
                        <div>
                            <div className='bg-gray-50 p-4 rounded-lg border'>
                                <h3 className='text-sm font-bold text-gray-500 uppercase mb-3'>STATUT</h3>
                                <div className='space-y-3'>
                                    <div className='flex items-center justify-between'>
                                        <span className='text-sm font-medium'>Statut:</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(invoice.status)}`}>
                                            {getStatusText(invoice.status)}
                                        </span>
                                    </div>
                                    <div className='flex items-center justify-between'>
                                        <span className='text-sm font-medium'>Méthode:</span>
                                        <span className='font-medium'>{invoice.paymentMethod}</span>
                                    </div>
                                    <div className='flex items-center justify-between'>
                                        <span className='text-sm font-medium'>Devise:</span>
                                        <span className='font-medium'>{invoice.company.currency}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tableau des articles */}
                    <div className='mb-10'>
                        <table className='w-full border-collapse'>
                            <thead>
                                <tr className='bg-gray-100 border-b-2 border-gray-300'>
                                    <th className='text-left font-bold text-gray-700 py-3 px-4'>N°</th>
                                    <th className='text-left font-bold text-gray-700 py-3 px-4'>DESCRIPTION</th>
                                    <th className='text-center font-bold text-gray-700 py-3 px-4'>QUANTITÉ</th>
                                    <th className='text-center font-bold text-gray-700 py-3 px-4'>PRIX UNITAIRE</th>
                                    <th className='text-center font-bold text-gray-700 py-3 px-4'>TVA</th>
                                    <th className='text-right font-bold text-gray-700 py-3 px-4'>TOTAL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item, index) => (
                                    <tr 
                                        key={item.id} 
                                        className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                                    >
                                        <td className='py-3 px-4 font-medium'>{index + 1}</td>
                                        <td className='py-3 px-4'>
                                            <div>
                                                <div className='font-medium text-gray-900'>{item.description}</div>
                                                {item.product && (
                                                    <div className='text-sm text-gray-500 mt-1'>
                                                        Produit: {item.product.name}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className='text-center py-3 px-4 font-medium'>
                                            {item.quantity}
                                        </td>
                                        <td className='text-center py-3 px-4 font-medium'>
                                            {formatCurrency(item.unitPrice, invoice.company.currency)}
                                        </td>
                                        <td className='text-center py-3 px-4'>
                                            <span className='font-medium'>{item.taxRate}%</span>
                                        </td>
                                        <td className='text-right py-3 px-4 font-bold'>
                                            {formatCurrency(item.total, invoice.company.currency)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totaux */}
                    <div className='flex justify-end'>
                        <div className='w-full md:w-1/2 lg:w-1/3 space-y-4'>
                            {/* Ligne de séparation */}
                            <div className='border-t border-gray-300 pt-4'></div>
                            
                            {/* Sous-total HT */}
                            <div className='flex justify-between items-center'>
                                <div className='text-lg font-medium text-gray-600'>
                                    Sous-total HT
                                </div>
                                <div className='text-lg font-medium'>
                                    {formatCurrency(invoice.subtotal, invoice.company.currency)}
                                </div>
                            </div>

                            {/* TVA */}
                            <div className='flex justify-between items-center'>
                                <div className='text-lg font-medium text-gray-600'>
                                    TVA ({invoice.items[0]?.taxRate || 20}%)
                                </div>
                                <div className='text-lg font-medium'>
                                    {formatCurrency(invoice.taxAmount, invoice.company.currency)}
                                </div>
                            </div>

                            {/* Ligne de séparation épaisse */}
                            <div className='border-t-2 border-gray-800 pt-2'></div>

                            {/* Total TTC */}
                            <div className='flex justify-between items-center'>
                                <div className='text-2xl font-bold text-gray-900'>
                                    TOTAL TTC
                                </div>
                                <div className='text-2xl font-bold text-gray-900'>
                                    {formatCurrency(invoice.total, invoice.company.currency)}
                                </div>
                            </div>

                            {/* Montants payés et restant */}
                            {invoice.amountPaid > 0 && (
                                <>
                                    <div className='border-t border-gray-300 my-4'></div>
                                    <div className='space-y-3'>
                                        <div className='flex justify-between items-center text-sm'>
                                            <span className='text-gray-600'>Montant payé:</span>
                                            <span className='font-bold text-green-600'>
                                                {formatCurrency(invoice.amountPaid, invoice.company.currency)}
                                            </span>
                                        </div>
                                        <div className='flex justify-between items-center'>
                                            <span className='text-lg font-bold'>RESTE À PAYER:</span>
                                            <span className={`text-xl font-bold ${
                                                invoice.status === 'PAID' ? 'text-green-600' : 
                                                invoice.status === 'OVERDUE' ? 'text-red-600' : 
                                                'text-gray-900'
                                            }`}>
                                                {formatCurrency(invoice.amountDue, invoice.company.currency)}
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
                            <div className='border-t border-gray-300 my-8'></div>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                                {invoice.notes && (
                                    <div>
                                        <h4 className='text-sm font-bold text-gray-500 uppercase mb-3'>NOTES</h4>
                                        <div className='p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-gray-700 whitespace-pre-line'>
                                            {invoice.notes}
                                        </div>
                                    </div>
                                )}
                                {invoice.terms && (
                                    <div>
                                        <h4 className='text-sm font-bold text-gray-500 uppercase mb-3'>CONDITIONS DE PAIEMENT</h4>
                                        <div className='p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-700 whitespace-pre-line'>
                                            {invoice.terms}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {/* Pied de page */}
                    <div className='border-t border-gray-300 my-8'></div>
                    <div className='text-center text-sm text-gray-500'>
                        <p>Merci pour votre confiance !</p>
                        <p className='mt-1'>Pour toute question concernant cette facture, contactez-nous.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default InvoicePDF