import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../api';
import { useAuthStore } from '../store';
import { getErrorMessage } from '../utils/getErrorMessage';

export default function Login() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const canSubmit = email.trim() !== '' && password.trim() !== '' && !loading;

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
      setError(getErrorMessage(err, '로그인에 실패했습니다'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-box">
        <div className="login-logo">WIZ<span className="accent">-Flow</span></div>
        <div className="login-sub">MOM 수준진단 시스템</div>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <label className="form-label">아이디</label>
          <input className="form-input-login" type="text" value={email}
                 onChange={e => setEmail(e.target.value)}
                 placeholder="아이디를 입력하세요"
                 autoComplete="off" autoFocus />

          <label className="form-label">비밀번호</label>
          <input className="form-input-login" type="password" value={password}
                 onChange={e => setPassword(e.target.value)}
                 placeholder="••••••••"
                 autoComplete="new-password" />

          <button className="btn-primary btn-block" type="submit" disabled={!canSubmit}
                  style={{ marginTop: 8, fontSize: 15 }}>
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

      </div>
    </div>
  );
}
