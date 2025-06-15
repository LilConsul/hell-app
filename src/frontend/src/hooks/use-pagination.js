import { useState, useEffect, useMemo } from 'react';


// hook to hadle different types of scrollToRef(string, ref, HTMLElement)
export function usePagination(items = [], itemsPerPage = 10, options = {}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedItems, setPaginatedItems] = useState([]);
  const { scrollToRef, scrollOptions = { behavior: 'smooth' } } = options;
  
  const totalPages = useMemo(() => {
    return items.length > 0 ? Math.ceil(items.length / itemsPerPage) : 1;
  }, [items.length, itemsPerPage]);

  // Reset to first page when items array length changes
  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  // Update items when current page or items change
  useEffect(() => {
    if (items.length > 0) {
      const indexOfLastItem = currentPage * itemsPerPage;
      const indexOfFirstItem = indexOfLastItem - itemsPerPage;
      const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);
      setPaginatedItems(currentItems);
    } else {
      setPaginatedItems([]);
    }
  }, [items, currentPage, itemsPerPage]);

  const scrollToTop = () => {
    setTimeout(() => {
      if (scrollToRef) {
        if (typeof scrollToRef === 'string') {
          const element = document.querySelector(scrollToRef);
          if (element) {
            element.scrollIntoView(scrollOptions);
          }
        } 
        else if (scrollToRef.current) {
          scrollToRef.current.scrollIntoView(scrollOptions);
        }
        else if (scrollToRef instanceof HTMLElement) {
          scrollToRef.scrollIntoView(scrollOptions);
        }
      } else {
        window.scrollTo({
          top: 0,
          ...scrollOptions
        });
      }
    }, 0);
  };

  const goToPage = (pageNumber) => {
    const targetPage = Math.max(1, Math.min(pageNumber, totalPages));
    setCurrentPage(targetPage);
    scrollToTop();
  };

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      scrollToTop();
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      scrollToTop();
    }
  };

  const firstPage = () => {
    setCurrentPage(1);
    scrollToTop();
  };

  const lastPage = () => {
    setCurrentPage(totalPages);
    scrollToTop();
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
