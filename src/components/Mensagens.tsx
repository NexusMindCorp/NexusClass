import { Fragment, useState, useEffect, useRef } from "react";
import type { MensagensProps } from "@/hooks/MensagensHooks/type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  MessageCircle,
  Info,
  MoreVertical,
  Trash2,
  User2,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { PerfilAvatar } from "./PerfilAvatar";
import { BoxPerfilUsuario } from "@/components/BoxPerfilUsuario";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  formatarDataRelativa,
  formatarDataUltimaMensagem,
  obterChaveDataLocal,
} from "@/lib/utils";

export function Mensagens({
  perfil,
  chatAtivoId,
  listaEscolar,
  mensagens,
  conversas,
  enviarMensagem,
  marcarComoLidas,
  excluirConversa,
}: MensagensProps) {
  const [contatoAtivo, setContatoAtivo] = useState<string | null>(chatAtivoId);
  const [texto, setTexto] = useState("");
  const [perfilContatoAberto, setPerfilContatoAberto] = useState(false);
  const [confirmacaoExclusaoAberta, setConfirmacaoExclusaoAberta] =
    useState(false);
  const mensagensScrollRef = useRef<HTMLDivElement>(null);
  const naoLidasDoContatoAtivo = mensagens.filter(
    (msg) =>
      !msg.lida &&
      msg.remetente_id === contatoAtivo &&
      msg.destinatario_id === perfil?.id,
  ).length;

  const obterInfoUsuario = (id: string) => {
    if (!listaEscolar?.turmas) return { nome: "Usuário", foto: null };

    for (const turma of Object.values(listaEscolar.turmas)) {
      if (turma.professor_id === id)
        return { nome: turma.professor, foto: turma.foto_professor };

      const aluno = turma.alunos?.find((a) => a.id === id);
      if (aluno) return { nome: aluno.nome, foto: aluno.foto_url };
    }
    return { nome: "Usuário Desconhecido", foto: null };
  };

  useEffect(() => {
    if (contatoAtivo && naoLidasDoContatoAtivo > 0) {
      void marcarComoLidas(contatoAtivo);
    }
  }, [contatoAtivo, marcarComoLidas, naoLidasDoContatoAtivo]);

  useEffect(() => {
    const areaMensagens = mensagensScrollRef.current;
    if (!areaMensagens) return;

    areaMensagens.scrollTo({
      top: areaMensagens.scrollHeight,
      behavior: "smooth",
    });
  }, [contatoAtivo, mensagens]);

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim() || !contatoAtivo) return;

    const conteudo = texto;
    setTexto("");
    await enviarMensagem(contatoAtivo, conteudo);
  };

  const mensagensDoChat = mensagens.filter(
    (msg) =>
      (msg.remetente_id === perfil?.id &&
        msg.destinatario_id === contatoAtivo) ||
      (msg.remetente_id === contatoAtivo && msg.destinatario_id === perfil?.id),
  );

  const infoContatoAtivo = contatoAtivo ? obterInfoUsuario(contatoAtivo) : null;

  const handleExcluirConversa = () => {
    if (!contatoAtivo) return;

    excluirConversa(contatoAtivo);
    setConfirmacaoExclusaoAberta(false);
    setContatoAtivo(null);
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-5.5rem)] min-h-[28rem] w-full max-w-5xl overflow-hidden rounded-xl border border-border bg-card shadow-sm md:h-[75vh]">
      {/* BARRA LATERAL: Lista de Conversas */}
      <div
        className={`${contatoAtivo ? "hidden md:flex" : "flex"} min-h-0 w-full flex-col bg-muted/20 md:w-1/3 md:min-w-[250px] md:border-r md:border-border`}
      >
        <div className="shrink-0 p-4 border-b border-border bg-card">
          <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <MessageCircle className="h-5 w-5 text-primary" />
            Mensagens
          </h2>
        </div>
        <ScrollArea className="min-h-0 flex-1">
          {conversas.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <Info className="h-8 w-8 opacity-50" />
              <p>Ainda não iniciou nenhuma conversa.</p>
              <p className="text-xs">
                Vá à lista de alunos da sua turma e clique em "Enviar mensagem".
              </p>
            </div>
          ) : (
            conversas.map((conversa) => {
              const info = obterInfoUsuario(conversa.usuarioId);
              const selecionado = contatoAtivo === conversa.usuarioId;

              return (
                <div
                  key={conversa.usuarioId}
                  onClick={() => setContatoAtivo(conversa.usuarioId)}
                  className={`flex items-center gap-3 p-3 border-b border-border cursor-pointer transition-colors ${
                    selecionado
                      ? "bg-primary/10 hover:bg-primary/15"
                      : "hover:bg-muted/50"
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
                      <span className="font-semibold text-sm truncate text-foreground">
                        {info.nome}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatarDataUltimaMensagem(
                          conversa.dataUltimaMensagem,
                        )}
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
      <div
        className={`${contatoAtivo ? "flex" : "hidden md:flex"} min-h-0 min-w-0 flex-1 flex-col bg-background/50`}
      >
        {contatoAtivo && infoContatoAtivo ? (
          <>
            {/* Cabeçalho do Chat */}
            <div className="z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card px-2 shadow-sm sm:gap-3 sm:px-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
                onClick={() => setContatoAtivo(null)}
                aria-label="Voltar para as conversas"
                title="Voltar para as conversas"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <PerfilAvatar
                classNameAvatar="h-10 w-10 rounded-full object-cover"
                classNameDiv="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                foto={infoContatoAtivo.foto}
                tipo="usuario"
                palavra={infoContatoAtivo.nome}
              />
              <span className="min-w-0 truncate font-bold text-foreground">
                {infoContatoAtivo.nome}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-9 w-9 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                    title="Opções da conversa"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => setPerfilContatoAberto(true)}
                    className="cursor-pointer"
                  >
                    <User2 className="mr-2 h-4 w-4" />
                    Ver perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setConfirmacaoExclusaoAberta(true)}
                    className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Apagar conversa
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Balões de Mensagem */}
            <div
              ref={mensagensScrollRef}
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4"
            >
              <div className="flex min-h-full flex-col gap-3">
                {mensagensDoChat.length === 0 ? (
                  <div className="text-center text-muted-foreground text-sm mt-10 bg-muted/50 w-fit mx-auto px-4 py-2 rounded-full border border-border">
                    Envie a primeira mensagem para iniciar a conversa.
                  </div>
                ) : (
                  mensagensDoChat.map((msg, index) => {
                    const souEu = msg.remetente_id === perfil?.id;
                    const mensagemAnterior = mensagensDoChat[index - 1];
                    const mostrarSeparador =
                      !mensagemAnterior ||
                      obterChaveDataLocal(mensagemAnterior.created_at) !==
                        obterChaveDataLocal(msg.created_at);

                    return (
                      <Fragment key={msg.id}>
                        {mostrarSeparador && (
                          <div className="my-2 flex items-center justify-center">
                            <span className="rounded-full border border-border bg-card/90 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-sm">
                              {formatarDataRelativa(msg.created_at)}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex flex-col ${souEu ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`max-w-[85%] px-4 py-2 rounded-2xl sm:max-w-[75%] ${
                              souEu
                                ? "bg-primary text-primary-foreground rounded-tr-sm"
                                : "bg-muted-foreground/30 border border-border text-foreground rounded-tl-sm shadow-sm"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.conteudo}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1 px-1">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </Fragment>
                    );
                  })
                )}
              </div>
            </div>

            {/* Input de Envio */}
            <div className="shrink-0 border-t border-border bg-card p-2 sm:p-3">
              <form onSubmit={handleEnviar} className="flex gap-2 items-center">
                <Input
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="Escreva uma mensagem..."
                  className="flex-1 bg-muted/50 border-border focus-visible:ring-primary"
                  autoFocus
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!texto.trim()}
                  className="rounded-full h-10 w-10 shrink-0"
                >
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
            <h3 className="text-xl font-bold text-foreground mb-2">
              NexusClass Web
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Selecione uma conversa ao lado ou vá ao Mural da sua turma para
              iniciar uma nova conversa com um colega ou professor.
            </p>
          </div>
        )}
      </div>

      {perfilContatoAberto && infoContatoAtivo ? (
        <BoxPerfilUsuario
          nomeUsuario={infoContatoAtivo.nome}
          onClose={() => setPerfilContatoAberto(false)}
          currentUserProfile={perfil}
        />
      ) : null}

      <Dialog
        open={confirmacaoExclusaoAberta}
        onOpenChange={setConfirmacaoExclusaoAberta}
      >
        <DialogContent className="mensagens-dialog-exclusao sm:max-w-md">
          <DialogHeader className="items-center text-center sm:text-center">
            <div className="mensagens-dialog-exclusao-icone">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <DialogTitle>Apagar esta conversa?</DialogTitle>
            <DialogDescription>
              A conversa com {infoContatoAtivo?.nome ?? "este usuário"} será
              removida da sua lista. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setConfirmacaoExclusaoAberta(false)}
            >
              Cancelar
            </Button>
            <Button
              className="mensagens-botao-confirmar-exclusao cursor-pointer"
              onClick={handleExcluirConversa}
            >
              <Trash2 className="h-4 w-4" />
              Apagar conversa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
