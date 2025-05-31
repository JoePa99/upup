#!/usr/bin/env node

// Simple test script to verify the backend works
const http = require('http');

console.log('🚀 Testing UPUP Backend Server...\n');

// Test if server starts
const testServer = () => {
  try {
    // Import the server
    const app = require('./src/server');
    
    console.log('✅ Server module loaded successfully');
    console.log('✅ Express app created');
    
    // Test health endpoint after a short delay
    setTimeout(() => {
      const options = {
        hostname: 'localhost',
        port: process.env.PORT || 3001,
        path: '/api/health',
        method: 'GET'
      };

      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.status === 'ok') {
              console.log('✅ Health endpoint working');
              console.log('✅ Backend is ready!');
              console.log('\n🎉 Success! Your backend is working properly.');
              console.log(`🌐 Server running at: http://localhost:${process.env.PORT || 3001}`);
              console.log('📝 Test it: curl http://localhost:3001/api/health');
            } else {
              console.log('❌ Health endpoint returned unexpected response');
            }
          } catch (error) {
            console.log('❌ Health endpoint returned invalid JSON');
          }
          process.exit(0);
        });
      });

      req.on('error', (error) => {
        console.log('❌ Could not connect to server:', error.message);
        console.log('\n💡 Try running: npm run dev');
        process.exit(1);
      });

      req.end();
    }, 2000);
    
  } catch (error) {
    console.log('❌ Error starting server:', error.message);
    console.log('\n💡 Make sure you ran: npm install');
    process.exit(1);
  }
};

testServer();