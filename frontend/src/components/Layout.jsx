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
    <div style={{ display:'flex', minHeight:'100vh', background:'#F8F9FA' }}>
      {/* 사이드바 */}
      <aside style={{
        width: 220, background:'#1A1A2E', display:'flex', flexDirection:'column',
        padding:'24px 0', flexShrink:0, position:'fixed', top:0, left:0, bottom:0, zIndex:100,
      }}>
        <div style={{padding:'0 20px 28px', borderBottom:'1px solid rgba(255,255,255,.08)'}}>
          <div style={{fontSize:18, fontWeight:900, color:'#fff', letterSpacing:'-.02em'}}>
            WIZ<span style={{color:'#E57373'}}>-Flow</span>
          </div>
          <div style={{fontSize:10, color:'rgba(255,255,255,.4)', marginTop:3}}>MOM 수준진단 시스템</div>
        </div>

        <nav style={{flex:1, padding:'16px 12px'}}>
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} style={{
                display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                borderRadius:12, marginBottom:4, textDecoration:'none',
                background: active ? 'rgba(192,57,43,.25)' : 'transparent',
                color: active ? '#fff' : 'rgba(255,255,255,.6)',
                fontSize:13, fontWeight: active ? 700 : 400,
                transition:'all .15s',
              }}>
                <span style={{fontSize:16}}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,.08)'}}>
          <div style={{fontSize:12, color:'rgba(255,255,255,.7)', marginBottom:4}}>{user?.name}</div>
          <div style={{fontSize:10, color:'rgba(255,255,255,.35)', marginBottom:12}}>{user?.role_code}</div>
          <button onClick={handleLogout} style={{
            width:'100%', padding:'8px', background:'rgba(255,255,255,.08)',
            color:'rgba(255,255,255,.6)', border:'1px solid rgba(255,255,255,.12)',
            borderRadius:10, fontSize:12, cursor:'pointer', fontFamily:'inherit',
          }}>로그아웃</button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main style={{ marginLeft:220, flex:1, display:'flex', flexDirection:'column' }}>
        {/* 상단 헤더 */}
        <header style={{
          height:56, background:'rgba(255,255,255,.92)', backdropFilter:'blur(20px)',
          borderBottom:'1px solid rgba(192,57,43,.1)', display:'flex',
          alignItems:'center', padding:'0 28px', position:'sticky', top:0, zIndex:50,
        }}>
          <h1 style={{fontSize:16, fontWeight:800, color:'#1a0a0a', letterSpacing:'-.02em'}}>
            {title}
          </h1>
        </header>

        <div style={{padding:'28px', flex:1}}>
          {children}
        </div>
      </main>
    </div>
  );
}
