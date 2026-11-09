export interface User {
  id: number;
  username: string;
}

export interface ScoreStats {
  best: number | null;
  games: number;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const signUp = (username: string, password: string) =>
  request<{ user: User }>('/signup', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }).then((d) => d.user);

export const signIn = (username: string, password: string) =>
  request<{ user: User }>('/signin', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }).then((d) => d.user);

export const signOut = () => request<{ ok: true }>('/signout', { method: 'POST' });

export const getMe = () => request<{ user: User }>('/me').then((d) => d.user);

export const saveScore = (score: number) =>
  request<ScoreStats>('/scores', { method: 'POST', body: JSON.stringify({ score }) });

export const getScores = () =>
  request<ScoreStats & { recent: { id: number; score: number; played_at: string }[] }>('/scores');
