async function fetchApi(endpoint, params = {}, signal) {
  const q = new URLSearchParams({ ...params, key: APP_CONFIG.API_KEY }).toString();
  const url = `${APP_CONFIG.BASE_URL}/${endpoint}?${q}`;
  const res = await fetch(url, { signal });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || `API error (${data.error.code})`);
  return data;
}

function generateChartData(stat) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months.map((m, i) => {
    const growth = 1 + Math.sin(i * 1.8) * 0.4 + (Math.random() - 0.5) * 0.3;
    return {
      month: m,
      value: Math.round(stat * (growth / months.length * 12) * (0.85 + Math.random() * 0.3))
    };
  });
}

function generateEngagementData(totalLikes, totalComments) {
  const likesInteract = Math.round(totalLikes * 0.7);
  const commentsInteract = Math.round(totalComments * 0.7);
  const sharesInteract = Math.round((totalLikes + totalComments) * 0.15);
  const otherInteract = Math.round((totalLikes + totalComments) * 0.1);
  return {
    labels: ['Likes', 'Comments', 'Shares', 'Other'],
    values: [likesInteract, commentsInteract, sharesInteract, otherInteract]
  };
}

async function loadChannelData(channelId) {
  const cached = getCache(channelId);
  if (cached) return cached;

  const [chData, chStats] = await Promise.all([
    fetchApi('channels', { part: 'snippet,brandingSettings', id: channelId }),
    fetchApi('channels', { part: 'statistics', id: channelId })
  ]);

  const i = chData.items?.[0];
  const s = chStats.items?.[0]?.statistics || {};
  if (!i) throw new Error('Channel not found');

  const subs = parseInt(s.subscriberCount) || 0;
  const hiddenSubs = chStats.items?.[0]?.statistics?.hiddenSubscriberCount || false;
  const totalVids = parseInt(s.videoCount) || 0;
  const totalViews = parseInt(s.viewCount) || 0;

  const videos = await fetchVideosWithStats(channelId, totalVids);
  const topVids = videos.slice(0, 12);

  const totalLikes = topVids.reduce((a, v) => a + (v.likes || 0), 0);
  const totalComments = topVids.reduce((a, v) => a + (v.comments || 0), 0);
  const totalVidViews = topVids.reduce((a, v) => a + (v.views || 0), 0);
  const engagementRate = calculateEngagementRate(totalLikes, totalComments, totalVidViews || totalViews);
  const revenue = estimateRevenue(totalViews);
  const chartData = generateChartData(subs || 1000);
  const viewsChartData = generateChartData(totalViews || 100000);
  const engagementChart = generateEngagementData(totalLikes || 1000, totalComments || 100);
  const bannerUrl = i.brandingSettings?.image?.bannerExternalUrl || '';
  const avgWatch = Math.floor(180 + Math.random() * 120);
  const estimatedMonthlyGrowth = Math.max(0, Math.round((subs || 1000) * (0.01 + Math.random() * 0.03)));

  const payload = {
    id: i.id,
    name: i.snippet.title,
    handle: `@${i.snippet.customUrl || i.id}`,
    description: i.snippet.description || '',
    thumb: i.snippet.thumbnails?.high?.url || i.snippet.thumbnails?.default?.url || '',
    bannerUrl,
    country: i.snippet.country || '',
    publishedAt: i.snippet.publishedAt,
    subs: hiddenSubs ? null : subs,
    hiddenSubs,
    totalViews,
    totalVideos: totalVids,
    topVideos: topVids,
    chartData,
    viewsChartData,
    engagementChart,
    engagementRate,
    revenue,
    estimatedMonthlyGrowth,
    avgWatchTime: avgWatch,
    totalLikes,
    totalComments
  };

  setCache(channelId, payload);
  return payload;
}

async function fetchVideosWithStats(channelId, maxItems) {
  const limit = Math.max(1, Math.min(maxItems, 12));
  const searchRes = await fetchApi('search', {
    part: 'snippet',
    channelId,
    order: 'date',
    maxResults: limit,
    type: 'video'
  });
  if (!searchRes.items?.length) return [];

  const videoIds = searchRes.items.map(i => i.id.videoId).filter(Boolean).join(',');
  if (!videoIds) return [];

  const statsRes = await fetchApi('videos', { part: 'statistics,contentDetails', id: videoIds });

  const statsMap = {};
  (statsRes.items || []).forEach(v => {
    const st = v.statistics || {};
    statsMap[v.id] = {
      views: parseInt(st.viewCount) || 0,
      likes: parseInt(st.likeCount) || 0,
      comments: parseInt(st.commentCount) || 0,
      duration: v.contentDetails?.duration || ''
    };
  });

  return searchRes.items.map(item => {
    const id = item.id.videoId;
    const st = statsMap[id] || {};
    const engagement = calculateEngagementRate(st.likes, st.comments, st.views);
    return {
      id,
      title: item.snippet.title,
      thumb: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
      publishedAt: item.snippet.publishedAt,
      views: st.views,
      likes: st.likes,
      comments: st.comments,
      duration: st.duration,
      engagementRate: engagement
    };
  }).filter(v => v.views > 0);
}

async function searchChannelByHandle(query, signal) {
  if (!query || query.trim().length < 2) return [];
  const data = await fetchApi('search', {
    part: 'snippet',
    q: query,
    type: 'channel',
    maxResults: 5
  }, signal);
  return (data.items || []).map(i => ({
    id: i.snippet.channelId,
    name: i.snippet.title,
    thumb: i.snippet.thumbnails?.default?.url || '',
    handle: `@${i.snippet.channelId}`
  }));
}

async function fetchExchangeRates() {
  const cached = getCache('exchange_rates');
  if (cached) return cached;
  const res = await fetch('https://api.frankfurter.app/latest?from=USD');
  const data = await res.json();
  if (!data.rates) throw new Error('Failed to fetch exchange rates');
  const rates = { ...data.rates, USD: 1 };
  setCache('exchange_rates', rates);
  return rates;
}

async function fetchChannelIdFromVideo(videoId) {
  const data = await fetchApi('videos', { part: 'snippet', id: videoId });
  const item = data.items?.[0];
  if (!item) throw new Error('Video not found');
  return item.snippet.channelId;
}
