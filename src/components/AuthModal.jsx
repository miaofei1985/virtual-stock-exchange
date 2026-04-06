import React, { useState, useEffect, useRef } from 'react';
import { saveSession } from '../utils/auth';
import { api } from '../utils/api';
import { useLang } from '../i18n/LanguageContext';

const FEATURES = [
  { icon: '📊', key: 'realtime', titleKey: 'featureRealtime', descKey: 'featureRealtimeDesc' },
  { icon: '🕯️', key: 'charts', titleKey: 'featureCharts', descKey: 'featureChartsDesc' },
  { icon: '💹', key: 'trading', titleKey: 'featureTrading', descKey: 'featureTradingDesc' },
  { icon: '🏆', key: 'compete', titleKey: 'featureCompete', descKey: 'featureCompeteDesc' },
];

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

/* ═══ 6-digit code input using React refs (no direct DOM manipulation) ═══ */
function CodeInput({ value, onChange, inputStyle, onFocus, onBlur }) {
  const refs = useRef([]);

  const digits = value.split('');
  while (digits.length < 6) digits.push('');

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, '');
    const newDigits = [...digits];
    newDigits[i] = val ? val[val.length - 1] : '';
    const newCode = newDigits.join('');
    onChange(newCode);
    if (val && i < 5) {
      refs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    onChange(paste);
    const nextIdx = Math.min(paste.length, 5);
    refs.current[nextIdx]?.focus();
  };

  return (
    <div className="flex gap-2 justify-between">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={el => refs.current[i] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          autoFocus={i === 0}
          style={{
            ...inputStyle,
            width: '48px',
            height: '56px',
            textAlign: 'center',
            fontSize: '20px',
            fontWeight: '700',
            padding: '0',
            letterSpacing: '0',
            borderRadius: '10px',
          }}
          onFocus={onFocus}
          onBlur={onBlur}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  );
}

