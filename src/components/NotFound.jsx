import React from 'react';
import { useLang } from '../i18n/LanguageContext';

export default function NotFound() {
  const { t } = useLang();
  return (
    <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center p-8">
        <div className="text-6xl mb-4">404</div>
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-bright)' }}>
          {t('pageNotFound')}
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          {t('pageNotFoundDesc')}
        </p>
        <a href="/"
          className="inline-block px-4 py-2 rounded text-sm font-bold"
          style={{ background: 'var(--up-color)', color: 'white', textDecoration: 'none' }}>
          {t('backToTrading')}
        </a>
      </div>
    </div>
  );
}
