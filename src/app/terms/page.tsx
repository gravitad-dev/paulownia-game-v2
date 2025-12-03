"use client";

import { RetroBackground } from "@/components/ui/RetroBackground";
import { LegalDocumentContent } from "@/components/legal/LegalDocumentContent";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="fixed inset-0 bg-[#050a1f] text-foreground selection:bg-primary/30 overflow-hidden">
      <RetroBackground />
      <div className="relative z-10 h-full flex flex-col">
        <div
          className="pt-5 pb-3 px-4 sm:px-5 lg:px-6 mx-auto"
          style={{ maxWidth: "1100px", width: "100%" }}
        >
          <div className="mb-4">
            <Link href="/game">
              <Button variant="outline" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Juego
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-center text-white drop-shadow-md">
              Términos y Condiciones
            </h1>
          </div>
          <div className="bg-card/80 backdrop-blur-sm rounded-lg p-4 shadow-lg">
            <LegalDocumentContent type="terms" />
          </div>
        </div>
      </div>
    </div>
  );
}
