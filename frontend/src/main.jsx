import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16 }}>
          <div style={{ fontSize:16, color:'#C0392B', fontWeight:700 }}>페이지 로드 오류</div>
          <div style={{ fontSize:13, color:'rgba(0,0,0,.5)' }}>{String(this.state.error?.message || this.state.error)}</div>
          <button onClick={() => window.location.reload()} style={{ padding:'8px 20px', background:'#C0392B', color:'#fff', border:'none', borderRadius:10, cursor:'pointer' }}>새로고침</button>
        </div>
      );
    }
    return this.props.children;
  }
}

import Login        from './pages/Login';
import Dashboard    from './pages/Dashboard';
import CustomerList from './pages/Customers/CustomerList';
import CustomerForm from './pages/Customers/CustomerForm';
import CustomerDetail from './pages/Customers/CustomerDetail';
import DiagnosisFlow from './pages/Diagnosis/DiagnosisFlow';
import DiagnosisResult from './pages/Diagnosis/DiagnosisResult';
import MasterPage   from './pages/Master/MasterPage';

import { useAuthStore } from './store';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

function PrivateRoute({ children }) {
  const token = useAuthStore(s => s.token);
  return token ? children : <Navigate to="/login" replace />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/customers" element={<PrivateRoute><CustomerList /></PrivateRoute>} />
          <Route path="/customers/new" element={<PrivateRoute><CustomerForm /></PrivateRoute>} />
          <Route path="/customers/:id" element={<PrivateRoute><CustomerDetail /></PrivateRoute>} />
          <Route path="/diagnosis/:companyId" element={<PrivateRoute><DiagnosisFlow /></PrivateRoute>} />
          <Route path="/diagnosis/result/:sessionId" element={<PrivateRoute><DiagnosisResult /></PrivateRoute>} />
          <Route path="/master" element={<PrivateRoute><MasterPage /></PrivateRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-center" toastOptions={{
        style: { background: '#fff', color: '#1a0a0a', boxShadow: '0 4px 20px rgba(0,0,0,.12)', borderRadius: '14px' }
      }} />
    </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
