interface Pageable {
  pageNumber: number;
  pageSize: number;
  sort: string[];
  offset: number;
  paged: boolean;
  unpaged: boolean;
}
export interface Page<T> {
  pageable: Pageable;
  content: T[];
  last: boolean;
  totalElements: number;
  totalPages: number;
  first: boolean;
  size: number;
  number: number;
  sort: string[];
  numberOfElements: number;
  empty: boolean;
}
