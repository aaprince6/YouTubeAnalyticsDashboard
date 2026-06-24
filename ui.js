let _currentVideos = [];
let _currentSort = 'views';

function showChannelInfo(data) {
  const info = document.getElementById('channelInfo');
  info.style.display = 'flex';
  info.style.animation = 'none';
  requestAnimationFrame(() => { info.style.animation = ''; });

  document.getElementById('channelThumb').src = data.thumb || '';
  document.getElementById('channelName').textContent = data.name || '';
  document.getElementById('channelHandle').textContent = data.handle || '';
  document.getElementById('channelDescription').textContent = data.description || '';

  const badge = document.getElementById('verifiedBadge');
  badge.style.display = data.subs > 100000 ? 'inline-flex' : 'none';

  document.getElementById('channelCountry').textContent = data.country || '';
  document.getElementById('channelDate').textContent = data.publishedAt ? `Joined ${formatDate(data.publishedAt)}` : '';

  const subsEl = document.getElementById('channelSubs');
  if (data.hiddenSubs) {
    subsEl.textContent = 'Subscribers hidden';
  } else {
    subsEl.textContent = data.subs !== null && data.subs !== undefined
      ? `${formatNumber(data.subs)} subscribers` : '';
  }

  document.getElementById('channelViews').textContent = data.totalViews
    ? `${formatNumber(data.totalViews)} views` : '';

  if (data.bannerUrl) {
    const bc = document.getElementById('bannerContainer');
    bc.style.display = 'block';
    document.getElementById('channelBanner').src = data.bannerUrl;
  } else {
    document.getElementById('bannerContainer').style.display = 'none';
  }

  document.getElementById('lastUpdated').textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
}

function renderStats(data) {
  const grid = document.getElementById('statsGrid');
  grid.style.display = 'grid';
  grid.style.animation = 'none';
  requestAnimationFrame(() => { grid.style.animation = ''; });

  const hidden = data.hiddenSubs;
  const subsVal = hidden ? 'Hidden' : formatNumber(data.subs);
  const engRate = data.engagementRate || 0;
  const rev = data.revenue || { min: 0, max: 0, mid: 0 };

  document.getElementById('totalViews').textContent = formatNumber(data.totalViews);
  document.getElementById('subscriberCount').textContent = subsVal;
  document.getElementById('videoCount').textContent = formatNumber(data.totalVideos);
  document.getElementById('engagementRate').textContent = `${engRate.toFixed(2)}%`;
  document.getElementById('estimatedRevenue').textContent = `$${rev.min}–$${rev.max}`;
  document.getElementById('avgWatchTime').textContent = data.avgWatchTime ? `${Math.floor(data.avgWatchTime / 60)}:${String(data.avgWatchTime % 60).padStart(2, '0')}` : '-';

  document.getElementById('viewsTrend').textContent = `↗ ${formatNumber(Math.round(data.totalViews * 0.08))}`;
  document.getElementById('subsTrend').textContent = data.estimatedMonthlyGrowth
    ? `↗ ${formatNumber(data.estimatedMonthlyGrowth)}/mo`
    : '';
  document.getElementById('videoTrend').textContent = `${data.topVideos.length} loaded`;
  document.getElementById('engagementTrend').textContent = getEngagementLabel(engRate);
  document.getElementById('revenueTrend').textContent = `~$${rev.mid}/mo`;
  document.getElementById('watchTrend').textContent = data.avgWatchTime ? `${data.avgWatchTime}s avg` : '';
  // Estimated-data disclaimer
  let note = document.getElementById('estDisclaimer');
  if (!note) {
    note = document.createElement('p');
    note.id = 'estDisclaimer';
    note.style.cssText = 'font-size:11px;color:var(--text-muted);text-align:center;margin-top:4px;grid-column:1/-1';
    grid.appendChild(note);
  }
  note.textContent = 'ⓘ Avg watch time, monthly growth, revenue, and chart data are estimates';
}

function renderVideos(videos, sortBy = 'views') {
  if (!videos || !Array.isArray(videos)) videos = [];
  _currentVideos = videos;
  _currentSort = sortBy;
  const sorted = sortVideos(videos, sortBy);
  const container = document.getElementById('videosContainer');
  document.getElementById('videosSection').style.display = 'block';
  document.getElementById('videoCountBadge').textContent = videos.length;

  if (!sorted.length) {
    container.innerHTML = `<div class="empty-state"><span class="empty-icon">🎬</span>No videos found</div>`;
    return;
  }

  container.innerHTML = sorted.map(v => {
    const engLabel = getEngagementLabel(v.engagementRate || 0);
    const engShort = v.engagementRate ? v.engagementRate.toFixed(1) + '%' : '';
    return `
      <div class="video-card">
        <a class="video-thumb-wrap" href="https://youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">
          <img src="${v.thumb}" alt="${escHtml(v.title)}" loading="lazy">
          ${v.duration ? `<span class="video-duration">${formatDuration(v.duration)}</span>` : ''}
          ${engShort ? `<span class="video-engagement-badge">${engLabel}</span>` : ''}
        </a>
        <div class="video-body">
          <a class="video-title" href="https://youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">${escHtml(v.title)}</a>
          <div class="video-stats-row">
            <span class="video-stat-item">👁️ <span class="num">${formatNumber(v.views)}</span></span>
            <span class="video-stat-item">👍 <span class="num">${formatNumber(v.likes)}</span></span>
            <span class="video-stat-item">💬 <span class="num">${formatNumber(v.comments)}</span></span>
            <span class="video-stat-item">⚡ ${engShort}</span>
          </div>
          <div class="video-date">${timeAgo(v.publishedAt)}</div>
        </div>
      </div>
    `;
  }).join('');
}

function escHtml(s) {
  if (!s) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

function renderSkeletons() {
  document.getElementById('videosSection').style.display = 'block';
  document.getElementById('videosContainer').innerHTML = Array.from({ length: 6 }, () => `
    <div class="skel-card">
      <div class="skel-thumb"></div>
      <div class="skel-line w-70"></div>
      <div class="skel-line w-50"></div>
    </div>
  `).join('');
}

function hideAllCharts() {
  document.getElementById('chartsSection').style.display = 'none';
}

function showCharts() {
  document.getElementById('chartsSection').style.display = 'block';
}

function showError(msg) {
  document.getElementById('videosSection').style.display = 'block';
  document.getElementById('videosContainer').innerHTML = `
    <div class="error">
      <span class="error-icon">⚠️</span>
      <div class="error-message">${escHtml(msg)}</div>
    </div>
  `;
}

function setLoading(loading) {
  const btn = document.getElementById('loadData');
  const input = document.getElementById('channelId');
  btn.disabled = loading;
  input.disabled = loading;
  document.querySelector('.btn-label').style.display = loading ? 'none' : 'inline';
  document.querySelector('.btn-spinner').style.display = loading ? 'inline-block' : 'none';
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function exportCSV(videos, channelName) {
  const headers = ['Title', 'Views', 'Likes', 'Comments', 'Engagement%', 'Published'];
  const rows = videos.map(v => [
    `"${(v.title || '').replace(/"/g, '""')}"`,
    v.views || 0,
    v.likes || 0,
    v.comments || 0,
    v.engagementRate ? v.engagementRate.toFixed(2) : 0,
    v.publishedAt || ''
  ].join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${channelName || 'youtube'}_videos.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}
