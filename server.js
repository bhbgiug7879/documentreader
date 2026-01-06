const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// In-memory storage (use database in production)
let documents = [];

// Upload document
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const docType = req.body.docType || 'Other';
  const doc = {
    id: Date.now().toString(),
    filename: req.file.originalname,
    filepath: `/uploads/${req.file.filename}`,
    docType,
    uploadedAt: new Date(),
    size: req.file.size
  };

  documents.push(doc);
  res.json({ success: true, document: doc });
});

// Get all documents
app.get('/api/documents', (req, res) => {
  res.json(documents);
});

// Delete document
app.delete('/api/documents/:id', (req, res) => {
  const index = documents.findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const doc = documents[index];
  const filePath = path.join(__dirname, doc.filepath);
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  documents.splice(index, 1);
  res.json({ success: true });
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});