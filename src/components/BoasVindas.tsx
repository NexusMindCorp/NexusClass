import { Sparkles, Compass, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PerfilUsuario } from "@/hooks/useAuth";
import { getAssetPath } from "@/lib/assetPath";

type BoasVindasProps = {
    perfil?: PerfilUsuario;
    acionarExplorar?: () => void;
}

export function BoasVindas({ perfil, acionarExplorar }: BoasVindasProps) {
    const nomeUsuario = perfil?.nome || "Usuário";
    const isAluno = perfil?.role === "aluno";
    const isProfessor = perfil?.role === "professor";

    return (
        <Card className="w-full h-full flex flex-col overflow-hidden border-border bg-card shadow-lg transition-all duration-300">
            <div className="h-2 w-full bg-primary shrink-0" />
            <div className="flex flex-col flex-1 justify-center">
                <CardHeader className="text-center pt-8 pb-4">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted border border-border shadow-sm">
                        <img src={getAssetPath("Logos/Logo.png")} alt="Logo NexusClass" className="h-15 w-15 object-contain" />
                    </div>

                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl flex items-center justify-center gap-2">
                        Bem-vindo(a) ao NexusClass! <Sparkles className="h-6 w-6 text-primary" />
                    </CardTitle>

                    <CardDescription className="text-base text-muted-foreground mt-3 max-w-lg mx-auto leading-relaxed">
                        {isProfessor ? (
                            <>
                                Olá, Prof. {nomeUsuario}! Seu ambiente virtual de ensino está pronto.
                                Aqui você pode gerenciar suas turmas, disponibilizar materiais e acompanhar o progresso dos seus alunos.
                                Além disso, temos a tecnologia de Inteligência Artificial para ajudar vocês ser mais produtivo.
                            </>
                        ) : isAluno ? (
                            <>
                                Olá, {nomeUsuario}! Seu ambiente virtual de aprendizagem está pronto.
                                Aqui você pode acompanhar suas disciplinas, acessar seus materiais e interagir com suas turmas.
                                Além disso, temos a tecnologia de Inteligência Artificial para ajudar vocês a aprender mais eficientemente.
                            </>
                        ) : (
                            <>
                                Olá, {nomeUsuario}! Seu ambiente virtual está pronto. Explore os recursos disponíveis na plataforma.
                            </>
                        )}
                    </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col items-center justify-center pb-8 pt-4">
                    <div className="rounded-xl border border-border bg-background p-6 w-full max-w-md text-center shadow-sm mb-6">

                        {isAluno && (
                            <>
                                <p className="text-sm text-foreground mb-4 font-medium">
                                    Ainda não faz parte de nenhuma turma ou quer expandir seus estudos?
                                </p>

                                <Button
                                    onClick={acionarExplorar}
                                    size="lg"
                                    className="w-full sm:w-auto cursor-pointer gap-2 bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shadow-md rounded-full px-8"
                                >
                                    <Compass className="h-5 w-5" />
                                    Explorar Novas Turmas
                                </Button>
                            </>
                        )}

                        {isProfessor && (
                            <div className="flex flex-col items-center">
                                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                    <Info className="h-6 w-6 text-primary" />
                                </div>
                                <p className="text-lg text-foreground mb-2 font-semibold">
                                    Nenhuma turma alocada
                                </p>
                                <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
                                    <p>
                                        Como você está vendo esta tela, significa que nenhuma disciplina foi vinculada ao seu perfil até o momento.
                                    </p>
                                    <p>
                                        Por favor, aguarde a alocação de suas turmas ou entre em contato com a administração caso acredite que isso seja um erro.
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>
                </CardContent>
            </div>
        </Card>
    );
}