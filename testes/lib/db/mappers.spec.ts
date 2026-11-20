import { describe, expect, it } from "vitest";
import {
  calcularEntregaNoPrazo,
  extrairNomeArquivoStorage,
  mapAlertaCalendario,
  mapAtividade,
  mapDuvida,
  mapEntrega,
  mapEventoCalendario,
  mapMensagem,
  mapPerfil,
  mapPostMural,
  mapTurmaProfessor,
  mapTurmaProps,
  paraInteiroId,
  umOuPrimeiro,
} from "@/lib/db/mappers";

describe("Data Mappers — Conversão Row -> Domínio (Nível 2 RBT)", () => {
  it("umOuPrimeiro normaliza objeto, array e nulos", () => {
    expect(umOuPrimeiro({ nome: "Ana" })).toEqual({ nome: "Ana" });
    expect(umOuPrimeiro([{ nome: "Ana" }, { nome: "Beto" }])).toEqual({
      nome: "Ana",
    });
    expect(umOuPrimeiro([])).toBeNull();
    expect(umOuPrimeiro(null)).toBeNull();
    expect(umOuPrimeiro(undefined)).toBeNull();
  });

  it("extrairNomeArquivoStorage remove caminho e prefixo numérico de timestamp", () => {
    expect(
      extrairNomeArquivoStorage("atividades/12/1730800000000-lista_sql.pdf"),
    ).toBe("lista_sql.pdf");
    expect(extrairNomeArquivoStorage("1730800000000-")).toBe("1730800000000-");
    expect(extrairNomeArquivoStorage(null)).toBe("Arquivo anexo");
  });

  it("paraInteiroId converte string positiva e rejeita valores inválidos", () => {
    expect(paraInteiroId("42", "idTurma")).toBe(42);
    expect(paraInteiroId(7, "idTurma")).toBe(7);
    expect(() => paraInteiroId("0", "idTurma")).toThrow(
      'Identificador inválido para idTurma: "0".',
    );
    expect(() => paraInteiroId("-3", "idTurma")).toThrow();
    expect(() => paraInteiroId("abc", "idTurma")).toThrow();
    expect(() => paraInteiroId("1.5", "idTurma")).toThrow();
  });

  it("mapPerfil converte id_perfil/id_escola e valida fallback de role", () => {
    const aluno = mapPerfil({
      id_perfil: "uuid-aluno",
      role: "aluno",
      nome: "Alice",
      email: "alice@nexus.edu",
      bio: null,
      foto_url: null,
      created_at: "2026-11-01T10:00:00Z",
      id_escola: 1,
    });
    expect(aluno.id).toBe("uuid-aluno");
    expect(aluno.id_escola).toBe("1");
    expect(aluno.role).toBe("aluno");

    const masterDesconhecido = mapPerfil({
      id_perfil: "uuid-m",
      role: "papel-invalido",
      nome: "Master",
      email: "m@nexus.edu",
      bio: "Admin",
      foto_url: "foto.png",
      created_at: "2026-11-01T10:00:00Z",
      id_escola: null,
    });
    expect(masterDesconhecido.role).toBe("aluno");
    expect(masterDesconhecido.id_escola).toBeNull();
  });

  it("mapTurmaProfessor e mapTurmaProps convertem IDs SERIAL em string", () => {
    const turmaRow = {
      id_turma: 10,
      codigo_acesso: "DCC061",
      materia: "Engenharia de Software",
      sala: "S301",
      periodo_escolar: "2026.3",
      banner_url: null,
      id_escola: 2,
    };

    expect(mapTurmaProfessor(turmaRow, "Pietro")).toEqual({
      id: "10",
      chave: "DCC061",
      materia: "Engenharia de Software",
      professor: "Pietro",
      sala: "S301",
      turma: "2026.3",
    });

    const props = mapTurmaProps(
      turmaRow,
      { id: "prof-1", nome: "Pietro", foto_url: null },
      [{ id: "a-1", nome: "Alice", foto_url: null }],
    );
    expect(props.id).toBe("10");
    expect(props.id_escola).toBe("2");
    expect(props.banners).toBe("");
    expect(props.foto_professor).toBe("");
    expect(props.turma).toBe("2026.3");
  });

  it("calcularEntregaNoPrazo e mapEntrega avaliam limite de prazo (antes, exatamente no prazo e após)", () => {
    const prazo = "2026-11-10T23:59:00.000Z";
    expect(calcularEntregaNoPrazo("2026-11-10T23:58:59.000Z", prazo)).toBe(true);
    expect(calcularEntregaNoPrazo("2026-11-10T23:59:00.000Z", prazo)).toBe(true);
    expect(calcularEntregaNoPrazo("2026-11-10T23:59:01.000Z", prazo)).toBe(false);
    expect(calcularEntregaNoPrazo("2026-11-10T23:59:01.000Z", null)).toBe(true);
    expect(calcularEntregaNoPrazo("data-invalida", prazo)).toBe(true);

    const entrega = mapEntrega(
      {
        id_entrega: 5,
        id_atividade: 2,
        id_aluno: "a-1",
        id_objeto_storage: "obj-1",
        nota: 95,
        feedback: "Ótimo",
        entregue_em: "2026-11-11T00:00:00.000Z",
        perfil: [{ nome: "Alice" }],
      },
      {
        dataEntregaAtividade: prazo,
        caminhoArquivo: "2/a-1/1700-trabalho.pdf",
      },
    );

    expect(entrega.id).toBe("5");
    expect(entrega.atividade_id).toBe("2");
    expect(entrega.no_prazo).toBe(false);
    expect(entrega.nome_arquivo).toBe("trabalho.pdf");
    expect(entrega.aluno_nome).toBe("Alice");
  });

  it("mapEntrega preserva o atraso registrado no envio mesmo se o prazo mudar", () => {
    const row = {
      id_entrega: 5,
      id_atividade: 2,
      id_aluno: "a-1",
      id_objeto_storage: "obj-1",
      nota: null,
      feedback: null,
      entregue_em: "2026-11-11T00:00:00.000Z",
    };

    expect(mapEntrega({ ...row, atraso: true }, {
      dataEntregaAtividade: "2026-11-12T00:00:00.000Z",
    }).no_prazo).toBe(false);
    expect(mapEntrega({ ...row, atraso: false }, {
      dataEntregaAtividade: "2026-11-10T00:00:00.000Z",
    }).no_prazo).toBe(true);
  });

  it("mapPostMural, mapAtividade, mapDuvida, mapEventoCalendario, mapAlertaCalendario e mapMensagem convertem os demais agregados", () => {
    const post = mapPostMural(
      {
        id_post: 11,
        conteudo: "Aviso de prova",
        created_at: "2026-11-10T12:00:00Z",
      },
      null,
    );
    expect(post.id).toBe("11");
    expect(post.Nome).toBe("Anônimo");

    const atividade = mapAtividade(
      {
        id_atividade: 4,
        id_turma: 1,
        id_professor: "prof-1",
        titulo: "E2",
        descricao: "Modelagem",
        data_entrega: "2026-11-20T23:59:00Z",
      },
      { nome: "Ana Paula" },
    );
    expect(atividade.id).toBe("4");
    expect(atividade.created_at).toBeNull();
    expect(atividade.professor_nome).toBe("Ana Paula");

    const duvida = mapDuvida({
      id_duvida: 7,
      id_aluno: "a-1",
      id_professor: "p-1",
      id_turma: 3,
      assunto: "3FN",
      descricao: "Como decompor?",
      created_at: "2026-11-05T10:00:00Z",
      resolveu: true,
      resposta: "Use tabela auxiliar.",
      turma: { materia: "BD", periodo_escolar: "2026.3" },
    });
    expect(duvida.id).toBe("7");
    expect(duvida.resolvido).toBe(true);
    expect(duvida.turma).toEqual({ materia: "BD", turma: "2026.3" });

    const evento = mapEventoCalendario({
      id_evento: 8,
      titulo: "Aula",
      descricao: "",
      data: "2026-11-20",
      horario: "19:30:00",
      tipo: "turma",
      id_turma: 2,
      id_autor: "p-1",
    });
    expect(evento.id).toBe("8");
    expect(evento.horario).toBe("19:30");
    expect(evento.turma_id).toBe("2");

    const alerta = mapAlertaCalendario(
      {
        id_alerta: 15,
        id_evento: 8,
        mensagem: "Começa em 5 min",
        minutos_antes: 5,
        lembrete_para: "2026-11-20T19:25:00Z",
      },
      "Aula",
    );
    expect(alerta.id).toBe("15");
    expect(alerta.evento_id).toBe("8");
    expect(alerta.titulo_evento).toBe("Aula");

    const msg = mapMensagem({
      id_mensagem: 99,
      id_remetente: "a-1",
      id_destinatario: "p-1",
      conteudo: "Oi!",
      lida: false,
      created_at: "2026-11-05T10:00:00Z",
    });
    expect(msg.id).toBe("99");
    expect(msg.remetente_id).toBe("a-1");
  });
});
