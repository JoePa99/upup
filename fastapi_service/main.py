from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AsyncOpenAI
import json
import asyncio
import os
from typing import Optional, List
import httpx

app = FastAPI(title="UPUP Content Generation Service", version="1.0.0")

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://upup-bn6a.vercel.app",
        "https://upup.vercel.app",
        "https://*.vercel.app",
        "https://yourdomain.com"  # Add your custom domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure OpenAI
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Pydantic models for request validation
class ContentRequest(BaseModel):
    topic: str
    contentType: str
    audience: str
    additionalContext: Optional[str] = None
    pins: List[dict] = []

class KnowledgeContext(BaseModel):
    tenantInfo: dict
    companyContext: str
    relevantKnowledge: List[dict]

# Helper function to get company knowledge context
async def get_company_context(topic: str, authorization: str) -> KnowledgeContext:
    """Fetch company knowledge context from the Next.js API"""
    try:
        headers = {"Authorization": authorization, "Content-Type": "application/json"}
        
        # Use environment variable for Next.js API URL, default to production
        nextjs_url = os.getenv("NEXTJS_API_URL", "https://upup-bn6a.vercel.app").rstrip('/')
        
        print(f"🔍 FastAPI: Fetching knowledge from {nextjs_url}")
        print(f"🔍 FastAPI: Auth header: {authorization[:50]}...")
        
        async with httpx.AsyncClient() as client:
            # Try to get company knowledge
            company_url = f"{nextjs_url}/api/knowledge/company"
            print(f"🔍 FastAPI: Calling {company_url}")
            company_response = await client.get(
                company_url, 
                headers=headers,
                timeout=10.0
            )
            print(f"🔍 FastAPI: Company response status: {company_response.status_code}")
            
            # Try to get platform knowledge
            platform_url = f"{nextjs_url}/api/super-admin/platform-knowledge"
            print(f"🔍 FastAPI: Calling {platform_url}")
            platform_response = await client.get(
                platform_url,
                headers=headers,
                timeout=10.0
            )
            print(f"🔍 FastAPI: Platform response status: {platform_response.status_code}")
            
            company_data = company_response.json() if company_response.status_code == 200 else {"data": []}
            platform_data = platform_response.json() if platform_response.status_code == 200 else {"data": []}
            
            print(f"🔍 FastAPI: Company data items: {len(company_data.get('data', []))}")
            print(f"🔍 FastAPI: Platform data items: {len(platform_data.get('data', []))}")
            
            # Process knowledge data
            company_knowledge = company_data.get("data", [])
            platform_knowledge = platform_data.get("data", [])
            
            # Combine and filter relevant knowledge
            all_knowledge = []
            search_terms = topic.lower().split()
            
            for item in company_knowledge + platform_knowledge:
                content = item.get("content", "").lower()
                title = item.get("title", "").lower()
                
                if any(term in content or term in title for term in search_terms):
                    all_knowledge.append(item)
            
            print(f"🔍 FastAPI: Found {len(all_knowledge)} relevant knowledge items for topic '{topic}'")
            
            # Create context string
            company_context = ""
            if all_knowledge:
                company_context = "\n".join([
                    f"Document: {item.get('title', 'Untitled')}\n{item.get('content', '')[:1000]}..."
                    for item in all_knowledge[:3]  # Limit to top 3 relevant docs
                ])
            
            # Return structured context
            return KnowledgeContext(
                tenantInfo={
                    "companyName": "Your Company",
                    "industry": "Professional Services", 
                    "values": "Quality, Innovation, Customer Success"
                },
                companyContext=company_context,
                relevantKnowledge=all_knowledge
            )
            
    except Exception as e:
        print(f"Error fetching company context: {e}")
        return KnowledgeContext(
            tenantInfo={
                "companyName": "Your Company",
                "industry": "Professional Services",
                "values": "Quality, Innovation, Customer Success"
            },
            companyContext="",
            relevantKnowledge=[]
        )

