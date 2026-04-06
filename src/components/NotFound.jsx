import React from 'react';
import { useLang } from '../i18n/LanguageContext';

export default function NotFound() {
  const { lang } = useLang();
  return (
    <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center p-8">
        <div className="text-6xl mb-4">404</div>
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-bright)' }}>
          {lang === 'zh' ? '页面未找到' : 'Page Not Found'}
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
          {lang === 'zh' ? '你访问的页面不存在' : 'The page you are looking for does not exist'}
        </p>
        <a href="/"
          className="inline-block px-4 py-2 rounded text-sm font-bold"
          style={{ background: 'var(--up-color)', color: 'white', textDecoration: 'none' }}>
          {lang === 'zh' ? '返回交易' : 'Back to Trading'}
        </a>
      </div>
    </div>
  );
}
