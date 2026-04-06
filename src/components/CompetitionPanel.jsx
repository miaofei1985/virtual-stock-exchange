import React, { useState, useEffect } from 'react';
import { getCompetitionStatus, getTimeRemaining } from '../utils/competition';
import { api } from '../utils/api';
import { useLang } from '../i18n/LanguageContext';

export default function CompetitionPanel({ user, onClose }) {
  const { t } = useLang();
  const [comps, setComps] = useState([]);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', durationDays: 7, startBalance: 1000000 });

  const fetchComps = async () => {
    try { const data = await api.getCompetitions(); setComps(data); } catch {}
  };

  useEffect(() => {
    fetchComps();
    const timer = setInterval(fetchComps, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      const result = await api.createCompetition(form.name, form.startBalance, form.durationDays);
      await fetchComps();
      setSelected(result.id);
      setView('detail');
    } catch {}
  };

  const handleJoin = async (compId) => {
    try { await api.joinCompetition(compId); await fetchComps(); } catch {}
  };

  const handleDelete = async (compId) => {
    try {
      await api.deleteCompetition(compId);
      setComps(prev => prev.filter(c => c.id !== compId));
    } catch {}
  };

  const statusLabel = (s) => s === 'active' ? t('active') : s === 'ended' ? t('ended') : t('upcoming');

  const panelStyle = { background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' };
  const labelStyle = { color: 'var(--text-muted)' };
  const inputStyle = { color: 'var(--text-bright)', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' };

  const renderList = () => (
    <div className="flex flex-col gap-2">
      <button onClick={() => setView('create')}
        className="w-full py-2 text-xs font-bold rounded border transition-all min-h-[44px]"
        style={{ background: 'rgba(38,166,154,0.15)', color: 'var(--up-color)', borderColor: 'rgba(38,166,154,0.3)' }}>
        {t('createCompetition')}
      </button>
      {comps.length === 0 ? (
        <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>{t('noCompetitions')}</div>
      ) : comps.map(comp => {
        const status = getCompetitionStatus(comp);
        const joined = comp.participants.find(p => (p.userId || p.user_id) === user.id);
        return (
          <div key={comp.id} className="rounded border p-3" style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm" style={{ color: 'var(--text-bright)' }}>{comp.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                status === 'active' ? 'text-up' : status === 'ended' ? 'price-down' : ''
              }`} style={{
                background: status === 'active' ? 'rgba(38,166,154,0.15)' : status === 'ended' ? 'rgba(239,83,80,0.15)' : 'rgba(255,193,7,0.15)',
                color: status === 'active' ? 'var(--up-color)' : status === 'ended' ? 'var(--down-color)' : '#ffc107',
              }}>{statusLabel(status)}</span>
            </div>
            <div className="flex gap-4 text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
              <span>💰 ${(comp.start_balance || comp.startBalance || 1000000).toLocaleString()}</span>
              <span>⏱ {getTimeRemaining(comp)}</span>
              <span>👥 {(comp.participants || []).length}</span>
            </div>
            <div className="flex gap-2">
              {status === 'active' && !joined && (
                <button onClick={() => handleJoin(comp.id)}
                  className="flex-1 py-1 text-xs font-bold rounded min-h-[44px]"
                  style={{ background: 'rgba(38,166,154,0.15)', color: 'var(--up-color)' }}>{t('join')}</button>
              )}
              <button onClick={() => { setSelected(comp.id); setView('detail'); }}
                className="flex-1 py-1 text-xs rounded min-h-[44px]"
                style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)' }}>{t('leaderboard')}</button>
              {comp.creator_id === user.id && (
                <button onClick={() => handleDelete(comp.id)}
                  className="py-1 px-2 text-xs rounded min-w-[44px] min-h-[44px]"
                  style={{ background: 'rgba(239,83,80,0.15)', color: 'var(--down-color)' }}
                  aria-label="Delete competition">🗑</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderCreate = () => (
    <div className="flex flex-col gap-3">
      <button onClick={() => setView('list')} className="text-xs text-left min-h-[44px]" style={{ color: 'var(--text-muted)' }}>← Back</button>
      <div>
        <label className="text-xs block mb-1" style={labelStyle}>{t('competitionName')}</label>
        <input className="input-dark" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
          placeholder={t('weeklyTradingChallenge')} />
      </div>
      <div>
        <label className="text-xs block mb-1" style={labelStyle}>{t('duration')}</label>
        <input className="input-dark" type="number" min="1" max="30" value={form.durationDays}
          onChange={e => setForm({...form, durationDays: parseInt(e.target.value) || 7})} />
      </div>
      <div>
        <label className="text-xs block mb-1" style={labelStyle}>{t('startingBalance')}</label>
        <input className="input-dark" type="number" min="1000" step="1000" value={form.startBalance}
          onChange={e => setForm({...form, startBalance: parseInt(e.target.value) || 1000000})} />
      </div>
      <button onClick={handleCreate} className="w-full py-2 text-white font-bold rounded text-sm min-h-[44px]"
        style={{ background: 'var(--up-color)' }}>
        {t('createAndJoin')}
      </button>
    </div>
  );

  const renderDetail = () => {
    const comp = comps.find(c => c.id === selected);
    if (!comp) return <div style={{ color: 'var(--text-muted)' }}>Competition not found</div>;
    const leaderboard = [...(comp.participants || [])].sort((a, b) => (b.pnl_pct || 0) - (a.pnl_pct || 0));
    const status = getCompetitionStatus(comp);

    return (
      <div className="flex flex-col gap-2">
        <button onClick={() => setView('list')} className="text-xs text-left min-h-[44px]" style={{ color: 'var(--text-muted)' }}>← Back</button>
        <div className="flex items-center justify-between">
          <span className="font-bold" style={{ color: 'var(--text-bright)' }}>{comp.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-bold ${status === 'active' ? 'text-up' : 'price-down'}`}
            style={{ background: status === 'active' ? 'rgba(38,166,154,0.15)' : 'rgba(239,83,80,0.15)' }}>
            {statusLabel(status)} · {getTimeRemaining(comp)}
          </span>
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('starting')}: ${(comp.start_balance || comp.startBalance || 1000000).toLocaleString()} · {(comp.participants || []).length} {t('participants')}</div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-4" style={{ color: 'var(--text-muted)' }}>{t('noParticipants')}</div>
        ) : (
          <div className="flex flex-col gap-1">
            {leaderboard.map((p, i) => (
              <div key={p.user_id || p.userId}
                className={`flex items-center justify-between px-3 py-2 rounded text-xs`}
                style={{
                  background: i === 0 ? 'rgba(255,193,7,0.08)' : i === 1 ? 'rgba(158,158,158,0.08)' : i === 2 ? 'rgba(255,152,0,0.08)' : 'var(--bg-panel)',
                  border: `1px solid ${i < 3 ? 'var(--border-light)' : 'var(--bg-hover)'}`,
                  boxShadow: (p.user_id || p.userId) === user.id ? '0 0 0 1px var(--up-color)' : undefined,
                }}>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : ''}`}
                    style={i > 2 ? { color: 'var(--text-muted)' } : {}}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <span style={(p.user_id || p.userId) === user.id ? { color: 'var(--up-color)', fontWeight: 600 } : { color: 'var(--text-bright)' }}>
                    {p.username}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>${(p.equity || 0).toLocaleString()}</span>
                  <span className={`font-mono font-bold ${(p.pnl_pct || p.pnlPct || 0) >= 0 ? 'text-up' : 'price-down'}`}>
                    {(p.pnl_pct || p.pnlPct || 0) >= 0 ? '+' : ''}{(p.pnl_pct || p.pnlPct || 0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" onClick={onClose} style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-lg shadow-2xl w-full max-w-md mx-4 p-4"
        style={panelStyle}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg" style={{ color: 'var(--text-bright)' }}>🏆 {t('tradingCompetitions')}</h2>
          <button onClick={onClose} className="text-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }} aria-label="Close">✕</button>
        </div>
        {view === 'list' && renderList()}
        {view === 'create' && renderCreate()}
        {view === 'detail' && renderDetail()}
      </div>
    </div>
  );
}
