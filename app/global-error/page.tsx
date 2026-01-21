"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="inline-flex items-center justify-center p-4 rounded-full bg-destructive/10 mb-6">
              <AlertTriangle className="h-16 w-16 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold mb-4">Une erreur est survenue</h1>
            <p className="text-muted-foreground mb-6">
              Désolé, une erreur inattendue s'est produite. Notre équipe a été notifiée.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={reset} className="gap-2">
                Réessayer
              </Button>
              <Button variant="outline" asChild>
                <Link href="/dashboard">Retour au tableau de bord</Link>
              </Button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}