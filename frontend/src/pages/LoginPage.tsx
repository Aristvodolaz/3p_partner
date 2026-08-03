import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

export function LoginPage() {
  const [employeeId, setEmployeeId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!employeeId.trim()) return;
    setIsLoading(true);
    try {
      await login(employeeId.trim());
      const redirectTo = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-900 px-4 overflow-hidden">
      {/* Атмосферный фон: тёплый навy-градиент + тонкая сетка */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1100px 600px at 15% -10%, #1B4F8A 0%, transparent 60%), radial-gradient(900px 500px at 100% 110%, #163F6E 0%, transparent 55%), #17140F',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="flex flex-col items-center mb-9 text-center">
          <span className="font-display text-4xl font-semibold text-white tracking-tight">
            3P Partner
          </span>
          <div className="flex items-center gap-2 mt-2.5">
            <span className="h-px w-6 bg-accent-500/70" />
            <span className="text-white/50 text-xs tracking-[0.2em] uppercase">ТСД · Офис</span>
            <span className="h-px w-6 bg-accent-500/70" />
          </div>
        </div>

        <div className="card p-7 shadow-panel">
          <h1 className="font-display text-xl font-semibold text-gray-900 mb-1 tracking-tight">
            Вход в систему
          </h1>
          <p className="text-sm text-gray-500 mb-5">
            Введите табельный номер или ШК сотрудника
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Табельный номер / ШК</label>
              <input
                autoFocus
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Например, 10234"
                className="input font-mono tracking-wide"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !employeeId.trim()}
              className="btn-primary w-full justify-center group"
            >
              {isLoading ? 'Вход...' : 'Войти'}
              {!isLoading && (
                <ArrowRight
                  size={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          3P Partner — внутренняя система обработки заявок НПП
        </p>
      </div>
    </div>
  );
}
