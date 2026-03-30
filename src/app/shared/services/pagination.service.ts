import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PaginationService {
  page: number = 0;
  size: number = 5;
  sort: string = 'id,desc';
  totalCounts: number = 0;
  totalPages: number = 0;

  nextPage() {
    if ((this.page + 1) * this.size < this.totalCounts) {
      this.page++;
      return true;
    }
    return false;
  }

  prevPage() {
    if (this.page > 0) {
      this.page--;
      return true;
    }
    return false;
  }
  handlePageClick(pg: number | string): boolean {
    if (pg !== '. . .') {
      this.page = (pg as number) - 1;
      return true;
    }
    return false;
  }

  getVisiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const currentPage = this.page + 1;

    if (this.totalPages <= 5) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('. . .');
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(this.totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < this.totalPages - 2) {
        pages.push('. . .');
      }
      pages.push(this.totalPages);
    }

    return pages;
  }

  reset() {
    this.page = 0;
  }
}
