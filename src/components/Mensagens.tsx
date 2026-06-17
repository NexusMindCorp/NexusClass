import { useState, useEffect, useRef } from "react";
import type{ MensagensProps } from "@/hooks/MensagensHooks/type";
import { useMensagens } from "@/hooks/MensagensHooks/useMensagens";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, Info } from "lucide-react";
import { PerfilAvatar } from "./PerfilAvatar";

export function Mensagens({ perfil, chatAtivoId, listaEscolar }: MensagensProps) {
    const { mensagens, conversas, enviarMensagem, marcarComoLidas } = useMensagens(perfil);
    const [contatoAtivo, setContatoAtivo] = useState<string | null>(chatAtivoId);
    const [texto, setTexto] = useState("");
    const mensagensEndRef = useRef<HTMLDivElement>(null);

    const obterInfoUsuario = (id: string) => {
        if (!listaEscolar?.turmas) return { nome: "Usuário", foto: null };

        for (const turma of Object.values(listaEscolar.turmas)) {
            if (turma.professor_id === id) return { nome: turma.professor, foto: turma.foto_professor };

            const aluno = turma.alunos?.find((a) => a.id === id);
            if (aluno) return { nome: aluno.nome, foto: aluno.foto_url };
        }
        return { nome: "Usuário Desconhecido", foto: null };
    };

    useEffect(() => {
        if (chatAtivoId) {
            setContatoAtivo(chatAtivoId);
        }
    }, [chatAtivoId]);

    useEffect(() => {
        if (contatoAtivo) {
            void marcarComoLidas(contatoAtivo);
            mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [contatoAtivo, mensagens, marcarComoLidas]);

    const handleEnviar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!texto.trim() || !contatoAtivo) return;

        const conteudo = texto;
        setTexto("");
        await enviarMensagem(contatoAtivo, conteudo);
    };

    const mensagensDoChat = mensagens.filter(
        (msg) =>
            (msg.remetente_id === perfil?.id && msg.destinatario_id === contatoAtivo) ||
            (msg.remetente_id === contatoAtivo && msg.destinatario_id === perfil?.id)
    );

    const infoContatoAtivo = contatoAtivo ? obterInfoUsuario(contatoAtivo) : null;

    return (
        <div className="flex h-[75vh] w-full max-w-5xl rounded-xl border border-border bg-card overflow-hidden shadow-sm mx-auto">
            {/* BARRA LATERAL: Lista de Conversas */}
            <div className="w-1/3 min-w-[250px] border-r border-border flex flex-col bg-muted/20">
                <div className="p-4 border-b border-border bg-card">
                    <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                        <MessageCircle className="h-5 w-5 text-primary" />
                        Mensagens
                    </h2>
                </div>
                <ScrollArea className="flex-1">
                    {conversas.length === 0 ? (
                        <div className="p-6 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                            <Info className="h-8 w-8 opacity-50" />
                            <p>Ainda não iniciou nenhuma conversa.</p>
                            <p className="text-xs">Vá à lista de alunos da sua turma e clique em "Enviar mensagem".</p>
                        </div>
                    ) : (
                        conversas.map((conversa) => {
                            const info = obterInfoUsuario(conversa.usuarioId);
                            const selecionado = contatoAtivo === conversa.usuarioId;

                            return (
                                <div
                                    key={conversa.usuarioId}
                                    onClick={() => setContatoAtivo(conversa.usuarioId)}
                                    className={`flex items-center gap-3 p-3 border-b border-border cursor-pointer transition-colors ${selecionado ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/50"
                                        }`}
                                >
                                    <PerfilAvatar
                                        classNameAvatar="h-12 w-12 rounded-full object-cover shadow-sm"
                                        classNameDiv="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                                        foto={info.foto}
                                        tipo="usuario"
                                        palavra={info.nome}
                                    />
                                    <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-sm truncate text-foreground">{info.nome}</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {new Date(conversa.dataUltimaMensagem).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs text-muted-foreground truncate pr-2">
                                                {conversa.ultimaMensagem}
                                            </p>
                                            {conversa.mensagensNaoLidas > 0 && (
                                                <span className="bg-primary text-primary-foreground text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shrink-0">
                                                    {conversa.mensagensNaoLidas}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </ScrollArea>
            </div>

            {/* ÁREA PRINCIPAL: O Chat Ativo */}
            <div className="flex-1 flex flex-col bg-background/50">
                {contatoAtivo && infoContatoAtivo ? (
                    <>
                        {/* Cabeçalho do Chat */}
                        <div className="h-16 border-b border-border bg-card flex items-center px-4 gap-3 shadow-sm z-10">
                            <PerfilAvatar
                                classNameAvatar="h-10 w-10 rounded-full object-cover"
                                classNameDiv="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                                foto={infoContatoAtivo.foto}
                                tipo="usuario"
                                palavra={infoContatoAtivo.nome}
                            />
                            <span className="font-bold text-foreground">{infoContatoAtivo.nome}</span>
                        </div>

                        {/* Balões de Mensagem */}
                        <ScrollArea className="flex-1 p-4">
                            <div className="flex flex-col gap-3">
                                {mensagensDoChat.length === 0 ? (
                                    <div className="text-center text-muted-foreground text-sm mt-10 bg-muted/50 w-fit mx-auto px-4 py-2 rounded-full border border-border">
                                        Envie a primeira mensagem para iniciar a conversa.
                                    </div>
                                ) : (
                                    mensagensDoChat.map((msg) => {
                                        const souEu = msg.remetente_id === perfil?.id;
                                        return (
                                            <div key={msg.id} className={`flex flex-col ${souEu ? "items-end" : "items-start"}`}>
                                                <div
                                                    className={`max-w-[75%] px-4 py-2 rounded-2xl ${souEu
                                                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                                                        : "bg-muted-foreground/30 border border-border text-foreground rounded-tl-sm shadow-sm"
                                                        }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap break-words">{msg.conteudo}</p>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={mensagensEndRef} />
                            </div>
                        </ScrollArea>

                        {/* Input de Envio */}
                        <div className="p-3 bg-card border-t border-border">
                            <form onSubmit={handleEnviar} className="flex gap-2 items-center">
                                <Input
                                    value={texto}
                                    onChange={(e) => setTexto(e.target.value)}
                                    placeholder="Escreva uma mensagem..."
                                    className="flex-1 bg-muted/50 border-border focus-visible:ring-primary"
                                    autoFocus
                                />
                                <Button type="submit" size="icon" disabled={!texto.trim()} className="rounded-full h-10 w-10 shrink-0">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-muted/10">
                        <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <MessageCircle className="h-12 w-12 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">NexusClass Web</h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Selecione uma conversa ao lado ou vá ao Mural da sua turma para iniciar uma nova conversa com um colega ou professor.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
