let subsChart = null, viewsChart = null, engagementChart = null;

function initCharts() {
  subsChart = createChart('subscribersChart', 'line', { labels: [], datasets: [] }, {});
  viewsChart = createChart('viewsChart', 'bar', { labels: [], datasets: [] }, {});
  engagementChart = createChart('engagementChart', 'doughnut', { labels: [], datasets: [] }, {});
}

function createChart(canvasId, type, data, customOpts) {
  const ctx = document.getElementById(canvasId)?.getContext('2d');
  if (!ctx) return null;
  if (Chart.getChart(canvasId)) Chart.getChart(canvasId).destroy();
  return new Chart(ctx, {
    type,
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      ...customOpts
    }
  });
}

function updateSubscribersChart(data) {
  if (!subsChart) return;
  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#9898b0' : '#6b7280';
  const gridColor = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)';
  const canvas = document.getElementById('subscribersChart');
  const grad = subsChart.ctx.createLinearGradient(0, 0, 0, canvas?.height || 280);
  const cfg = APP_CONFIG.CHART_GRADIENTS.line;
  grad.addColorStop(0, cfg.top);
  grad.addColorStop(1, cfg.bottom);

  subsChart.data = {
    labels: data.map(d => d.month),
    datasets: [{
      label: 'Subscribers',
      data: data.map(d => d.value),
      borderColor: APP_CONFIG.CHART_GRADIENTS.line.top,
      backgroundColor: grad,
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointBackgroundColor: '#ff0000',
      pointBorderColor: isDark ? '#1a1a2e' : '#fff',
      pointBorderWidth: 2,
      borderWidth: 3
    }]
  };
  subsChart.options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { color: gridColor, drawBorder: false },
        ticks: { color: textColor, font: { size: 10 } }
      },
      y: {
        grid: { color: gridColor, drawBorder: false },
        ticks: { color: textColor, font: { size: 10 }, callback: v => formatNumber(v) }
      }
    },
    interaction: { intersect: false, mode: 'index' }
  };
  subsChart.update();
}

function updateViewsChart(data) {
  if (!viewsChart) return;
  const isDark = document.body.classList.contains('dark-mode');
  const textColor = isDark ? '#9898b0' : '#6b7280';
  const gridColor = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.06)';

  viewsChart.data = {
    labels: data.map(d => d.month),
    datasets: [{
      label: 'Views',
      data: data.map(d => d.value),
      backgroundColor: data.map((_, i) => {
        const alpha = 0.25 + (i / data.length) * 0.55;
        return `rgba(59, 130, 246, ${alpha})`;
      }),
      borderColor: '#3b82f6',
      borderWidth: 2,
      borderRadius: 4,
      maxBarThickness: 40
    }]
  };
  viewsChart.options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { color: gridColor, drawBorder: false },
        ticks: { color: textColor, font: { size: 10 } }
      },
      y: {
        grid: { color: gridColor, drawBorder: false },
        ticks: { color: textColor, font: { size: 10 }, callback: v => formatNumber(v) }
      }
    },
    interaction: { intersect: false, mode: 'index' }
  };
  viewsChart.update();
}

function updateEngagementChart(data) {
  if (!engagementChart) return;
  const isDark = document.body.classList.contains('dark-mode');
  const colors = APP_CONFIG.ENGAGEMENT_CHART_COLORS;

  engagementChart.data = {
    labels: data.labels,
    datasets: [{
      data: data.values,
      backgroundColor: colors,
      borderColor: isDark ? '#1a1a2e' : '#fff',
      borderWidth: 3,
      hoverOffset: 12
    }]
  };
  engagementChart.options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDark ? '#9898b0' : '#6b7280',
          font: { size: 11, weight: '500' },
          padding: 14,
          usePointStyle: true,
          pointStyleWidth: 10,
          boxHeight: 8
        }
      }
    }
  };
  engagementChart.update();
}

function refreshCharts(channelData) {
  updateSubscribersChart(channelData.chartData);
  updateViewsChart(channelData.viewsChartData);
  updateEngagementChart(channelData.engagementChart);
}
