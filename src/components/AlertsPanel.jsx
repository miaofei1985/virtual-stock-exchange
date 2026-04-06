import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useLang } from '../i18n/LanguageContext';

export default function AlertsPanel({ userId, stocks, selectedSymbol, onClose, onAlertsChange }) {
  const { t } = useLang();
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({ symbol: selectedSymbol, type: 'above', price: '', note: '' });
  const [error, setError] = useState('');

  const TYPE_LABELS = {
    above: { label: t('priceAbove'), color: 'price-up', bg: 'rgba(38,166,154,0.12)', border: 'rgba(38,166,154,0.3)' },
    below: { label: t('priceBelow'), color: 'price-down', bg: 'rgba(239,83,80,0.12)', border: 'rgba(239,83,80,0.3)' },
    stop_loss: { label: t('stopLoss'), color: 'price-down', bg: 'rgba(239,83,80,0.18)', border: 'rgba(239,83,80,0.4)' },
    take_profit: { label: t('takeProfit'), color: 'price-up', bg: 'rgba(38,166,154,0.18)', border: 'rgba(38,166,154,0.4)' },
  };

  useEffect(() => {
    if (userId) {
      api.getAlerts().then(setAlerts).catch(() => {});
    }
  }, [userId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.price || isNaN(parseFloat(form.price)) || parseFloat(form.price) <= 0) {
      setError(t('enterValidPrice')); return;
    }
    try {
      const result = await api.addAlert(form.symbol, form.type, parseFloat(form.price));
      const newAlert = { id: result.id, symbol: form.symbol, type: form.type, price: parseFloat(form.price), active: 1, created_at: Date.now() };
      const updated = [...alerts, newAlert];
      setAlerts(updated);
      onAlertsChange && onAlertsChange(updated);
      setForm(f => ({ ...f, price: '', note: '' }));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.removeAlert(id);
      const updated = alerts.filter(a => a.id !== id);
      setAlerts(updated);
      onAlertsChange && onAlertsChange(updated);
    } catch {}
  };

  const stock = stocks.find(s => s.symbol === form.symbol);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <div className="font-bold" style={{ color: 'var(--text-bright)' }}>🔔 {t('priceAlertsStopLoss')}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{t('getNotified')}</div>
          </div>
          <button onClick={onClose} className="text-xl px-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleAdd} className="px-5 py-4 border-b" style={{ borderColor: 'var(--bg-hover)', background: 'rgba(26,26,34,0.5)' }}>
          <div className="text-xs uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>{t('newAlert')}</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>{t('symbol')}</label>
              <select className="input-dark" value={form.symbol}
                onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}>
                {stocks.map(s => (
                  <option key={s.symbol} value={s.symbol}>{s.symbol} — ${s.currentPrice.toFixed(2)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>{t('alertType')}</label>
              <select className="input-dark" value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="above">{t('priceAbove')}</option>
                <option value="below">{t('priceBelow')}</option>
                <option value="stop_loss">{t('stopLoss')}</option>
                <option value="take_profit">{t('takeProfit')}</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>
                {t('targetPrice')}
                {stock && <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}> ({t('now')} ${stock.currentPrice.toFixed(2)})</span>}
              </label>
              <input className="input-dark" type="number" step="0.01" min="0.01"
                placeholder="0.00" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>{t('note')}</label>
              <input className="input-dark" placeholder={t('supportLevel')}
                value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
          </div>
          {error && <div className="price-down text-xs mb-2">{error}</div>}
          <button type="submit" className="btn-buy text-xs py-1.5 px-4">{t('addAlert')}</button>
        </form>

        <div className="overflow-y-auto flex-1 px-5 py-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>{t('noAlerts')}</div>
          ) : (
            <div className="flex flex-col gap-2">
              {alerts.map(a => {
                const meta = TYPE_LABELS[a.type] || TYPE_LABELS.above;
                const triggered = a.triggered || a.active === 0;
                return (
                  <div key={a.id}
                    className="flex items-start justify-between p-3 rounded-lg text-xs"
                    style={{ background: meta.bg, border: `1px solid ${meta.border}`, opacity: triggered ? 0.5 : 1 }}>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold" style={{ color: 'var(--text-bright)' }}>{a.symbol}</span>
                        <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
                        <span className="font-mono font-bold" style={{ color: 'var(--text-bright)' }}>${a.price.toFixed(2)}</span>
                        {triggered && <span className="text-yellow-400">{t('triggered')}</span>}
                      </div>
                      {a.note && <div style={{ color: 'var(--text-secondary)' }}>{a.note}</div>}
                    </div>
                    {!triggered && (
                      <button onClick={() => handleDelete(a.id)}
                        className="ml-3 mt-0.5 text-base leading-none min-w-[44px] min-h-[44px] flex items-center justify-center"
                        style={{ color: 'var(--text-muted)' }}
                        aria-label={`Delete alert for ${a.symbol}`}>×</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
