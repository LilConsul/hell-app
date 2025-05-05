
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { CollectionCard } from "@/components/collections/card";
import { CollectionFilters } from "@/components/collections/filters";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";

import CollectionAPI from "./Collections.api";

import {
  EmptyCollections,
  LoadingCollections,
  ErrorCollections
} from "@/components/collections/handle-collections";

function Collections() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [collections, setCollections] = useState([]);
  const [allCollections, setAllCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: "all",
    questionCount: [0, 100],
    createdBy: "all"
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [collectionsPerPage] = useState(10);
  const [paginatedCollections, setPaginatedCollections] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const loadCollections = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await CollectionAPI.fetchCollections();   // ← use CollectionAPI
        setAllCollections(data);
      } catch (err) {
        setError("Failed to load collections. Please try again later.");
        toast.error("Failed to load collections", {
          description: "Please try again later.",
        });
      } finally {
        setLoading(false);
      }
    };
    loadCollections();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const applyAllFilters = useCallback(() => {
    if (!allCollections.length) return [];
    return allCollections.filter(collection => {
      if (activeFilter !== "all" && collection.status !== activeFilter) return false;
      if (debouncedSearchQuery &&
          !collection.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) &&
          !collection.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) return false;
      if (filters.dateRange !== "all") {
        const collectionDate = new Date(collection.created_at);
        const now = new Date();
        switch (filters.dateRange) {
          case "today":
            if (collectionDate.toDateString() !== now.toDateString()) return false;
            break;
          case "week":
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            if (collectionDate < weekAgo) return false;
            break;
          case "month":
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            if (collectionDate < monthAgo) return false;
            break;
          case "year":
            const yearAgo = new Date();
            yearAgo.setFullYear(now.getFullYear() - 1);
            if (collectionDate < yearAgo) return false;
            break;
        }
      }
      const questionCount = collection.question_count || 0;
      if (questionCount < filters.questionCount[0] || questionCount > filters.questionCount[1]) return false;
      if (filters.createdBy !== "all" && user) {
        const isCreatedByCurrentUser = collection.created_by?.id === user.id;
        if ((filters.createdBy === "me" && !isCreatedByCurrentUser) ||
            (filters.createdBy === "others" && isCreatedByCurrentUser)) return false;
      }
      return true;
    });
  }, [activeFilter, debouncedSearchQuery, filters, allCollections, user]);

  useEffect(() => {
    const filtered = applyAllFilters();
    setCollections(filtered);
    setCurrentPage(1);
  }, [debouncedSearchQuery, activeFilter, applyAllFilters]);

  // Apply pagination
  useEffect(() => {
    if (collections.length > 0) {
      const totalPages = Math.ceil(collections.length / collectionsPerPage);
      setTotalPages(totalPages);
      const indexOfLastCollection = currentPage * collectionsPerPage;
      const currentCollections = collections.slice(
        indexOfLastCollection - collectionsPerPage,
        indexOfLastCollection
      );
      setPaginatedCollections(currentCollections);
    } else {
      setPaginatedCollections([]);
      setTotalPages(1);
    }
  }, [collections, currentPage, collectionsPerPage]);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const handleStatusChange = async (collectionId, newStatus) => {
    try {
      await CollectionAPI.updateCollectionStatus(collectionId, newStatus);  // ← use API
      setCollections(prev =>
        prev.map(c =>
          c.id === collectionId ? { ...c, status: newStatus } : c
        )
      );
      setAllCollections(prev =>
        prev.map(c =>
          c.id === collectionId ? { ...c, status: newStatus } : c
        )
      );
      toast.success(`Collection status updated`, {
        description: `"${collections.find(c => c.id === collectionId)?.title}" is now ${newStatus}.`,
      });
    } catch {
      toast.error("Failed to update status", {
        description: "Please try again later.",
      });
    }
  };

  const handleDelete = async (collectionId) => {
    try {
      await CollectionAPI.deleteCollection(collectionId);  // ← use API
      setCollections(prev => prev.filter(c => c.id !== collectionId));
      setAllCollections(prev => prev.filter(c => c.id !== collectionId));
      toast.success(`Collection deleted`, {
        description: `"${collections.find(c => c.id === collectionId)?.title}" has been removed.`,
      });
    } catch {
      toast.error("Failed to delete collection", {
        description: "Please try again later.",
      });
    }
  };

  const handleDuplicate = async (collectionId, title, description) => {
    try {
      setLoading(true);
      const newId = await CollectionAPI.duplicateCollection(collectionId, title, description); // ← use API
      navigate(`/collections/${newId}`);
    } catch {
      toast.error("Failed to duplicate collection", {
        description: "Please try again later.",
      });
    } finally {
      setLoading(false);
    }
  };

  const canEditCollection = (collection) => 
    user && collection.created_by?.id === user.id;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <Toaster closeButton />
      <main className="flex-1 space-y-4 p-8 pt-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Test Collections</h2>
            <p className="text-muted-foreground">Create and manage your test question collections</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild>
              <Link to="/collections/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Collection
              </Link>
            </Button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto flex flex-col space-y-4">
          <CollectionFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            filters={filters}
            setFilters={setFilters}
            applyFilters={applyAllFilters}
          />
          {loading ? (
            <LoadingCollections />
          ) : error ? (
            <ErrorCollections error={error} retryAction={() => fetchCollectionsAPI()} />
          ) : (
            <div className="space-y-4">
              {collections.length === 0 ? (
                <EmptyCollections />
              ) : (
                <>
                  {paginatedCollections.map((collection) => (
                    <CollectionCard
                      key={collection.id}
                      collection={collection}
                      onStatusChange={handleStatusChange}
                      onDelete={handleDelete}
                      onDuplicate={handleDuplicate}
                      canEdit={canEditCollection(collection)}
                    />
                  ))}
                  {collections.length > collectionsPerPage && (
                    <Pagination className="mt-6">
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            aria-disabled={currentPage === 1}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                        {/* First Page */}
                        <PaginationItem>
                          <PaginationLink
                            isActive={currentPage === 1}
                            onClick={() => handlePageChange(1)}
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
                            <PaginationLink onClick={() => handlePageChange(currentPage - 1)}>
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
                            <PaginationLink onClick={() => handlePageChange(currentPage + 1)}>
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
                              onClick={() => handlePageChange(totalPages)}
                            >
                              {totalPages}
                            </PaginationLink>
                          </PaginationItem>
                        )}
                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            aria-disabled={currentPage === totalPages}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default Collections;
