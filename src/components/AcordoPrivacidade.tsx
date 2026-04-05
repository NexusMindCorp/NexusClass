import { Button } from "./ui/button";

type AcordoPrivacidadeProps = {
    acionarAjuda: () => void;
}

export function AcordoPrivacidade({ acionarAjuda }: AcordoPrivacidadeProps) {
    return (
        <div className="max-w-3xl mx-auto p-6 bg-transparent rounded-lg">
            <h1 className="text-3xl font-bold mb-6 text-white">Termos de Uso e Política de Privacidade</h1>
            
            <div className="space-y-6 text-white leading-relaxed">
                <section>
                    <p className="mb-4 text-sm text-white italic">
                        Última atualização: {new Date().toLocaleDateString('pt-BR')}
                    </p>
                    <p className="mb-4">
                        Bem-vindo à plataforma de ensino NexusClass. Ao utilizar nossos serviços, você concorda em cumprir estes termos de uso. Leia atentamente antes de prosseguir.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-white">1. Criação e Responsabilidade da Conta</h2>
                    <p className="mb-3">
                        Para acessar a plataforma, você deverá criar uma conta fornecendo informações precisas e completas. Você concorda em:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li>Manter a confidencialidade de sua senha e não compartilhá-la com terceiros</li>
                        <li>Ser o único responsável por todas as atividades realizadas em sua conta</li>
                        <li>Notificar-nos imediatamente caso suspeite de uso não autorizado</li>
                        <li>Atualizar suas informações de conta quando necessário</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-white">2. Uso Aceitável</h2>
                    <p className="mb-3">
                        Você se compromete a utilizar a plataforma de forma responsável e ética. É proibido:
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li>Compartilhar referências ou conteúdo ofensivo, ilegal ou discriminatório</li>
                        <li>Tentar acessar ou modificar dados de outros usuários</li>
                        <li>Usar a plataforma para fins comerciais não autorizados</li>
                        <li>Implementar ataques de negação de serviço ou prejudicar a infraestrutura</li>
                        <li>Violar direitos autorais ou propriedade intelectual</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-white">3. Propriedade Intelectual</h2>
                    <p>
                        Todo conteúdo disponibilizado na plataforma, incluindo materiais didáticos, vídeos e exercícios, é protegido por direitos autorais. Você pode utilizar para fins educacionais pessoais, mas não pode reproduzir, distribuir ou publicar sem permissão prévia.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-white">4. Privacidade e Proteção de Dados</h2>
                    <p className="mb-3">
                        Seus dados pessoais são tratados conforme a Lei Geral de Proteção de Dados (LGPD):
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-2">
                        <li>Coletamos informações necessárias para fornecer melhores serviços educacionais</li>
                        <li>Seus dados não serão vendidos a terceiros</li>
                        <li>Utilizamos encriptação para proteger informações sensíveis</li>
                        <li>Você tem direito de acessar, corrigir ou solicitar exclusão de seus dados</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-white">5. Limitação de Responsabilidade</h2>
                    <p>
                        A plataforma é fornecida "como está". NexusClass não se responsabiliza por perda de dados, interrupções de serviço ou qualquer dano indireto resultante do uso ou impossibilidade de uso da plataforma.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-white">6. Modificações nos Termos</h2>
                    <p>
                        Reservamo-nos o direito de atualizar estes termos a qualquer momento. Notificaremos usuários sobre mudanças significativas. O uso contínuo da plataforma após essas mudanças constitui aceitação dos novos termos.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-white">7. Suspensão de Conta</h2>
                    <p>
                        Podemos suspender ou encerrar contas que violarem estes termos. Usuários serão notificados com antecedência, exceto em casos de violação grave.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-3 text-white">8. Contato e Suporte</h2>
                    <p>
                        Se tiver dúvidas sobre estes termos ou nossa política de privacidade, clique no botão abaixo para conversar com nosso assistente virtual ou entre em contato com nosso time de suporte.
                    </p>
                </section>
            </div>

            <div className="mt-8 pt-6 border-t border-white">
                <Button 
                    variant="link" 
                    onClick={acionarAjuda}
                >
                     Dúvidas sobre os termos de uso
                </Button>
            </div>
        </div>
    );
}