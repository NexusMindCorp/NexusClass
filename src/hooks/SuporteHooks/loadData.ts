import type { sendContactEmailParams } from "@/hooks/SuporteHooks/type";
    export const sendContactEmail = async ({ formElement, files, perfil, supabase }: sendContactEmailParams): Promise<void> => {
      const formData = new FormData(formElement);
      const nomeFromForm = String(formData.get("from_name") ?? "").trim();
      const emailFromForm = String(formData.get("from_email") ?? formData.get("reply_to") ?? "").trim();
      const nome = nomeFromForm || perfil?.nome || "";
      const email = emailFromForm || perfil?.email || "";
      const assunto = String(formData.get("subject") ?? "").trim();
      const mensagem = String(formData.get("message") ?? "").trim();
    
      if (!nome || !email || !assunto || !mensagem) {
        throw new Error("Preencha todos os campos antes de confirmar o envio.");
      }
    
      const urlsAnexos: string[] = [];
    
      
      if (files.length > 0) {
        for (const file of files) {
        
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          
         
          const { error: uploadError } = await supabase.storage
            .from('anexos_suporte')
            .upload(fileName, file);
    
          if (uploadError) {
            throw new Error("Erro ao fazer upload do anexo: " + uploadError.message);
          }
    
          const { data: publicUrlData } = supabase.storage
            .from('anexos_suporte')
            .getPublicUrl(fileName);
    
          urlsAnexos.push(publicUrlData.publicUrl);
        }
      }
    
      
      const { error } = await supabase
        .from('suporte')
        .insert([
          { 
            nome,
            email,
            assunto,
            mensagem,
            anexos_urls: urlsAnexos, 
            status: 'pendente'
          }
        ]);
    
      if (error) {
        throw new Error(error.message);
      }
    };