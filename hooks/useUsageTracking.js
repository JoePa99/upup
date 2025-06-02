import { useState, useEffect } from 'react';

const STORAGE_KEYS = {
  CONTENT_COUNT: 'contentGeneratedCount',
  TEMPLATE_COUNT: 'templatesUsedCount',
  API_TOKENS: 'apiTokensUsed',
  WEEKLY_STATS: 'weeklyStats'
};

export const useUsageTracking = () => {
  const [stats, setStats] = useState({
    contentGenerated: 0,
    templatesUsed: 0,
    apiTokensUsed: 0,
    weeklyStats: {
      contentGenerated: 0,
      templatesUsed: 0,
      apiTokensUsed: 0,
      lastWeekReset: null
    }
  });

  // Load stats from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const loadedStats = {
        contentGenerated: parseInt(localStorage.getItem(STORAGE_KEYS.CONTENT_COUNT) || '0'),
        templatesUsed: parseInt(localStorage.getItem(STORAGE_KEYS.TEMPLATE_COUNT) || '0'),
        apiTokensUsed: parseInt(localStorage.getItem(STORAGE_KEYS.API_TOKENS) || '0'),
        weeklyStats: JSON.parse(localStorage.getItem(STORAGE_KEYS.WEEKLY_STATS) || '{"contentGenerated":0,"templatesUsed":0,"apiTokensUsed":0,"lastWeekReset":null}')
      };

      // Check if we need to reset weekly stats (every 7 days)
      const now = new Date();
      const lastReset = loadedStats.weeklyStats.lastWeekReset ? new Date(loadedStats.weeklyStats.lastWeekReset) : null;
      const weekInMs = 7 * 24 * 60 * 60 * 1000;

      if (!lastReset || (now - lastReset) > weekInMs) {
        loadedStats.weeklyStats = {
          contentGenerated: 0,
          templatesUsed: 0,
          apiTokensUsed: 0,
          lastWeekReset: now.toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.WEEKLY_STATS, JSON.stringify(loadedStats.weeklyStats));
      }

      setStats(loadedStats);
    }
  }, []);

  // Save to localStorage
  const saveStats = (newStats) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.CONTENT_COUNT, newStats.contentGenerated.toString());
      localStorage.setItem(STORAGE_KEYS.TEMPLATE_COUNT, newStats.templatesUsed.toString());
      localStorage.setItem(STORAGE_KEYS.API_TOKENS, newStats.apiTokensUsed.toString());
      localStorage.setItem(STORAGE_KEYS.WEEKLY_STATS, JSON.stringify(newStats.weeklyStats));
    }
    setStats(newStats);
  };

  // Track content generation
  const trackContentGenerated = (type = 'content', tokensUsed = 0) => {
    const newStats = {
      ...stats,
      contentGenerated: stats.contentGenerated + 1,
      apiTokensUsed: stats.apiTokensUsed + tokensUsed,
      weeklyStats: {
        ...stats.weeklyStats,
        contentGenerated: stats.weeklyStats.contentGenerated + 1,
        apiTokensUsed: stats.weeklyStats.apiTokensUsed + tokensUsed
      }
    };
    saveStats(newStats);
  };

  // Track template usage
  const trackTemplateUsed = (templateType, tokensUsed = 0) => {
    const newStats = {
      ...stats,
      templatesUsed: stats.templatesUsed + 1,
      apiTokensUsed: stats.apiTokensUsed + tokensUsed,
      weeklyStats: {
        ...stats.weeklyStats,
        templatesUsed: stats.weeklyStats.templatesUsed + 1,
        apiTokensUsed: stats.weeklyStats.apiTokensUsed + tokensUsed
      }
    };
    saveStats(newStats);
  };

  // Track API token usage (for when we don't track content/template)
  const trackApiTokens = (tokensUsed) => {
    const newStats = {
      ...stats,
      apiTokensUsed: stats.apiTokensUsed + tokensUsed,
      weeklyStats: {
        ...stats.weeklyStats,
        apiTokensUsed: stats.weeklyStats.apiTokensUsed + tokensUsed
      }
    };
    saveStats(newStats);
  };

  // Get formatted stats for dashboard
  const getFormattedStats = () => {
    const formatNumber = (num) => {
      if (num >= 1000) {
        return `${(num / 1000).toFixed(1)}k`;
      }
      return num.toString();
    };

    const getPercentageOfLimit = (used, limit = 10000) => {
      return Math.round((used / limit) * 100);
    };

    return {
      contentGenerated: formatNumber(stats.contentGenerated),
      contentGeneratedWeekly: `+${stats.weeklyStats.contentGenerated} this week`,
      templatesUsed: formatNumber(stats.templatesUsed),
      templatesUsedWeekly: `+${stats.weeklyStats.templatesUsed} this week`,
      apiTokensUsed: formatNumber(stats.apiTokensUsed),
      apiTokensPercentage: `${getPercentageOfLimit(stats.apiTokensUsed)}% of monthly limit`
    };
  };

  // Reset all stats (for testing/admin)
  const resetStats = () => {
    const emptyStats = {
      contentGenerated: 0,
      templatesUsed: 0,
      apiTokensUsed: 0,
      weeklyStats: {
        contentGenerated: 0,
        templatesUsed: 0,
        apiTokensUsed: 0,
        lastWeekReset: new Date().toISOString()
      }
    };
    saveStats(emptyStats);
  };

  return {
    stats,
    trackContentGenerated,
    trackTemplateUsed,
    trackApiTokens,
    getFormattedStats,
    resetStats
  };
};