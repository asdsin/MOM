'use strict';
require('dotenv').config();
const app = require('./src/app');
const { sequelize, testConnection } = require('./src/config/db');
const seed = require('./db/seeders/master.seed');

const PORT = process.env.PORT || 3001;

(async () => {
  await testConnection();

  // 테이블 동기화
  // SQLite(인메모리): force=true 로 매번 새로 생성 후 시드
  // MySQL 개발: alter=true / MySQL 운영: 변경 없음
  const dialect = process.env.DB_DIALECT || 'mysql';
  const syncOpt = dialect === 'sqlite'
    ? { force: true }
    : { alter: process.env.NODE_ENV === 'development' };
  await sequelize.sync(syncOpt);
  console.log('✅ DB 동기화 완료');

  // 초기 데이터 시드
  await seed();

  app.listen(PORT, () => {
    console.log(`🚀 MOM 수준진단 시스템 서버 시작: http://localhost:${PORT}`);
    console.log(`📚 API 문서: http://localhost:${PORT}/api/health`);
  });
})();
