import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { PerfilUsuario } from "@/hooks/AuthHooks/type";
import type { ClienteSupabaseTipado } from "@/repositories/base";
import { PerfilRepository } from "@/repositories/PerfilRepository";

const mocks = vi.hoisted(() => ({
  buscarPorNome: vi.fn(),
  obterCodigoPublicoMinhaEscola: vi.fn(),
}));

vi.mock("@/lib/supabaseClient", () => ({
  hasSupabaseConfig: true,
  supabase: {},
}));

vi.mock("@/repositories", () => ({
  perfilRepository: {
    buscarPorNome: mocks.buscarPorNome,
    obterCodigoPublicoMinhaEscola: mocks.obterCodigoPublicoMinhaEscola,
  },
}));

import { BoxPerfilUsuario } from "@/components/BoxPerfilUsuario";

const alunoProprio: PerfilUsuario = {
  id: "00000000-0000-0000-0000-000000000008",
  nome: "Alice",
  email: "alice@aluno.nexusclass.edu.br",
  role: "aluno",
  bio: "Estudante",
  foto_url: null,
  created_at: "2026-01-10T10:00:00Z",
  id_escola: "1",
};

const outroUsuario: PerfilUsuario = {
  id: "00000000-0000-0000-0000-000000000009",
  nome: "Alberto",
  email: "alberto@aluno.nexusclass.edu.br",
  role: "aluno",
  bio: "Outro estudante",
  foto_url: null,
  created_at: "2026-01-10T10:00:00Z",
  id_escola: "1",
};

const perfilMaster: PerfilUsuario = {
  id: "00000000-0000-0000-0000-000000000001",
  nome: "Coordenação Geral Nexus",
  email: "master@nexusclass.edu.br",
  role: "master",
  bio: "Gestão",
  foto_url: null,
  created_at: "2026-01-10T10:00:00Z",
  id_escola: null,
};

describe("Código público da escola — PerfilRepository e BoxPerfilUsuario", () => {
  beforeEach(() => {
    mocks.buscarPorNome.mockReset();
    mocks.obterCodigoPublicoMinhaEscola.mockReset();
  });

  it("PerfilRepository.obterCodigoPublicoMinhaEscola consulta a RPC dedicada e normaliza nulos", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValueOnce({ data: "ESC-7K4M9P2Q", error: null })
      .mockResolvedValueOnce({ data: null, error: null })
      .mockResolvedValueOnce({ data: null, error: new Error("Falha RPC") });

    const repo = new PerfilRepository({ rpc } as unknown as ClienteSupabaseTipado);

    await expect(repo.obterCodigoPublicoMinhaEscola()).resolves.toBe("ESC-7K4M9P2Q");
    expect(rpc).toHaveBeenCalledWith("obter_codigo_publico_minha_escola");

    await expect(repo.obterCodigoPublicoMinhaEscola()).resolves.toBeNull();
    await expect(repo.obterCodigoPublicoMinhaEscola()).rejects.toThrow("Falha RPC");
  });

  it("exibe o código público da escola somente quando o usuário visualiza o próprio perfil", async () => {
    mocks.buscarPorNome.mockResolvedValue(alunoProprio);
    mocks.obterCodigoPublicoMinhaEscola.mockResolvedValue("ESC-7K4M9P2Q");

    render(
      <BoxPerfilUsuario
        nomeUsuario={alunoProprio.nome}
        currentUserProfile={alunoProprio}
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByText("Código da Escola")).toBeInTheDocument();
    expect(screen.getByText("ESC-7K4M9P2Q")).toBeInTheDocument();
    expect(mocks.obterCodigoPublicoMinhaEscola).toHaveBeenCalledTimes(1);
  });

  it("oculta o código público da escola e não chama a RPC ao visualizar o perfil de outro usuário", async () => {
    mocks.buscarPorNome.mockResolvedValue(outroUsuario);

    render(
      <BoxPerfilUsuario
        nomeUsuario={outroUsuario.nome}
        currentUserProfile={alunoProprio}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Alberto")).toBeInTheDocument();
    });

    expect(screen.queryByText("Código da Escola")).not.toBeInTheDocument();
    expect(mocks.obterCodigoPublicoMinhaEscola).not.toHaveBeenCalled();
  });

  it("não busca nem exibe código da escola para perfil master sem escola vinculada", async () => {
    mocks.buscarPorNome.mockResolvedValue(perfilMaster);

    render(
      <BoxPerfilUsuario
        nomeUsuario={perfilMaster.nome}
        currentUserProfile={perfilMaster}
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Coordenação Geral Nexus")).toBeInTheDocument();
    });

    expect(screen.queryByText("Código da Escola")).not.toBeInTheDocument();
    expect(mocks.obterCodigoPublicoMinhaEscola).not.toHaveBeenCalled();
  });
});
