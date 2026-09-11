import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/ui/button';

describe('Componente Button (NexusClass Real)', () => {
  it('deve renderizar o botão com o texto passado por children', () => {
    render(<Button>Entrar na Turma</Button>);
    
    const botao = screen.getByRole('button', { name: /entrar na turma/i });
    expect(botao).toBeInTheDocument();
  });

  it('deve disparar a função passada no onClick quando o usuário clicar', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Salvar Alterações</Button>);
    
    const botao = screen.getByRole('button', { name: /salvar alterações/i });
    await userEvent.click(botao);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('deve respeitar a propriedade disabled e não chamar o onClick', async () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Desativado</Button>);
    
    const botao = screen.getByRole('button', { name: /desativado/i });
    expect(botao).toBeDisabled();

    await userEvent.click(botao);
    expect(handleClick).not.toHaveBeenCalled();
  });
});