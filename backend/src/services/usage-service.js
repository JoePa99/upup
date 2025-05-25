const db = require('../config/database');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * Track API usage for a tenant
 * @param {number} tenantId - The tenant ID
 * @param {string} usageType - The type of usage (ai_api_calls, storage_used_bytes, emails_sent, audio_processed_seconds)
 * @param {number} quantity - The quantity to increment
 */
const trackUsage = async (tenantId, usageType, quantity) => {
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    // Get current date
    const today = new Date().toISOString().split('T')[0];
    
    // Check if record exists for today
    const checkResult = await client.query(
      'SELECT id FROM public.tenant_usage WHERE tenant_id = $1 AND date = $2',
      [tenantId, today]
    );
    
    if (checkResult.rows.length === 0) {
      // Create new record for today
      await client.query(
        `INSERT INTO public.tenant_usage (
          tenant_id, 
          date, 
          ${usageType}
        ) VALUES ($1, $2, $3)`,
        [tenantId, today, quantity]
      );
    } else {
      // Update existing record
      await client.query(
        `UPDATE public.tenant_usage 
         SET ${usageType} = ${usageType} + $1, 
         updated_at = NOW() 
         WHERE tenant_id = $2 AND date = $3`,
        [quantity, tenantId, today]
      );
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error tracking usage:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Report usage to Stripe for metered billing
 * This would typically be run as a daily cron job
 */
const reportUsageToStripe = async () => {
  const client = await db.getClient();
  
  try {
    // Get yesterday's date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    // Get all tenant usage for yesterday
    const usageResult = await client.query(
      `SELECT u.*, t.stripe_customer_id, t.subscription_plan
       FROM public.tenant_usage u
       JOIN public.tenants t ON u.tenant_id = t.id
       WHERE u.date = $1`,
      [yesterdayStr]
    );
    
    // Get subscription plans
    const plansResult = await client.query(
      'SELECT * FROM public.subscription_plans'
    );
    
    const plans = {};
    plansResult.rows.forEach(plan => {
      plans[plan.name] = plan;
    });
    
    // Report usage for each tenant
    for (const usage of usageResult.rows) {
      const tenant = {
        id: usage.tenant_id,
        stripeCustomerId: usage.stripe_customer_id,
        plan: usage.subscription_plan
      };
      
      const planLimits = plans[tenant.plan];
      
      if (!planLimits) {
        console.error(`No plan limits found for ${tenant.plan}`);
        continue;
      }
      
      // Report AI API calls overage
      if (usage.ai_api_calls > planLimits.ai_request_limit) {
        const overage = usage.ai_api_calls - planLimits.ai_request_limit;
        await reportStripeUsage(tenant, 'ai_api_calls', overage);
      }
      
      // Report storage overage (convert GB to bytes)
      const storageLimitBytes = planLimits.storage_limit_gb * 1024 * 1024 * 1024;
      if (usage.storage_used_bytes > storageLimitBytes) {
        const overageGB = Math.ceil((usage.storage_used_bytes - storageLimitBytes) / (1024 * 1024 * 1024));
        await reportStripeUsage(tenant, 'storage_used_gb', overageGB);
      }
      
      // Report email overage
      if (usage.emails_sent > planLimits.email_limit) {
        const overage = usage.emails_sent - planLimits.email_limit;
        await reportStripeUsage(tenant, 'emails_sent', overage);
      }
      
      // Report audio processing overage (convert minutes to seconds)
      const audioLimitSeconds = planLimits.audio_processing_limit_minutes * 60;
      if (usage.audio_processed_seconds > audioLimitSeconds) {
        const overageMinutes = Math.ceil((usage.audio_processed_seconds - audioLimitSeconds) / 60);
        await reportStripeUsage(tenant, 'audio_processed_minutes', overageMinutes);
      }
    }
  } catch (error) {
    console.error('Error reporting usage to Stripe:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Report usage to Stripe for a specific metric
 */
const reportStripeUsage = async (tenant, metricName, quantity) => {
  try {
    // Get the Stripe subscription item ID for the tenant
    const subscriptions = await stripe.subscriptions.list({
      customer: tenant.stripeCustomerId,
      status: 'active',
      limit: 1
    });
    
    if (subscriptions.data.length === 0) {
      console.error(`No active subscription found for tenant ${tenant.id}`);
      return;
    }
    
    const subscription = subscriptions.data[0];
    
    // Find the subscription item for the metered usage
    const item = subscription.items.data.find(
      item => item.price.nickname && item.price.nickname.includes(metricName)
    );
    
    if (!item) {
      console.error(`No subscription item found for ${metricName}`);
      return;
    }
    
    // Report the usage
    await stripe.subscriptionItems.createUsageRecord(
      item.id,
      {
        quantity: quantity,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment'
      }
    );
    
    console.log(`Reported ${quantity} ${metricName} for tenant ${tenant.id}`);
  } catch (error) {
    console.error(`Error reporting ${metricName} to Stripe:`, error);
    throw error;
  }
};

/**
 * Get usage statistics for a tenant
 */
const getTenantUsage = async (tenantId, period = '30days') => {
  try {
    let dateFilter;
    
    switch (period) {
      case '7days':
        dateFilter = "date >= CURRENT_DATE - INTERVAL '7 days'";
        break;
      case '30days':
        dateFilter = "date >= CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'thismonth':
        dateFilter = "date >= DATE_TRUNC('month', CURRENT_DATE)";
        break;
      case 'lastmonth':
        dateFilter = "date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') AND date < DATE_TRUNC('month', CURRENT_DATE)";
        break;
      default:
        dateFilter = "date >= CURRENT_DATE - INTERVAL '30 days'";
    }
    
    const query = `
      SELECT 
        SUM(ai_api_calls) as total_ai_calls,
        MAX(storage_used_bytes) as current_storage,
        SUM(emails_sent) as total_emails,
        SUM(audio_processed_seconds) as total_audio_seconds
      FROM public.tenant_usage
      WHERE tenant_id = $1 AND ${dateFilter}
    `;
    
    const result = await db.query(query, [tenantId]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error getting tenant usage:', error);
    throw error;
  }
};

module.exports = {
  trackUsage,
  reportUsageToStripe,
  getTenantUsage
};