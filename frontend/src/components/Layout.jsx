import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import toast from 'react-hot-toast';

const NAV_ITEMS = [
  { path: '/',          label: '대시보드',    icon: '📊' },
  { path: '/customers', label: '고객사 관리', icon: '🏭' },
  { path: '/master',    label: '기준정보 관리', icon: '⚙️' },
];

export default function Layout({ children, title }) {
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate  = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('로그아웃됐습니다');
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F9FA' }}>
      {/* 사이드바 */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="brand">
            WIZ<span className="accent">-Flow</span>
          </div>
          <div className="sub">MOM 수준진단 시스템</div>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item${active ? ' active' : ''}`}
              >
                <span className="icon">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-user">
          <div className="name">{user?.name}</div>
          <div className="role">{user?.role_code}</div>
          <button onClick={handleLogout} className="logout-btn">로그아웃</button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="main-content">
        <header className="header">
          <h1>{title}</h1>
        </header>
        <div className="content-body">
          {children}
        </div>
      </main>
    </div>
  );
}
