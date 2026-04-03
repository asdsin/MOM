'use strict';
require('dotenv').config();
const app = require('./src/app');
const { sequelize, testConnection } = require('./src/config/db');
const seed = require('./db/seeders/master.seed');

const PORT = process.env.PORT || 3001;

(async () => {
  await testConnection();

  // 테이블 동기화 (개발: alter, 운영: migrate 사용)
  await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
  console.log('✅ DB 동기화 완료');

  // 초기 데이터 시드
  await seed();

  app.listen(PORT, () => {
    console.log(`🚀 MOM 수준진단 시스템 서버 시작: http://localhost:${PORT}`);
    console.log(`📚 API 문서: http://localhost:${PORT}/api/health`);
  });
})();
