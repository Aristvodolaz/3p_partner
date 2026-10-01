import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
  it('вызывает onClick по клику', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Жми</Button>);
    await userEvent.click(screen.getByRole('button', { name: 'Жми' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('loading блокирует кнопку и не вызывает onClick', async () => {
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Сохранить
      </Button>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('disabled блокирует клик', async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        X
      </Button>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });
});
