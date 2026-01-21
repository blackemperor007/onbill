"use client"
 
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Home, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-6">
            <FileText className="h-16 w-16 text-primary" />
          </div>
          <div className="space-y-4">
            <h1 className="text-7xl font-bold tracking-tighter bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              404
            </h1>
            <h2 className="text-3xl font-bold">Page non trouvée</h2>
            <p className="text-muted-foreground text-lg">
              La page que vous recherchez semble s'être égarée dans les méandres de la facturation
            </p>
          </div>
        </div>

        <Card className="border-2 border-dashed">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Il semble que la page que vous essayez d'atteindre n'existe pas ou a été déplacée.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-muted/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Search className="h-5 w-5 text-blue-600" />
                      </div>
                      <h3 className="font-semibold">Vérifiez l'URL</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Assurez-vous que l'URL est correctement orthographiée.
                      Les erreurs de frappe sont courantes.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-muted/30">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <h3 className="font-semibold">Factures récentes</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Peut-être cherchiez-vous une facture spécifique ?
                      Consultez votre liste de factures.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="border-t pt-6">
                <h4 className="text-sm font-medium mb-4 text-center">
                  Voici ce que vous pouvez faire :
                </h4>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button asChild className="gap-2">
                    <Link href="/dashboard">
                      <Home className="h-4 w-4" />
                      Tableau de bord
                    </Link>
                  </Button>
                  
                  <Button variant="outline" asChild className="gap-2">
                    <Link href="/invoices">
                      <FileText className="h-4 w-4" />
                      Voir les factures
                    </Link>
                  </Button>
                  
                  <Button variant="ghost" asChild className="gap-2">
                    <Link href="/">
                      <ArrowLeft className="h-4 w-4" />
                      Retour à l'accueil
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Besoin d'aide ?{" "}
                  <Link 
                    href="/contact" 
                    className="text-primary hover:underline font-medium"
                  >
                    Contactez notre support
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Décoration graphique */}
        <div className="mt-8 flex justify-center gap-4 opacity-50">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-2 w-2 rounded-full bg-primary"
              style={{
                animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}