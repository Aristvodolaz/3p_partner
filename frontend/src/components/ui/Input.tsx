import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <input
      ref={ref}
      className={cn('input', error && 'input-error', className)}
      aria-invalid={error || undefined}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn('input resize-none', error && 'input-error', className)}
      aria-invalid={error || undefined}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn('input pr-8', error && 'input-error', className)}
      aria-invalid={error || undefined}
      {...props}
    >
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

/** Поле с подписью и текстом ошибки под ним — единый вертикальный ритм форм. */
export function Field({
  label,
  required,
  error,
  hint,
  htmlFor,
  children,
}: {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
          {required && <span className="text-primary ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}
