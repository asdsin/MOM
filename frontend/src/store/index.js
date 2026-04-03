import { create } from 'zustand';

// ── 인증 스토어 ──────────────────────────────────────────────
export const useAuthStore = create((set) => ({
  user:  JSON.parse(localStorage.getItem('mom_user') || 'null'),
  token: localStorage.getItem('mom_token') || null,

  setAuth: (user, token) => {
    localStorage.setItem('mom_user',  JSON.stringify(user));
    localStorage.setItem('mom_token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('mom_user');
    localStorage.removeItem('mom_token');
    set({ user: null, token: null });
  },

  isLoggedIn: () => !!localStorage.getItem('mom_token'),
}));

// ── 진단 스토어 ──────────────────────────────────────────────
export const useDiagnosisStore = create((set, get) => ({
  // 세션
  sessionId:       null,
  companyId:       null,
  companyNm:       '',

  // 모듈 선택
  availableModules: [],   // DB에서 불러온 전체 모듈 목록
  selectedModules:  [],   // 선택된 모듈 cd 배열

  // 진단 답변
  answers: {},  // { module_cd: 'y'|'n' }

  // 결과
  result: null,

  // 현재 단계 (1:모듈선택, 2:현황진단, 3:결과)
  step: 1,

  // ── 모듈 선택 ─────────────────────────────────────────────
  setAvailableModules: (mods) => set({ availableModules: mods }),

  toggleModule: (module_cd) => {
    const { selectedModules, availableModules } = get();
    const isSelected = selectedModules.includes(module_cd);

    if (isSelected) {
      // 해제 시 — 이 모듈을 선행으로 가진 후행 모듈도 함께 해제
      const toRemove = findAllDependents(module_cd, selectedModules, availableModules);
      toRemove.add(module_cd);
      set({ selectedModules: selectedModules.filter(m => !toRemove.has(m)) });
      return { removed: [...toRemove] };
    } else {
      // 선택 시 — 선행 모듈 충족 여부 확인
      const mod = availableModules.find(m => m.module_cd === module_cd);
      const missing = (mod?.requires || []).filter(r => !selectedModules.includes(r));
      if (missing.length > 0) {
        const missingNames = missing.map(r => {
          const m = availableModules.find(x => x.module_cd === r);
          return m?.module_nm || r;
        });
        return { error: `선행 모듈 필요: ${missingNames.join(', ')}` };
      }
      set({ selectedModules: [...selectedModules, module_cd] });
      return { ok: true };
    }
  },

  canSelect: (module_cd) => {
    const { selectedModules, availableModules } = get();
    const mod = availableModules.find(m => m.module_cd === module_cd);
    return (mod?.requires || []).every(r => selectedModules.includes(r));
  },

  // ── 답변 ──────────────────────────────────────────────────
  setAnswer: (module_cd, val) =>
    set((s) => ({ answers: { ...s.answers, [module_cd]: val } })),

  // ── 세션 초기화 ───────────────────────────────────────────
  initSession: (sessionId, companyId, companyNm) =>
    set({ sessionId, companyId, companyNm, step: 1, selectedModules: [], answers: {}, result: null }),

  setResult: (result) => set({ result }),
  setStep:   (step)   => set({ step }),
  reset:     ()       => set({ sessionId: null, companyId: null, companyNm: '',
                                selectedModules: [], answers: {}, result: null, step: 1 }),
}));

// 후행 모듈 재귀 탐색
function findAllDependents(module_cd, selected, allModules) {
  const result = new Set();
  const direct = allModules
    .filter(m => (m.requires || []).includes(module_cd) && selected.includes(m.module_cd))
    .map(m => m.module_cd);
  direct.forEach(d => {
    result.add(d);
    findAllDependents(d, selected, allModules).forEach(x => result.add(x));
  });
  return result;
}
