#!/bin/bash

echo "🚀 Setting up FastAPI Content Service"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -r requirements.txt

# Copy environment file
echo "⚙️ Setting up environment..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Please edit .env file with your OpenAI API key"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the FastAPI service:"
echo "1. Activate virtual environment: source venv/bin/activate"
echo "2. Set your OpenAI API key in .env file"
echo "3. Start the service: uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "The service will be available at: http://localhost:8000"
echo "API docs will be available at: http://localhost:8000/docs"