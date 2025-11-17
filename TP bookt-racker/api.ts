// Service pour communiquer avec MongoDB via API

import { Book, IBook } from './book';

// URL de votre API backend (à configurer)
const API_URL = 'http://localhost:3000/api/books';

export class BookAPI {
  // Récupérer tous les livres
  static async getAllBooks(): Promise<Book[]> {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('Erreur lors de la récupération des livres');
      
      const data: IBook[] = await response.json();
      return data.map(bookData => 
        new Book(
          bookData.title,
          bookData.author,
          bookData.numberOfPages,
          bookData.status,
          bookData.price,
          bookData.pagesRead,
          bookData.format,
          bookData.suggestedBy,
          bookData._id
        )
      );
    } catch (error) {
      console.error('Erreur:', error);
      return [];
    }
  }

  // Ajouter un nouveau livre
  static async addBook(book: Omit<IBook, '_id' | 'finished'>): Promise<Book | null> {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(book),
      });
      
      if (!response.ok) throw new Error('Erreur lors de l\'ajout du livre');
      
      const data: IBook = await response.json();
      return new Book(
        data.title,
        data.author,
        data.numberOfPages,
        data.status,
        data.price,
        data.pagesRead,
        data.format,
        data.suggestedBy,
        data._id
      );
    } catch (error) {
      console.error('Erreur:', error);
      return null;
    }
  }

  // Supprimer un livre
  static async deleteBook(id: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      });
      
      return response.ok;
    } catch (error) {
      console.error('Erreur:', error);
      return false;
    }
  }

  // Mettre à jour un livre
  static async updateBook(id: string, updates: Partial<IBook>): Promise<Book | null> {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Erreur lors de la mise à jour');
      
      const data: IBook = await response.json();
      return new Book(
        data.title,
        data.author,
        data.numberOfPages,
        data.status,
        data.price,
        data.pagesRead,
        data.format,
        data.suggestedBy,
        data._id
      );
    } catch (error) {
      console.error('Erreur:', error);
      return null;
    }
  }
}