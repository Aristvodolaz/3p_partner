import { NavLink, Outlet } from 'react-router-dom';
import { Building2, Users, Package, Coins, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/partners', label: 'Партнёры', icon: Users },
  { to: '/skus', label: 'Справочник SKU', icon: Package },
  { to: '/tariffs', label: 'Тарифы', icon: Coins },
  { to: '/requests', label: 'Заявки', icon: ClipboardList },
];

export function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Building2 size={16} className="text-white" />
              </div>
              <div>
                <span className="font-semibold text-gray-900">3P Partner</span>
                <span className="text-gray-400 text-sm ml-2">НПП</span>
              </div>
            </div>
            <nav className="flex items-center gap-1">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
                    )
                  }
                >
                  <Icon size={16} />
                  <span className="hidden sm:inline">{label}</span>
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
