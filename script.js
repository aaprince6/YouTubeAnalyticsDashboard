document.addEventListener('DOMContentLoaded', () => {
  initCharts();
  const loadBtn = document.getElementById('loadData');
  const input = document.getElementById('channelId');
  const themeToggle = document.getElementById('themeToggle');
  const backToTop = document.getElementById('backToTop');
  const exportBtn = document.getElementById('exportBtn');
  const clearBtn = document.getElementById('clearBtn');
  let _lastResult = null;

  // Theme
  const savedTheme = localStorage.getItem('ytdash_theme');
  if (savedTheme === 'light') document.body.classList.remove('dark-mode');
  else document.body.classList.add('dark-mode');

  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('ytdash_theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
    if (_lastResult) {
      const isDark = document.body.classList.contains('dark-mode');
      const color = isDark ? '#9898b0' : '#6b7280';
      const grid = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)';
      [subsChart, viewsChart].forEach(c => {
        if (!c) return;
        c.options.scales.x.ticks.color = color;
        c.options.scales.y.ticks.color = color;
        c.options.scales.x.grid.color = grid;
        c.options.scales.y.grid.color = grid;
        c.update();
      });
      if (engagementChart) {
        engagementChart.options.plugins.legend.labels.color = color;
        engagementChart.options.borderColor = isDark ? '#1a1a2e' : '#fff';
        engagementChart.update();
      }
    }
  });

  // Load / Analyze
  async function loadChannel(channelId) {
    if (!channelId || !channelId.trim()) return;
    setLoading(true);
    renderSkeletons();
    hideAllCharts();
    document.getElementById('channelInfo').style.display = 'none';
    document.getElementById('statsGrid').style.display = 'none';
    document.getElementById('videosSection').style.display = 'none';
    document.getElementById('lastUpdated').textContent = '';

    try {
      const data = await loadChannelData(channelId.trim());
      _lastResult = data;
      showChannelInfo(data);
      renderStats(data);
      renderVideos(data.topVideos, 'views');
      refreshCharts(data);
      showCharts();
      setCurrentSortActive('views');
      scrollToTop();
    } catch (err) {
      showError(err.message || 'Failed to load channel data');
      showToast(err.message || 'Failed to load channel data', 'error');
    } finally {
      setLoading(false);
    }
  }

  loadBtn.addEventListener('click', () => loadChannel(input.value));

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadChannel(input.value);
    if (e.key === 'Escape') { input.blur(); clearSearchResults(); }
  });

  // Paste auto-scrape
  input.addEventListener('paste', () => {
    setTimeout(async () => {
      const val = input.value.trim();
      const videoId = parseVideoUrl(val);
      if (videoId) {
        setLoading(true);
        hideAllCharts();
        document.getElementById('channelInfo').style.display = 'none';
        document.getElementById('statsGrid').style.display = 'none';
        document.getElementById('videosSection').style.display = 'none';
        renderSkeletons();
        try {
          const chId = await fetchChannelIdFromVideo(videoId);
          input.value = chId;
          await loadChannel(chId);
        } catch (err) {
          showToast('Could not find channel from this video', 'error');
          setLoading(false);
        }
      }
    }, 50);
  });

  // Search-as-you-type
  let searchAbortCtrl = null;
  const debouncedSearch = debounce(async (query) => {
    const resultsDiv = document.getElementById('searchResults');
    if (!query || query.trim().length < 2 || parseVideoUrl(query)) {
      resultsDiv.innerHTML = '';
      resultsDiv.style.display = 'none';
      return;
    }
    if (searchAbortCtrl) searchAbortCtrl.abort();
    searchAbortCtrl = new AbortController();
    try {
      const items = await searchChannelByHandle(query, searchAbortCtrl.signal);
      resultsDiv.innerHTML = items.map(item => `
        <button class="search-result-item" data-id="${item.id}">
          <img class="search-result-thumb" src="${item.thumb}" alt="" loading="lazy">
          <div class="search-result-info">
            <div class="search-result-title">${escHtml(item.name)}</div>
            <div class="search-result-channel">${escHtml(item.handle)}</div>
          </div>
        </button>
      `).join('');
      resultsDiv.style.display = items.length ? 'block' : 'none';

      const items_ = resultsDiv.querySelectorAll('.search-result-item');
      items_.forEach(btn => {
        btn.addEventListener('click', () => {
          input.value = btn.dataset.id;
          resultsDiv.innerHTML = '';
          resultsDiv.style.display = 'none';
          loadChannel(btn.dataset.id);
        });
      });
      // Keyboard arrow navigation
      if (items_.length) {
        let idx = -1;
        const onKey = (e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); idx = Math.min(idx + 1, items_.length - 1); items_[idx]?.focus(); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(idx - 1, 0); items_[idx]?.focus(); }
          else if (e.key === 'Escape') { clearSearchResults(); input.focus(); }
          else if (e.key === 'Enter' && idx >= 0) { items_[idx]?.click(); }
        };
        input.addEventListener('keydown', onKey);
        resultsDiv.addEventListener('keydown', onKey);
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      resultsDiv.innerHTML = '';
      resultsDiv.style.display = 'none';
    }
  }, 350);

  input.addEventListener('input', () => debouncedSearch(input.value));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-group')) clearSearchResults();
  });

  function clearSearchResults() {
    const el = document.getElementById('searchResults');
    if (el) { el.innerHTML = ''; el.style.display = 'none'; }
  }

  // Chart tabs
  document.querySelectorAll('.chart-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const chart = tab.dataset.chart;
      document.querySelectorAll('.chart-card').forEach(c => c.style.display = 'none');
      if (chart === 'subscribers') document.getElementById('subscribersChartCard').style.display = 'block';
      else if (chart === 'views') document.getElementById('viewsChartCard').style.display = 'block';
      else if (chart === 'engagement') document.getElementById('engagementChartCard').style.display = 'block';
    });
  });
  // show first chart by default
  document.querySelectorAll('.chart-card').forEach((c, i) => c.style.display = i === 0 ? 'block' : 'none');

  // Video sorting tabs
  document.querySelectorAll('.video-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      if (!_lastResult) return;
      setCurrentSortActive(tab.dataset.sort);
      renderVideos(_lastResult.topVideos, tab.dataset.sort);
    });
  });

  function setCurrentSortActive(sort) {
    document.querySelectorAll('.video-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.video-tab[data-sort="${sort}"]`)?.classList.add('active');
  }

  // Back to top
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  });
  backToTop.addEventListener('click', scrollToTop);

  // Export
  exportBtn.addEventListener('click', () => {
    if (!_lastResult) { showToast('No data to export', 'info'); return; }
    const fmt = confirm('Click OK for CSV, Cancel for JSON');
    if (fmt) {
      exportCSV(_lastResult.topVideos, _lastResult.name);
      showToast('Data exported as CSV', 'success');
    } else {
      const data = {
        channel: { name: _lastResult.name, handle: _lastResult.handle, subs: _lastResult.subs, views: _lastResult.totalViews, videos: _lastResult.totalVideos, engagementRate: _lastResult.engagementRate, revenue: _lastResult.revenue },
        videos: _lastResult.topVideos
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `youtube_analytics_${_lastResult.id}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast('Data exported as JSON', 'success');
    }
  });

  // Clear
  clearBtn.addEventListener('click', () => {
    _lastResult = null;
    input.value = '';
    document.getElementById('channelInfo').style.display = 'none';
    document.getElementById('statsGrid').style.display = 'none';
    document.getElementById('chartsSection').style.display = 'none';
    document.getElementById('videosSection').style.display = 'none';
    document.getElementById('bannerContainer').style.display = 'none';
    document.getElementById('lastUpdated').textContent = '';
    document.getElementById('videosContainer').innerHTML = '';
    clearSearchResults();
    showToast('Dashboard cleared', 'info');
    input.focus();
  });
});
