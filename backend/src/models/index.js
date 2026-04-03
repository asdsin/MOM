const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// ══════════════════════════════════════════════════════════
// E. 사용자/보안
// ══════════════════════════════════════════════════════════
const AuthUser = sequelize.define('auth_user', {
  id:            { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  tenant_id:     { type: DataTypes.STRING(50), allowNull: false },
  email:         { type: DataTypes.STRING(200), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  name:          { type: DataTypes.STRING(100), allowNull: false },
  user_type:     { type: DataTypes.ENUM('internal','external'), defaultValue: 'internal' },
  role_code:     { type: DataTypes.ENUM(
    'super_admin','system_admin','sales_manager','sales_user',
    'consultant','master_admin','customer_admin','customer_user','customer_viewer'
  ), defaultValue: 'sales_user' },
  is_active:     { type: DataTypes.BOOLEAN, defaultValue: true },
  fail_count:    { type: DataTypes.TINYINT, defaultValue: 0 },
  is_locked:     { type: DataTypes.BOOLEAN, defaultValue: false },
  last_login_at: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'auth_user', indexes: [{ fields: ['tenant_id'] }, { fields: ['email'], unique: true }] });

const AuthLoginHistory = sequelize.define('auth_login_history', {
  id:         { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:    { type: DataTypes.BIGINT.UNSIGNED },
  ip_addr:    { type: DataTypes.STRING(50) },
  user_agent: { type: DataTypes.STRING(300) },
  success:    { type: DataTypes.BOOLEAN },
}, { tableName: 'auth_login_history', updatedAt: false });

const AuthAuditLog = sequelize.define('auth_audit_log', {
  id:          { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id:     { type: DataTypes.BIGINT.UNSIGNED },
  action_type: { type: DataTypes.STRING(100) },
  target_id:   { type: DataTypes.STRING(100) },
  detail:      { type: DataTypes.TEXT },
  ip_addr:     { type: DataTypes.STRING(50) },
}, { tableName: 'auth_audit_log', updatedAt: false });

// ══════════════════════════════════════════════════════════
// A. 고객/조직
// ══════════════════════════════════════════════════════════
const CustomerCompany = sequelize.define('customer_company', {
  id:              { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  tenant_id:       { type: DataTypes.STRING(50), allowNull: false },
  company_nm:      { type: DataTypes.STRING(200), allowNull: false },
  business_no:     { type: DataTypes.STRING(20) },
  industry_type:   { type: DataTypes.STRING(50) },
  production_type: { type: DataTypes.STRING(50) },
  emp_cnt:         { type: DataTypes.INTEGER },
  erp_yn:          { type: DataTypes.BOOLEAN, defaultValue: false },
  mes_yn:          { type: DataTypes.BOOLEAN, defaultValue: false },
  wms_yn:          { type: DataTypes.BOOLEAN, defaultValue: false },
  plc_yn:          { type: DataTypes.BOOLEAN, defaultValue: false },
  sales_user_id:   { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
}, { tableName: 'customer_company',
    indexes: [{ fields: ['tenant_id'] }, { fields: ['sales_user_id'] }] });

const CustomerSite = sequelize.define('customer_site', {
  id:         { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  company_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  site_cd:    { type: DataTypes.STRING(20) },
  site_nm:    { type: DataTypes.STRING(100), allowNull: false },
  location:   { type: DataTypes.STRING(200) },
}, { tableName: 'customer_site' });

const CustomerFactory = sequelize.define('customer_factory', {
  id:         { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  site_id:    { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  factory_cd: { type: DataTypes.STRING(20) },
  factory_nm: { type: DataTypes.STRING(100), allowNull: false },
  line_cnt:   { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'customer_factory' });

const CustomerLine = sequelize.define('customer_line', {
  id:          { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  factory_id:  { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  line_cd:     { type: DataTypes.STRING(20) },
  line_nm:     { type: DataTypes.STRING(100), allowNull: false },
  shift_type:  { type: DataTypes.STRING(20) },
  cycle_time:  { type: DataTypes.FLOAT },
}, { tableName: 'customer_line' });

const CustomerProcess = sequelize.define('customer_process', {
  id:           { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  line_id:      { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  process_cd:   { type: DataTypes.STRING(20) },
  process_nm:   { type: DataTypes.STRING(100), allowNull: false },
  equip_cnt:    { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'customer_process' });

const CustomerEquipment = sequelize.define('customer_equipment', {
  id:          { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  process_id:  { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  equip_cd:    { type: DataTypes.STRING(20) },
  equip_nm:    { type: DataTypes.STRING(100), allowNull: false },
  pm_cycle:    { type: DataTypes.INTEGER },
  plc_yn:      { type: DataTypes.BOOLEAN, defaultValue: false },
  sensor_yn:   { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'customer_equipment' });

const CustomerExternalSystem = sequelize.define('customer_external_system', {
  id:             { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  company_id:     { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  system_type:    { type: DataTypes.STRING(20) },
  product_nm:     { type: DataTypes.STRING(100) },
  vendor:         { type: DataTypes.STRING(100) },
  api_open_yn:    { type: DataTypes.BOOLEAN, defaultValue: false },
  interface_type: { type: DataTypes.ENUM('api','db','file','none'), defaultValue: 'none' },
  note:           { type: DataTypes.TEXT },
}, { tableName: 'customer_external_system' });

// ══════════════════════════════════════════════════════════
// B. 기준정보
// ══════════════════════════════════════════════════════════
const MasterModule = sequelize.define('master_module', {
  id:                { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  module_cd:         { type: DataTypes.STRING(20), unique: true, allowNull: false },
  module_nm:         { type: DataTypes.STRING(100), allowNull: false },
  description:       { type: DataTypes.TEXT },
  stage_no:          { type: DataTypes.TINYINT, defaultValue: 1 },
  default_effort_y:  { type: DataTypes.DECIMAL(4,1), defaultValue: 1.0 },
  default_effort_n:  { type: DataTypes.DECIMAL(4,1), defaultValue: 4.0 },
  effort_type_y:     { type: DataTypes.ENUM('build','partial','api','data','master','skip'), defaultValue: 'partial' },
  effort_type_n:     { type: DataTypes.ENUM('build','partial','api','data','master','skip'), defaultValue: 'build' },
  reason_y:          { type: DataTypes.STRING(300) },
  reason_n:          { type: DataTypes.STRING(300) },
  api_warn:          { type: DataTypes.STRING(300) },
  is_active:         { type: DataTypes.BOOLEAN, defaultValue: true },
  version:           { type: DataTypes.INTEGER, defaultValue: 1 },
  status:            { type: DataTypes.ENUM('draft','review','approved'), defaultValue: 'draft' },
}, { tableName: 'master_module' });

const MasterQuestion = sequelize.define('master_question', {
  id:           { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  question_cd:  { type: DataTypes.STRING(30), unique: true },
  module_id:    { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  question_txt: { type: DataTypes.TEXT, allowNull: false },
  hint_txt:     { type: DataTypes.TEXT },
  answer_type:  { type: DataTypes.ENUM('yes_no','score','grade','multiple'), defaultValue: 'yes_no' },
  weight:       { type: DataTypes.FLOAT, defaultValue: 1.0 },
  required_yn:  { type: DataTypes.BOOLEAN, defaultValue: true },
  sort_order:   { type: DataTypes.INTEGER, defaultValue: 0 },
  version:      { type: DataTypes.INTEGER, defaultValue: 1 },
  is_active:    { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'master_question' });

const MasterMaturityStage = sequelize.define('master_maturity_stage', {
  id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  stage_no:   { type: DataTypes.TINYINT, unique: true },
  stage_nm:   { type: DataTypes.STRING(100) },
  badge_txt:  { type: DataTypes.STRING(100) },
  title_txt:  { type: DataTypes.STRING(200) },
  desc_txt:   { type: DataTypes.TEXT },
  color_hex:  { type: DataTypes.STRING(10) },
  version:    { type: DataTypes.INTEGER, defaultValue: 1 },
}, { tableName: 'master_maturity_stage' });

const MasterJudgmentRule = sequelize.define('master_judgment_rule', {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  rule_cd:        { type: DataTypes.STRING(30), unique: true },
  stage_no:       { type: DataTypes.TINYINT },
  condition_json: { type: DataTypes.JSON },
  result_stage:   { type: DataTypes.TINYINT },
  priority:       { type: DataTypes.INTEGER, defaultValue: 0 },
  version:        { type: DataTypes.INTEGER, defaultValue: 1 },
  is_active:      { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'master_judgment_rule' });

const MasterTemplateIndustry = sequelize.define('master_template_industry', {
  id:                  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  template_cd:         { type: DataTypes.STRING(30), unique: true },
  template_nm:         { type: DataTypes.STRING(100) },
  industry_type:       { type: DataTypes.STRING(50) },
  default_module_cds:  { type: DataTypes.JSON },
  description:         { type: DataTypes.TEXT },
  is_active:           { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'master_template_industry' });

// ══════════════════════════════════════════════════════════
// C. 판정 운영
// ══════════════════════════════════════════════════════════
const DiagnosisSession = sequelize.define('diagnosis_session', {
  id:               { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  company_id:       { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  user_id:          { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  template_cd:      { type: DataTypes.STRING(30) },
  selected_modules: { type: DataTypes.JSON },
  rule_version:     { type: DataTypes.INTEGER, defaultValue: 1 },
  status:           { type: DataTypes.ENUM('in_progress','completed','saved'), defaultValue: 'in_progress' },
  completed_at:     { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'diagnosis_session',
    indexes: [{ fields: ['company_id'] }, { fields: ['user_id'] }, { fields: ['status'] }] });

const DiagnosisAnswer = sequelize.define('diagnosis_answer', {
  id:          { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  session_id:  { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  question_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
  module_cd:   { type: DataTypes.STRING(20) },
  answer_val:  { type: DataTypes.STRING(20) },
}, { tableName: 'diagnosis_answer', updatedAt: false });

const DiagnosisResult = sequelize.define('diagnosis_result', {
  id:                  { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  session_id:          { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  stage_no:            { type: DataTypes.TINYINT },
  stage_nm:            { type: DataTypes.STRING(100) },
  total_weeks_min:     { type: DataTypes.DECIMAL(5,1) },
  total_weeks_max:     { type: DataTypes.DECIMAL(5,1) },
  selected_module_cnt: { type: DataTypes.INTEGER },
  api_warnings:        { type: DataTypes.JSON },
  snapshot_json:       { type: DataTypes.JSON },
}, { tableName: 'diagnosis_result', updatedAt: false });

const DiagnosisResultEffort = sequelize.define('diagnosis_result_effort', {
  id:           { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  result_id:    { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  module_cd:    { type: DataTypes.STRING(20) },
  module_nm:    { type: DataTypes.STRING(100) },
  answer_val:   { type: DataTypes.STRING(10) },
  effort_type:  { type: DataTypes.STRING(20) },
  effort_weeks: { type: DataTypes.DECIMAL(4,1) },
  reason:       { type: DataTypes.STRING(300) },
  api_warn:     { type: DataTypes.STRING(300) },
}, { tableName: 'diagnosis_result_effort', timestamps: false });

const DiagnosisReport = sequelize.define('diagnosis_report', {
  id:           { type: DataTypes.BIGINT.UNSIGNED, primaryKey: true, autoIncrement: true },
  session_id:   { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
  company_nm:   { type: DataTypes.STRING(200) },
  report_json:  { type: DataTypes.JSON },
  download_cnt: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'diagnosis_report', updatedAt: false });

// ══════════════════════════════════════════════════════════
// D. 연관성/룰
// ══════════════════════════════════════════════════════════
const RelModuleDependency = sequelize.define('rel_module_dependency', {
  id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  parent_module_cd: { type: DataTypes.STRING(20), allowNull: false },
  child_module_cd:  { type: DataTypes.STRING(20), allowNull: false },
  rel_type:         { type: DataTypes.ENUM('required','recommended','optional'), defaultValue: 'required' },
  priority:         { type: DataTypes.INTEGER, defaultValue: 0 },
  is_active:        { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'rel_module_dependency', updatedAt: false });

const RelModuleMasterdata = sequelize.define('rel_module_masterdata', {
  id:              { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  module_cd:       { type: DataTypes.STRING(20) },
  masterdata_type: { type: DataTypes.STRING(100) },
  required_yn:     { type: DataTypes.BOOLEAN, defaultValue: true },
  checklist_item:  { type: DataTypes.STRING(300) },
  priority_tag:    { type: DataTypes.STRING(20) },
  color_hex:       { type: DataTypes.STRING(10) },
  is_active:       { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'rel_module_masterdata', timestamps: false });

const RelModuleExternalSystem = sequelize.define('rel_module_external_system', {
  id:               { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  module_cd:        { type: DataTypes.STRING(20) },
  system_type:      { type: DataTypes.STRING(20) },
  required_yn:      { type: DataTypes.BOOLEAN, defaultValue: false },
  interface_type:   { type: DataTypes.ENUM('api','db','file','none') },
  effort_add_weeks: { type: DataTypes.FLOAT, defaultValue: 0 },
  warn_txt:         { type: DataTypes.STRING(300) },
  is_active:        { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'rel_module_external_system', timestamps: false });

// ══════════════════════════════════════════════════════════
// 관계 정의
// ══════════════════════════════════════════════════════════
AuthUser.hasMany(AuthLoginHistory,  { foreignKey: 'user_id' });
AuthLoginHistory.belongsTo(AuthUser, { foreignKey: 'user_id' });

AuthUser.hasMany(AuthAuditLog,  { foreignKey: 'user_id' });
AuthAuditLog.belongsTo(AuthUser, { foreignKey: 'user_id' });

CustomerCompany.belongsTo(AuthUser, { foreignKey: 'sales_user_id', as: 'salesUser' });
CustomerCompany.hasMany(CustomerSite,            { foreignKey: 'company_id', as: 'sites' });
CustomerCompany.hasMany(CustomerExternalSystem,  { foreignKey: 'company_id', as: 'extSystems' });
CustomerCompany.hasMany(DiagnosisSession,        { foreignKey: 'company_id', as: 'sessions' });

CustomerSite.belongsTo(CustomerCompany,    { foreignKey: 'company_id' });
CustomerSite.hasMany(CustomerFactory,      { foreignKey: 'site_id', as: 'factories' });
CustomerFactory.belongsTo(CustomerSite,    { foreignKey: 'site_id' });
CustomerFactory.hasMany(CustomerLine,      { foreignKey: 'factory_id', as: 'lines' });
CustomerLine.belongsTo(CustomerFactory,    { foreignKey: 'factory_id' });
CustomerLine.hasMany(CustomerProcess,      { foreignKey: 'line_id', as: 'processes' });
CustomerProcess.belongsTo(CustomerLine,    { foreignKey: 'line_id' });
CustomerProcess.hasMany(CustomerEquipment, { foreignKey: 'process_id', as: 'equipments' });
CustomerEquipment.belongsTo(CustomerProcess, { foreignKey: 'process_id' });

MasterModule.hasMany(MasterQuestion, { foreignKey: 'module_id', as: 'questions' });
MasterQuestion.belongsTo(MasterModule, { foreignKey: 'module_id', as: 'module' });

DiagnosisSession.belongsTo(CustomerCompany, { foreignKey: 'company_id', as: 'company' });
DiagnosisSession.belongsTo(AuthUser,        { foreignKey: 'user_id',    as: 'user' });
DiagnosisSession.hasMany(DiagnosisAnswer,   { foreignKey: 'session_id', as: 'answers' });
DiagnosisSession.hasMany(DiagnosisResult,   { foreignKey: 'session_id', as: 'results' });
DiagnosisSession.hasMany(DiagnosisReport,   { foreignKey: 'session_id', as: 'reports' });

DiagnosisResult.hasMany(DiagnosisResultEffort, { foreignKey: 'result_id', as: 'efforts' });
DiagnosisResultEffort.belongsTo(DiagnosisResult, { foreignKey: 'result_id' });

module.exports = {
  sequelize,
  AuthUser, AuthLoginHistory, AuthAuditLog,
  CustomerCompany, CustomerSite, CustomerFactory,
  CustomerLine, CustomerProcess, CustomerEquipment, CustomerExternalSystem,
  MasterModule, MasterQuestion, MasterMaturityStage,
  MasterJudgmentRule, MasterTemplateIndustry,
  DiagnosisSession, DiagnosisAnswer, DiagnosisResult,
  DiagnosisResultEffort, DiagnosisReport,
  RelModuleDependency, RelModuleMasterdata, RelModuleExternalSystem,
};
