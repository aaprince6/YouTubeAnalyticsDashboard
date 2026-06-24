const APP_CONFIG = {
  API_KEY: window.LOCAL_API_KEY || 'YOUR_API_KEY_HERE',
  BASE_URL: 'https://www.googleapis.com/youtube/v3',
  CACHE_TTL: 600000,
  CACHE_VER: 2,
  REVENUE_PER_1K: { min: 0.5, max: 2.5 },
  ENGAGEMENT_THRESHOLDS: { low: 2, medium: 5, high: 10 },
  COLORS: [
    '#ff0000', '#ff6b6b', '#ffa94d', '#ffd43b',
    '#69db7c', '#38d9a9', '#22b8cf', '#339af0',
    '#748ffc', '#9775fa', '#da77f2', '#f783ac'
  ],
  CHART_GRADIENTS: {
    line: { top: 'rgba(255,0,0,0.15)', bottom: 'rgba(255,0,0,0)' },
    views: { top: 'rgba(59,130,246,0.2)', bottom: 'rgba(59,130,246,0)' },
  },
  ENGAGEMENT_CHART_COLORS: ['#ff6b6b', '#ffd43b', '#69db7c', '#339af0']
};
