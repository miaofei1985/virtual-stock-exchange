import React, { useState } from 'react';
import { saveSession } from '../utils/auth';
import { api } from '../utils/api';
import { useLang } from '../i18n/LanguageContext';

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

function generateRandomUsername(provider) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return `${provider}_${suffix}`;
}

export default function AuthModal({ onAuth }) {
  const { t } = useLang();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');

  const handleEmail = async (e) => {
    e.preventDefault();
    setError('');
    try {
      let data;
      if (mode === 'register') {
        data = await api.register(username, email, password);
      } else {
        data = await api.login(username, password);
      }
      saveSession(data.user);
      onAuth(data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleOAuth = async (provider) => {
    setLoading(provider);
    setError('');
    try {
      const randomUsername = generateRandomUsername(provider);
      const randomPassword = Math.random().toString(36).slice(2, 10);
      const mockEmail = `${randomUsername}@${provider}.sim`;
      const data = await api.register(randomUsername, mockEmail, randomPassword);
      saveSession(data.user);
      onAuth(data.user);
    } catch (err) {
      // If username taken, retry once
      try {
        const retryUsername = generateRandomUsername(provider);
        const retryPassword = Math.random().toString(36).slice(2, 10);
        const retryEmail = `${retryUsername}@${provider}.sim`;
        const data = await api.register(retryUsername, retryEmail, retryPassword);
        saveSession(data.user);
        onAuth(data.user);
      } catch (err2) {
        setError(err2.message);
        setLoading('');
      }
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0,0,0,0.9)' }}>
      <div className="rounded-xl w-full max-w-sm shadow-2xl"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
        <div className="px-6 pt-8 pb-4 text-center">
          <div className="text-3xl font-bold tracking-wider mb-1 text-gold">{t('vse')}</div>
          <div className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-secondary)' }}>{t('vseFullName')}</div>
          <div className="mt-4 font-semibold" style={{ color: 'var(--text-bright)' }}>
            {mode === 'login' ? t('signInToTrade') : t('createAccount')}
          </div>
        </div>

        <div className="px-6 flex flex-col gap-2">
          <button onClick={() => handleOAuth('google')} disabled={!!loading} aria-label={t('continueWithGoogle')}
            className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-lg text-sm transition-all disabled:opacity-50 min-h-[44px]"
            style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-bright)' }}>
            {loading === 'google' ? <span className="animate-spin text-xs">⟳</span> : <GoogleIcon />}
            {t('continueWithGoogle')}
          </button>
          <button onClick={() => handleOAuth('github')} disabled={!!loading} aria-label={t('continueWithGitHub')}
            className="flex items-center justify-center gap-2.5 w-full py-2.5 rounded-lg text-sm transition-all disabled:opacity-50 min-h-[44px]"
            style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-bright)' }}>
            {loading === 'github' ? <span className="animate-spin text-xs">⟳</span> : <GithubIcon />}
            {t('continueWithGitHub')}
          </button>
        </div>

        <div className="flex items-center gap-3 px-6 my-4">
          <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('or')}</span>
          <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
        </div>

        <form onSubmit={handleEmail} className="px-6 flex flex-col gap-3">
          <input className="input-dark" placeholder={t('username')} value={username}
            onChange={e => setUsername(e.target.value)} required minLength={2}
            aria-label={t('username')} />
          {mode === 'register' && (
            <input className="input-dark" type="email" placeholder={t('emailAddress')} value={email}
              onChange={e => setEmail(e.target.value)} required
              aria-label={t('emailAddress')} />
          )}
          <input className="input-dark" type="password" placeholder={t('password')} value={password}
            onChange={e => setPassword(e.target.value)} required minLength={6}
            aria-label={t('password')} />

          {error && <div className="text-down text-xs text-center">{error}</div>}

          <button type="submit"
            className="w-full py-2.5 text-white rounded-lg text-sm font-bold transition-all min-h-[44px]"
            style={{ background: 'var(--up-color)' }}>
            {mode === 'login' ? t('signIn') : t('createAccount')}
          </button>
        </form>

        <div className="px-6 py-5 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          {mode === 'login' ? (
            <>{t('noAccount')} <button className="text-up hover:underline" onClick={() => { setMode('register'); setError(''); }}>{t('register')}</button></>
          ) : (
            <>{t('alreadyRegistered')} <button className="text-up hover:underline" onClick={() => { setMode('login'); setError(''); }}>{t('signIn')}</button></>
          )}
        </div>

        <div className="px-6 pb-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          {t('startWith')}
        </div>
      </div>
    </div>
  );
}
