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
    <div className="flex flex-col h-full bg-dark-800">
      <div className="px-3 py-2 border-b border-dark-500 flex items-center justify-between flex-wrap gap-2">
        <div className="flex gap-4">
          <div>
            <div className="text-xs text-gray-500">{t('totalEquity')}</div>
            <div className="text-sm font-mono font-bold text-white">${totalValue.toLocaleString(undefined, {maximumFractionDigits:2})}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">{t('cash2')}</div>
            <div className="text-sm font-mono text-white">${portfolio.balance.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">{t('unrPnl2')}</div>
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
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">{t('noOpenPositions')}</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-dark-600">
                  {[t('symbol'),t('shares'),t('avgCost'),t('price'),t('value'),t('pnlLabel'),'P&L%'].map(h => (
                    <th key={h} className="px-3 py-1.5 text-right first:text-left font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {positions.map(p => (
                  <tr key={p.sym} className="border-b border-dark-700 hover:bg-dark-700">
                    <td className="px-3 py-1.5 font-bold text-white">{p.sym}</td>
                    <td className="px-3 py-1.5 text-right font-mono">{p.shares}</td>
                    <td className="px-3 py-1.5 text-right font-mono">${p.avgCost.toFixed(2)}</td>
                    <td className={`px-3 py-1.5 text-right font-mono ${p.pnl >= 0 ? 'price-up' : 'price-down'}`}>${p.currentPrice.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-white">${p.value.toLocaleString()}</td>
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
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">{t('noTradeHistory')}</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-dark-600">
                  {[t('time'),t('symbol'),t('side'),t('qty'),t('price'),t('total'),t('pnlLabel')].map(h => (
                    <th key={h} className="px-3 py-1.5 text-right first:text-left font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {portfolio.orders.map(o => (
                  <tr key={o.id} className="border-b border-dark-700 hover:bg-dark-700">
                    <td className="px-3 py-1.5 text-gray-400">{o.time}</td>
                    <td className="px-3 py-1.5 font-bold text-white">{o.symbol}</td>
                    <td className={`px-3 py-1.5 font-bold ${o.side === 'buy' ? 'price-up' : 'price-down'}`}>
                      {o.side === 'buy' ? t('buy') : t('sell')}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono">{o.qty}</td>
                    <td className="px-3 py-1.5 text-right font-mono">${o.price.toFixed(2)}</td>
                    <td className="px-3 py-1.5 text-right font-mono">${o.total.toLocaleString()}</td>
                    <td className={`px-3 py-1.5 text-right font-mono ${o.realizedPnl >= 0 ? 'price-up' : o.realizedPnl < 0 ? 'price-down' : 'text-gray-500'}`}>
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
