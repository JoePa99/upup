const db = require('../config/database');
const knowledgeService = require('../services/knowledge-service');

/**
 * Super Admin Controller
 * Handles operations that only super admins can perform
 */
const superAdminController = {
  /**
   * Get all tenants (companies)
   */
  async getAllTenants(req, res) {
    try {
      // Get all tenants with basic usage stats
      const { data: tenants, error } = await db.supabaseQuery('tenants', {
        select: `
          id, name, subdomain, admin_email, subscription_plan, 
          subscription_status, status, created_at, updated_at
        `,
        order: { column: 'created_at', ascending: false }
      });
      
      if (error) {
        throw error;
      }
      
      // Get user counts for each tenant
      const enhancedTenants = await Promise.all(tenants.map(async (tenant) => {
        // Count users for this tenant
        const { data: userCount } = await db.supabaseQuery('users', {
          select: 'count(*)',
          eq: { tenant_id: tenant.id }
        });
        
        // Count knowledge documents for this tenant
        const { data: knowledgeCount } = await db.supabaseQuery('company_knowledge', {
          select: 'count(*)',
          eq: { tenant_id: tenant.id }
        });
        
        return {
          ...tenant,
          user_count: userCount?.[0]?.count || 0,
          knowledge_count: knowledgeCount?.[0]?.count || 0
        };
      }));
      
      res.json({
        success: true,
        data: enhancedTenants
      });
    } catch (error) {
      console.error('Error in super admin - getAllTenants:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve tenants',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },
  
  /**
   * Get analytics data for platform dashboard
   */
  async getPlatformAnalytics(req, res) {
    try {
      // Get tenant count
      const { data: tenantCount } = await db.supabaseQuery('tenants', {
        select: 'count(*)',
        eq: { status: 'active' }
      });
      
      // Get user count across all tenants
      const { data: userCount } = await db.supabaseQuery('users', {
        select: 'count(*)'
      });
      
      // Get platform knowledge count
      const { data: knowledgeCount } = await db.supabaseQuery('platform_knowledge', {
        select: 'count(*)',
        eq: { status: 'active' }
      });
      
      // Calculate monthly revenue (basic implementation)
      const { data: subscriptions } = await db.supabaseQuery('tenants', {
        select: 'subscription_plan',
        eq: { 
          status: 'active',
          subscription_status: 'active'
        }
      });
      
      let monthlyRevenue = 0;
      if (subscriptions && subscriptions.length > 0) {
        // Get subscription plan prices
        const { data: plans } = await db.supabaseQuery('subscription_plans', {
          select: 'name, monthly_price'
        });
        
        // Calculate revenue
        if (plans && plans.length > 0) {
          const planPrices = plans.reduce((acc, plan) => {
            acc[plan.name] = plan.monthly_price;
            return acc;
          }, {});
          
          monthlyRevenue = subscriptions.reduce((total, sub) => {
            return total + (planPrices[sub.subscription_plan] || 0);
          }, 0);
        }
      }
      
      // Get usage data for the past 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: usageData } = await db.supabaseQuery('tenant_usage', {
        select: `
          date, 
          sum(ai_api_calls) as total_ai_calls,
          sum(storage_used_bytes) as total_storage,
          sum(emails_sent) as total_emails
        `,
        gte: { date: thirtyDaysAgo.toISOString().split('T')[0] },
        groupBy: 'date',
        order: { column: 'date', ascending: true }
      });
      
      res.json({
        success: true,
        data: {
          totalTenants: tenantCount?.[0]?.count || 0,
          totalUsers: userCount?.[0]?.count || 0,
          totalKnowledgeDocs: knowledgeCount?.[0]?.count || 0,
          monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
          platformUsage: usageData || []
        }
      });
    } catch (error) {
      console.error('Error in super admin - getPlatformAnalytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve platform analytics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },
  
  /**
   * Create platform knowledge (super admin only)
   */
  async createPlatformKnowledge(req, res) {
    try {
      const { 
        title, 
        content, 
        documentType, 
        category, 
        tags = [], 
        status = 'active', 
        metadata = {} 
      } = req.body;
      
      // Validate required fields
      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: title and content are required'
        });
      }
      
      // Super admin email from token
      const superAdminEmail = req.user.email;
      
      // Prepare platform knowledge data
      const knowledgeData = {
        title,
        content,
        document_type: documentType,
        category: category || 'general',
        tags: Array.isArray(tags) ? tags : [],
        status,
        created_by_super_admin: superAdminEmail,
        version: 1,
        metadata
      };
      
      // Insert knowledge
      const { data, error } = await db.supabaseInsert(
        'platform_knowledge',
        knowledgeData,
        { returning: true }
      );
      
      if (error) {
        throw error;
      }
      
      res.status(201).json({
        success: true,
        data: data[0],
        message: 'Platform knowledge created successfully'
      });
    } catch (error) {
      console.error('Error in super admin - createPlatformKnowledge:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create platform knowledge',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },
  
  /**
   * Get platform knowledge
   */
  async getPlatformKnowledge(req, res) {
    try {
      const { 
        limit = 50, 
        offset = 0, 
        category, 
        documentType, 
        status = 'active' 
      } = req.query;
      
      // Build query options
      const queryOptions = {
        select: `
          id, title, document_type, category, tags, status,
          created_by_super_admin, version, metadata, created_at, updated_at
        `,
        eq: { status },
        limit: parseInt(limit, 10),
        range: { 
          from: parseInt(offset, 10), 
          to: parseInt(offset, 10) + parseInt(limit, 10) - 1 
        },
        order: { column: 'created_at', ascending: false }
      };
      
      // Add optional filters
      if (category) {
        queryOptions.eq.category = category;
      }
      
      if (documentType) {
        queryOptions.eq.document_type = documentType;
      }
      
      // Execute query
      const { data, error } = await db.supabaseQuery('platform_knowledge', queryOptions);
      
      if (error) {
        throw error;
      }
      
      // Get total count for pagination
      const { data: countData, error: countError } = await db.supabaseQuery('platform_knowledge', {
        select: 'count(*)',
        eq: { status }
      });
      
      if (countError) {
        console.error('Error getting knowledge count:', countError);
      }
      
      res.json({
        success: true,
        data: {
          knowledge: data.map(item => ({
            ...item,
            size_kb: item.metadata?.fileSize ? Math.round(item.metadata.fileSize / 1024) : 0
          })),
          total: countData?.[0]?.count || data.length
        }
      });
    } catch (error) {
      console.error('Error in super admin - getPlatformKnowledge:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve platform knowledge',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },
  
  /**
   * Delete platform knowledge
   */
  async deletePlatformKnowledge(req, res) {
    try {
      const { id } = req.params;
      
      // Delete knowledge
      const { error } = await db.supabaseDelete('platform_knowledge', { id });
      
      if (error) {
        throw error;
      }
      
      res.json({
        success: true,
        message: 'Platform knowledge deleted successfully',
        deleted_id: id
      });
    } catch (error) {
      console.error('Error in super admin - deletePlatformKnowledge:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete platform knowledge',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },
  
  /**
   * Create a new tenant (company)
   */
  async createTenant(req, res) {
    try {
      const { 
        name, 
        subdomain, 
        adminEmail, 
        subscriptionPlan = 'free',
        status = 'active'
      } = req.body;
      
      // Validate required fields
      if (!name || !subdomain || !adminEmail) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: name, subdomain, and adminEmail are required'
        });
      }
      
      // Check if subdomain is already taken
      const { data: existingTenant } = await db.supabaseQuery('tenants', {
        select: 'id',
        eq: { subdomain },
        limit: 1
      });
      
      if (existingTenant && existingTenant.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Subdomain already in use'
        });
      }
      
      // Create tenant
      const { data: tenant, error } = await db.supabaseInsert(
        'tenants',
        {
          name,
          subdomain,
          admin_email: adminEmail,
          subscription_plan: subscriptionPlan,
          subscription_status: 'active',
          status
        },
        { returning: true }
      );
      
      if (error) {
        throw error;
      }
      
      res.status(201).json({
        success: true,
        data: tenant[0],
        message: 'Tenant created successfully'
      });
    } catch (error) {
      console.error('Error in super admin - createTenant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create tenant',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },
  
  /**
   * Update tenant status or plan
   */
  async updateTenant(req, res) {
    try {
      const { id } = req.params;
      const { 
        name, 
        status, 
        subscriptionPlan, 
        subscriptionStatus 
      } = req.body;
      
      // Check if tenant exists
      const { data: existingTenant } = await db.supabaseQuery('tenants', {
        select: 'id',
        eq: { id },
        limit: 1
      });
      
      if (!existingTenant || existingTenant.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Tenant not found'
        });
      }
      
      // Build update data
      const updateData = {};
      
      if (name) updateData.name = name;
      if (status) updateData.status = status;
      if (subscriptionPlan) updateData.subscription_plan = subscriptionPlan;
      if (subscriptionStatus) updateData.subscription_status = subscriptionStatus;
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }
      
      // Update tenant
      const { data: updatedTenant, error } = await db.supabaseUpdate(
        'tenants',
        updateData,
        { id },
        { returning: true }
      );
      
      if (error) {
        throw error;
      }
      
      res.json({
        success: true,
        data: updatedTenant[0],
        message: 'Tenant updated successfully'
      });
    } catch (error) {
      console.error('Error in super admin - updateTenant:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update tenant',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  },
  
  /**
   * Verify super admin access
   */
  async verifySuperAdmin(req, res) {
    // If this middleware reaches here, the user is a super admin
    res.json({
      success: true,
      message: 'Super admin access verified',
      user: {
        email: req.user.email,
        isSuperAdmin: true
      }
    });
  }
};

module.exports = superAdminController;