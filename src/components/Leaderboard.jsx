import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../utils/auth';
import { useLang } from '../i18n/LanguageContext';

const MEDALS = ['🥇', '🥈', '🥉'];
const INITIAL_BALANCE = 1000000;

const ProviderBadge = ({ provider }) => {
  const colorMap = {
    google: { background: 'rgba(33,150,243,0.15)', color: '#42a5f5', border: 'rgba(33,150,243,0.3)' },
    github: { background: 'rgba(156,39,176,0.15)', color: '#ab47bc', border: 'rgba(156,39,176,0.3)' },
    email: { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: 'var(--border-color)' },
  };
  const s = colorMap[provider] || colorMap.email;
  return (
    <span className="text-xs px-1.5 py-0.5 rounded border font-mono"
      style={{ background: s.background, color: s.color, borderColor: s.border }}>
      {provider}
    </span>
  );
};

export default function Leaderboard({ currentUser, onClose }) {
  const { t } = useLang();
  const [board, setBoard] = useState([]);

  useEffect(() => {
    setBoard(getLeaderboard());
    const id = setInterval(() => setBoard(getLeaderboard()), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <div className="font-bold text-lg" style={{ color: 'var(--text-bright)' }}>🏆 {t('leaderboardTitle')}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('rankedByEquity')}</div>
          </div>
          <button onClick={onClose} className="text-xl px-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }} aria-label="Close">✕</button>
        </div>

        <div className="overflow-y-auto flex-1">
          {board.length === 0 ? (
            <div className="flex items-center justify-center py-16" style={{ color: 'var(--text-muted)' }}>{t('noTradersYet')}</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0" style={{ background: 'var(--bg-secondary)' }}>
                <tr className="text-xs border-b" style={{ color: 'var(--text-muted)', borderColor: 'var(--bg-hover)' }}>
                  <th className="px-4 py-2 text-left w-10">#</th>
                  <th className="px-4 py-2 text-left">{t('trade')}</th>
                  <th className="px-4 py-2 text-right">{t('totalEquity')}</th>
                  <th className="px-4 py-2 text-right">{t('pnlLabel')}</th>
                  <th className="px-4 py-2 text-right">{t('return')}</th>
                  <th className="px-4 py-2 text-right">{t('trades')}</th>
                </tr>
              </thead>
              <tbody>
                {board.map((entry, i) => {
                  const isMe = currentUser?.username === entry.username;
                  const ret = +((entry.equity / INITIAL_BALANCE - 1) * 100).toFixed(2);
                  return (
                    <tr key={i}
                      className="border-b transition-colors"
                      style={{
                        borderColor: 'var(--bg-surface)',
                        background: isMe ? 'rgba(38,166,154,0.1)' : undefined,
                      }}>
                      <td className="px-4 py-3 text-center font-bold">
                        {i < 3 ? MEDALS[i] : <span style={{ color: 'var(--text-muted)' }}>{i + 1}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0"
                            style={{ background: 'var(--bg-hover)', color: 'var(--up-color)' }}>
                            {entry.avatar
                              ? <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                              : entry.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold flex items-center gap-1.5" style={{ color: 'var(--text-bright)' }}>
                              {entry.username}
                              {isMe && <span className="text-xs text-up">{t('you')}</span>}
                            </div>
                            <ProviderBadge provider={entry.provider} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold" style={{ color: 'var(--text-bright)' }}>
                        ${entry.equity.toLocaleString(undefined, {maximumFractionDigits:0})}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${entry.pnl >= 0 ? 'price-up' : 'price-down'}`}>
                        {entry.pnl >= 0 ? '+' : ''}${entry.pnl.toLocaleString(undefined, {maximumFractionDigits:0})}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${ret >= 0 ? 'price-up' : 'price-down'}`}>
                        {ret >= 0 ? '+' : ''}{ret}%
                      </td>
                      <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--text-secondary)' }}>{entry.trades}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-3 border-t text-xs text-center" style={{ borderColor: 'var(--bg-hover)', color: 'var(--text-muted)' }}>
          {t('updatesEvery5s')}
        </div>
      </div>
    </div>
  );
}
