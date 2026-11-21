import { describe, expect, it, vi } from "vitest";
import type { AnexoStorageFacade } from "@/patterns/facade/AnexoStorageFacade";
import { ComunicacaoRepository } from "@/repositories/ComunicacaoRepository";
import type { ClienteSupabaseTipado } from "@/repositories/base";

describe("ComunicacaoRepository — denúncia, suporte e disparo Edge Functions", () => {
  it("sanitiza e grava denúncia e dispara resend-email com id_denuncia", async () => {
    const insertSpy = vi.fn();
    const invokeSpy = vi.fn().mockResolvedValue({ data: { enviado: true }, error: null });

    const fakeClient = {
      from: (tabela: string) => {
        expect(tabela).toBe("denuncia");
        return {
          insert: (payload: Record<string, unknown>) => {
            insertSpy(payload);
            return {
              select: () => ({
                single: async () => ({ data: { id_denuncia: 42 }, error: null }),
              }),
            };
          },
        };
      },
      functions: { invoke: invokeSpy },
    } as unknown as ClienteSupabaseTipado;

    const repo = new ComunicacaoRepository(fakeClient);
    await repo.criarDenuncia({
      idAutor: "prof-1",
      idDenunciado: "aluno-1",
      motivo: "Spam\u0000no mural",
      descricao: "Detalhes\u0007\nlinha 2",
    });

    expect(insertSpy).toHaveBeenCalledWith({
      id_autor: "prof-1",
      id_denunciado: "aluno-1",
      motivo: "Spam no mural",
      descricao: "Detalhes\nlinha 2",
      status: "pendente",
    });
    expect(invokeSpy).toHaveBeenCalledWith("resend-email", {
      body: { id_denuncia: 42 },
    });
  });

  it("não falha criarDenuncia quando resend-email lança erro (best-effort)", async () => {
    const invokeSpy = vi.fn().mockRejectedValue(new Error("Resend offline"));

    const fakeClient = {
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id_denuncia: 7 }, error: null }),
          }),
        }),
      }),
      functions: { invoke: invokeSpy },
    } as unknown as ClienteSupabaseTipado;

    const repo = new ComunicacaoRepository(fakeClient);
    await expect(
      repo.criarDenuncia({
        idAutor: "prof-1",
        idDenunciado: "aluno-1",
        motivo: "Outro",
        descricao: "",
      }),
    ).resolves.toBeUndefined();
    expect(invokeSpy).toHaveBeenCalledOnce();
  });

  it("grava ticket e anexos 1FN antes de disparar resend-suport com id_suporte", async () => {
    const ordem: string[] = [];
    const invokeSpy = vi.fn(async () => {
      ordem.push("resend-suport");
      return { data: { enviado: true }, error: null };
    });

    const fakeClient = {
      from: (tabela: string) => {
        expect(tabela).toBe("ticket_suporte");
        return {
          insert: () => {
            ordem.push("insert-ticket");
            return {
              select: () => ({
                single: async () => ({ data: { id_suporte: 99 }, error: null }),
              }),
            };
          },
        };
      },
      functions: { invoke: invokeSpy },
    } as unknown as ClienteSupabaseTipado;

    const fakeFacade = {
      anexar: vi.fn(async () => {
        ordem.push("anexar-1fn");
      }),
    } as unknown as AnexoStorageFacade;

    const repo = new ComunicacaoRepository(fakeClient, fakeFacade);
    const arquivo = new File(["conteudo"], "print.png", { type: "image/png" });

    await repo.criarTicketSuporte(
      { idPerfil: "user-1", assunto: "Ajuda", mensagem: "Preciso de suporte" },
      [arquivo],
    );

    expect(ordem).toEqual(["insert-ticket", "anexar-1fn", "resend-suport"]);
    expect(invokeSpy).toHaveBeenCalledWith("resend-suport", {
      body: { id_suporte: 99 },
    });
  });

  it("não falha criarTicketSuporte quando resend-suport lança erro (best-effort)", async () => {
    const invokeSpy = vi.fn().mockRejectedValue(new Error("Resend 503"));

    const fakeClient = {
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: { id_suporte: 12 }, error: null }),
          }),
        }),
      }),
      functions: { invoke: invokeSpy },
    } as unknown as ClienteSupabaseTipado;

    const fakeFacade = {
      anexar: vi.fn(async () => undefined),
    } as unknown as AnexoStorageFacade;

    const repo = new ComunicacaoRepository(fakeClient, fakeFacade);
    await expect(
      repo.criarTicketSuporte(
        { idPerfil: "user-1", assunto: "Dúvida", mensagem: "Teste" },
        [],
      ),
    ).resolves.toBeUndefined();
    expect(invokeSpy).toHaveBeenCalledOnce();
  });
});
