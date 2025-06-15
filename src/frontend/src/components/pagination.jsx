import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";

export const CustomPagination = ({ 
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}) => {
  if (totalPages <= 1) return null;


  return (
    <Pagination className={`mt-6 cursor-default ${className}`}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            aria-disabled={currentPage === 1}
            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
        
        {/* First Page */}
        <PaginationItem>
          <PaginationLink
            isActive={currentPage === 1}
            onClick={() => onPageChange(1)}
          >
            1
          </PaginationLink>
        </PaginationItem>
        
        {/* Ellipsis if needed */}
        {currentPage > 3 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        
        {/* Previous Page */}
        {currentPage > 2 && (
          <PaginationItem>
            <PaginationLink onClick={() => onPageChange(currentPage - 1)}>
              {currentPage - 1}
            </PaginationLink>
          </PaginationItem>
        )}
        
        {/* Current Page */}
        {currentPage > 1 && currentPage < totalPages && (
          <PaginationItem>
            <PaginationLink isActive>{currentPage}</PaginationLink>
          </PaginationItem>
        )}
        
        {/* Next Page */}
        {currentPage < totalPages - 1 && (
          <PaginationItem>
            <PaginationLink onClick={() => onPageChange(currentPage + 1)}>
              {currentPage + 1}
            </PaginationLink>
          </PaginationItem>
        )}
        
        {/* Ellipsis if needed */}
        {currentPage < totalPages - 2 && (
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
        )}
        
        {/* Last Page */}
        {totalPages > 1 && (
          <PaginationItem>
            <PaginationLink
              isActive={currentPage === totalPages}
              onClick={() => onPageChange(totalPages)}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        )}
        
        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            aria-disabled={currentPage === totalPages}
            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
