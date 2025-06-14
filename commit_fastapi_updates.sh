#!/bin/bash

echo "Committing FastAPI updates..."

# Check git status
git status

# Add changes
git add fastapi_service/

# Commit with message
git commit -m "Update FastAPI service with latest OpenAI API

- Updated requirements.txt with latest package versions
- Migrated from legacy openai to AsyncOpenAI client
- Fixed OpenAI API calls for streaming and non-streaming endpoints
- Updated to use proper async/await patterns

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push changes
git push

echo "FastAPI updates pushed successfully!"