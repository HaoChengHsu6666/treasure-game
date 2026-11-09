import { useState, type FormEvent } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { signIn, signUp, type User } from '../lib/api';

interface AuthScreenProps {
  onAuthenticated: (user: User) => void;
  onPlayAsGuest: () => void;
}

export function AuthScreen({ onAuthenticated, onPlayAsGuest }: AuthScreenProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === 'signup';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = isSignUp ? await signUp(username, password) : await signIn(username, password);
      onAuthenticated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMode = () => {
    setMode(isSignUp ? 'signin' : 'signup');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl mb-4 text-amber-900 text-center">🏴‍☠️ Treasure Hunt Game 🏴‍☠️</h1>

      <form
        onSubmit={handleSubmit}
        className="w-full p-6 bg-amber-200/80 rounded-xl shadow-lg border-2 border-amber-400"
        style={{ maxWidth: '24rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
      >
        <h2 className="text-2xl text-amber-900 text-center">
          {isSignUp ? 'Create an account' : 'Sign in'}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Label htmlFor="username" className="text-amber-900">Username</Label>
          <Input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ backgroundColor: 'white' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <Label htmlFor="password" className="text-amber-900">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ backgroundColor: 'white' }}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
        >
          {submitting ? 'Please wait…' : isSignUp ? 'Sign up' : 'Sign in'}
        </Button>

        <p className="text-sm text-amber-800 text-center">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button type="button" onClick={toggleMode} className="underline text-amber-900">
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </form>

      <div className="text-center" style={{ marginTop: '1.5rem' }}>
        <Button variant="outline" onClick={onPlayAsGuest}>
          Play as guest
        </Button>
        <p className="text-sm text-amber-700 mt-2">Guest scores are not saved.</p>
      </div>
    </div>
  );
}
