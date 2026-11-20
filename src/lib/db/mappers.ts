import type { PerfilUsuario, TurmaProfessor } from "@/hooks/AuthHooks/type";
import type { EventoCalendario } from "@/hooks/CalendarioHooks/type";
import type {
  Duvida,
  DuvidaAlunoInfo,
  DuvidaProfessorInfo,
  DuvidaRegistroBanco,
} from "@/hooks/DuvidaHooks/type";
import type { Entrega, EntregaRowComPerfil } from "@/hooks/EntregasHooks/type";
import type { PayloadAlertaCalendario } from "@/hooks/GerenciadorHooks/type";
import type { TurmaProps, UsuarioResumo } from "@/hooks/LeituraDataHooks/type";
import type { Mensagem } from "@/hooks/MensagensHooks/type";
import type { Atividade, Post } from "@/hooks/MuralHooks/type";
import type { TabelaRow } from "@/lib/database.types";

/**
 * Referência normalizada (1FN) de um arquivo no Supabase Storage vinculado a
 * uma tabela de anexos (`atividade_anexo`, `duvida_anexo`, `ticket_suporte_anexo`).
 */
export type AnexoRef = {
  idObjeto: string;
  caminho: string;
  nome: string;
  urlAssinada?: string;
};

/**
 * Normaliza retornos de joins do PostgREST que podem vir como objeto único,
 * array com 1 item ou `null`/`undefined`.
 */
export function umOuPrimeiro<T>(valor: T | T[] | null | undefined): T | null {
  if (Array.isArray(valor)) {
    return valor[0] ?? null;
  }
  return valor ?? null;
}

/**
 * Extrai o nome legível do arquivo a partir do caminho completo no bucket,
 * removendo o prefixo de timestamp (`1700000000000-`) quando presente.
 */
export function extrairNomeArquivoStorage(caminho: string | null | undefined): string {
  if (!caminho) return "Arquivo anexo";
  const segmentoFinal = caminho.split("/").pop() ?? "";
  const limpo = segmentoFinal.replace(/^\d+-/, "");
  return limpo || segmentoFinal || "Arquivo anexo";
}

/**
 * Converte um identificador textual de domínio (`string`) para a chave
 * inteira `SERIAL` esperada pelo esquema SQL.
 */
export function paraInteiroId(id: string | number, nomeCampo = "id"): number {
  const numero = typeof id === "number" ? id : Number(id);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw new Error(`Identificador inválido para ${nomeCampo}: "${String(id)}".`);
  }
  return numero;
}

/**
 * Converte uma linha da tabela `perfil` para o modelo de domínio `PerfilUsuario`.
 */
export function mapPerfil(row: TabelaRow<"perfil">): PerfilUsuario {
  const roleValida: PerfilUsuario["role"] =
    row.role === "professor" || row.role === "master" ? row.role : "aluno";

  return {
    id: row.id_perfil,
    nome: row.nome,
    email: row.email,
    foto_url: row.foto_url,
    bio: row.bio,
    created_at: row.created_at,
    role: roleValida,
    id_escola: row.id_escola !== null ? String(row.id_escola) : null,
  };
}

/**
 * Converte uma linha da tabela `turma` para `TurmaProfessor` (usado pelo docente autenticado).
 */
export function mapTurmaProfessor(
  row: TabelaRow<"turma">,
  nomeProfessor: string,
): TurmaProfessor {
  return {
    id: String(row.id_turma),
    chave: row.codigo_acesso,
    materia: row.materia,
    professor: nomeProfessor,
    sala: row.sala,
    turma: row.periodo_escolar,
  };
}

/**
 * Converte uma linha da tabela `turma` + vínculos de professor e alunos para `TurmaProps`.
 */
export function mapTurmaProps(
  row: TabelaRow<"turma">,
  professor: { id?: string; nome: string; foto_url: string | null },
  alunos: UsuarioResumo[],
): TurmaProps {
  return {
    id: String(row.id_turma),
    id_escola: String(row.id_escola),
    materia: row.materia,
    professor: professor.nome,
    professor_id: professor.id,
    banners: row.banner_url ?? "",
    alunos,
    foto_professor: professor.foto_url ?? "",
    sala: row.sala,
    turma: row.periodo_escolar,
  };
}

/**
 * Converte uma linha de `mural_post` + autor para o modelo `Post` da UI.
 */
export function mapPostMural(
  row: Pick<TabelaRow<"mural_post">, "id_post" | "conteudo" | "created_at">,
  autorRow: TabelaRow<"perfil"> | TabelaRow<"perfil">[] | null | undefined,
): Post {
  const autorPerfil = umOuPrimeiro(autorRow);
  const autor = autorPerfil ? mapPerfil(autorPerfil) : null;

  return {
    id: String(row.id_post),
    Nome: autor?.nome || "Anônimo",
    conteudo: row.conteudo,
    data: new Date(row.created_at).toLocaleString("pt-BR"),
    autor,
  };
}

/**
 * Converte uma linha de `atividade` + nome do professor + anexos 1FN para `Atividade`.
 */
