import { useState, useEffect } from 'react';

export function usePagination(items = [], itemsPerPage = 10) {
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedItems, setPaginatedItems] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [items]);

  useEffect(() => {
    if (items.length > 0) {
      const totalPages = Math.ceil(items.length / itemsPerPage);
      setTotalPages(totalPages);
      const indexOfLastItem = currentPage * itemsPerPage;
      const currentItems = items.slice(
        indexOfLastItem - itemsPerPage,
        indexOfLastItem
      );
      setPaginatedItems(currentItems);
    } else {
      setPaginatedItems([]);
      setTotalPages(1);
    }
  }, [items, currentPage, itemsPerPage]);

  const goToPage = (pageNumber) => {
    setCurrentPage(Math.max(1, Math.min(pageNumber, totalPages)));
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const firstPage = () => {
    setCurrentPage(1);
  };

  const lastPage = () => {
    setCurrentPage(totalPages);
  };

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages
  };
}
