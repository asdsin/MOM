'use strict';
// Vercel 서버리스 함수 진입점
// /api/* 요청을 모두 Express 앱으로 위임
process.env.DB_DIALECT  = process.env.DB_DIALECT  || 'sqlite';
process.env.DB_STORAGE  = process.env.DB_STORAGE  || '/tmp/mom.db';
process.env.NODE_ENV    = process.env.NODE_ENV    || 'production';

const { sequelize, testConnection } = require('../backend/src/config/db');
const seed = require('../backend/db/seeders/master.seed');
const app  = require('../backend/src/app');

let ready = false;

module.exports = async (req, res) => {
  if (!ready) {
    try {
      await testConnection();
      await sequelize.sync({ force: false });
      await seed();
      ready = true;
    } catch (e) {
      console.error('[INIT ERROR]', e.message);
      return res.status(500).json({ error: '서버 초기화 실패', detail: e.message });
    }
  }
  return app(req, res);
};
