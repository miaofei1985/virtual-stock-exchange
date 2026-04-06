import React, { useState, useEffect } from 'react';
import { getCompetitionStatus, getTimeRemaining } from '../utils/competition';
import { api } from '../utils/api';
import { useLang } from '../i18n/LanguageContext';

export default function CompetitionPanel({ user, onClose }) {
  const { t } = useLang();
  const [comps, setComps] = useState([]);
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', durationDays: 7, startBalance: 100000 });

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

  const handleDelete = (compId) => {
    setComps(prev => prev.filter(c => c.id !== compId));
  };

  const statusLabel = (s) => s === 'active' ? t('active') : s === 'ended' ? t('ended') : t('upcoming');

  const renderList = () => (
    <div className="flex flex-col gap-2">
      <button onClick={() => setView('create')}
        className="w-full py-2 bg-up/20 hover:bg-up/30 text-up text-xs font-bold rounded border border-up/30 transition-all">
        {t('createCompetition')}
      </button>
      {comps.length === 0 ? (
        <div className="text-center text-gray-600 py-8 text-sm">{t('noCompetitions')}</div>
      ) : comps.map(comp => {
        const status = getCompetitionStatus(comp);
        const joined = comp.participants.find(p => (p.userId || p.user_id) === user.id);
        return (
          <div key={comp.id} className="bg-dark-700 rounded border border-dark-500 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-bold text-sm">{comp.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded font-bold ${
                status === 'active' ? 'bg-up/20 text-up' : status === 'ended' ? 'bg-down/20 text-down' : 'bg-yellow-500/20 text-yellow-400'
              }`}>{statusLabel(status)}</span>
            </div>
            <div className="flex gap-4 text-xs text-gray-400 mb-2">
              <span>💰 ${(comp.start_balance || comp.startBalance || 100000).toLocaleString()}</span>
              <span>⏱ {getTimeRemaining(comp)}</span>
              <span>👥 {(comp.participants || []).length}</span>
            </div>
            <div className="flex gap-2">
              {status === 'active' && !joined && (
                <button onClick={() => handleJoin(comp.id)}
                  className="flex-1 py-1 bg-up/20 hover:bg-up/30 text-up text-xs font-bold rounded">{t('join')}</button>
              )}
              <button onClick={() => { setSelected(comp.id); setView('detail'); }}
                className="flex-1 py-1 bg-dark-600 hover:bg-dark-500 text-gray-300 text-xs rounded">{t('leaderboard')}</button>
              {comp.creator_id === user.id && (
                <button onClick={() => handleDelete(comp.id)}
                  className="py-1 px-2 bg-down/20 hover:bg-down/30 text-down text-xs rounded">🗑</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderCreate = () => (
    <div className="flex flex-col gap-3">
      <button onClick={() => setView('list')} className="text-xs text-gray-500 hover:text-white">← Back</button>
      <div>
        <label className="text-xs text-gray-500 block mb-1">{t('competitionName')}</label>
        <input className="input-dark" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
          placeholder={t('weeklyTradingChallenge')} />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">{t('duration')}</label>
        <input className="input-dark" type="number" min="1" max="30" value={form.durationDays}
          onChange={e => setForm({...form, durationDays: parseInt(e.target.value) || 7})} />
      </div>
      <div>
        <label className="text-xs text-gray-500 block mb-1">{t('startingBalance')}</label>
        <input className="input-dark" type="number" min="1000" step="1000" value={form.startBalance}
          onChange={e => setForm({...form, startBalance: parseInt(e.target.value) || 100000})} />
      </div>
      <button onClick={handleCreate} className="w-full py-2 bg-up text-white font-bold rounded text-sm hover:bg-up/80">
        {t('createAndJoin')}
      </button>
    </div>
  );

  const renderDetail = () => {
    const comp = comps.find(c => c.id === selected);
    if (!comp) return <div className="text-gray-500">Competition not found</div>;
    const leaderboard = [...(comp.participants || [])].sort((a, b) => (b.pnl_pct || 0) - (a.pnl_pct || 0));
    const status = getCompetitionStatus(comp);

    return (
      <div className="flex flex-col gap-2">
        <button onClick={() => setView('list')} className="text-xs text-gray-500 hover:text-white">← Back</button>
        <div className="flex items-center justify-between">
          <span className="text-white font-bold">{comp.name}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
            status === 'active' ? 'bg-up/20 text-up' : 'bg-down/20 text-down'
          }`}>{statusLabel(status)} · {getTimeRemaining(comp)}</span>
        </div>
        <div className="text-xs text-gray-500">{t('starting')}: ${(comp.start_balance || comp.startBalance || 100000).toLocaleString()} · {(comp.participants || []).length} {t('participants')}</div>

        {leaderboard.length === 0 ? (
          <div className="text-center text-gray-600 py-4">{t('noParticipants')}</div>
        ) : (
          <div className="flex flex-col gap-1">
            {leaderboard.map((p, i) => (
              <div key={p.user_id || p.userId}
                className={`flex items-center justify-between px-3 py-2 rounded text-xs ${
                  i === 0 ? 'bg-yellow-500/10 border border-yellow-500/30' :
                  i === 1 ? 'bg-gray-400/10 border border-gray-400/20' :
                  i === 2 ? 'bg-orange-600/10 border border-orange-600/20' :
                  'bg-dark-700 border border-dark-600'
                } ${(p.user_id || p.userId) === user.id ? 'ring-1 ring-up/50' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                  <span className={(p.user_id || p.userId) === user.id ? 'text-up font-bold' : 'text-white'}>{p.username}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 font-mono">${(p.equity || 0).toLocaleString()}</span>
                  <span className={`font-mono font-bold ${(p.pnl_pct || p.pnlPct || 0) >= 0 ? 'text-up' : 'text-down'}`}>
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-dark-800 border border-dark-500 rounded-lg shadow-2xl w-full max-w-md mx-4 p-4"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">🏆 {t('tradingCompetitions')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-lg">✕</button>
        </div>
        {view === 'list' && renderList()}
        {view === 'create' && renderCreate()}
        {view === 'detail' && renderDetail()}
      </div>
    </div>
  );
}
