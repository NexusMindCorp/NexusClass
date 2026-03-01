import { useState } from "react";

export type Post = {
    id: string;
    conteudo: string;
    data: string;
};

export function useMural() {
    const [posts, setPosts] = useState<{ posts: Post[]; boxAberto: boolean; tipoAmostar:"atividade"|"mural"|"contato" }>({
        posts: [],
        boxAberto: false,
        tipoAmostar: "mural",
    });
    const [conteudo, setConteudo] = useState("");
    const [assunto, setAssunto] = useState("");

    const mudarAberturaBox = (boxAberto: boolean) =>
        setPosts((anterior) => ({ ...anterior, boxAberto }));

    const handlePublicar = () => {
        if (conteudo.trim()) {
            const novoPost: Post = {
                id: Date.now().toString(),
                conteudo,
                data: new Date().toLocaleString("pt-BR"),
            };
            setPosts((anterior) => ({
                ...anterior,
                posts: [...anterior.posts, novoPost],
            }));
            setConteudo("");
            mudarAberturaBox(false);
            abrirMural();
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
    }


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
    };
}