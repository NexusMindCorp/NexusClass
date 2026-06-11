import * as React from "react";
import { Lock } from "lucide-react";

interface BoxRestritoProps {
  titulo?: string;
  mensagem?: string;
  children?: React.ReactNode;
}

export function BoxRestrito({ 
  titulo = "Acesso Restrito", 
  mensagem = "Vocês não tem permissão para visualizar este conteúdo. Entre em contato com o suporte caso seja algum erro.",
  children 
}: BoxRestritoProps) {
  return (
    <div className="relative group w-full max-w-4xl mx-auto overflow-hidden rounded-3xl border border-destructive/20 bg-card/45 backdrop-blur-md p-10 md:p-16 text-center shadow-2xl transition-all duration-300 hover:border-destructive/40 hover:shadow-destructive/8">
      {/* Background decorative gradients */}
      <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-destructive/10 blur-3xl pointer-events-none transition-all duration-500 group-hover:bg-destructive/15" />
      <div className="absolute -bottom-32 -right-32 h-64 w-64 rounded-full bg-primary/10 blur-3xl pointer-events-none transition-all duration-500 group-hover:bg-primary/15" />
      
      <div className="relative z-10 flex flex-col items-center">
        {/* Animated Lock Icon Circle */}
        <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-destructive/10 border border-destructive/20 mb-8 shadow-[0_0_20px_rgba(239,68,68,0.07)] transition-all duration-300 group-hover:scale-105 group-hover:border-destructive/40 group-hover:shadow-[0_0_30px_rgba(239,68,68,0.15)]">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-destructive/20 to-transparent animate-pulse" />
          <Lock className="w-11 h-11 text-destructive relative z-10 transition-transform duration-500 group-hover:rotate-6" />
        </div>

        {/* Title with subtle gradient */}
        <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-red-400 via-rose-500 to-red-500 bg-clip-text text-transparent md:text-4xl mb-4">
          {titulo}
        </h2>

        {/* Description */}
        <p className="text-muted-foreground max-w-xl text-base md:text-lg leading-relaxed mb-8">
          {mensagem}
        </p>

        {/* Extensible actions (buttons, etc.) */}
        {children && (
          <div className="w-full flex justify-center animate-in fade-in slide-in-from-bottom-3 duration-300 delay-100">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

