import { Link, Outlet } from 'react-router-dom';
import { getToken } from '../lib/api';
import ThemeToggle from './ThemeToggle';

const navLinks = [
  { to: '/', label: '首页' },
  { to: '/timeline', label: '时光轴' },
  { to: '/guestbook', label: '留言板' },
  { to: '/wall', label: '涂鸦墙' },
  { to: '/messages', label: '私信' },
];

export default function Layout() {
  const isLoggedIn = !!getToken();

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary flex flex-col">
      <header className="sticky top-0 z-50 bg-bg-secondary/95 backdrop-blur-sm border-b border-bg-card">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-6">
            <Link
              to="/"
              className="font-bold text-lg text-accent hover:opacity-80 transition-opacity"
            >
              我的空间
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to={isLoggedIn ? '/admin' : '/login'}
              className="text-sm text-text-secondary hover:text-accent transition-colors"
            >
              {isLoggedIn ? '管理' : '登录'}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-bg-card py-6 text-center text-sm text-text-secondary">
        <p>&copy; {new Date().getFullYear()} 我的网站</p>
      </footer>
    </div>
  );
}
