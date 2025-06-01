# 🧪 Knowledge Management API Testing

## ✅ **API Endpoints Ready**

Your knowledge management system now has these working endpoints:

### **Company Knowledge (Company Admin)**
```bash
# Upload company knowledge
POST /api/knowledge/company
{
  "title": "Brand Guidelines 2024",
  "content": "Our brand voice is professional yet approachable...",
  "documentType": "brand_guide",
  "metadata": {"department": "marketing"}
}

# Get company knowledge (all users can view)
GET /api/knowledge/company

# Delete company knowledge (Company Admin only)
DELETE /api/knowledge/company/123
```

### **Session Knowledge (All Users)**
```bash
# Upload session-specific knowledge
POST /api/knowledge/session
{
  "title": "Q4 Campaign Research",
  "content": "Market analysis shows...",
  "sessionId": "campaign_q4_2024",
  "documentType": "research"
}

# Get user's session knowledge
GET /api/knowledge/session?sessionId=campaign_q4_2024

# Delete session knowledge
DELETE /api/knowledge/session/456
```

### **AI Context Retrieval**
```bash
# Get hierarchical knowledge context for AI
GET /api/knowledge/context?sessionId=campaign_q4_2024&includeContent=true
```

## 🔑 **Role Permissions**

- **Super Admin**: All platform knowledge (not implemented yet)
- **Company Admin**: Can create/edit/delete company knowledge + all user permissions
- **User**: Can create/edit/delete their own session knowledge, view company knowledge

## 🧪 **Quick Test Commands**

```bash
# Test the health endpoint first
curl http://localhost:3001/api/health

# Test knowledge endpoints (need auth token)
curl -X GET http://localhost:3001/api/knowledge/company \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

The API is now ready for frontend integration! 🚀