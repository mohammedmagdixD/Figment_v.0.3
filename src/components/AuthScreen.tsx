import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Mail, Lock, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { supabase } from '../services/supabase';
import { haptics } from '../utils/haptics';

type ViewState = 'initial' | 'email_auth' | 'otp' | 'forgot_password';
type AuthMode = 'signin' | 'signup';

const springTransition = { type: 'spring' as const, damping: 25, stiffness: 300 };

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

export function AuthScreen() {
  const [view, setView] = useState<ViewState>('initial');
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password validation
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);

  const handleOAuth = async (provider: 'google' | 'x') => {
    haptics.light();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    haptics.light();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        if (!hasUppercase || !hasLowercase || !hasNumber || !hasSymbol) {
          throw new Error('Please meet all password requirements.');
        }
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setView('otp');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
      haptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    haptics.light();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) throw error;
      setMessage('Magic link sent! Check your email to reset your password.');
    } catch (err: any) {
      setError(err.message);
      haptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 7) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    const token = otp.join('');
    if (token.length !== 8) return;
    
    haptics.light();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
      haptics.error();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (otp.join('').length === 8) {
      verifyOtp();
    }
  }, [otp]);

  const slideVariants = {
    enter: { x: '100%', opacity: 1 },
    center: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[var(--system-background)] dark:bg-[var(--secondary-system-background)] overflow-hidden flex flex-col">
      <AnimatePresence mode="wait">
        {view === 'initial' && (
          <motion.div
            key="initial"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: '-50%' }}
            transition={springTransition}
            className="flex-1 flex flex-col items-center justify-center px-6"
          >
            <h1 className="text-3xl font-serif font-bold text-[var(--label)] mb-2">Figment</h1>
            <p className="text-[var(--secondary-label)] text-center mb-12">Your universal media library.</p>

            <div className="w-full max-w-sm space-y-4">
              <button
                onClick={() => handleOAuth('x')}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-transparent border border-[var(--separator)] rounded-full text-[var(--label)] font-medium hover:bg-[var(--tertiary-system-background)] transition-colors"
              >
                <XIcon />
                Continue with X
              </button>
              <button
                onClick={() => handleOAuth('google')}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-transparent border border-[var(--separator)] rounded-full text-[var(--label)] font-medium hover:bg-[var(--tertiary-system-background)] transition-colors"
              >
                <GoogleIcon />
                Continue with Google
              </button>

              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-[1px] bg-[var(--separator)]" />
                <span className="text-sm text-[var(--secondary-label)]">or</span>
                <div className="flex-1 h-[1px] bg-[var(--separator)]" />
              </div>

              <button
                onClick={() => {
                  setMode('signin');
                  setView('email_auth');
                }}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-[var(--label)] text-[var(--system-background)] rounded-full font-medium hover:opacity-90 transition-opacity"
              >
                <Mail className="w-5 h-5" />
                Sign in with Email
              </button>
            </div>
          </motion.div>
        )}

        {view === 'email_auth' && (
          <motion.div
            key="email_auth"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={springTransition}
            className="flex-1 flex flex-col px-6 pt-12"
          >
            <button 
              onClick={() => setView('initial')}
              className="self-start p-2 -ml-2 mb-6 text-[var(--label)]"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <h2 className="text-3xl font-serif font-bold text-[var(--label)] mb-8">
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </h2>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 text-red-500 text-sm flex items-start gap-3 border border-red-500/20">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="flex flex-col gap-5 max-w-sm w-full mx-auto">
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--secondary-label)]" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[var(--tertiary-system-background)] border border-[var(--separator)] rounded-full py-4 pl-14 pr-5 text-[var(--label)] focus:outline-none focus:ring-2 focus:ring-ios-blue transition-all"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--secondary-label)]" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[var(--tertiary-system-background)] border border-[var(--separator)] rounded-full py-4 pl-14 pr-5 text-[var(--label)] focus:outline-none focus:ring-2 focus:ring-ios-blue transition-all"
                  required
                />
              </div>

              {mode === 'signup' && password.length > 0 && (
                <div className="px-2 space-y-2 mt-2">
                  <div className="flex items-center gap-2 text-sm">
                    {hasUppercase ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-[var(--secondary-label)]" />}
                    <span className={hasUppercase ? 'text-[var(--label)]' : 'text-[var(--secondary-label)]'}>Uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {hasLowercase ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-[var(--secondary-label)]" />}
                    <span className={hasLowercase ? 'text-[var(--label)]' : 'text-[var(--secondary-label)]'}>Lowercase letter</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {hasNumber ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-[var(--secondary-label)]" />}
                    <span className={hasNumber ? 'text-[var(--label)]' : 'text-[var(--secondary-label)]'}>Number</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {hasSymbol ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-[var(--secondary-label)]" />}
                    <span className={hasSymbol ? 'text-[var(--label)]' : 'text-[var(--secondary-label)]'}>Special symbol</span>
                  </div>
                </div>
              )}

              {mode === 'signin' && (
                <button
                  type="button"
                  onClick={() => setView('forgot_password')}
                  className="text-sm text-ios-blue self-end hover:opacity-80 px-2"
                >
                  Forgot password?
                </button>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--label)] text-[var(--system-background)] rounded-full py-4 font-medium hover:opacity-90 transition-opacity mt-4 disabled:opacity-50"
              >
                {isLoading ? 'Please wait...' : (mode === 'signin' ? 'Sign In' : 'Create Account')}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-[var(--secondary-label)] text-sm hover:text-[var(--label)] transition-colors"
                >
                  {mode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {view === 'forgot_password' && (
          <motion.div
            key="forgot_password"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={springTransition}
            className="flex-1 flex flex-col px-6 pt-12"
          >
            <button 
              onClick={() => setView('email_auth')}
              className="self-start p-2 -ml-2 mb-6 text-[var(--label)]"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <h2 className="text-3xl font-serif font-bold text-[var(--label)] mb-4">
              Reset Password
            </h2>
            <p className="text-[var(--secondary-label)] mb-8">
              Enter your email address and we'll send you a magic link to reset your password.
            </p>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 text-red-500 text-sm flex items-start gap-3 border border-red-500/20">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            {message && (
              <div className="mb-6 p-4 rounded-2xl bg-green-500/10 text-green-500 text-sm flex items-start gap-3 border border-green-500/20">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <p>{message}</p>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="flex flex-col gap-5 max-w-sm w-full mx-auto">
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--secondary-label)]" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[var(--tertiary-system-background)] border border-[var(--separator)] rounded-full py-4 pl-14 pr-5 text-[var(--label)] focus:outline-none focus:ring-2 focus:ring-ios-blue transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[var(--label)] text-[var(--system-background)] rounded-full py-4 font-medium hover:opacity-90 transition-opacity mt-4 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Magic Link'}
              </button>
            </form>
          </motion.div>
        )}

        {view === 'otp' && (
          <motion.div
            key="otp"
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={springTransition}
            className="flex-1 flex flex-col px-6 pt-12"
          >
            <button 
              onClick={() => setView('email_auth')}
              className="self-start p-2 -ml-2 mb-6 text-[var(--label)]"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <h2 className="text-3xl font-serif font-bold text-[var(--label)] mb-4">
              Check your email
            </h2>
            <p className="text-[var(--secondary-label)] mb-8">
              We sent an 8-digit code to <span className="text-[var(--label)] font-medium">{email}</span>
            </p>

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 text-red-500 text-sm flex items-start gap-3 border border-red-500/20">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="flex justify-center gap-2 max-w-sm mx-auto w-full">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => { otpRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(index, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(index, e)}
                  className="w-10 h-12 text-center text-xl font-bold bg-[var(--tertiary-system-background)] border border-[var(--separator)] rounded-xl text-[var(--label)] focus:outline-none focus:ring-2 focus:ring-ios-blue transition-all"
                />
              ))}
            </div>
            
            {isLoading && (
              <div className="mt-8 text-center text-[var(--secondary-label)]">
                Verifying...
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
