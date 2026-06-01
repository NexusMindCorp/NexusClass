import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";

type AcordoPrivacidadeProps = {
    acionarAjuda: () => void;
}

export function AcordoPrivacidade({ acionarAjuda }: AcordoPrivacidadeProps) {
    return (
        <div className="max-w-4xl mx-auto p-4">
            <Card className="border-slate-200 bg-white text-slate-900 shadow-2xl dark:border-white/10 dark:bg-slate-950/40 dark:text-white">
                <CardHeader>
                    <CardTitle className="text-3xl">Termos de Uso e Política de Privacidade</CardTitle>
                    <CardDescription className="text-sm text-slate-600 dark:text-white/60 italic">Última atualização: {new Date().toLocaleDateString('pt-BR')}</CardDescription>
                </CardHeader>

                <CardContent>
                    <div className="space-y-6 text-slate-700 dark:text-white leading-relaxed">
                        <section>
                            <p className="mb-2">
                                Bem-vindo à plataforma de ensino NexusClass. Ao utilizar nossos serviços, você concorda em cumprir estes termos de uso. Leia atentamente antes de prosseguir.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">1. Criação e Responsabilidade da Conta</h2>
                            <p className="mb-3">
                                Para utilizar a plataforma, é necessário criar uma conta com informações precisas e completas. Você concorda em:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Proteger a confidencialidade de sua senha e não compartilhá-la com terceiros;</li>
                                <li>Ser responsável por todas as atividades realizadas em sua conta;</li>
                                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado;</li>
                                <li>Manter suas informações de conta atualizadas quando necessário.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">2. Uso Aceitável</h2>
                            <p className="mb-3">
                                Você se compromete a utilizar a plataforma de maneira responsável e ética. É proibido:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Publicar conteúdo ofensivo, ilegal ou discriminatório;</li>
                                <li>Tentar acessar ou modificar dados de outros usuários sem autorização;</li>
                                <li>Utilizar a plataforma para fins comerciais não autorizados;</li>
                                <li>Realizar ataques que comprometam a disponibilidade do serviço;</li>
                                <li>Violar direitos de propriedade intelectual.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">3. Propriedade Intelectual</h2>
                            <p>
                                Todo o conteúdo disponibilizado na plataforma, incluindo materiais didáticos, vídeos e exercícios, é protegido por direitos autorais. O uso é permitido para fins educacionais pessoais, mas a reprodução, distribuição ou publicação requer autorização prévia.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">4. Privacidade e Proteção de Dados</h2>
                            <p className="mb-3">
                                Seus dados pessoais são tratados de acordo com a Lei Geral de Proteção de Dados (LGPD):
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-2">
                                <li>Coletamos apenas os dados necessários para a prestação dos serviços;</li>
                                <li>Não vendemos dados a terceiros;</li>
                                <li>Implementamos medidas de segurança para proteger informações sensíveis;</li>
                                <li>Você tem o direito de acessar, corrigir ou solicitar a exclusão de seus dados.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">5. Limitação de Responsabilidade</h2>
                            <p>
                                A plataforma é fornecida "no estado em que se encontra". NexusClass não se responsabiliza por perdas indiretas, interrupções temporárias ou danos decorrentes do uso ou da indisponibilidade do serviço.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">6. Modificações nos Termos</h2>
                            <p>
                                Reservamo-nos o direito de atualizar estes termos a qualquer momento. Notificaremos os usuários sobre mudanças significativas. O uso contínuo da plataforma após a notificação implica aceitação dos novos termos.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">7. Suspensão de Conta</h2>
                            <p>
                                Podemos suspender ou encerrar contas que violarem estes termos. Sempre que possível, os usuários serão notificados previamente, exceto em casos de violação grave.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">8. Contato e Suporte</h2>
                            <p>
                                Se você tiver dúvidas sobre estes termos ou nossa política de privacidade, utilize o chat de suporte ou entre em contato pelo canal oficial. Estamos à disposição para esclarecer.
                            </p>
                        </section>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
                        <Button
                            variant="link"
                            onClick={acionarAjuda}
                            className="text-indigo-600 dark:text-indigo-400"
                        >
                            Dúvidas sobre os termos de uso
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}