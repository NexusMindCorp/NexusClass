

import { Input } from "@/components/ui/input"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { TurmaCard } from "./TurmaCard"
import { usePesquisa } from "@/hooks/usePesquisa"

type PesquisarProps = {
    mudarInscricao: (materia: string) => void
    estaInscrito: (materia: string) => boolean
    marcarMural: (key: string) => void
    voltarPrincipal: () => void
}
export function Pesquisar(props: PesquisarProps) {
    const { textoPesquisa, setTextoPesquisa, aberto, mudarAberturaSheet, turmasFiltradas } = usePesquisa({
        aoFecharPesquisa: props.voltarPrincipal
    })

    return (
        <div className="w-full h-full flex items-center justify-center p-4">
            <Sheet open={aberto} onOpenChange={mudarAberturaSheet}>
                <SheetContent side="top" className="h-[80vh] overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle>Pesquisar classrons</SheetTitle>
                        <SheetDescription>
                            Digite para pesquisar turmas, professores ou matérias
                        </SheetDescription>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="Digite sua pesquisa..."
                                value={textoPesquisa}
                                onChange={(e) => setTextoPesquisa(e.target.value)}
                                className="flex-1"
                                autoFocus
                            />
                        </div>

                        {/* Área de resultados */}
                        <div className="mt-6 space-y-4">
                            {textoPesquisa.trim() === "" ? (
                                <div className="text-sm text-muted-foreground text-center py-8">
                                    Digite algo para começar a pesquisa
                                </div>
                            ) : turmasFiltradas.length > 0 ? (
                                <>
                                    <div className="text-sm text-muted-foreground mb-4">
                                        {turmasFiltradas.length} resultado{turmasFiltradas.length !== 1 ? 's' : ''} encontrado{turmasFiltradas.length !== 1 ? 's' : ''}
                                    </div>
                                    <div className={`grid gap-4 ${turmasFiltradas.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
                                        turmasFiltradas.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                                            turmasFiltradas.length === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                                                turmasFiltradas.length === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4' :
                                                    'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                                        }`}>
                                        {turmasFiltradas.map(([key, turma]) => (
                                            <TurmaCard
                                                key={key}
                                                materia={turma.materia}
                                                banners={turma.banners}
                                                professor={turma.professor}
                                                fotoProfessor={turma.foto_professor}
                                                sala={turma.sala}
                                                turma={turma.turma}
                                                inscrito={props.estaInscrito(key)}
                                                clickInscrito={() => props.mudarInscricao(key)}
                                                clickMural={() => {
                                                    props.marcarMural(key)
                                                    mudarAberturaSheet(false)
                                                }}
                                            />
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-sm text-muted-foreground text-center py-2">
                                    Nenhum resultado encontrado para "{textoPesquisa}"
                                </div>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}