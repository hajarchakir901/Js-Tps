// server-v2.js - Version alternative du serveur
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001; // Port différent

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware personnalisé
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Configuration MongoDB
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DATABASE = 'reading_tracker';
const BOOKS_COLLECTION = 'library';

let database;
let booksDB;

/**
 * Connexion à la base de données
 */
async function connectDatabase() {
  try {
    console.log('\n🔌 Connecting to MongoDB...');
    const client = await MongoClient.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    database = client.db(DATABASE);
    booksDB = database.collection(BOOKS_COLLECTION);
    
    console.log('✅ MongoDB connected successfully!');
    console.log(`📦 Database: ${DATABASE}`);
    console.log(`📚 Collection: ${BOOKS_COLLECTION}\n`);
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }
}

/**
 * Helper: Valider les données du livre
 */
function validateBookData(data) {
  const required = ['title', 'author', 'numberOfPages'];
  const missing = required.filter(field => !data[field]);
  
  if (missing.length > 0) {
    return { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }
  
  if (data.numberOfPages < 1) {
    return { valid: false, error: 'Number of pages must be at least 1' };
  }
  
  if (data.pagesRead < 0) {
    return { valid: false, error: 'Pages read cannot be negative' };
  }
  
  return { valid: true };
}

/**
 * Routes API
 */

// Route de base
app.get('/', (req, res) => {
  res.json({
    message: '📚 Reading Tracker API v2.0',
    endpoints: {
      'GET /api/books': 'Get all books',
      'GET /api/books/:id': 'Get book by ID',
      'POST /api/books': 'Create new book',
      'PUT /api/books/:id': 'Update book',
      'DELETE /api/books/:id': 'Delete book',
      'GET /api/stats': 'Get reading statistics'
    }
  });
});

// GET - Tous les livres
app.get('/api/books', async (req, res) => {
  try {
    const books = await booksDB.find({}).sort({ createdAt: -1 }).toArray();
    res.json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch books',
      message: err.message
    });
  }
});

// GET - Un livre par ID
app.get('/api/books/:id', async (req, res) => {
  try {
    const book = await booksDB.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }
    
    res.json({
      success: true,
      data: book
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch book',
      message: err.message
    });
  }
});

// POST - Ajouter un livre
app.post('/api/books', async (req, res) => {
  try {
    const validation = validateBookData(req.body);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }
    
    const newBook = {
      ...req.body,
      pagesRead: req.body.pagesRead || 0,
      finished: (req.body.pagesRead || 0) >= req.body.numberOfPages,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await booksDB.insertOne(newBook);
    const insertedBook = await booksDB.findOne({ _id: result.insertedId });
    
    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      data: insertedBook
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to add book',
      message: err.message
    });
  }
});

// PUT - Mettre à jour un livre
app.put('/api/books/:id', async (req, res) => {
  try {
    const updates = { ...req.body };
    
    // Recalculer le statut finished
    if (updates.pagesRead !== undefined || updates.numberOfPages !== undefined) {
      const currentBook = await booksDB.findOne({ _id: new ObjectId(req.params.id) });
      const totalPages = updates.numberOfPages || currentBook.numberOfPages;
      const pagesRead = updates.pagesRead !== undefined ? updates.pagesRead : currentBook.pagesRead;
      updates.finished = pagesRead >= totalPages;
    }
    
    updates.updatedAt = new Date();
    
    const result = await booksDB.findOneAndUpdate(
      { _id: new ObjectId(req.params.id) },
      { $set: updates },
      { returnDocument: 'after' }
    );
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Book updated successfully',
      data: result
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to update book',
      message: err.message
    });
  }
});

// DELETE - Supprimer un livre
app.delete('/api/books/:id', async (req, res) => {
  try {
    const result = await booksDB.deleteOne({ _id: new ObjectId(req.params.id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'Book not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete book',
      message: err.message
    });
  }
});

// GET - Statistiques de lecture
app.get('/api/stats', async (req, res) => {
  try {
    const allBooks = await booksDB.find({}).toArray();
    
    const stats = {
      totalBooks: allBooks.length,
      booksFinished: allBooks.filter(b => b.finished).length,
      booksInProgress: allBooks.filter(b => b.status === 'Currently reading').length,
      totalPagesRead: allBooks.reduce((sum, b) => sum + (b.pagesRead || 0), 0),
      totalPages: allBooks.reduce((sum, b) => sum + b.numberOfPages, 0),
      averageProgress: allBooks.length > 0 
        ? Math.round((allBooks.reduce((sum, b) => sum + ((b.pagesRead || 0) / b.numberOfPages * 100), 0) / allBooks.length))
        : 0,
      byStatus: {},
      byFormat: {}
    };
    
    // Compter par statut
    allBooks.forEach(book => {
      stats.byStatus[book.status] = (stats.byStatus[book.status] || 0) + 1;
      stats.byFormat[book.format] = (stats.byFormat[book.format] || 0) + 1;
    });
    
    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to calculate statistics',
      message: err.message
    });
  }
});

// Route 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
});

// Démarrer le serveur
async function startServer() {
  await connectDatabase();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(` http://localhost:${PORT}`);
   
   
  });
}

startServer();