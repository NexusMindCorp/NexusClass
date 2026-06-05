
interface BoxRestritoProps {
  titulo?: string;
  mensagem?: string;
  children?: React.ReactNode;
}

export function BoxRestrito({ 
  titulo = "Acesso Restrito", 
  mensagem = "Vocês não tem permissão para visualizar este conteúdo. Entre em contato com o suporte caso seja algum erro.",
  children 
}: BoxRestritoProps) {
  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-[#1a1a1e] border border-[#2d2d32] rounded-2xl text-center shadow-xl">
      <h2 className="text-2xl font-bold text-red-500">{titulo}</h2>
      <img src="https://cdn-icons-png.flaticon.com/512/179/179314.png" alt="Ícone de cadeado de bloqueio" className="mx-auto mt-4 w-16 h-16 opacity-70" />
      <p className="text-white-400 mt-2">{mensagem}</p>
      
      {/* Renderiza qualquer botão ou elemento extra passado para o componente, se existir */}
      {children && (
        <div className="mt-6 flex justify-center">
          {children}
        </div>
      )}
    </div>
  );
}