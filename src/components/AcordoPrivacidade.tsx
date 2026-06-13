import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";

type AcordoPrivacidadeProps = {
    acionarAjuda: () => void;
}

export function AcordoPrivacidade({ acionarAjuda }: AcordoPrivacidadeProps) {
    return (
        <div className="max-w-4xl mx-auto p-4">
            <Card className="bg-card text-card-foreground border-border shadow-2xl">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">Termos de Uso e Política de Privacidade</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground italic">
                        Última atualização: {new Date().toLocaleDateString('pt-BR')}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="space-y-6 text-foreground/90 leading-relaxed">
                        <section>
                            <p className="mb-2">
                                Bem-vindo ao NexusClass, uma plataforma de ambiente virtual de aprendizagem cooperativa desenvolvida como projeto educacional e laboratório prático. Ao acessar ou interagir com nosso sistema, você declara ter lido, compreendido e aceitado integralmente estes Termos de Uso e Política de Privacidade.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-foreground">1. Aceitação dos Termos e Escopo Educativo</h2>
                            <p className="mb-3">
                                Ao utilizar a plataforma, você concorda com as condições de uso estabelecidas para este projeto educativo. Você reconhece que:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>O NexusClass é um projeto experimental, sem fins lucrativos e estritamente de caráter educacional;</li>
                                <li>O sistema é utilizado como laboratório para aprendizado de tecnologias de front-end, back-end e design systems;</li>
                                <li>Ao utilizar a plataforma, você atesta possuir capacidade civil plena ou estar devidamente assistido por seus responsáveis.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-foreground">2. Descrição dos Serviços</h2>
                            <p className="mb-3">
                                A plataforma simula um ambiente virtual de ensino contendo:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Criação de salas de aula virtuais, controle de turmas e visualização de estudantes;</li>
                                <li>Publicação de avisos no mural de comunicações e envio de mensagens em tempo real;</li>
                                <li>Visualização, entrega e acompanhamento de atividades escolares de simulação;</li>
                                <li>Interação com assistentes virtuais automatizados de chat de suporte.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-foreground">3. Cadastro, Perfis e Segurança da Conta</h2>
                            <p className="mb-3">
                                Para utilizar as funcionalidades interativas, é necessário criar uma conta com informações básicas. Você se compromete a:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Proteger a confidencialidade de sua senha e não compartilhá-la com terceiros;</li>
                                <li>Ser responsável por todas as atividades realizadas em seu perfil de Aluno ou Professor;</li>
                                <li>Notificar imediatamente o suporte sobre qualquer suspeita de invasão ou uso não autorizado de sua conta;</li>
                                <li>Manter suas informações básicas de cadastro atualizadas e verídicas.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-foreground">4. Política de Uso Aceitável e Conduta</h2>
                            <p className="mb-3">
                                Para garantir um ambiente saudável e respeitoso no mural e nas trocas de mensagens, é terminantemente proibido:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Publicar conteúdo com caráter ofensivo, violento, ilegal, discriminatório ou preconceituoso;</li>
                                <li>Tentar burlar sistemas de segurança, injetar códigos maliciosos ou realizar varreduras de vulnerabilidades;</li>
                                <li>Realizar raspagem de dados (scraping) ou usar robôs para capturar informações de outros usuários;</li>
                                <li>Publicar materiais ou links de terceiros protegidos por propriedade intelectual sem a devida autorização.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-foreground">5. Conteúdo Gerado pelo Usuário</h2>
                            <p className="mb-3">
                                Você mantém a titularidade e os direitos intelectuais sobre qualquer material de estudo, postagem no mural ou arquivo anexado:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Você concede ao NexusClass uma licença gratuita e limitada para exibir e transmitir esses arquivos aos membros de sua respectiva turma;</li>
                                <li>Você declara ter pleno direito para fazer o envio e disponibilização desses arquivos no ambiente virtual;</li>
                                <li>Garantimos a remoção dos seus dados e dos arquivos correspondentes mediante exclusão de sua conta.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-foreground">6. Propriedade Intelectual da Plataforma</h2>
                            <p className="mb-3">
                                Os elementos originais que compõem o ecossistema NexusClass estão protegidos:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>O design gráfico, layout, código-fonte de controle de estado e estrutura de componentes pertencem aos seus autores originais;</li>
                                <li>A utilização de componentes baseados no shadcn/ui e Tailwind CSS segue suas respectivas licenças de software aberto (MIT).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-foreground">7. Gratuidade e Ausência de Cobranças</h2>
                            <p className="mb-3">
                                Por ser um piloto de caráter estritamente educativo:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Não há qualquer tipo de cobrança de mensalidade, taxa de inscrição ou anúncios pagos;</li>
                                <li>Nenhuma transação financeira real ou solicitação de dados bancários será feita por nossa equipe;</li>
                                <li>Toda simulação de pontuação ou entrega de tarefas tem finalidade puramente ilustrativa.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-foreground">8. Disponibilidade do Serviço e Isenção de SLA</h2>
                            <p className="mb-3">
                                Devido ao estágio experimental do projeto:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>A plataforma é fornecida "no estado em que se encontra", sem garantias de desempenho ou disponibilidade ininterrupta;</li>
                                <li>Não oferecemos acordos de nível de serviço (SLA) ou compromisso contra a perda de arquivos carregados;</li>
                                <li>Manutenções preventivas ou corretivas podem ocorrer a qualquer momento e ocasionar indisponibilidade de uso temporária.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-foreground">9. Privacidade e Proteção de Dados (LGPD)</h2>
                            <p className="mb-3">
                                O tratamento de suas informações respeita a Lei Geral de Proteção de Dados (LGPD):
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Coletamos apenas dados cadastrais necessários para uso (nome, e-mail, papel de acesso e fotos enviadas pelo usuário);</li>
                                <li>Os dados coletados não serão comercializados, alugados ou compartilhados com terceiros para fins de marketing;</li>
                                <li>Garantimos o acesso rápido para consulta, alteração ou exclusão definitiva de seus dados a partir do painel do usuário.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-foreground">10. Limitação de Responsabilidade</h2>
                            <p className="mb-3">
                                Os criadores e mantenedores da plataforma não se responsabilizam por:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Eventuais danos causados por interrupções do servidor, bugs, invasões externas ou vazamentos acidentais de dados de teste;</li>
                                <li>Eventual incompatibilidade de navegadores ou indisponibilidade de ferramentas acessadas externamente;</li>
                                <li>Prejuízos indiretos de qualquer natureza decorrentes do uso de arquivos ou simulações da plataforma.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-foreground">11. Suspensão e Encerramento de Contas</h2>
                            <p className="mb-3">
                                Reservamo-nos o direito de restringir o acesso a qualquer conta:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Em caso de violações graves a estes termos de uso ou denúncias fundamentadas de conduta imprópria no mural;</li>
                                <li>Mediante solicitação de encerramento pelo próprio usuário, o que acarretará na exclusão definitiva de seus dados do banco de dados operacional.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-foreground">12. Modificações nos Termos</h2>
                            <p className="mb-3">
                                Reservamo-nos o direito de atualizar este documento a qualquer momento para adequação técnica ou legal:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Modificações significativas serão avisadas de forma clara na interface da plataforma;</li>
                                <li>O uso continuado da plataforma após as modificações constitui concordância expressa com os termos atualizados.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-foreground">13. Legislação Aplicável e Foro</h2>
                            <p className="mb-3">
                                Este termo de uso é regido pela legislação da República Federativa do Brasil. Eventuais controvérsias judiciais que  poderão ser solucionadas amigavelmente.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-foreground">14. Contato e Suporte</h2>
                            <p className="mb-3">
                                Para esclarecer quaisquer dúvidas sobre estes termos de uso ou a política de privacidade de dados:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Utilize o chat de suporte direto na barra de navegação principal da plataforma;</li>
                                <li>Consulte as opções de atendimento ao contato disponíveis na tela de suporte do usuário.</li>
                            </ul>
                        </section>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border">
                        <Button
                            variant="link"
                            onClick={acionarAjuda}
                            className="text-primary hover:text-primary/80 cursor-pointer p-0 h-auto font-medium transition-colors"
                        >
                            Dúvidas sobre os termos de uso
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}