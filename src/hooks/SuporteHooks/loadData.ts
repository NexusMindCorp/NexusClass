import type { sendContactEmailParams } from "@/hooks/SuporteHooks/type";
import { comunicacaoRepository } from "@/repositories";

export const sendContactEmail = async ({
  formElement,
  files,
  perfil,
}: sendContactEmailParams): Promise<void> => {
  const formData = new FormData(formElement);
  const nomeFromForm = String(formData.get("from_name") ?? "").trim();
  const emailFromForm = String(
    formData.get("from_email") ?? formData.get("reply_to") ?? "",
  ).trim();
  const nome = nomeFromForm || perfil?.nome || "";
  const email = emailFromForm || perfil?.email || "";
  const assunto = String(formData.get("subject") ?? "").trim();
  const mensagem = String(formData.get("message") ?? "").trim();

  if (!nome || !email || !assunto || !mensagem) {
    throw new Error("Preencha todos os campos antes de confirmar o envio.");
  }

  if (!perfil?.id) {
    throw new Error("Sessão inválida. Faça login novamente para abrir um chamado.");
  }

  await comunicacaoRepository.criarTicketSuporte(
    {
      idPerfil: perfil.id,
      assunto,
      mensagem,
    },
    files,
  );
};
