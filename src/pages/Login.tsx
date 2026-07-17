import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setToken, getToken } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (getToken()) {
    navigate('/admin', { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = (await api.post('/auth/login', { username, password })) as { token: string };
      setToken(data.token);
      navigate('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-bg-card rounded-2xl p-8 border border-bg-card shadow-xl">
        <div className="text-center mb-8">
          <div className="text-3xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold text-text-primary">管理员登录</h1>
          <p className="text-text-secondary text-sm mt-1">
            登录以管理网站
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              用户名
            </label>
            <input
              type="text"
              placeholder="输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-bg-secondary text-text-primary border border-bg-card focus:border-accent outline-none placeholder:text-text-secondary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              密码
            </label>
            <input
              type="password"
              placeholder="输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-bg-secondary text-text-primary border border-bg-card focus:border-accent outline-none placeholder:text-text-secondary"
            />
          </div>

          {error && (
            <div className="bg-red-400/10 border border-red-400/30 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 rounded-lg bg-accent text-white font-medium hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
