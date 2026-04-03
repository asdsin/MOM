'use strict';
require('dotenv').config();
const path     = require('path');
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// ── 미들웨어 ────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(isProd ? 'combined' : 'dev'));

// ── 프로덕션: 프론트엔드 정적 파일 서빙 ─────────────────────
if (isProd) {
  app.use(express.static(path.join(__dirname, '../public')));
}

// ── 라우터 ──────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/customers', require('./routes/customer.routes'));
app.use('/api/master',    require('./routes/master.routes'));
app.use('/api/diagnosis', require('./routes/diagnosis.routes'));

// ── 헬스체크 ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MOM 수준진단 시스템', version: '1.0.0',
             time: new Date().toISOString() });
});

// ── 프로덕션: React Router SPA 지원 (catch-all) ───────────────
if (isProd) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

// ── 404 (개발용) ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Not Found: ${req.method} ${req.path}` });
});

// ── 전역 에러 핸들러 ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || '서버 오류가 발생했습니다',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