export function mapAtividade(
  row: TabelaRow<"atividade">,
  professorRel:
    | { nome?: string | null }
    | Array<{ nome?: string | null }>
    | null
    | undefined,
  anexos: AnexoRef[] = [],
  fallbackProfessorNome = "Professor",
): Atividade {
  const perfilProf = umOuPrimeiro(professorRel);

  return {
    id: String(row.id_atividade),
    turma_id: String(row.id_turma),
    professor_id: row.id_professor,
    titulo: row.titulo,
    descricao: row.descricao,
    data_entrega: row.data_entrega,
    created_at: null,
    anexos,
    professor_nome: perfilProf?.nome || fallbackProfessorNome,
  };
}

/**
 * Calcula se a entrega foi feita dentro do prazo comparando `entregue_em` com
 * `data_entrega` da atividade pai.
 */
export function calcularEntregaNoPrazo(
  entregueEm: string,
  dataEntregaAtividade: string | null | undefined,
): boolean {
  if (!dataEntregaAtividade) return true;
  const tsEntrega = new Date(entregueEm).getTime();
  const tsPrazo = new Date(dataEntregaAtividade).getTime();
  if (Number.isNaN(tsEntrega) || Number.isNaN(tsPrazo)) return true;
  return tsEntrega <= tsPrazo;
}

/**
 * Converte uma linha de `entrega_atividade` (opcionalmente com join de perfil e
 * caminho resolvido via `v_storage_objetos`) para o modelo `Entrega`.
 */
export function mapEntrega(
  row: EntregaRowComPerfil | TabelaRow<"entrega_atividade">,
  opcoes: {
    dataEntregaAtividade?: string | null;
    caminhoArquivo?: string | null;
  } = {},
): Entrega {
  const perfilRel = "perfil" in row ? umOuPrimeiro(row.perfil) : null;
  const caminho = opcoes.caminhoArquivo ?? null;

  return {
    id: String(row.id_entrega),
    atividade_id: String(row.id_atividade),
    aluno_id: row.id_aluno,
    id_objeto_storage: row.id_objeto_storage,
    caminho_arquivo: caminho,
    nome_arquivo: extrairNomeArquivoStorage(caminho),
    nota: row.nota,
    feedback: row.feedback,
    no_prazo: row.atraso == null
      ? calcularEntregaNoPrazo(row.entregue_em, opcoes.dataEntregaAtividade)
      : !row.atraso,
    entregue_em: row.entregue_em,
    ...(perfilRel !== null ? { aluno_nome: perfilRel?.nome || "Aluno Anônimo" } : {}),
  };
}

/**
 * Converte uma linha de `duvida` + relacionamentos + anexos 1FN para `Duvida`.
 */
export function mapDuvida(
  row: DuvidaRegistroBanco,
  anexos: AnexoRef[] = [],
): Duvida {
  const alunoRel: DuvidaAlunoInfo | null = umOuPrimeiro(row.aluno);
  const profRel: DuvidaProfessorInfo | null = umOuPrimeiro(row.professor);
  const turmaRel = umOuPrimeiro(row.turma);

  return {
    id: String(row.id_duvida),
    aluno_id: row.id_aluno,
    prof_id: row.id_professor,
    turma_id: String(row.id_turma),
    assunto: row.assunto,
    descricao: row.descricao,
    anexos,
    created_at: row.created_at,
    resolvido: row.resolveu,
    resposta: row.resposta,
    aluno: alunoRel ?? undefined,
    professor: profRel ?? undefined,
    turma: turmaRel
      ? {
          materia: turmaRel.materia,
          turma: turmaRel.periodo_escolar,
        }
      : undefined,
  };
}

/**
 * Converte uma linha de `evento_calendario` para `EventoCalendario`.
 */
export function mapEventoCalendario(
  row: TabelaRow<"evento_calendario">,
): EventoCalendario {
  return {
    id: String(row.id_evento),
    titulo: row.titulo,
    descricao: row.descricao,
    data: row.data,
    horario: row.horario.slice(0, 5),
    tipo: row.tipo === "turma" ? "turma" : "pessoal",
    turma_id: row.id_turma !== null ? String(row.id_turma) : null,
    autor_id: row.id_autor,
  };
}

/**
 * Converte uma linha de `alerta_calendario` para `PayloadAlertaCalendario`.
 */
export function mapAlertaCalendario(
  row: TabelaRow<"alerta_calendario">,
  tituloEvento?: string,
): PayloadAlertaCalendario {
  return {
    id: String(row.id_alerta),
    evento_id: String(row.id_evento),
    mensagem: row.mensagem,
    minutos_antes: row.minutos_antes,
    lembrete_para: row.lembrete_para,
    ...(tituloEvento ? { titulo_evento: tituloEvento } : {}),
  };
}

/**
 * Converte uma linha de `mensagem` para o modelo `Mensagem`.
 */
export function mapMensagem(row: TabelaRow<"mensagem">): Mensagem {
  return {
    id: String(row.id_mensagem),
    remetente_id: row.id_remetente,
    destinatario_id: row.id_destinatario,
    conteudo: row.conteudo,
    lida: row.lida,
    created_at: row.created_at,
  };
}
