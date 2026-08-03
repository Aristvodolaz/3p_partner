import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Building2, LogIn } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-3">
            <Building2 size={22} className="text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-lg">3P Partner</span>
          <span className="text-gray-400 text-sm">НПП</span>
        </div>

        <div className="card p-6">
          <h1 className="text-base font-semibold text-gray-900 mb-1">Вход</h1>
          <p className="text-sm text-gray-500 mb-4">
            Введите табельный номер / ШК сотрудника
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Табельный номер / ШК сотрудника</label>
              <input
                autoFocus
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                placeholder="Например, 10234"
                className="input"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !employeeId.trim()}
              className="btn-primary w-full justify-center"
            >
              <LogIn size={16} />
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
