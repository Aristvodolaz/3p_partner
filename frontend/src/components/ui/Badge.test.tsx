import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge, statusTone } from './Badge';

describe('statusTone', () => {
  it('сопоставляет статусы документов тонам', () => {
    expect(statusTone('Выполнено')).toBe('green');
    expect(statusTone('Отмена')).toBe('red');
    expect(statusTone('Процесс')).toBe('amber');
    expect(statusTone('Создана')).toBe('blue');
    expect(statusTone('неизвестный')).toBe('gray');
  });
});

describe('Badge', () => {
  it('рендерит текст и класс выбранного тона', () => {
    render(<Badge tone="green">Готово</Badge>);
    const el = screen.getByText('Готово');
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('emerald');
  });

  it('по умолчанию тон gray', () => {
    render(<Badge>Нейтрально</Badge>);
    expect(screen.getByText('Нейтрально').className).toContain('gray');
  });
});
