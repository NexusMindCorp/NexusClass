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

export type Atividade = {
    id: string;
    turma_id: string;
    professor_id: string;
    titulo: string;
    descricao: string;
    data_entrega: string | null;
    created_at: string;
    anexo_url: string | null;
    professor_nome?: string;
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

export function useMural(turmaId: string, perfil: PerfilUsuario) {
    const [posts, setPosts] = useState<{ posts: Post[]; boxAberto: boolean; tipoAmostar: "atividade" | "mural" | "contato" | "alunos" }>({
        posts: [],
        boxAberto: false,
        tipoAmostar: "mural",
    });
    const [atividades, setAtividades] = useState<Atividade[]>([]);
    const [loadingAtividades, setLoadingAtividades] = useState(false);
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
                        email,
                        bio,
                        foto_url,
                        role,
                        created_at
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

    const carregarAtividades = useCallback(async () => {
        if (!hasSupabaseConfig || !supabase || !turmaId) return;

        try {
            setLoadingAtividades(true);
            const { data, error } = await supabase
                .from("atividades")
                .select(`
                    id,
                    turma_id,
                    professor_id,
                    titulo,
                    descricao,
                    data_entrega,
                    created_at,
                    anexo_url,
                    perfis:professor_id (
                        nome
                    )
                `)
                .eq("turma_id", turmaId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            if (data) {
                const atividadesFormatadas: Atividade[] = data.map((a: any) => {
                    const perfilProf = Array.isArray(a.perfis) ? a.perfis[0] : a.perfis;
                    return {
                        id: a.id,
                        turma_id: a.turma_id,
                        professor_id: a.professor_id,
                        titulo: a.titulo,
                        descricao: a.descricao,
                        data_entrega: a.data_entrega,
                        created_at: a.created_at,
                        anexo_url: a.anexo_url,
                        professor_nome: perfilProf?.nome || "Professor",
                    };
                });
                setAtividades(atividadesFormatadas);
            }
        } catch (err: any) {
            console.error("Erro ao carregar atividades:", err);
            toast.error("Erro ao carregar atividades", {
                description: "Não foi possível carregar as atividades da turma."
            });
        } finally {
            setLoadingAtividades(false);
        }
    }, [turmaId]);

    useEffect(() => {
        void carregarPosts();
        void carregarAtividades();
    }, [carregarPosts, carregarAtividades]);

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

    const publicarAtividade = async (titulo: string, descricao: string, dataEntrega: string | null, arquivos: File[]) => {
        if (!hasSupabaseConfig || !supabase || !perfil?.id) {
            toast.error("Erro de autenticação", {
                description: "Não foi possível salvar a atividade."
            });
            return;
        }

        try {
            const urls: string[] = [];

            if (arquivos && arquivos.length > 0) {
                for (const file of arquivos) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage
                        .from('anexos_atividades')
                        .upload(fileName, file);

                    if (uploadError) throw uploadError;

                    const { data: publicUrlData } = supabase.storage
                        .from('anexos_atividades')
                        .getPublicUrl(fileName);

                    if (publicUrlData?.publicUrl) {
                        urls.push(publicUrlData.publicUrl);
                    }
                }
            }

            const anexoUrl = urls.length > 0 ? JSON.stringify(urls) : null;

            const { data, error } = await supabase
                .from("atividades")
                .insert({
                    turma_id: turmaId,
                    professor_id: perfil.id,
                    titulo: titulo.trim(),
                    descricao: descricao.trim(),
                    data_entrega: dataEntrega ? new Date(dataEntrega).toISOString() : null,
                    anexo_url: anexoUrl,
                })
                .select(`
                    id,
                    turma_id,
                    professor_id,
                    titulo,
                    descricao,
                    data_entrega,
                    created_at,
                    anexo_url,
                    perfis:professor_id (
                        nome
                    )
                `)
                .single();

            if (error) throw error;

            const perfilProf = Array.isArray(data.perfis) ? data.perfis[0] : data.perfis;
            const novaAtividade: Atividade = {
                id: data.id,
                turma_id: data.turma_id,
                professor_id: data.professor_id,
                titulo: data.titulo,
                descricao: data.descricao,
                data_entrega: data.data_entrega,
                created_at: data.created_at,
                anexo_url: data.anexo_url,
                professor_nome: perfilProf?.nome || perfil.nome,
            };

            setAtividades((anterior) => [novaAtividade, ...anterior]);
            toast.success("Atividade criada com sucesso!");
        } catch (err: any) {
            console.error("Erro ao criar atividade:", err);
            toast.error("Erro ao criar atividade", {
                description: err.message || "Tente novamente."
            });
            throw err;
        }
    };

    const deletarAtividade = async (atividadeId: string) => {
        if (!hasSupabaseConfig || !supabase) return;

        try {
            // Deletar os arquivos vinculados a esta atividade do storage
            const atividadeExistente = atividades.find((a) => a.id === atividadeId);
            if (atividadeExistente) {
                const urlsOriginais = extrairUrlsAnexo(atividadeExistente.anexo_url);
                if (urlsOriginais.length > 0) {
                    const caminhosParaDeletar = urlsOriginais.map(obterNomeArquivoDoUrl).filter(Boolean);
                    if (caminhosParaDeletar.length > 0) {
                        const { error: deleteStorageError } = await supabase.storage
                            .from('anexos_atividades')
                            .remove(caminhosParaDeletar);
                        if (deleteStorageError) {
                            console.error("Erro ao deletar arquivos do storage:", deleteStorageError);
                            toast.error("Erro ao remover arquivos do storage", {
                                description: deleteStorageError.message
                            });
                        }
                    }
                }
            }

            const { error } = await supabase
                .from("atividades")
                .delete()
                .eq("id", atividadeId);

            if (error) throw error;

            setAtividades((anterior) => anterior.filter((a) => a.id !== atividadeId));
            toast.success("Atividade excluída com sucesso!");
        } catch (err: any) {
            console.error("Erro ao excluir atividade:", err);
            toast.error("Erro ao excluir atividade", {
                description: err.message || "Tente novamente."
            });
        }
    };

    const editarAtividade = async (
        atividadeId: string,
        titulo: string,
        descricao: string,
        dataEntrega: string | null,
        arquivos: File[],
        urlsMantidas: string[]
    ) => {
        if (!hasSupabaseConfig || !supabase) return;

        try {
            // Obter arquivos que foram removidos pelo usuário na edição
            const atividadeExistente = atividades.find((a) => a.id === atividadeId);
            if (atividadeExistente) {
                const urlsOriginais = extrairUrlsAnexo(atividadeExistente.anexo_url);
                const urlsRemovidas = urlsOriginais.filter((url) => !urlsMantidas.includes(url));
                
                if (urlsRemovidas.length > 0) {
                    const caminhosParaDeletar = urlsRemovidas.map(obterNomeArquivoDoUrl).filter(Boolean);
                    if (caminhosParaDeletar.length > 0) {
                        const { error: deleteStorageError } = await supabase.storage
                            .from('anexos_atividades')
                            .remove(caminhosParaDeletar);
                        if (deleteStorageError) {
                            console.error("Erro ao deletar arquivos do storage:", deleteStorageError);
                            toast.error("Erro ao remover arquivos antigos do storage", {
                                description: deleteStorageError.message
                            });
                        }
                    }
                }
            }

            const novasUrls: string[] = [];

            if (arquivos && arquivos.length > 0) {
                for (const file of arquivos) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage
                        .from('anexos_atividades')
                        .upload(fileName, file);

                    if (uploadError) throw uploadError;

                    const { data: publicUrlData } = supabase.storage
                        .from('anexos_atividades')
                        .getPublicUrl(fileName);

                    if (publicUrlData?.publicUrl) {
                        novasUrls.push(publicUrlData.publicUrl);
                    }
                }
            }

            const urlsFinais = [...urlsMantidas, ...novasUrls];
            const anexoUrl = urlsFinais.length > 0 ? JSON.stringify(urlsFinais) : null;

            const { data, error } = await supabase
                .from("atividades")
                .update({
                    titulo: titulo.trim(),
                    descricao: descricao.trim(),
                    data_entrega: dataEntrega ? new Date(dataEntrega).toISOString() : null,
                    anexo_url: anexoUrl,
                })
                .eq("id", atividadeId)
                .select(`
                    id,
                    turma_id,
                    professor_id,
                    titulo,
                    descricao,
                    data_entrega,
                    created_at,
                    anexo_url,
                    perfis:professor_id (
                        nome
                    )
                `)
                .single();

            if (error) throw error;

            const perfilProf = Array.isArray(data.perfis) ? data.perfis[0] : data.perfis;
            const atividadeAtualizada: Atividade = {
                id: data.id,
                turma_id: data.turma_id,
                professor_id: data.professor_id,
                titulo: data.titulo,
                descricao: data.descricao,
                data_entrega: data.data_entrega,
                created_at: data.created_at,
                anexo_url: data.anexo_url,
                professor_nome: perfilProf?.nome || perfil.nome,
            };

            setAtividades((anterior) =>
                anterior.map((a) => (a.id === atividadeId ? atividadeAtualizada : a))
            );
            toast.success("Atividade atualizada com sucesso!");
        } catch (err: any) {
            console.error("Erro ao atualizar atividade:", err);
            toast.error("Erro ao atualizar atividade", {
                description: err.message || "Tente novamente."
            });
            throw err;
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

    const enviarMensagemContato = async (assuntoText: string, mensagemText: string, arquivos: File[]) => {
        if (!hasSupabaseConfig || !supabase || !perfil?.id) {
            toast.error("Erro de autenticação", {
                description: "Não foi possível enviar a mensagem."
            });
            return;
        }

        try {
            // 1. Buscar o professor da turma
            const { data: profRel, error: profRelError } = await supabase
                .from("professor_turma")
                .select("professor_id")
                .eq("turma_id", turmaId)
                .maybeSingle();

            if (profRelError || !profRel) {
                throw new Error("Professor desta turma não encontrado.");
            }

            // 2. Upload de arquivos para o bucket 'duvidasalunostoprofessor'
            const urls: string[] = [];
            if (arquivos && arquivos.length > 0) {
                for (const file of arquivos) {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage
                        .from('duvidasalunostoprofessor')
                        .upload(fileName, file);

                    if (uploadError) throw uploadError;

                    const { data: publicUrlData } = supabase.storage
                        .from('duvidasalunostoprofessor')
                        .getPublicUrl(fileName);

                    if (publicUrlData?.publicUrl) {
                        urls.push(publicUrlData.publicUrl);
                    }
                }
            }

            const anexoUrl = urls.length > 0 ? JSON.stringify(urls) : null;

            // 3. Inserir na tabela duvidasalunostoprofessor
            const { error: insertError } = await supabase
                .from("duvidasalunostoprofessor")
                .insert({
                    aluno_id: perfil.id,
                    prof_id: profRel.professor_id,
                    turma_id: turmaId,
                    assunto: assuntoText.trim(),
                    descricao: mensagemText.trim(),
                    anexo_url: anexoUrl,
                    resolvido: false,
                });

            if (insertError) throw insertError;

            toast.success("Mensagem enviada com sucesso!");
            setConteudo("");
            setAssunto("");
            setPosts((anterior) => ({ ...anterior, boxAberto: false }));
            abrirMural();
        } catch (err: any) {
            console.error("Erro ao enviar mensagem:", err);
            toast.error("Erro ao enviar mensagem", {
                description: err.message || "Tente novamente."
            });
            throw err;
        }
    };

    const abrirAlunos = () => {
        setPosts((anterior) => ({ ...anterior, tipoAmostar: "alunos" }));
    };

    const deletarPost = async (postId: string) => {
        if (!hasSupabaseConfig || !supabase) return;

        try {
            const { error } = await supabase
                .from("mural_posts")
                .delete()
                .eq("id", postId);

            if (error) throw error;

            setPosts((anterior) => ({
                ...anterior,
                posts: anterior.posts.filter((p) => p.id !== postId),
            }));
            toast.success("Publicação excluída com sucesso!");
        } catch (err: any) {
            console.error("Erro ao excluir post:", err);
            toast.error("Erro ao excluir", {
                description: err.message || "Tente novamente."
            });
        }
    };

    useEffect(() => {
        carregarPosts();
        carregarAtividades();
    }, [carregarPosts, carregarAtividades]);

useEffect(() => {
        if (!hasSupabaseConfig || !supabase || !turmaId || !perfil) return;


        const channelPosts = supabase
            .channel('realtime:mural_posts')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'mural_posts',
                    filter: `turma_id=eq.${turmaId}`
                },
                (payload) => {
              
                    if (payload.new.autor_id !== perfil.id) {
                        toast('O mural foi atualizado!', {
                            description: 'Uma nova publicação foi adicionada.',
                            action: {
                                label: 'Carregar',
                                onClick: () => void carregarPosts(),
                            },
                        });
                    }
                }
            )
            .subscribe();

       
        const channelAtividades = supabase
            .channel('realtime:atividades')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'atividades',
                    filter: `turma_id=eq.${turmaId}`
                },
                (payload) => {

                    if (payload.new.professor_id !== perfil.id) {
                        toast('Novas atividades!', {
                            description: 'Uma nova atividade foi postada na turma.',
                            action: {
                                label: 'Carregar',
                                onClick: () => void carregarAtividades(),
                            },
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channelPosts);
            supabase.removeChannel(channelAtividades);
        };
    }, [turmaId, perfil?.id, carregarPosts, carregarAtividades, hasSupabaseConfig, supabase]);

    return {
        posts,
        atividades,
        loadingAtividades,
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
        enviarMensagemContato,
        abrirAlunos,
        deletarPost,
        publicarAtividade,
        deletarAtividade,
        carregarAtividades,
        editarAtividade,
    };
}