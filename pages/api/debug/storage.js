import fs from 'fs';
import path from 'path';

const STORAGE_FILE = path.join(process.cwd(), 'temp-knowledge.json');

function loadTempStorage() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading temp storage:', error);
  }
  return [];
}

export default function handler(req, res) {
  try {
    const storage = loadTempStorage();
    
    res.status(200).json({
      success: true,
      data: {
        storage_file_exists: fs.existsSync(STORAGE_FILE),
        storage_file_path: STORAGE_FILE,
        storage_contents: storage,
        storage_length: storage.length,
        current_working_directory: process.cwd()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}