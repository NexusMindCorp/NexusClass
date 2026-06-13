import { useEffect, useState } from "react";
import type { UsuarioProps } from "@/hooks/useGerenciador";
import type { PerfilUsuario } from "@/hooks/useAuth";
import { useDuvidas, type Duvida } from "@/hooks/useDuvidas";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Paperclip, Download, MessageSquare, Funnel  } from "lucide-react";
import { obterUrlsAnexo, obterNomeArquivoDoUrl } from "./BoxAtividade";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ButtonGroup } from "./ui/button-group";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";


type DuvidasBoxProps = {
    usuario: UsuarioProps|any;
    perfil: PerfilUsuario | null;
};

export function DuvidasBox({ usuario, perfil }: DuvidasBoxProps) {
    const { duvidas, loading, deletarDuvida, responderDuvida } = useDuvidas(perfil);
    const [duvidaSelecionada, setDuvidaSelecionada] = useState<Duvida | null>(null);
    const [textoResposta, setTextoResposta] = useState("");
    const [modalAberto, setModalAberto] = useState(false);
    const [enviandoResposta, setEnviandoResposta] = useState(false);
    const [filtro, setFiltro] = useState("todas");

    const handleEnviarResposta = async () => {
        if (!duvidaSelecionada || !textoResposta.trim()) return;
        try {
            setEnviandoResposta(true);
            await responderDuvida(duvidaSelecionada.id, textoResposta.trim());
            setModalAberto(false);
            setDuvidaSelecionada(null);
            setTextoResposta("");
        } catch (error) {
            console.error("Erro ao enviar resposta:", error);
        } finally {
            setEnviandoResposta(false);
        }
    };

    // Filtrar dúvidas conforme o papel do usuário logado
    const duvidasFiltradas = duvidas.filter((d) => {
        if (!perfil) return false;
        if (perfil.role === "master") return true;
        if (perfil.role === "professor") return d.prof_id === perfil.id;
        return d.aluno_id === perfil.id; 
    });

    useEffect(() => {
        setFiltro("todas");
    }, [perfil]);

    const duvidasFiltradasPorStatus = duvidasFiltradas.filter((d) => {
        if (filtro === "pendentes") return !d.resolvido;
        if (filtro === "resolvidas") return d.resolvido;
        return true;
    });

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-12 min-h-[40vh] w-full">
                <Loader2 className="h-8 w-8 animate-spin text-purple-500 mb-2" />
                <p className="text-sm text-muted-foreground">Carregando canal de dúvidas...</p>
            </div>
        );
    }
    return (
        <div className="mx-auto w-full max-w-3xl space-y-6 min-h-screen pb-16">
            <div className="flex flex-col gap-1.5 border-b border-border/60 pb-4">
                <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-purple-500" />
                    Central de Mensagens / Dúvidas
                </h2>
                <div className="flex items-center gap-39.5">
                    <p className="text-sm text-muted-foreground">
                        {perfil?.role === "professor"
                            ? "Gerencie e delete as dúvidas e contatos diretos enviados pelos seus alunos."
                            : perfil?.role === "master"
                            ? "Painel de administração para monitoramento de dúvidas escolares."
                            : "Acompanhe as dúvidas e mensagens diretas que você enviou aos professores."}
                    </p>
                    <ButtonGroup>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="pl-2!">
                                <p className="text-sm nd flex items-center gap-1">
                                    <Funnel className="h-4 w-4" />
                                    Filtrar
                                </p>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuGroup>
                                    <DropdownMenuItem  onSelect={() => setFiltro("todas")}>
                                        Todos
                                    </DropdownMenuItem>
                                    <DropdownMenuItem  onSelect={() => setFiltro("pendentes")}>
                                        <span className="text-orange-500">Pendente</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setFiltro("resolvidas")}>
                                        <span className="text-green-500">Resolvida</span>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </ButtonGroup>
                </div>
            </div>

            <div className="space-y-4">
                {duvidasFiltradasPorStatus.length > 0 ? (
                    duvidasFiltradasPorStatus.map((duvida) => {
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
                                                {duvida.resolvido ? (
                                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] py-0 px-2 h-5">Resolvida</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] py-0 px-2 h-5">Pendente</Badge>
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
                                    <h4 className="font-bold text-sm text-foreground">Assunto: {duvida.assunto}</h4>
                                    <p className="text-sm text-card-foreground/90 whitespace-pre-wrap leading-relaxed">
                                        Descrição:
                                    </p>
                                    <div className="p-3 bg-muted rounded-md border border-border/80">
                                        <p className="text-sm text-card-foreground/90 whitespace-pre-wrap leading-relaxed">
                                            {duvida.descricao}
                                        </p>
                                    </div>
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

                                {/* Resposta do Professor */}
                                {duvida.resposta && (
                                    <div className="pl-1 pt-3 border-t border-border/40 space-y-2 mt-3">
                                        <div className="flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4 text-purple-500" />
                                            <span className="text-xs font-bold text-foreground">Resposta do Professor:</span>
                                        </div>
                                        <div className="p-3 bg-purple-500/5 rounded-md border border-purple-500/10">
                                            <p className="text-sm text-card-foreground/90 whitespace-pre-wrap leading-relaxed">
                                                {duvida.resposta}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Botão para Responder Dúvida (Somente para Professores ou Master) */}
                                {(isProfessor || isMaster) && (
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 border-purple-500/30 text-purple-600 hover:bg-purple-500/10 hover:text-purple-700 cursor-pointer"
                                            onClick={() => {
                                                setDuvidaSelecionada(duvida);
                                                setTextoResposta(duvida.resposta || "");
                                                setModalAberto(true);
                                            }}
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            {duvida.resolvido ? "Editar Resposta" : "Responder Dúvida"}
                                        </Button>
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

            {/* Modal de resposta da dúvida */}
            <Dialog open={modalAberto} onOpenChange={setModalAberto}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-purple-500" />
                            Responder Dúvida
                        </DialogTitle>
                    </DialogHeader>
                    {duvidaSelecionada && (
                        <div className="space-y-4 py-2">
                            <div>
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Dúvida do Aluno ({duvidaSelecionada.aluno?.nome})</h4>
                                <div className="p-3 bg-muted rounded-md text-sm text-card-foreground/95">
                                    <p className="font-semibold mb-1">Assunto: {duvidaSelecionada.assunto}</p>
                                    <p className="whitespace-pre-wrap">{duvidaSelecionada.descricao}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="resposta-textarea" className="text-sm font-semibold text-foreground">
                                    Sua Resposta:
                                </label>
                                <Textarea
                                    id="resposta-textarea"
                                    placeholder="Digite aqui sua orientação ou resposta para o aluno..."
                                    value={textoResposta}
                                    onChange={(e) => setTextoResposta(e.target.value)}
                                    rows={6}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setModalAberto(false)} disabled={enviandoResposta}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleEnviarResposta}
                            disabled={enviandoResposta || !textoResposta.trim()}
                            className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                        >
                            {enviandoResposta ? "Enviando..." : "Enviar Resposta"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}