def create_content_prompt(request: ContentRequest, context: KnowledgeContext) -> str:
    """Create the content generation prompt with knowledge base context"""
    
    has_knowledge = len(context.relevantKnowledge) > 0
    
    if has_knowledge:
        knowledge_section = f"\n\nCOMPANY KNOWLEDGE BASE - USE THIS INFORMATION:\n{context.companyContext}"
        
        prompt = f"""Create a well-formatted {request.contentType} about {request.topic} for {request.audience}.

COMPANY KNOWLEDGE BASE - USE THIS INFORMATION:
{context.companyContext}

FORMATTING REQUIREMENTS:
CRITICAL: Use PLAIN TEXT formatting only - NO markdown symbols
- Write headlines as regular text (NOT ###, ##, or #)
- Use simple paragraphs with line breaks for separation
- For bullet points use simple dashes (-) or numbers, NOT •
- NEVER use **, *, ###, ##, # symbols in the content
- Write everything in plain readable text
- Separate sections with blank lines only
- Keep paragraphs short and focused

CONTENT REQUIREMENTS:
1. Create comprehensive 400-600 word professional content
2. Write EXCLUSIVELY about the company from the knowledge base above
3. Use specific details, products, services, and insights from knowledge base
4. Use a professional, engaging tone for {request.audience}
5. Make the content clear, well-organized, and easy to read"""

        if request.additionalContext:
            prompt += f"\n6. Additional requirements: {request.additionalContext}"
        
        prompt += "\n\nReturn ONLY the well-formatted content - no extra text or meta-commentary."
        
    else:
        prompt = f"""Create a well-formatted {request.contentType} about {request.topic} for {request.audience}.

COMPANY CONTEXT:
Company: {context.tenantInfo['companyName']}
Industry: {context.tenantInfo['industry']}
Values: {context.tenantInfo['values']}

FORMATTING REQUIREMENTS:
CRITICAL: Use PLAIN TEXT formatting only - NO markdown symbols
- Write headlines as regular text (NOT ###, ##, or #)
- Use simple paragraphs with line breaks for separation
- For bullet points use simple dashes (-) or numbers, NOT •
- NEVER use **, *, ###, ##, # symbols in the content
- Write everything in plain readable text
- Separate sections with blank lines only
- Keep paragraphs short and focused

CONTENT REQUIREMENTS:
- Create comprehensive 400-600 word professional content
- Use a professional, engaging tone for {request.audience}
- Reference and incorporate the company context above"""

        if request.additionalContext:
            prompt += f"\n- Additional requirements: {request.additionalContext}"
        
        prompt += "\n\nReturn ONLY the well-formatted content - no extra text."
    
    return prompt

# Authentication dependency
async def get_auth_header(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header required")
    return authorization

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "UPUP FastAPI Content Service"}

@app.post("/generate/stream")
async def generate_content_stream(
    request: ContentRequest,
    authorization: str = Depends(get_auth_header)
):
    """Stream content generation with real-time response"""
    
    try:
        # Get company knowledge context
        context = await get_company_context(request.topic, authorization)
        
        # Create the prompt
        prompt = create_content_prompt(request, context)
        
        # Validate OpenAI API key
        if not client.api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not configured")
        
        async def content_generator():
            try:
                # Start with metadata about the generation
                metadata = {
                    "status": "generating",
                    "hasKnowledge": len(context.relevantKnowledge) > 0,
                    "knowledgeItems": len(context.relevantKnowledge)
                }
                yield f"data: {json.dumps({'type': 'metadata', 'data': metadata})}\n\n"
                
                # Create streaming OpenAI request
                response = await client.chat.completions.create(
                    model="gpt-4o",
                    messages=[
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=2000,
                    temperature=0.7,
                    stream=True
                )
                
                # Stream the content as it's generated
                async for chunk in response:
                    if chunk.choices[0].delta.content:
                        content_chunk = chunk.choices[0].delta.content
                        yield f"data: {json.dumps({'type': 'content', 'data': content_chunk})}\n\n"
                
                # Send completion signal
                yield f"data: {json.dumps({'type': 'complete'})}\n\n"
                
            except Exception as e:
                # Send error if something goes wrong
                yield f"data: {json.dumps({'type': 'error', 'data': str(e)})}\n\n"
        
        return StreamingResponse(
            content_generator(),
            media_type="text/plain",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"  # Disable nginx buffering
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")

@app.post("/generate")
async def generate_content_non_stream(
    request: ContentRequest,
    authorization: str = Depends(get_auth_header)
):
    """Non-streaming content generation (fallback)"""
    
    try:
        # Get company knowledge context
        context = await get_company_context(request.topic, authorization)
        
        # Create the prompt
        prompt = create_content_prompt(request, context)
        
        # Generate content with OpenAI
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.7
        )
        
        content = response.choices[0].message.content
        
        return {
            "success": True,
            "data": {
                "content": content,
                "title": f"{request.contentType}: {request.topic}",
                "metadata": {
                    "hasKnowledge": len(context.relevantKnowledge) > 0,
                    "knowledgeItems": len(context.relevantKnowledge),
                    "contentType": request.contentType,
                    "audience": request.audience,
                    "topic": request.topic
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Content generation failed: {str(e)}")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "UPUP FastAPI Content Service",
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "UPUP FastAPI Content Generation Service", 
        "status": "running",
        "endpoints": ["/health", "/generate/stream", "/generate"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)