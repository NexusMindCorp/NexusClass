import { createPortal } from "react-dom"
import type { PerfilUsuario } from "@/hooks/useAuth"
import { Loader2, Mail, FileText, Calendar, ShieldCheck, X } from "lucide-react"
import { usePerfilUsuario } from "@/hooks/usePerfilUsuario"
import { PerfilAvatar } from "./PerfilAvatar"

type BoxPerfilUsuarioProps = {
    nomeUsuario: string
    onClose: () => void
    currentUserProfile: PerfilUsuario | null
}

export function BoxPerfilUsuario({ nomeUsuario, onClose, currentUserProfile }: BoxPerfilUsuarioProps) {
    const { perfilAlvo, loading, error, ehProprioUsuario } = usePerfilUsuario(nomeUsuario, currentUserProfile)

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 animate-in fade-in duration-200">
            <div className="relative overflow-hidden bg-card text-card-foreground border border-border/80 rounded-2xl w-full max-w-md shadow-2xl transition-all duration-300">
                {/* Cabeçalho decorativo */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-purple-600/20 via-pink-500/20 to-blue-500/20 pointer-events-none" />
                
                {/* Botão de fechar */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-full bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10 cursor-pointer"
                >
                    <X className="h-5 w-5" />
                </button>

                <div className="relative p-6 pt-10 flex flex-col items-center">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Buscando perfil no banco de dados...</p>
                        </div>
                    ) : error ? (
                        <div className="py-8 flex flex-col items-center justify-center text-center">
                            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-3">
                                <X className="h-6 w-6" />
                            </div>
                            <h3 className="font-semibold text-lg">{error}</h3>
                            <p className="text-sm text-muted-foreground mt-1 mb-6">
                                Verifique o nome ou tente novamente mais tarde.
                            </p>
                        </div>
                    ) : perfilAlvo ? (
                        <div className="w-full flex flex-col items-center">
                            {/* Avatar */}
                            <div >
                                <PerfilAvatar
                                    classNameAvatar="h-24 w-24 rounded-full object-cover border"
                                    classNameDiv="h-24 w-24 rounded-full flex items-center justify-center text-white text-3xl font-bold border-4 border-black shadow-lg"
                                    foto={ehProprioUsuario ? perfilAlvo.foto_url : null}
                                    tipo="usuario"
                                    palavra={perfilAlvo.nome}
                                />
                            </div>

                            {/* Nome */}
                            <h2 className="text-2xl font-bold tracking-tight text-foreground text-center mb-1">
                                {perfilAlvo.nome}
                            </h2>

                            {/* Indicador de perfil próprio (se aplicável) */}
                            
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-4">
                                    <ShieldCheck className="h-3 w-3" />
                                    {ehProprioUsuario ? `Seu Perfil (${perfilAlvo.role})`: `Perfil de ${perfilAlvo.role}`}
                                </span>
                            {/* Rodapé com nota de rodapé e botão de Fechar */}
                            <div className="w-full mt-1 pt-2 flex justify-end gap-1">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground/80" />
                                        Membro desde {perfilAlvo.created_at ? new Date(perfilAlvo.created_at).toLocaleDateString("pt-BR", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric"
                                        }) : "Data não disponível"}
                                    </span>
                                </div>


                            {/* Separador */}
                            <div className="w-full border-t border-border/60 my-4" />

                            {/* Campos do perfil */}
                            <div className="w-full space-y-4 text-left">
                                {/* Email de Contato */}
                                <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                                    <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email de Contato</p>
                                        <p className="text-sm font-medium text-foreground break-all">{perfilAlvo.email}</p>
                                    </div>
                                </div>

                                {/* Bio */}
                                <div className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                                    <div className="w-full">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Biografia</p>
                                        <p className="text-sm text-foreground italic whitespace-pre-wrap leading-relaxed mt-0.5">
                                            {perfilAlvo.bio || "Nenhuma biografia adicionada."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )

    return createPortal(modalContent, document.body)
}
