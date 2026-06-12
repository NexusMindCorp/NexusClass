import type { UsuarioProps } from "@/hooks/useGerenciador";
import type { PerfilUsuario } from "@/hooks/useAuth";
import { useDuvidas } from "@/hooks/useDuvidas";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Paperclip, Download, MessageSquare } from "lucide-react";
import { obterUrlsAnexo, obterNomeArquivoDoUrl } from "./BoxAtividade";

type DuvidasBoxProps = {
    usuario: UsuarioProps|any;
    perfil: PerfilUsuario | null;
};

export function DuvidasBox({ usuario, perfil }: DuvidasBoxProps) {
    const { duvidas, loading, deletarDuvida } = useDuvidas(perfil);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[40vh] w-full">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
                <p className="text-sm text-muted-foreground">Carregando canal de dúvidas...</p>
            </div>
        );
    }

    // Filtrar dúvidas conforme o papel do usuário logado
    const duvidasFiltradas = duvidas.filter((d) => {
        if (!perfil) return false;
        if (perfil.role === "master") return true;
        if (perfil.role === "professor") return d.prof_id === perfil.id;
        return d.aluno_id === perfil.id; // Aluno vê apenas suas próprias dúvidas
    });

    return (
        <div className="mx-auto w-full max-w-3xl space-y-6 min-h-screen pb-16">
            <div className="flex flex-col gap-1.5 border-b border-border/60 pb-4">
                <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-purple-500" />
                    Central de Mensagens / Dúvidas
                </h2>
                <p className="text-sm text-muted-foreground">
                    {perfil?.role === "professor"
                        ? "Gerencie e delete as dúvidas e contatos diretos enviados pelos seus alunos."
                        : perfil?.role === "master"
                        ? "Painel de administração para monitoramento de dúvidas escolares."
                        : "Acompanhe as dúvidas e mensagens diretas que você enviou aos professores."}
                </p>
            </div>

            <div className="space-y-4">
                {duvidasFiltradas.length > 0 ? (
                    duvidasFiltradas.map((duvida) => {
                        const attachments = obterUrlsAnexo(duvida.anexo_url);
                        const isProfessor = perfil?.role === "professor";
                        const isMaster = perfil?.role === "master";
                        const isOwner = perfil?.id === duvida.aluno_id;

                        return (
                            <Card key={duvida.id} className="p-5 shadow-sm border border-border/60 hover:shadow-md transition-shadow duration-200 space-y-4">
                                {/* Header da Dúvida */}
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-semibold text-sm text-foreground">
                                                    {isProfessor || isMaster
                                                        ? `De: ${duvida.aluno?.nome || "Aluno Anônimo"}`
                                                        : `Para Prof: ${duvida.professor?.nome || "Professor"}`}
                                                </span>
                                                {duvida.turma && (
                                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border/80">
                                                        {duvida.turma.materia} • {duvida.turma.turma}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground mt-0.5">
                                                Enviado em {new Date(duvida.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Botão Deletar (somente autor, professor destinatário ou master) */}
                                    {(isOwner || isProfessor || isMaster) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deletarDuvida(duvida.id)}
                                            className="h-8 w-8 p-0 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer shrink-0"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                {/* Assunto e Descrição */}
                                <div className="space-y-1.5 pl-1">
                                    <h4 className="font-bold text-sm text-foreground">{duvida.assunto}</h4>
                                    <p className="text-sm text-card-foreground/90 whitespace-pre-wrap leading-relaxed">
                                        {duvida.descricao}
                                    </p>
                                </div>

                                {/* Anexos da dúvida */}
                                {attachments.length > 0 && (
                                    <div className="pl-1 pt-1 space-y-1.5 border-t border-border/40 mt-3 pt-3">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Arquivos Anexados</p>
                                        <div className="flex flex-wrap gap-2">
                                            {attachments.map((url, idx) => (
                                                <a
                                                    key={idx}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/40 text-xs text-foreground hover:bg-muted transition-colors max-w-xs truncate"
                                                >
                                                    <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />
                                                    <span className="truncate">{obterNomeArquivoDoUrl(url)}</span>
                                                    <Download className="h-3 w-3 ml-0.5 text-muted-foreground shrink-0" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })
                ) : (
                    <Card className="p-8 text-center border border-dashed border-border/80">
                        <div className="flex flex-col items-center justify-center space-y-2.5 p-4">
                            <MessageSquare className="h-10 w-10 text-muted-foreground opacity-60" />
                            <h4 className="font-bold text-sm text-foreground">Nenhuma dúvida registrada</h4>
                            <p className="text-xs text-muted-foreground max-w-sm">
                                {perfil?.role === "professor"
                                    ? "Excelente! Nenhuma dúvida ou mensagem direta de alunos pendente para você nesta matéria."
                                    : "Caso tenha alguma dúvida técnica sobre as matérias, use o botão 'Entrar em contato' no Mural da sua turma."}
                            </p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
}