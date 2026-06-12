import { useState } from "react"
import { Input } from "@/components/ui/input"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TurmaCard } from "./TurmaCard"
import { usePesquisa } from "@/hooks/usePesquisa"
import type { TurmaProps } from "@/hooks/leituraJson"
import type { PerfilUsuario } from "@/hooks/useAuth"

type PesquisarProps = {
    mudarInscricao: (materia: string) => void
    estaInscrito: (materia: string) => boolean
    marcarMural: (key: string) => void
    voltarPrincipal: () => void
    turmas: Record<string, TurmaProps>
    perfil: PerfilUsuario
}

export function Pesquisar(props: PesquisarProps) {
    const [abaAtiva, setAbaAtiva] = useState("minhas")
    const { textoPesquisa, setTextoPesquisa, aberto, mudarAberturaSheet, turmasFiltradas } = usePesquisa({
        aoFecharPesquisa: props.voltarPrincipal,
        turmas: props.turmas,
    })

    const isAluno = props.perfil?.role === "aluno";
    const isProfessor = props.perfil?.role === "professor";

    const turmasBase = textoPesquisa.trim() === ""
        ? Object.entries(props.turmas).sort((a, b) => a[1].materia.localeCompare(b[1].materia))
        : turmasFiltradas;

    const turmasParaExibir = turmasBase.filter(([key, _]) => {
        const inscrito = props.estaInscrito(key);

        if (isProfessor && !inscrito) return false;

        if (isAluno) {
            if (abaAtiva === "minhas" && !inscrito) return false;
            if (abaAtiva === "disponiveis" && inscrito) return false;
        }
        return true;
    });

    const turmasOrdenadas = turmasParaExibir.sort(([keyA,], [keyB,]) => {
        const inscritoA = props.estaInscrito(keyA);
        const inscritoB = props.estaInscrito(keyB);

        if (inscritoA && !inscritoB) return -1;
        if (!inscritoA && inscritoB) return 1;
        return 0;
    });

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <Sheet open={aberto} onOpenChange={mudarAberturaSheet}>
                <SheetContent side="right" className="w-full sm:w-[400px] lg:w-[450px] flex flex-col p-5">

                    <SheetHeader className="space-y-1 p-0" >
                        <SheetTitle>Pesquisar Turmas</SheetTitle>
                        <SheetDescription className="text-xs">
                            Digite para pesquisar turmas, professores ou matérias:
                        </SheetDescription>
                    </SheetHeader>

                    <div className="mt-2 flex flex-col gap-3">
                        <Input
                            placeholder="Digite sua pesquisa..."
                            value={textoPesquisa}
                            onChange={(e) => setTextoPesquisa(e.target.value)}
                            className="w-full h-9 text-sm"
                            autoFocus
                        />

                        {isAluno && (
                            <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 p-0 bg-muted rounded-xl overflow-hidden h-auto border-1 border-black border-border">
                                    <TabsTrigger
                                        value="minhas"
                                        className="cursor-pointer h-full w-full py-2 text-sm font-medium text-muted-foreground rounded-lg data-[state=active]:bg-primary data-[state=active]:text-muted data-[state=active]:shadow-sm hover:text-foreground transition-all dark:data-[state=active]:bg-primary dark:data-[state=active]:text-foreground dark:data-[state=active]:shadow-sm dark:hover:text-foreground"
                                    >
                                        Inscritas
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="disponiveis"
                                        className="cursor-pointer h-full w-full py-2 text-sm font-medium text-muted-foreground rounded-lg data-[state=active]:bg-primary data-[state=active]:text-muted data-[state=active]:shadow-sm hover:text-foreground transition-all dark:data-[state=active]:bg-primary dark:data-[state=active]:text-foreground dark:data-[state=active]:shadow-sm dark:hover:text-foreground"
                                    >
                                        Disponíveis
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="todas"
                                        className="cursor-pointer h-full w-full py-2 text-sm font-medium text-muted-foreground rounded-lg data-[state=active]:bg-primary data-[state=active]:text-muted data-[state=active]:shadow-sm hover:text-foreground transition-all dark:data-[state=active]:bg-primary dark:data-[state=active]:text-foreground dark:data-[state=active]:shadow-sm dark:hover:text-foreground"
                                    >
                                        Todas
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        )}
                    </div>

                    <div className="mt-2 flex-1 overflow-y-auto pr-2 pb-6 space-y-2">
                        {turmasOrdenadas.length > 0 ? (
                            <>
                                <div className="text-xs text-muted-foreground mb-2">
                                    {turmasOrdenadas.length} resultado{turmasOrdenadas.length !== 1 ? 's' : ''}
                                </div>

                                <div className="flex flex-col gap-2">
                                    {turmasOrdenadas.map(([key, turma]) => (
                                        <TurmaCard
                                            key={key}
                                            compacto={true}
                                            materia={turma.materia}
                                            banners={turma.banners}
                                            professor={turma.professor}
                                            fotoProfessor={turma.foto_professor}
                                            sala={turma.sala}
                                            turma={turma.turma}
                                            inscrito={props.estaInscrito(key)}
                                            clickInscrito={() => props.mudarInscricao(key)}
                                            clickMural={() => { props.marcarMural(key) }}
                                            modoPesquisa={true}
                                            perfil={props.perfil}
                                        />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-muted-foreground text-center py-8">
                                Nenhum resultado encontrado.
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}