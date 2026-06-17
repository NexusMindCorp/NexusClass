import { useState, useEffect, useCallback } from "react";
import { supabase, hasSupabaseConfig } from "@/lib/supabaseClient";
import { toast } from "sonner";
import type { PerfilUsuario } from "@/hooks/AuthHooks/useAuth";

export type Duvida = {
    id: string;
    aluno_id: string;
    prof_id: string;
    turma_id: string;
    assunto: string;
    descricao: string;
    anexo_url: string | null;
    created_at: string;
    resolvido: boolean;
    resposta: string | null;
    aluno?: {
        nome: string;
        email: string;
        foto_url: string | null;
    };
    professor?: {
        nome: string;
    };
    turma?: {
        materia: string;
        turma: string;
    };
};

function extrairUrlsAnexo(anexoUrl: string | null): string[] {
    if (!anexoUrl) return [];
    try {
        if (anexoUrl.startsWith("[") && anexoUrl.endsWith("]")) {
            const parsed = JSON.parse(anexoUrl);
            if (Array.isArray(parsed)) return parsed;
        }
        return [anexoUrl];
    } catch {
        return [anexoUrl];
    }
}

function obterNomeArquivoDoUrl(url: string): string {
    try {
        const decoded = decodeURIComponent(url);
        const cleanUrl = decoded.split("?")[0];
        const parts = cleanUrl.split("/");
        return parts[parts.length - 1];
    } catch {
        return "";
    }
}

export function useDuvidas(perfil: PerfilUsuario | null) {
    const [duvidas, setDuvidas] = useState<Duvida[]>([]);
    const [loading, setLoading] = useState(false);

    const carregarDuvidas = useCallback(async () => {
        if (!hasSupabaseConfig || !supabase || !perfil?.id) return;

        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("duvidasalunostoprofessor")
                .select(`
                    id,
                    aluno_id,
                    prof_id,
                    turma_id,
                    assunto,
                    descricao,
                    anexo_url,
                    created_at,
                    resolvido,
                    resposta,
                    aluno:aluno_id (nome, email, foto_url),
                    professor:prof_id (nome),
                    turma:turma_id (materia, turma)
                `)
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (data) {
                const formatadas: Duvida[] = data.map((d: any) => {
                    const alunoData = Array.isArray(d.aluno) ? d.aluno[0] : d.aluno;
                    const profData = Array.isArray(d.professor) ? d.professor[0] : d.professor;
                    const turmaData = Array.isArray(d.turma) ? d.turma[0] : d.turma;

                    return {
                        ...d,
                        aluno: alunoData || undefined,
                        professor: profData || undefined,
                        turma: turmaData || undefined,
                    };
                });
                setDuvidas(formatadas);
            }
        } catch (err: any) {
            console.error("Erro ao carregar dúvidas:", err);
            toast.error("Erro ao carregar dúvidas", {
                description: err.message || "Tente novamente mais tarde."
            });
        } finally {
            setLoading(false);
        }
    }, [perfil?.id]);

    const deletarDuvida = async (duvidaId: string) => {
        if (!hasSupabaseConfig || !supabase) return;

        try {
            const duvidaExistente = duvidas.find((d) => d.id === duvidaId);
            if (duvidaExistente?.anexo_url) {
                const urls = extrairUrlsAnexo(duvidaExistente.anexo_url);
                if (urls.length > 0) {
                    const caminhosParaDeletar = urls.map(obterNomeArquivoDoUrl).filter(Boolean);
                    if (caminhosParaDeletar.length > 0) {
                        const { error: deleteStorageError } = await supabase.storage
                            .from("duvidasalunostoprofessor")
                            .remove(caminhosParaDeletar);
                        if (deleteStorageError) {
                            console.error("Erro ao remover arquivos anexos:", deleteStorageError);
                        }
                    }
                }
            }

            const { error } = await supabase
                .from("duvidasalunostoprofessor")
                .delete()
                .eq("id", duvidaId);

            if (error) throw error;

            setDuvidas((prev) => prev.filter((d) => d.id !== duvidaId));
            toast.success("Dúvida excluída com sucesso!");
        } catch (err: any) {
            console.error("Erro ao deletar dúvida:", err);
            toast.error("Erro ao excluir dúvida", {
                description: err.message || "Tente novamente."
            });
        }
    };

    const responderDuvida = async (duvidaId: string, respostaText: string) => {
        if (!hasSupabaseConfig || !supabase) return;

        try {
            const { error } = await supabase
                .from("duvidasalunostoprofessor")
                .update({
                    resposta: respostaText,
                    resolvido: true,
                })
                .eq("id", duvidaId);

            if (error) throw error;

            setDuvidas((prev) =>
                prev.map((d) =>
                    d.id === duvidaId ? { ...d, resposta: respostaText, resolvido: true } : d
                )
            );
            toast.success("Dúvida respondida com sucesso!");
        } catch (err: any) {
            console.error("Erro ao responder dúvida:", err);
            toast.error("Erro ao responder dúvida", {
                description: err.message || "Tente novamente."
            });
            throw err;
        }
    };

    useEffect(() => {
        void carregarDuvidas();
    }, [carregarDuvidas]);

    return {
        duvidas,
        loading,
        carregarDuvidas,
        deletarDuvida,
        responderDuvida
    };
}
