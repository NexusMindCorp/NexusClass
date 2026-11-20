import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { BoxDenunciaAluno } from "@/components/BoxDenunciaAluno";

const { submit, sucesso } = vi.hoisted(() => ({ submit: vi.fn(), sucesso: vi.fn() }));

vi.mock("sonner", () => ({ toast: { success: sucesso } }));
vi.mock("@/hooks/DenunciaHooks/useDenuncia", () => ({
  useDenuncia: () => ({
    motivos: ["Outro"], motivoSelecionado: "Outro", detalhes: "",
    sending: false, error: null, submit,
  }),
}));

beforeEach(() => {
  submit.mockReset();
  sucesso.mockReset();
});

it("confirma a denúncia antes de fechar o formulário", async () => {
  submit.mockResolvedValue(undefined);
  const fechar = vi.fn(() => expect(sucesso).toHaveBeenCalledOnce());
  render(<BoxDenunciaAluno aluno="Aluno de teste" onClose={fechar} />);
  fireEvent.click(screen.getByRole("button", { name: /^Denunciar$/ }));

  await waitFor(() => expect(fechar).toHaveBeenCalledOnce());
  expect(sucesso).toHaveBeenCalledWith("Denúncia enviada com sucesso.");
});

it("mantém o formulário aberto quando o envio falha", async () => {
  const erro = new Error("Falha no envio de teste");
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  submit.mockRejectedValue(erro);
  const fechar = vi.fn();
  try {
    render(<BoxDenunciaAluno aluno="Aluno de teste" onClose={fechar} />);
    fireEvent.click(screen.getByRole("button", { name: /^Denunciar$/ }));

    await waitFor(() => expect(log).toHaveBeenCalledWith("Erro ao enviar denúncia", erro));
    expect(fechar).not.toHaveBeenCalled();
    expect(sucesso).not.toHaveBeenCalled();
  } finally {
    log.mockRestore();
  }
});
