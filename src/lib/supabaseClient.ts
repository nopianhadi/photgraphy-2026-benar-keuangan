import { createClient } from '@supabase/supabase-js';

function isValidHttpUrl(val: unknown): boolean {
  if (typeof val !== 'string' || !val.trim()) return false;
  try {
    const parsed = new URL(val.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function resolveSupabaseConfig() {
  const envUrl = ((import.meta.env.VITE_SUPABASE_URL as string) || '').trim();
  const envKey = ((import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '').trim();

  let targetUrl = '';
  let targetKey = '';

  // Detect if envUrl and envKey were accidentally swapped
  // (e.g. envUrl is a JWT starting with "ey..." and envKey is a URL like "https://xxx.supabase.co")
  const isKeyUrl = isValidHttpUrl(envKey) || envKey.includes('.supabase.co');
  const isUrlUrl = (isValidHttpUrl(envUrl) || envUrl.includes('.supabase.co')) && !envUrl.startsWith('ey');

  if (isKeyUrl && !isUrlUrl) {
    targetUrl = envKey;
    targetKey = envUrl;
  } else {
    targetUrl = envUrl;
    targetKey = envKey;
  }

  // Prepend https:// if user provided a bare domain (e.g. xxx.supabase.co)
  if (targetUrl && !targetUrl.startsWith('http://') && !targetUrl.startsWith('https://') && targetUrl.includes('.')) {
    targetUrl = `https://${targetUrl}`;
  }

  // If URL is still not valid, try decoding the JWT payload ref if present
  if (!isValidHttpUrl(targetUrl) && targetKey) {
    try {
      const parts = targetKey.split('.');
      if (parts.length === 3) {
        const decoded = typeof window !== 'undefined' && window.atob ? window.atob(parts[1]) : Buffer.from(parts[1], 'base64').toString();
        const payload = JSON.parse(decoded);
        if (payload?.ref) {
          targetUrl = `https://${payload.ref}.supabase.co`;
        }
      }
    } catch {
      // ignore
    }
  }

  // Final fallback to prevent runtime crashes if configuration is absent or invalid
  if (!isValidHttpUrl(targetUrl)) {
    targetUrl = 'https://demo-applet.supabase.co';
  }

  if (!targetKey) {
    targetKey = 'demo-anon-key-placeholder';
  }

  return { supabaseUrl: targetUrl, supabaseAnonKey: targetKey };
}

const { supabaseUrl, supabaseAnonKey } = resolveSupabaseConfig();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

