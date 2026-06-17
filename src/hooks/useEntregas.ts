import { useState, useEffect, useCallback } from "react";
import type { PerfilUsuario } from "@/hooks/AuthHooks/useAuth";
import { supabase, hasSupabaseConfig } from "@/lib/supabaseClient";
import { toast } from "sonner";

export type Entrega = {
    id: string;
    atividade_id: string;
    aluno_id: string;
    url_anexo: string | null;
    nota: number | null;
    feedback: string | null;
    no_prazo: boolean;
    entregue_em: string;
    created_at: string;
    updated_at: string;
    aluno_nome?: string;
};

export function useEntregas(atividadeId: string, perfil: PerfilUsuario) {
    const [entregaPropria, setEntregaPropria] = useState<Entrega | null>(null);
    const [todasEntregas, setTodasEntregas] = useState<Entrega[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Carregar a entrega própria (se for aluno) ou todas (se for professor/master)
    const carregarDados = useCallback(async () => {
        if (!hasSupabaseConfig || !supabase || !atividadeId) return;

        setLoading(true);
        try {
            if (perfil.role === "aluno") {
                const { data, error } = await supabase
                    .from("entregas_atividades")
                    .select("*")
                    .eq("atividade_id", atividadeId)
                    .eq("aluno_id", perfil.id)
                    .maybeSingle();

                if (error) throw error;
                setEntregaPropria(data);
            } else {
                // Professor ou Admin: carrega todas as entregas com o perfil do aluno
                const { data, error } = await supabase
                    .from("entregas_atividades")
                    .select(`
                        *,
                        perfis:aluno_id (
                            nome
                        )
                    `)
                    .eq("atividade_id", atividadeId)
                    .order("entregue_em", { ascending: false });

                if (error) throw error;
                
                const formatadas: Entrega[] = (data || []).map((d: any) => {
                    const perf = Array.isArray(d.perfis) ? d.perfis[0] : d.perfis;
                    return {
                        ...d,
                        aluno_nome: perf?.nome || "Aluno Anônimo"
                    };
                });
                setTodasEntregas(formatadas);
            }
        } catch (err: any) {
            console.error("Erro ao carregar entregas:", err);
        } finally {
            setLoading(false);
        }
    }, [atividadeId, perfil.id, perfil.role]);

    // Fazer upload do anexo e salvar a entrega no banco
    const enviarEntrega = async (file: File) => {
        if (!hasSupabaseConfig || !supabase) return;

        setUploading(true);
        try {
            const ext = file.name.split(".").pop();
            // Evita caracteres especiais no nome do arquivo
            const nomeLimpo = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
            const caminhoArquivo = `${atividadeId}/${perfil.id}/${Date.now()}-${nomeLimpo}`;

            // 1. Upload do arquivo para o bucket
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from("entregas_atividades")
                .upload(caminhoArquivo, file, { upsert: true });

            if (uploadError) throw uploadError;

            // 2. Salva ou atualiza a entrega no banco
            const { error: dbError } = await supabase
                .from("entregas_atividades")
                .upsert({
                    atividade_id: atividadeId,
                    aluno_id: perfil.id,
                    url_anexo: uploadData.path,
                    entregue_em: new Date().toISOString()
                }, { onConflict: "atividade_id,aluno_id" });

            if (dbError) throw dbError;

            toast.success("Atividade entregue com sucesso!");
            await carregarDados();
        } catch (err: any) {
            console.error("Erro ao enviar entrega:", err);
            toast.error("Erro ao entregar atividade", {
                description: err.message || "Por favor, tente novamente."
            });
        } finally {
            setUploading(false);
        }
    };

    // Dar nota/feedback (Professor/Master)
    const avaliarEntrega = async (alunoId: string, nota: number, feedback: string) => {
        if (!hasSupabaseConfig || !supabase) return;

        try {
            const { error } = await supabase
                .from("entregas_atividades")
                .update({ nota, feedback, updated_at: new Date().toISOString() })
                .eq("atividade_id", atividadeId)
                .eq("aluno_id", alunoId);

            if (error) throw error;

            toast.success("Avaliação salva com sucesso!");
            await carregarDados();
        } catch (err: any) {
            console.error("Erro ao avaliar entrega:", err);
            toast.error("Erro ao salvar avaliação", {
                description: err.message
            });
        }
    };

    // Obter link público/assinado do arquivo de entrega
    const obterLinkArquivo = async (caminho: string): Promise<string | null> => {
        if (!hasSupabaseConfig || !supabase) return null;
        try {
            const { data, error } = await supabase.storage
                .from("entregas_atividades")
                .createSignedUrl(caminho, 3600); 

            if (error) throw error;
            return data.signedUrl;
        } catch (err) {
            console.error("Erro ao gerar link do arquivo:", err);
            return null;
        }
    };

    useEffect(() => {
        void carregarDados();
    }, [carregarDados]);

    return {
        entregaPropria,
        todasEntregas,
        loading,
        uploading,
        enviarEntrega,
        avaliarEntrega,
        obterLinkArquivo,
        recarregar: carregarDados
    };
}
