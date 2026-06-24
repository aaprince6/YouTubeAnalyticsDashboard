function formatNumber(n) {
  if (!n && n !== 0) return '-';
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatDuration(d) {
  if (!d) return '';
  const m = d.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!m) return d;
  const h = (m[1] || '').replace('H', '') || '0';
  const mn = (m[2] || '').replace('M', '') || '0';
  const s = (m[3] || '').replace('S', '') || '0';
  if (h !== '0') return `${h}:${mn.padStart(2,'0')}:${s.padStart(2,'0')}`;
  return `${mn}:${s.padStart(2,'0')}`;
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff/86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff/2592000)}mo ago`;
  return `${Math.floor(diff/31536000)}y ago`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function calculateEngagementRate(likes, comments, views) {
  if (!views || views === 0) return 0;
  return ((likes + comments) / views) * 100;
}

function estimateRevenue(views) {
  if (!views || views === 0) return { min: 0, max: 0, mid: 0 };
  const { REVENUE_PER_1K } = APP_CONFIG;
  const thousands = views / 1000;
  return {
    min: Math.round(thousands * REVENUE_PER_1K.min),
    max: Math.round(thousands * REVENUE_PER_1K.max),
    mid: Math.round(thousands * ((REVENUE_PER_1K.min + REVENUE_PER_1K.max) / 2))
  };
}

function parseVideoUrl(url) {
  if (!url) return null;
  const u = url.trim();
  let m = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  m = u.match(/^([a-zA-Z0-9_-]{11})$/);
  return m ? m[1] : null;
}

function showToast(msg, type = 'info', duration = 3500) {
  if (window._toastTimer) clearTimeout(window._toastTimer);
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.className = 'toast';
    el.setAttribute('role', 'alert');
    document.body.appendChild(el);
  }
  const icons = { info: 'i', success: '✓', error: '✕' };
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type] || ''}</span> ${msg}`;
  requestAnimationFrame(() => el.classList.add('toast-visible'));
  window._toastTimer = setTimeout(() => el.classList.remove('toast-visible'), duration);
}

function debounce(fn, delay = 400) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function getCache(key) {
  try {
    const raw = localStorage.getItem(`ytdash_${key}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.v !== APP_CONFIG.CACHE_VER || Date.now() - data.ts > APP_CONFIG.CACHE_TTL) {
      localStorage.removeItem(`ytdash_${key}`);
      return null;
    }
    return data.payload;
  } catch (e) { console.warn('Cache read failed:', e); return null; }
}

function setCache(key, payload) {
  try {
    const raw = JSON.stringify({ v: APP_CONFIG.CACHE_VER, ts: Date.now(), payload });
    if (raw.length > 4_000_000) { console.warn('Cache too large, skipping'); return; }
    localStorage.setItem(`ytdash_${key}`, raw);
  } catch (e) {
    if (e.name === 'QuotaExceededError') console.warn('localStorage quota exceeded');
    else console.warn('Cache write failed:', e);
  }
}

function clearAllCache() {
  const keys = Object.keys(localStorage);
  keys.filter(k => k.startsWith('ytdash_')).forEach(k => localStorage.removeItem(k));
}

function getEngagementLabel(rate) {
  if (rate >= 10) return '🔥 Excellent';
  if (rate >= 5) return '👍 Great';
  if (rate >= 2) return '✅ Good';
  return '📊 Average';
}

function sortVideos(videos, sortBy) {
  const vids = [...videos];
  switch (sortBy) {
    case 'likes': return vids.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    case 'comments': return vids.sort((a, b) => (b.comments || 0) - (a.comments || 0));
    case 'engagement': return vids.sort((a, b) => (b.engagementRate || 0) - (a.engagementRate || 0));
    case 'date': return vids.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    default: return vids.sort((a, b) => (b.views || 0) - (a.views || 0));
  }
}
