import api from './axios';

// ── 인증 ────────────────────────────────────────────────────
export const authAPI = {
  login:    (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  me:       ()     => api.get('/api/auth/me'),
  unlock:   (id)   => api.post(`/api/auth/unlock/${id}`),
};

// ── 고객사 ──────────────────────────────────────────────────
export const customerAPI = {
  list:          (params) => api.get('/api/customers', { params }),
  get:           (id)     => api.get(`/api/customers/${id}`),
  create:        (data)   => api.post('/api/customers', data),
  update:        (id, data) => api.put(`/api/customers/${id}`, data),
  delete:        (id)     => api.delete(`/api/customers/${id}`),

  // 공장 구조
  getSites:      (id)       => api.get(`/api/customers/${id}/sites`),
  createSite:    (id, data) => api.post(`/api/customers/${id}/sites`, data),
  createFactory: (cid, sid, data) => api.post(`/api/customers/${cid}/sites/${sid}/factories`, data),
  createLine:    (fid, data)      => api.post(`/api/customers/factories/${fid}/lines`, data),

  // 외부 시스템
  getExtSystems:    (id)       => api.get(`/api/customers/${id}/external-systems`),
  createExtSystem:  (id, data) => api.post(`/api/customers/${id}/external-systems`, data),
};

// ── 기준정보 ────────────────────────────────────────────────
export const masterAPI = {
  getModules:          (params) => api.get('/api/master/modules', { params }),
  createModule:        (data)   => api.post('/api/master/modules', data),
  updateModule:        (id, data) => api.put(`/api/master/modules/${id}`, data),
  approveModule:       (id)     => api.patch(`/api/master/modules/${id}/approve`),

  getQuestions:        (params) => api.get('/api/master/questions', { params }),
  createQuestion:      (data)   => api.post('/api/master/questions', data),
  updateQuestion:      (id, data) => api.put(`/api/master/questions/${id}`, data),

  getStages:           ()       => api.get('/api/master/stages'),
  getDependencies:     ()       => api.get('/api/master/dependencies'),
  createDependency:    (data)   => api.post('/api/master/dependencies', data),
  deleteDependency:    (id)     => api.delete(`/api/master/dependencies/${id}`),

  getMasterdataMap:    (params) => api.get('/api/master/masterdata-map', { params }),
  getTemplates:        ()       => api.get('/api/master/templates'),
  createTemplate:      (data)   => api.post('/api/master/templates', data),
  updateTemplate:      (id, data) => api.put(`/api/master/templates/${id}`, data),
  deleteTemplate:      (id)     => api.delete(`/api/master/templates/${id}`),

  getRules:            ()       => api.get('/api/master/rules'),
  createRule:          (data)   => api.post('/api/master/rules', data),
  updateRule:          (id, data) => api.put(`/api/master/rules/${id}`, data),
  deleteRule:          (id)     => api.delete(`/api/master/rules/${id}`),
};

// ── 진단 ────────────────────────────────────────────────────
export const diagnosisAPI = {
  getAvailableModules: ()             => api.get('/api/diagnosis/modules/available'),
  createSession:       (data)         => api.post('/api/diagnosis/sessions', data),
  updateModules:       (id, modules)  => api.put(`/api/diagnosis/sessions/${id}/modules`, { selected_modules: modules }),
  submitAnswer:        (id, data)     => api.post(`/api/diagnosis/sessions/${id}/answers`, data),
  calculate:           (id)           => api.post(`/api/diagnosis/sessions/${id}/calculate`),
  getResult:           (id)           => api.get(`/api/diagnosis/sessions/${id}/result`),
  getSessions:         (params)       => api.get('/api/diagnosis/sessions', { params }),
  exportExcel:         (id)           => api.get(`/api/diagnosis/sessions/${id}/export-excel`, { responseType: 'blob' }),
};
