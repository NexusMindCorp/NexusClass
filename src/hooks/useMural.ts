import { useState } from "react";

export type Post = {
    id: string;
    conteudo: string;
    data: string;
};

export function useMural() {
    const [posts, setPosts] = useState<{ posts: Post[]; boxAberto: boolean }>({
        posts: [],
        boxAberto: false,
    });
    const [conteudo, setConteudo] = useState("");

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
        }
    };

    const handleCancelar = () => {
        setConteudo("");
        mudarAberturaBox(false);
    };

    return {
        posts,
        conteudo,
        setConteudo,
        mudarAberturaBox,
        handlePublicar,
        handleCancelar,
    };
}