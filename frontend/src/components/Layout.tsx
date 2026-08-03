import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Users,
  Package,
  Coins,
  ClipboardList,
  UserCog,
  FileSpreadsheet,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const NPP_NAV = [{ to: '/requests', label: 'Заявки', icon: ClipboardList }];

const NRP_NAV = [
  { to: '/partners', label: 'Партнёры', icon: Users },
  { to: '/skus', label: 'Справочник SKU', icon: Package },
  { to: '/tariffs', label: 'Тарифы', icon: Coins },
  { to: '/requests', label: 'Заявки', icon: ClipboardList },
  { to: '/acts', label: 'Акты', icon: FileSpreadsheet },
  { to: '/employees', label: 'Сотрудники', icon: UserCog },
];

export function Layout() {
  const { employee, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = employee?.role === 'НРП' ? NRP_NAV : NPP_NAV;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary-900/20">
                <span className="font-display font-semibold text-white text-[15px] leading-none">
                  3P
                </span>
              </div>
              <div className="leading-none">
                <span className="font-display font-semibold text-gray-900 text-[15px] tracking-tight">
                  Partner
                </span>
                <span className="text-gray-400 text-xs ml-2 align-middle">НПП</span>
              </div>
            </div>
            <nav className="flex items-center gap-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'text-primary'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/80',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute inset-0 rounded-lg bg-primary-50 animate-scale-in" />
                      )}
                      <Icon size={16} className="relative" />
                      <span className="relative hidden sm:inline">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center gap-3 pl-3 ml-2 border-l border-gray-200">
              <div className="hidden sm:block text-right">
                <div className="text-sm font-medium text-gray-900 leading-tight">
                  {employee?.fullName}
                </div>
                <div className="text-xs text-gray-400 leading-tight tracking-wide uppercase">
                  {employee?.role ?? 'роль не назначена'}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn-ghost text-xs p-2"
                title="Выйти"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in-up">
        <Outlet />
      </main>
    </div>
  );
}
