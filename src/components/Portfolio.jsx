import React, { useState } from 'react';
import { useLang } from '../i18n/LanguageContext';

export default function Portfolio({ portfolio, stocks }) {
  const { t } = useLang();
  const [tab, setTab] = useState('positions');

  const positions = Object.entries(portfolio.positions).map(([sym, pos]) => {
    const stock = stocks.find(s => s.symbol === sym);
    const currentPrice = stock?.currentPrice || pos.avgCost;
    const value = +(currentPrice * pos.shares).toFixed(2);
    const pnl = +((currentPrice - pos.avgCost) * pos.shares).toFixed(2);
    const pnlPct = +((currentPrice - pos.avgCost) / pos.avgCost * 100).toFixed(2);
    return { sym, ...pos, currentPrice, value, pnl, pnlPct };
  });

  const totalValue = portfolio.balance + positions.reduce((s, p) => s + p.value, 0);
  const totalPnl = portfolio.pnl;

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-secondary)' }}>
      <div className="px-3 py-2 border-b flex items-center justify-between flex-wrap gap-2"
        style={{ borderColor: 'var(--border-color)' }}>
        <div className="flex gap-4">
          <div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('totalEquity')}</div>
            <div className="text-sm font-mono font-bold" style={{ color: 'var(--text-bright)' }}>${totalValue.toLocaleString(undefined, {maximumFractionDigits:2})}</div>
          </div>
          <div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('cash2')}</div>
            <div className="text-sm font-mono" style={{ color: 'var(--text-bright)' }}>${portfolio.balance.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('unrPnl2')}</div>
            <div className={`text-sm font-mono font-bold ${totalPnl >= 0 ? 'price-up' : 'price-down'}`}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString()}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {[{k:'positions',l:t('positions')},{k:'history',l:t('history')}].map(ta => (
            <button key={ta.k} className={`tab-btn ${tab === ta.k ? 'active' : ''}`}
              onClick={() => setTab(ta.k)}>{ta.l}</button>
          ))}
        </div>
      </div>

      {tab === 'positions' ? (
        <div className="overflow-auto flex-1">
          {positions.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-muted)' }}>{t('noOpenPositions')}</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--bg-hover)' }}>
                  {[t('symbol'),t('shares'),t('avgCost'),t('price'),t('value'),t('pnlLabel'),'P&L%'].map(h => (
                    <th key={h} className="px-3 py-1.5 text-right first:text-left font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map(p => (
                  <tr key={p.sym} style={{ borderBottom: '1px solid var(--bg-surface)' }}>
                    <td className="px-3 py-1.5 font-bold" style={{ color: 'var(--text-bright)' }}>{p.sym}</td>
                    <td className="px-3 py-1.5 text-right font-mono" style={{ color: 'var(--text-primary)' }}>{p.shares}</td>
                    <td className="px-3 py-1.5 text-right font-mono" style={{ color: 'var(--text-primary)' }}>${p.avgCost.toFixed(2)}</td>
                    <td className={`px-3 py-1.5 text-right font-mono ${p.pnl >= 0 ? 'price-up' : 'price-down'}`}>${p.currentPrice.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right font-mono" style={{ color: 'var(--text-bright)' }}>${p.value.toLocaleString()}</td>
                    <td className={`px-3 py-1.5 text-right font-mono font-bold ${p.pnl >= 0 ? 'price-up' : 'price-down'}`}>
                      {p.pnl >= 0 ? '+' : ''}${p.pnl.toFixed(2)}
                    </td>
                    <td className={`px-3 py-1.5 text-right font-mono ${p.pnlPct >= 0 ? 'price-up' : 'price-down'}`}>
                      {p.pnlPct >= 0 ? '+' : ''}{p.pnlPct}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="overflow-auto flex-1">
          {portfolio.orders.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-muted)' }}>{t('noTradeHistory')}</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--bg-hover)' }}>
                  {[t('time'),t('symbol'),t('side'),t('qty'),t('price'),t('total'),t('pnlLabel')].map(h => (
                    <th key={h} className="px-3 py-1.5 text-right first:text-left font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolio.orders.map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--bg-surface)' }}>
                    <td className="px-3 py-1.5" style={{ color: 'var(--text-secondary)' }}>{o.time}</td>
                    <td className="px-3 py-1.5 font-bold" style={{ color: 'var(--text-bright)' }}>{o.symbol}</td>
                    <td className={`px-3 py-1.5 font-bold ${o.side === 'buy' ? 'price-up' : 'price-down'}`}>
                      {o.side === 'buy' ? t('buy') : t('sell')}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono" style={{ color: 'var(--text-primary)' }}>{o.qty}</td>
                    <td className="px-3 py-1.5 text-right font-mono" style={{ color: 'var(--text-primary)' }}>${o.price.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right font-mono" style={{ color: 'var(--text-primary)' }}>${o.total.toLocaleString()}</td>
                    <td className={`px-3 py-1.5 text-right font-mono ${o.realizedPnl >= 0 ? 'price-up' : o.realizedPnl < 0 ? 'price-down' : ''}`}
                      style={o.realizedPnl === 0 ? { color: 'var(--text-muted)' } : {}}>
                      {o.realizedPnl !== 0 ? (o.realizedPnl > 0 ? '+' : '') + '$' + o.realizedPnl.toFixed(2) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
