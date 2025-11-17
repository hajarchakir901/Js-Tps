

export enum BookStatus {
  READ = "Read",
  REREAD = "Re-read",
  DNF = "DNF",
  CURRENTLY_READING = "Currently reading",
  RETURNED_UNREAD = "Returned Unread",
  WANT_TO_READ = "Want to read"
}

export enum BookFormat {
  PRINT = "Print",
  PDF = "PDF",
  EBOOK = "Ebook",
  AUDIOBOOK = "AudioBook"
}

export interface IBook {
  _id?: string;
  title: string;
  author: string;
  numberOfPages: number;
  status: BookStatus;
  price: number;
  pagesRead: number;
  format: BookFormat;
  suggestedBy: string;
  finished: boolean;
}

export class Book implements IBook {
  _id?: string;
  title: string;
  author: string;
  numberOfPages: number;
  status: BookStatus;
  price: number;
  pagesRead: number;
  format: BookFormat;
  suggestedBy: string;
  finished: boolean;

  constructor(
    title: string,
    author: string,
    numberOfPages: number,
    status: BookStatus,
    price: number,
    pagesRead: number,
    format: BookFormat,
    suggestedBy: string,
    _id?: string
  ) {
    this._id = _id;
    this.title = title;
    this.author = author;
    this.numberOfPages = numberOfPages;
    this.status = status;
    this.price = price;
    this.pagesRead = Math.min(pagesRead, numberOfPages);
    this.format = format;
    this.suggestedBy = suggestedBy;
    this.finished = this.pagesRead >= this.numberOfPages;
  }

  // Méthode pour obtenir le pourcentage de lecture
  currentlyAt(): number {
    if (this.numberOfPages === 0) return 0;
    return Math.round((this.pagesRead / this.numberOfPages) * 100);
  }

  // Méthode pour supprimer le livre (retourne l'ID pour suppression)
  deleteBook(): string | undefined {
    return this._id;
  }

  // Méthode pour mettre à jour les pages lues
  updatePagesRead(pages: number): void {
    this.pagesRead = Math.min(pages, this.numberOfPages);
    this.finished = this.pagesRead >= this.numberOfPages;
  }
}