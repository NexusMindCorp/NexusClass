import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useOutletContext } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import { ConfiguracoesAvancadas } from "@/components/ConfiguracoesAvancadas";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const { auth, configuracoes } = vi.hoisted(() => ({ auth: vi.fn(), configuracoes: vi.fn() }));

vi.mock("@/hooks/AuthHooks/useAuth", () => ({ useAuth: auth }));
vi.mock("@/hooks/ConfigAvancadaHooks/useConfiguracoesAvancadas", () => ({
  useConfiguracoesAvancadas: configuracoes,
}));

function ConteudoProtegido() {
  const { perfil } = useOutletContext<{ perfil: { nome: string } }>();
  return <p>Área autenticada de {perfil.nome}</p>;
}

function renderizarRota() {
  render(
    <MemoryRouter initialEntries={["/restrita"]}>
      <Routes>
        <Route path="/login" element={<p>Entre na conta</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/restrita" element={<ConteudoProtegido />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  auth.mockReset();
  configuracoes.mockReset();
});

it("aguarda a sessão sem expor o conteúdo nem redirecionar", () => {
  auth.mockReturnValue({ session: null, loading: true });
  renderizarRota();
  expect(screen.queryByText("Entre na conta")).toBeNull();
  expect(screen.queryByText(/^Área autenticada/)).toBeNull();
});

it("redireciona para login quando não há sessão", async () => {
  auth.mockReturnValue({ session: null, loading: false });
  renderizarRota();
  expect(await screen.findByText("Entre na conta")).toBeInTheDocument();
  expect(screen.queryByText(/^Área autenticada/)).toBeNull();
});

it("renderiza a rota e entrega o perfil ao Outlet quando há sessão", () => {
  auth.mockReturnValue({ session: {}, loading: false, perfil: { nome: "Aluno de teste" } });
  renderizarRota();
  expect(screen.getByText("Área autenticada de Aluno de teste")).toBeInTheDocument();
});

it("exibe acesso restrito nas configurações avançadas de um professor", () => {
  configuracoes.mockReturnValue({ perfil: { role: "professor" } });
  render(<ConfiguracoesAvancadas usuario={{}} listaEscolar={{}} cancelarInscricao={vi.fn()} estaInscrito={() => false} />);
  expect(screen.getByRole("heading", { name: "Acesso Restrito" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /deletar conta/i })).toBeNull();
});
