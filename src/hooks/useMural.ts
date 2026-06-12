import { useState, useEffect, useCallback } from "react";
import type { PerfilUsuario } from "@/hooks/useAuth";
import { supabase, hasSupabaseConfig } from "@/lib/supabaseClient";
import { toast } from "sonner";

export type Post = {
    id: string;
    Nome: string;
    conteudo: string;
    data: string;
    autor: PerfilUsuario | null;
};

export function useMural(turmaId: string, perfil: PerfilUsuario) {
    const [posts, setPosts] = useState<{ posts: Post[]; boxAberto: boolean; tipoAmostar: "atividade" | "mural" | "contato" | "alunos" }>({
        posts: [],
        boxAberto: false,
        tipoAmostar: "mural",
    });
    const [conteudo, setConteudo] = useState("");
    const [assunto, setAssunto] = useState("");

    const mudarAberturaBox = (boxAberto: boolean) =>
        setPosts((anterior) => ({ ...anterior, boxAberto }));

    const carregarPosts = useCallback(async () => {
        if (!hasSupabaseConfig || !supabase || !turmaId) return;

        try {
            const { data, error } = await supabase
                .from("mural_posts")
                .select(`
                    id,
                    conteudo,
                    created_at,
                    perfis:autor_id (
                        id,
                        nome,
                        foto_url
                    )
                `)
                .eq("turma_id", turmaId)
                .order("created_at", { ascending: true });

            if (error) throw error;

            if (data) {
                const postsFormatados: Post[] = data.map((p: any) => {
                    const perfilAutor = Array.isArray(p.perfis) ? p.perfis[0] : p.perfis;
                    return {
                        id: p.id,
                        Nome: perfilAutor?.nome || "Anônimo",
                        conteudo: p.conteudo,
                        data: new Date(p.created_at).toLocaleString("pt-BR"),
                        autor: perfilAutor ? (perfilAutor as PerfilUsuario) : null,
                    };
                });

                setPosts((anterior) => ({
                    ...anterior,
                    posts: postsFormatados,
                }));
            }
        } catch (err: any) {
            console.error("Erro ao carregar posts:", err);
            toast.error("Erro ao carregar posts", {
                description: "Não foi possível carregar as publicações do mural."
            });
        }
    }, [turmaId]);

    useEffect(() => {
        void carregarPosts();
    }, [carregarPosts]);

    const handlePublicar = async () => {
        if (!conteudo.trim()) return;

        if (!hasSupabaseConfig || !supabase || !perfil?.id) {
            toast.error("Erro de autenticação", {
                description: "Não foi possível salvar a publicação."
            });
            return;
        }

        try {
            const { data, error } = await supabase
                .from("mural_posts")
                .insert({
                    turma_id: turmaId,
                    autor_id: perfil.id,
                    conteudo: conteudo.trim(),
                })
                .select(`
                    id,
                    conteudo,
                    created_at,
                    perfis:autor_id (
                        id,
                        nome,
                        email,
                        bio,
                        foto_url,
                        role,
                        created_at
                    )
                `)
                .single();

            if (error) throw error;

            const perfilAutor = Array.isArray(data.perfis) ? data.perfis[0] : data.perfis;
            const novoPost: Post = {
                id: data.id,
                Nome: perfilAutor?.nome || perfil.nome,
                conteudo: data.conteudo,
                data: new Date(data.created_at).toLocaleString("pt-BR"),
                autor: perfilAutor ? (perfilAutor as PerfilUsuario) : perfil,
            };

            setPosts((anterior) => ({
                ...anterior,
                posts: [...anterior.posts, novoPost],
            }));
            setConteudo("");
            mudarAberturaBox(false);
            abrirMural();
            toast.success("Publicado com sucesso!");
        } catch (err: any) {
            console.error("Erro ao criar post:", err);
            toast.error("Erro ao publicar", {
                description: err.message || "Tente novamente."
            });
        }
    };

    const handleCancelar = () => {
        setConteudo("");
        setAssunto("");
        mudarAberturaBox(false);
        abrirMural();
    };

    const abrirMural = () => {
        setPosts((anterior) => ({ ...anterior, tipoAmostar: "mural" }));
    };

    const abrirAtividades = () => {
        setPosts((anterior) => ({ ...anterior, tipoAmostar: "atividade" }));
    };

    const abrirContato = () => {
        setPosts((anterior) => ({ ...anterior, tipoAmostar: "contato", boxAberto: true }));
    };

    const abrirMensagemContato = () => {
        setConteudo("");
        setAssunto("");
        setPosts((anterior) => ({ ...anterior, boxAberto: false }));
        abrirMural();
    };

    const abrirAlunos = () => {
        setPosts((anterior) => ({ ...anterior, tipoAmostar: "alunos" }));
    };

    return {
        posts,
        conteudo,
        setConteudo,
        assunto,
        setAssunto,
        mudarAberturaBox,
        handlePublicar,
        handleCancelar,
        abrirMural,
        abrirAtividades,
        abrirContato,
        abrirMensagemContato,
        abrirAlunos,
    };
}