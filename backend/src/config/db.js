require('dotenv').config();
const { Sequelize } = require('sequelize');

const dialect = process.env.DB_DIALECT || 'mysql';

const DEFINE = {
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
};

let sequelize;

if (dialect === 'sqlite') {
  // SQLite — 외부 DB 불필요, 인메모리 (서버 재시작 시 시드로 초기화)
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: process.env.DB_STORAGE || ':memory:',
    logging: false,
    define: DEFINE,
  });
} else {
  // MySQL (로컬/운영)
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host:     process.env.DB_HOST || 'localhost',
      port:     process.env.DB_PORT || 3306,
      dialect:  'mysql',
      timezone: '+09:00',
      logging:  process.env.NODE_ENV === 'development' ? console.log : false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      define: DEFINE,
    }
  );
}

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ ${dialect.toUpperCase()} 연결 성공`);
  } catch (err) {
    console.error(`❌ DB 연결 실패 (${dialect}):`, err.message);
    throw err;
  }
};

module.exports = { sequelize, testConnection };
