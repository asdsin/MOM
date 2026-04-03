import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../api';
import { useAuthStore } from '../store';

const S = {
  wrap:  { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
           background:'radial-gradient(ellipse 80% 60% at 50% 30%, #FEF0EE 0%, #fff 70%)' },
  box:   { background:'#fff', borderRadius:24, padding:'44px 36px', width:'100%', maxWidth:400,
           boxShadow:'-4px -4px 12px rgba(255,180,170,.55), 4px 4px 14px rgba(146,43,33,.22), inset 1px 1px 4px rgba(255,220,210,.80)' },
  logo:  { fontSize:24, fontWeight:900, letterSpacing:'-.03em', color:'#1a0a0a', marginBottom:6 },
  sub:   { fontSize:13, color:'rgba(26,10,10,.55)', marginBottom:32 },
  label: { display:'block', fontSize:12, fontWeight:700, color:'rgba(26,10,10,.65)', marginBottom:6 },
  input: { width:'100%', padding:'12px 14px', border:'1.5px solid rgba(192,57,43,.28)',
           borderRadius:12, fontSize:15, fontFamily:'inherit', outline:'none',
           background:'#fdf8f7', marginBottom:16,
           boxShadow:'inset -1px -1px 3px rgba(255,220,210,.7), inset 1px 1px 3px rgba(146,43,33,.12)' },
  btn:   { width:'100%', padding:'14px', background:'linear-gradient(135deg, #C0392B, #922B21)',
           color:'#fff', border:'none', borderRadius:14, fontSize:15, fontWeight:700,
           cursor:'pointer', fontFamily:'inherit', marginTop:8,
           boxShadow:'0 4px 16px rgba(192,57,43,.28)', transition:'transform .2s' },
  err:   { fontSize:12, color:'#C0392B', marginBottom:12, padding:'10px 14px',
           background:'rgba(192,57,43,.06)', borderRadius:10 },
};

export default function Login() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await authAPI.login({ email, password });
      setAuth(data.user, data.access_token);
      toast.success(`${data.user.name}님, 환영합니다!`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || '로그인에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.wrap}>
      <div style={S.box}>
        <div style={S.logo}>WIZ<span style={{color:'#C0392B'}}>-Flow</span></div>
        <div style={S.sub}>MOM 수준진단 시스템</div>

        {error && <div style={S.err}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={S.label}>이메일</label>
          <input style={S.input} type="email" value={email}
                 onChange={e => setEmail(e.target.value)}
                 placeholder="admin@wizfactory.com" autoFocus />

          <label style={S.label}>비밀번호</label>
          <input style={S.input} type="password" value={password}
                 onChange={e => setPassword(e.target.value)}
                 placeholder="••••••••" />

          <button style={S.btn} type="submit" disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

      </div>
    </div>
  );
}
