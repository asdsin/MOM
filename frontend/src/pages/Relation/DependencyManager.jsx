import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { masterAPI } from '../../api';

const REL = {
  required:    { label: '필수',   color: '#C0392B', bg: 'rgba(192,57,43,.1)' },
  recommended: { label: '추천',   color: '#1a5fa8', bg: 'rgba(26,95,168,.1)' },
  optional:    { label: '선택',   color: '#1a7a4a', bg: 'rgba(26,122,74,.1)' },
};
const S = {
  card:   { background: '#fff', borderRadius: 20, padding: '22px', marginBottom: 14,
            boxShadow: '-3px -3px 8px rgba(255,180,170,.5), 3px 3px 10px rgba(146,43,33,.18)' },
  label:  { fontSize: 11, fontWeight: 700, color: 'rgba(26,10,10,.55)', marginBottom: 5, display: 'block' },
  select: { width: '100%', padding: '10px 12px', border: '1.5px solid rgba(192,57,43,.22)',
            borderRadius: 11, fontSize: 13, fontFamily: 'inherit', background: '#fdf8f7',
            outline: 'none', cursor: 'pointer', marginBottom: 12 },
};

export default function DependencyManager() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ parent_module_cd: '', child_module_cd: '', rel_type: 'required' });
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'matrix' | 'graph'

  const { data: mods = [] } = useQuery({
    queryKey: ['master-modules'],
    queryFn: () => masterAPI.getModules().then(r => r.data),
  });
  const { data: deps = [] } = useQuery({
    queryKey: ['dependencies'],
    queryFn: () => masterAPI.getDependencies().then(r => r.data),
  });

  const createMut = useMutation({
    mutationFn: d => masterAPI.createDependency(d),
    onSuccess: () => { qc.invalidateQueries(['dependencies']); toast.success('의존성 추가 완료'); setForm({ parent_module_cd: '', child_module_cd: '', rel_type: 'required' }); },
    onError: e => toast.error(e.response?.data?.error || '추가 실패'),
  });
  const deleteMut = useMutation({
    mutationFn: id => masterAPI.deleteDependency(id),
    onSuccess: () => { qc.invalidateQueries(['dependencies']); toast.success('삭제 완료'); },
  });

  const getNm = cd => mods.find(m => m.module_cd === cd)?.module_nm || cd;

  // ── 의존성 매트릭스 계산 ────────────────────────────────
  const matrixCell = (parent, child) => deps.find(
    d => d.parent_module_cd === parent && d.child_module_cd === child
  );

  return (
    <div>
      {/* 뷰 전환 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[['list', '📋 목록'], ['matrix', '⬜ 매트릭스'], ['graph', '🔵 그래프']].map(([v, l]) => (
          <button key={v} onClick={() => setViewMode(v)} style={{
            padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
            background: viewMode === v ? '#C0392B' : 'rgba(192,57,43,.08)',
            color: viewMode === v ? '#fff' : '#C0392B',
          }}>{l}</button>
        ))}
      </div>

      {/* ── 목록 뷰 ── */}
      {viewMode === 'list' && (
        <div style={S.card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,10,10,.45)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 14 }}>현재 의존성 ({deps.length}개)</div>
          {deps.length === 0
            ? <div style={{ color: 'rgba(26,10,10,.35)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>등록된 의존성이 없습니다</div>
            : deps.map(d => {
              const r = REL[d.rel_type] || REL.required;
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid rgba(192,57,43,.07)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#C0392B' }}>{getNm(d.parent_module_cd)}</span>
                    <span style={{ fontSize: 18, color: 'rgba(26,10,10,.3)' }}>→</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{getNm(d.child_module_cd)}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: r.bg, color: r.color }}>{r.label}</span>
                  </div>
                  <button onClick={() => deleteMut.mutate(d.id)} style={{ padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(192,57,43,.2)', background: 'rgba(192,57,43,.06)', color: '#C0392B', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>삭제</button>
                </div>
              );
            })
          }
        </div>
      )}

      {/* ── 매트릭스 뷰 ── */}
      {viewMode === 'matrix' && (
        <div style={S.card}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,10,10,.45)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 14 }}>의존성 매트릭스 (행: 선행 → 열: 후행)</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 12px', background: '#1A1A2E', color: '#fff', borderRadius: '8px 0 0 0' }}>선행 ↓ / 후행 →</th>
                  {mods.map(m => (
                    <th key={m.module_cd} style={{ padding: '8px 10px', background: '#1A1A2E', color: '#fff', fontSize: 10, textAlign: 'center', whiteSpace: 'nowrap' }}>{m.module_nm}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mods.map((parent, pi) => (
                  <tr key={parent.module_cd} style={{ background: pi % 2 === 0 ? '#fff' : '#fdf8f7' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 700, fontSize: 11, whiteSpace: 'nowrap', borderRight: '2px solid rgba(192,57,43,.15)' }}>{parent.module_nm}</td>
                    {mods.map(child => {
                      const cell = matrixCell(parent.module_cd, child.module_cd);
                      const isSelf = parent.module_cd === child.module_cd;
                      const r = cell ? (REL[cell.rel_type] || REL.required) : null;
                      return (
                        <td key={child.module_cd} style={{ padding: '6px 8px', textAlign: 'center', background: isSelf ? 'rgba(0,0,0,.04)' : cell ? r.bg : 'transparent', border: '1px solid rgba(192,57,43,.06)' }}>
                          {isSelf ? <span style={{ color: 'rgba(26,10,10,.2)', fontSize: 14 }}>—</span>
                            : cell ? <span style={{ fontSize: 9, fontWeight: 800, color: r.color }}>{r.label}</span>
                            : <span style={{ color: 'rgba(26,10,10,.1)', fontSize: 10 }}>·</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
            {Object.entries(REL).map(([k, v]) => (
              <span key={k} style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: v.bg, color: v.color }}>■ {v.label}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── 그래프 뷰 (T3-08 SVG 기반) ── */}
      {viewMode === 'graph' && <ModuleGraph mods={mods} deps={deps} />}

      {/* ── 새 의존성 추가 ── */}
      <div style={{ ...S.card, border: '1.5px solid rgba(192,57,43,.2)' }}>
        <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 14 }}>새 의존성 추가</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 10, alignItems: 'end' }}>
          <div>
            <label style={S.label}>선행 모듈 (부모)</label>
            <select style={S.select} value={form.parent_module_cd} onChange={e => setForm(p => ({ ...p, parent_module_cd: e.target.value }))}>
              <option value="">선택</option>
              {mods.map(m => <option key={m.id} value={m.module_cd}>{m.module_nm}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>후행 모듈 (자식)</label>
            <select style={S.select} value={form.child_module_cd} onChange={e => setForm(p => ({ ...p, child_module_cd: e.target.value }))}>
              <option value="">선택</option>
              {mods.filter(m => m.module_cd !== form.parent_module_cd).map(m => <option key={m.id} value={m.module_cd}>{m.module_nm}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>관계 유형</label>
            <select style={S.select} value={form.rel_type} onChange={e => setForm(p => ({ ...p, rel_type: e.target.value }))}>
              {Object.entries(REL).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <button onClick={() => createMut.mutate(form)} disabled={!form.parent_module_cd || !form.child_module_cd || createMut.isPending} style={{ padding: '10px 20px', background: '#C0392B', color: '#fff', border: 'none', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', opacity: !form.parent_module_cd || !form.child_module_cd ? .4 : 1, marginBottom: 12 }}>추가</button>
        </div>
      </div>
    </div>
  );
}

// ── T3-08: SVG 기반 모듈 관계 그래프 ────────────────────────
function ModuleGraph({ mods, deps }) {
  const [hovered, setHovered] = useState(null);

  if (!mods.length) return null;

  // 모듈을 Stage별로 배치
  const stageGroups = { 1: [], 2: [], 3: [] };
  mods.forEach(m => { (stageGroups[m.stage_no] || stageGroups[1]).push(m); });

  const W = 820, H = 420;
  const STAGE_X = { 1: 120, 2: 400, 3: 680 };
  const STAGE_COLOR = { 1: '#C0392B', 2: '#1a5fa8', 3: '#1a7a4a' };
  const NODE_W = 130, NODE_H = 44;

  // 노드 위치 계산
  const nodePos = {};
  Object.entries(stageGroups).forEach(([stage, ms]) => {
    const spacing = Math.max(60, (H - 80) / Math.max(ms.length, 1));
    ms.forEach((m, i) => {
      nodePos[m.module_cd] = {
        x: STAGE_X[stage],
        y: 60 + i * spacing + (H - 80 - (ms.length - 1) * spacing) / 2,
        color: STAGE_COLOR[stage],
        nm: m.module_nm,
      };
    });
  });

  // 엣지 경로 계산
  const edges = deps.map(d => {
    const from = nodePos[d.parent_module_cd];
    const to   = nodePos[d.child_module_cd];
    if (!from || !to) return null;
    const x1 = from.x + NODE_W / 2, y1 = from.y + NODE_H / 2;
    const x2 = to.x   - NODE_W / 2, y2 = to.y   + NODE_H / 2;
    const cx1 = x1 + 60, cx2 = x2 - 60;
    return { d: `M${x1},${y1} C${cx1},${y1} ${cx2},${y2} ${x2},${y2}`, rel: d.rel_type, id: d.id, from: d.parent_module_cd, to: d.child_module_cd };
  }).filter(Boolean);

  const REL_COLORS = { required: '#C0392B', recommended: '#1a5fa8', optional: '#1a7a4a' };

  return (
    <div style={{ ...S.card, overflowX: 'auto' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(26,10,10,.45)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 14 }}>모듈 관계 그래프</div>
      <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
        <defs>
          {Object.entries(REL_COLORS).map(([k, c]) => (
            <marker key={k} id={`arrow-${k}`} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill={c} />
            </marker>
          ))}
        </defs>

        {/* Stage 레이블 배경 */}
        {[1, 2, 3].map(s => (
          <g key={s}>
            <rect x={STAGE_X[s] - NODE_W/2 - 10} y={10} width={NODE_W + 20} height={H - 20}
                  rx={16} fill={`${STAGE_COLOR[s]}08`} stroke={`${STAGE_COLOR[s]}20`} strokeWidth={1.5} />
            <text x={STAGE_X[s]} y={34} textAnchor="middle" fontSize={11} fontWeight={800} fill={STAGE_COLOR[s]}>단계 {s}</text>
          </g>
        ))}

        {/* 엣지 */}
        {edges.map((e, i) => (
          <g key={i}>
            <path d={e.d} fill="none" stroke={REL_COLORS[e.rel] || '#888'}
                  strokeWidth={hovered === `${e.from}-${e.to}` ? 2.5 : 1.5}
                  strokeDasharray={e.rel === 'optional' ? '5,3' : e.rel === 'recommended' ? '2,2' : '0'}
                  markerEnd={`url(#arrow-${e.rel})`}
                  opacity={hovered && hovered !== `${e.from}-${e.to}` ? .25 : .8}
                  style={{ transition: 'all .2s', cursor: 'pointer' }}
                  onMouseEnter={() => setHovered(`${e.from}-${e.to}`)}
                  onMouseLeave={() => setHovered(null)} />
          </g>
        ))}

        {/* 노드 */}
        {Object.entries(nodePos).map(([cd, pos]) => {
          const isHoveredNode = hovered && (hovered.startsWith(cd) || hovered.endsWith(cd));
          return (
            <g key={cd} onMouseEnter={() => setHovered(cd)} onMouseLeave={() => setHovered(null)} style={{ cursor: 'pointer' }}>
              <rect x={pos.x - NODE_W/2} y={pos.y} width={NODE_W} height={NODE_H}
                    rx={12} fill={isHoveredNode ? pos.color : '#fff'}
                    stroke={pos.color} strokeWidth={isHoveredNode ? 2.5 : 1.5}
                    style={{ filter: isHoveredNode ? `drop-shadow(0 4px 8px ${pos.color}40)` : 'none', transition: 'all .2s' }} />
              <text x={pos.x} y={pos.y + NODE_H/2 + 1} textAnchor="middle" dominantBaseline="middle"
                    fontSize={11} fontWeight={700} fill={isHoveredNode ? '#fff' : '#1a0a0a'}
                    style={{ transition: 'all .2s', pointerEvents: 'none' }}>
                {pos.nm.length > 8 ? pos.nm.slice(0, 8) + '…' : pos.nm}
              </text>
            </g>
          );
        })}
      </svg>

      {/* 범례 */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 12 }}>
        {[['required','실선','필수'], ['recommended','점선','추천'], ['optional','파선','선택']].map(([k, style, label]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
            <svg width={28} height={12}>
              <line x1={0} y1={6} x2={28} y2={6} stroke={REL_COLORS[k]} strokeWidth={2}
                    strokeDasharray={k === 'optional' ? '4,2' : k === 'recommended' ? '2,2' : '0'} />
            </svg>
            <span style={{ color: REL_COLORS[k], fontWeight: 700 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