export default function AuthModal({ onAuth }) {
  const { t, lang, toggleLang } = useLang();

  // Mode: 'login' | 'register' | 'code'
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [devCode, setDevCode] = useState('');

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // ═══ Email verification code flow ═══
  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !email.includes('@')) {
      setError(t('invalidEmail'));
      return;
    }
    setLoading('send');
    try {
      const res = await api.sendVerificationCode(email);
      setDevCode(res.dev_code || '');
      setMode('code');
      setCountdown(60);
    } catch (err) {
      setError(err.message);
    }
    setLoading('');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    if (code.length !== 6) {
      setError(t('invalidCodeHint'));
      return;
    }
    setLoading('verify');
    try {
      const data = await api.verifyCode(email, code);
      saveSession(data.user);
      onAuth(data.user);
    } catch (err) {
      setError(t('invalidCode'));
    }
    setLoading('');
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    try {
      const res = await api.sendVerificationCode(email);
      setDevCode(res.dev_code || '');
      setCountdown(60);
    } catch (err) {
      setError(err.message);
    }
  };

  // ═══ Login flow ═══
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !email.includes('@')) {
      setError(t('invalidEmail'));
      return;
    }
    if (!password) {
      setError(t('loginPassword'));
      return;
    }
    setLoading('login');
    try {
      const data = await api.login(email, password);
      saveSession(data.user);
      onAuth(data.user);
    } catch (err) {
      setError(t('loginFailed'));
    }
    setLoading('');
  };

  // ═══ Register flow ═══
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim()) {
      setError(t('username'));
      return;
    }
    if (!email || !email.includes('@')) {
      setError(t('invalidEmail'));
      return;
    }
    if (!password || password.length < 4) {
      setError(t('loginPassword'));
      return;
    }
    setLoading('register');
    try {
      const data = await api.register(username.trim(), email, password);
      saveSession(data.user);
      onAuth(data.user);
    } catch (err) {
      setError(t('registerFailed'));
    }
    setLoading('');
  };

  // ═══ OAuth ═══
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

  const inputStyle = {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border-color)',
    color: 'var(--text-bright)',
    borderRadius: '8px',
    padding: '14px 16px',
    fontSize: '15px',
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.2s',
  };

  const handleFocus = (e) => { e.target.style.borderColor = 'var(--up-color)'; };
  const handleBlur = (e) => { e.target.style.borderColor = 'var(--border-color)'; };

  // ═══ Language toggle button ═══
  const LangToggle = () => (
    <button onClick={toggleLang}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all font-bold tracking-wider lang-toggle-btn"
      style={{ background: 'var(--gold)', color: '#1a1a2e', border: '2px solid transparent', boxShadow: '0 0 12px rgba(255,215,0,0.3)' }}
      title={lang === 'en' ? '切换到中文' : 'Switch to English'}
      aria-label={lang === 'en' ? '切换到中文' : 'Switch to English'}>
      🌐 {lang === 'en' ? '中文' : 'English'}
    </button>
  );

  // ═══ Tab bar: Login / Register ═══
  const TabBar = () => (
    <div className="flex rounded-xl overflow-hidden mb-6" style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
      <button
        onClick={() => { setMode('login'); setError(''); }}
        className="flex-1 py-3 text-sm font-bold transition-all"
        style={{
          background: mode === 'login' ? 'var(--up-color)' : 'transparent',
          color: mode === 'login' ? 'white' : 'var(--text-secondary)',
        }}>
        {t('loginTab')}
      </button>
      <button
        onClick={() => { setMode('register'); setError(''); }}
        className="flex-1 py-3 text-sm font-bold transition-all"
        style={{
          background: mode === 'register' ? 'var(--up-color)' : 'transparent',
          color: mode === 'register' ? 'white' : 'var(--text-secondary)',
        }}>
        {t('registerTab')}
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex" style={{ background: 'var(--bg-primary)' }}>
      {/* ═══ Left Panel — Features ═══ */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-center px-12 xl:px-20"
        style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="text-4xl font-bold tracking-wider text-gold">{t('vse')}</div>
            <div className="w-px h-8" style={{ background: 'var(--border-color)' }} />
            <div className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              {t('vseFullName')}
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-3xl xl:text-4xl font-bold mb-3 leading-tight" style={{ color: 'var(--text-bright)' }}>
            {t('landingSubtitle')}
          </h1>
          <p className="text-base mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {t('landingDescription')}
          </p>

          {/* Feature cards */}
          <div className="flex flex-col gap-4">
            {FEATURES.map(f => (
              <div key={f.key} className="flex items-start gap-4 p-4 rounded-xl transition-all"
                style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)' }}>
                <div className="text-2xl flex-shrink-0 mt-0.5">{f.icon}</div>
                <div>
                  <div className="font-semibold text-sm mb-0.5" style={{ color: 'var(--text-bright)' }}>
                    {t(f.titleKey)}
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {t(f.descKey)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust line */}
          <div className="mt-8 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>🔒</span>
            <span>{t('noRealMoney')}</span>
          </div>
        </div>
      </div>

      {/* ═══ Right Panel — Auth ═══ */}
      <div className="flex-1 lg:w-1/2 xl:w-[45%] flex flex-col items-center justify-center p-6 relative">

        {/* Language toggle — top right */}
        <div className="absolute top-4 right-4">
          <LangToggle />
        </div>

        <div className="w-full max-w-md">
          {/* Mobile logo + lang toggle */}
          <div className="lg:hidden text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="text-3xl font-bold tracking-wider text-gold">{t('vse')}</div>
            </div>
            <div className="text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
              {t('vseFullName')}
            </div>
          </div>

          {/* Mobile language toggle */}
          <div className="lg:hidden flex justify-center mb-4">
            <LangToggle />
          </div>

          {/* Card */}
          <div className="rounded-2xl p-8 shadow-xl"
            style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>

            <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-bright)' }}>
              {t('welcomeToVse')}
            </h2>

            {/* ═══ Login Mode ═══ */}
            {mode === 'login' && (
              <>
                <TabBar />
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <input
                    style={inputStyle}
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    required
                    autoFocus
                    aria-label={t('emailAddress')}
                  />
                  <input
                    style={inputStyle}
                    type="password"
                    placeholder={t('loginPassword')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    required
                    aria-label={t('loginPassword')}
                  />
                  {error && <div className="price-down text-xs">{error}</div>}
                  <button type="submit" disabled={!!loading}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all min-h-[48px]"
                    style={{
                      background: 'var(--up-color)',
                      color: 'white',
                      opacity: loading === 'login' ? 0.7 : 1,
                    }}>
                    {loading === 'login'
                      ? <span className="animate-spin inline-block">⟳</span>
                      : t('loginSubmit')}
                  </button>
                </form>

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('or')}</span>
                  <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={() => handleOAuth('google')} disabled={!!loading}
                    className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-sm transition-all min-h-[48px]"
                    style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-bright)' }}>
                    {loading === 'google' ? <span className="animate-spin text-xs">⟳</span> : <GoogleIcon />}
                    {t('continueWithGoogle')}
                  </button>
                  <button onClick={() => handleOAuth('github')} disabled={!!loading}
                    className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-sm transition-all min-h-[48px]"
                    style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-bright)' }}>
                    {loading === 'github' ? <span className="animate-spin text-xs">⟳</span> : <GithubIcon />}
                    {t('continueWithGitHub')}
                  </button>
                </div>
              </>
            )}

            {/* ═══ Register Mode ═══ */}
            {mode === 'register' && (
              <>
                <TabBar />
                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                  <input
                    style={inputStyle}
                    type="text"
                    placeholder={t('username')}
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    required
                    autoFocus
                    aria-label={t('username')}
                  />
                  <input
                    style={inputStyle}
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    required
                    aria-label={t('emailAddress')}
                  />
                  <input
                    style={inputStyle}
                    type="password"
                    placeholder={t('loginPassword')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    required
                    aria-label={t('loginPassword')}
                  />
                  {error && <div className="price-down text-xs">{error}</div>}
                  <button type="submit" disabled={!!loading}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all min-h-[48px]"
                    style={{
                      background: 'var(--up-color)',
                      color: 'white',
                      opacity: loading === 'register' ? 0.7 : 1,
                    }}>
                    {loading === 'register'
                      ? <span className="animate-spin inline-block">⟳</span>
                      : t('registerSubmit')}
                  </button>
                </form>

                <div className="flex items-center gap-3 my-5">
                  <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{t('or')}</span>
                  <div className="flex-1 h-px" style={{ background: 'var(--border-color)' }} />
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={() => handleOAuth('google')} disabled={!!loading}
                    className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-sm transition-all min-h-[48px]"
                    style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-bright)' }}>
                    {loading === 'google' ? <span className="animate-spin text-xs">⟳</span> : <GoogleIcon />}
                    {t('continueWithGoogle')}
                  </button>
                  <button onClick={() => handleOAuth('github')} disabled={!!loading}
                    className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-sm transition-all min-h-[48px]"
                    style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', color: 'var(--text-bright)' }}>
                    {loading === 'github' ? <span className="animate-spin text-xs">⟳</span> : <GithubIcon />}
                    {t('continueWithGitHub')}
                  </button>
                </div>
              </>
            )}

            {/* ═══ Verification Code Mode ═══ */}
            {mode === 'code' && (
              <>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  {t('checkSpam')}
                </p>
                <form onSubmit={handleVerify} className="flex flex-col gap-4">
                  <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    {t('codeSent')} <span style={{ color: 'var(--text-bright)' }}>{email}</span>
                  </div>

                  <CodeInput
                    value={code}
                    onChange={setCode}
                    inputStyle={inputStyle}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                  />

                  {devCode && (
                    <div className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                      🔧 {t('devCodeHint')}: <span className="font-mono font-bold" style={{ color: 'var(--gold)' }}>{devCode}</span>
                    </div>
                  )}

                  {error && <div className="price-down text-xs text-center">{error}</div>}

                  <button type="submit" disabled={loading === 'verify' || code.length < 6}
                    className="w-full py-3 rounded-xl text-sm font-bold transition-all min-h-[48px]"
                    style={{
                      background: 'var(--up-color)',
                      color: 'white',
                      opacity: (loading === 'verify' || code.length < 6) ? 0.5 : 1,
                    }}>
                    {loading === 'verify'
                      ? <span className="animate-spin inline-block">⟳</span>
                      : t('verify')}
                  </button>

                  <div className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                    {countdown > 0 ? (
                      <span>{t('resendIn')} {countdown}{t('seconds')}</span>
                    ) : (
                      <button type="button" onClick={handleResend}
                        className="hover:underline" style={{ color: 'var(--up-color)' }}>
                        {t('resend')}
                      </button>
                    )}
                  </div>

                  <button type="button" onClick={() => { setMode('login'); setError(''); setCode(''); }}
                    className="text-xs text-center min-h-[44px]"
                    style={{ color: 'var(--text-muted)' }}>
                    ← {t('changeEmail')}
                  </button>
                </form>
              </>
            )}

            {/* Bottom */}
            <div className="mt-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              {t('startWith')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
