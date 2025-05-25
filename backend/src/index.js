// This is the entry point for the application
// It initializes the database if needed and starts the server

const { initializeDatabase } = require('./config/db-init');
const app = require('./server');

// Start the application
const startApp = async () => {
  try {
    // Initialize the database (create tables if they don't exist)
    await initializeDatabase();
    console.log('Database initialized successfully');
    
    // Server is already started in server.js
    console.log('Application started successfully');
  } catch (error) {
    console.error('Error starting application:', error);
    process.exit(1);
  }
};

// Run the application
startApp();