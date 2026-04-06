import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useLang } from '../i18n/LanguageContext';

export default function AlertsPanel({ userId, stocks, selectedSymbol, onClose, onAlertsChange }) {
  const { t } = useLang();
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState({ symbol: selectedSymbol, type: 'above', price: '', note: '' });
  const [error, setError] = useState('');

  const TYPE_LABELS = {
    above: { label: t('priceAbove'), color: 'text-up', bg: 'bg-teal-900/30 border-teal-800' },
    below: { label: t('priceBelow'), color: 'text-down', bg: 'bg-red-900/30 border-red-800' },
    stop_loss: { label: t('stopLoss'), color: 'text-down', bg: 'bg-red-900/40 border-red-700' },
    take_profit: { label: t('takeProfit'), color: 'text-up', bg: 'bg-teal-900/40 border-teal-700' },
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-400 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-500">
          <div>
            <div className="text-white font-bold">🔔 {t('priceAlertsStopLoss')}</div>
            <div className="text-gray-500 text-xs mt-0.5">{t('getNotified')}</div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl px-2">✕</button>
        </div>

        <form onSubmit={handleAdd} className="px-5 py-4 border-b border-dark-600 bg-dark-700/50">
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">{t('newAlert')}</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">{t('symbol')}</label>
              <select className="input-dark" value={form.symbol}
                onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}>
                {stocks.map(s => (
                  <option key={s.symbol} value={s.symbol}>{s.symbol} — ${s.currentPrice.toFixed(2)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">{t('alertType')}</label>
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
              <label className="text-xs text-gray-500 block mb-1">
                {t('targetPrice')}
                {stock && <span className="text-gray-600 ml-1">({t('now')} ${stock.currentPrice.toFixed(2)})</span>}
              </label>
              <input className="input-dark" type="number" step="0.01" min="0.01"
                placeholder="0.00" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">{t('note')}</label>
              <input className="input-dark" placeholder={t('supportLevel')}
                value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
          </div>
          {error && <div className="text-down text-xs mb-2">{error}</div>}
          <button type="submit" className="btn-buy text-xs py-1.5 px-4">{t('addAlert')}</button>
        </form>

        <div className="overflow-y-auto flex-1 px-5 py-3">
          {alerts.length === 0 ? (
            <div className="text-center text-gray-600 py-8 text-sm">{t('noAlerts')}</div>
          ) : (
            <div className="flex flex-col gap-2">
              {alerts.map(a => {
                const meta = TYPE_LABELS[a.type] || TYPE_LABELS.above;
                const triggered = a.triggered || a.active === 0;
                return (
                  <div key={a.id}
                    className={`flex items-start justify-between p-3 rounded-lg border text-xs ${meta.bg} ${triggered ? 'opacity-50' : ''}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-white">{a.symbol}</span>
                        <span className={`font-semibold ${meta.color}`}>{meta.label}</span>
                        <span className="font-mono text-white font-bold">${a.price.toFixed(2)}</span>
                        {triggered && <span className="text-yellow-400">{t('triggered')}</span>}
                      </div>
                      {a.note && <div className="text-gray-400">{a.note}</div>}
                    </div>
                    {!triggered && (
                      <button onClick={() => handleDelete(a.id)}
                        className="text-gray-600 hover:text-down ml-3 mt-0.5 text-base leading-none">×</button>
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
