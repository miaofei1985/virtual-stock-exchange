import React, { useEffect, useState } from 'react';
import { getLeaderboard } from '../utils/auth';

const MEDALS = ['🥇', '🥈', '🥉'];

const ProviderBadge = ({ provider }) => {
  const styles = {
    google: 'bg-blue-900/40 text-blue-400 border-blue-800',
    github: 'bg-purple-900/40 text-purple-400 border-purple-800',
    email: 'bg-gray-800 text-gray-400 border-gray-700',
  };
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded border font-mono ${styles[provider] || styles.email}`}>
      {provider}
    </span>
  );
};

export default function Leaderboard({ currentUser, onClose }) {
  const [board, setBoard] = useState([]);

  useEffect(() => {
    setBoard(getLeaderboard());
    const id = setInterval(() => setBoard(getLeaderboard()), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-400 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-500">
          <div>
            <div className="text-white font-bold text-lg">🏆 Leaderboard</div>
            <div className="text-gray-500 text-xs mt-0.5">Ranked by total equity</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl px-2">✕</button>
        </div>

        {/* Table */}
        <div className="overflow-y-auto flex-1">
          {board.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-gray-600">
              No traders yet — be the first!
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-dark-800">
                <tr className="text-gray-500 text-xs border-b border-dark-600">
                  <th className="px-4 py-2 text-left w-10">#</th>
                  <th className="px-4 py-2 text-left">Trader</th>
                  <th className="px-4 py-2 text-right">Equity</th>
                  <th className="px-4 py-2 text-right">P&L</th>
                  <th className="px-4 py-2 text-right">Return</th>
                  <th className="px-4 py-2 text-right">Trades</th>
                </tr>
              </thead>
              <tbody>
                {board.map((entry, i) => {
                  const isMe = currentUser?.username === entry.username;
                  const ret = +((entry.equity / 100000 - 1) * 100).toFixed(2);
                  return (
                    <tr key={i}
                      className={`border-b border-dark-700 transition-colors ${isMe ? 'bg-teal-900/20' : 'hover:bg-dark-700'}`}>
                      <td className="px-4 py-3 text-center font-bold">
                        {i < 3 ? MEDALS[i] : <span className="text-gray-500">{i + 1}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-dark-500 flex items-center justify-center text-xs font-bold text-up overflow-hidden flex-shrink-0">
                            {entry.avatar
                              ? <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                              : entry.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-white font-semibold flex items-center gap-1.5">
                              {entry.username}
                              {isMe && <span className="text-xs text-up">(you)</span>}
                            </div>
                            <ProviderBadge provider={entry.provider} />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-white font-bold">
                        ${entry.equity.toLocaleString(undefined, {maximumFractionDigits:0})}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${entry.pnl >= 0 ? 'price-up' : 'price-down'}`}>
                        {entry.pnl >= 0 ? '+' : ''}${entry.pnl.toLocaleString(undefined, {maximumFractionDigits:0})}
                      </td>
                      <td className={`px-4 py-3 text-right font-mono ${ret >= 0 ? 'price-up' : 'price-down'}`}>
                        {ret >= 0 ? '+' : ''}{ret}%
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400 font-mono">{entry.trades}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-dark-600 text-xs text-gray-600 text-center">
          Updates every 5 seconds · Starting capital: $100,000
        </div>
      </div>
    </div>
  );
}
