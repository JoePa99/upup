const usageService = require('../services/usage-service');
const db = require('../config/database');

/**
 * Get usage statistics for a tenant
 */
const getTenantUsage = async (req, res) => {
  try {
    const { tenant } = req;
    const { period } = req.query;
    
    const usage = await usageService.getTenantUsage(tenant.id, period);
    
    // Get subscription plan details
    const planQuery = 'SELECT * FROM public.subscription_plans WHERE name = $1';
    const planResult = await db.query(planQuery, [tenant.subscription_plan]);
    const plan = planResult.rows[0];
    
    // Calculate usage percentages
    const usageStats = {
      ai_api_calls: {
        used: usage.total_ai_calls || 0,
        limit: plan.ai_request_limit,
        percentage: ((usage.total_ai_calls || 0) / plan.ai_request_limit) * 100
      },
      storage: {
        used: usage.current_storage || 0,
        limit: plan.storage_limit_gb * 1024 * 1024 * 1024, // Convert GB to bytes
        percentage: ((usage.current_storage || 0) / (plan.storage_limit_gb * 1024 * 1024 * 1024)) * 100
      },
      emails: {
        used: usage.total_emails || 0,
        limit: plan.email_limit,
        percentage: ((usage.total_emails || 0) / plan.email_limit) * 100
      },
      audio_processing: {
        used: usage.total_audio_seconds || 0,
        limit: plan.audio_processing_limit_minutes * 60, // Convert minutes to seconds
        percentage: ((usage.total_audio_seconds || 0) / (plan.audio_processing_limit_minutes * 60)) * 100
      }
    };
    
    res.status(200).json({
      status: 'success',
      data: {
        usage: usageStats,
        period
      }
    });
  } catch (error) {
    console.error('Error getting tenant usage:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get usage statistics',
      error: error.message
    });
  }
};

/**
 * Track usage for a tenant
 * Note: This would typically be called internally, not exposed as an API
 */
const trackUsage = async (tenantId, usageType, quantity) => {
  try {
    await usageService.trackUsage(tenantId, usageType, quantity);
    return true;
  } catch (error) {
    console.error('Error tracking usage:', error);
    return false;
  }
};

module.exports = {
  getTenantUsage,
  trackUsage
};