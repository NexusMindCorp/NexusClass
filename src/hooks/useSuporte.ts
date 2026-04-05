export const sendContactEmail = async (formElement: HTMLFormElement): Promise<void> => {
  const formData = new FormData(formElement);
  const nome = String(formData.get("from_name") ?? "").trim();
  const email = String(formData.get("from_email") ?? "").trim();
  const assunto = String(formData.get("subject") ?? "").trim();
  const mensagem = String(formData.get("message") ?? "").trim();

  if (!nome || !email || !assunto || !mensagem) {
    throw new Error("Preencha todos os campos antes de confirmar o envio.");
  }

  await new Promise((resolve) => setTimeout(resolve, 250));
  console.log("Confirmação local de e-mail registrada:", { nome, email, assunto });
};
