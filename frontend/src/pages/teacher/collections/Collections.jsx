import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { CollectionCard } from "@/components/collections/collection-card";
import { CollectionFilters } from "@/components/collections/filters";
import { CustomPagination } from "@/components/pagination";
import { usePagination } from "@/hooks/use-pagination";

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
  
  const {
    currentPage,
    totalPages,
    paginatedItems: paginatedCollections,
    goToPage: handlePageChange
  } = usePagination(collections, 10);

  useEffect(() => {
    const loadCollections = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await CollectionAPI.fetchCollections();
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
    
    let filteredCollections = allCollections.filter(collection => {
      // Status filter
      if (activeFilter !== "all" && activeFilter !== collection.status) return false;
      // Filter by search query
      if (debouncedSearchQuery &&
          !collection.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) &&
          !collection.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) return false;
      
      // Filter by date range
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
      
      // Filter by question count
      const questionCount = collection.question_count || 0;
      if (questionCount < filters.questionCount[0] || questionCount > filters.questionCount[1]) return false;
      
      // Filter by creator
      if (filters.createdBy !== "all" && user) {
        const isCreatedByCurrentUser = collection.created_by?.id === user.id;
        if ((filters.createdBy === "me" && !isCreatedByCurrentUser) ||
            (filters.createdBy === "others" && isCreatedByCurrentUser)) return false;
      }
      
      return true;
    });
    
    if (activeFilter === "all") {
      filteredCollections.sort((a, b) => {
        // First sort by archived status (non-archived first)
        if (a.status === "archived" && b.status !== "archived") return 1;
        if (a.status !== "archived" && b.status === "archived") return -1;
        
        // If both have same archived status sort by created date (newest first)
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }
    
    return filteredCollections;
  }, [activeFilter, debouncedSearchQuery, filters, allCollections, user]);

  useEffect(() => {
    const filtered = applyAllFilters();
    setCollections(filtered);
  }, [debouncedSearchQuery, activeFilter, applyAllFilters]);

  const handleStatusChange = async (collectionId, newStatus) => {
    try {
      await CollectionAPI.updateCollectionStatus(collectionId, newStatus);
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
      
      const statusMessage = {
        published: "public",
        draft: "draft",
        archived: "archived"
      };
      
      toast.success(`Collection status updated`, {
        description: `"${collections.find(c => c.id === collectionId)?.title}" is now ${statusMessage[newStatus]}.`,
      });
      
      // Refresh the collections list to ensure sorting is applied
      if (activeFilter === "all") {
        const filtered = applyAllFilters();
        setCollections(filtered);
      }
    } catch {
      toast.error("Failed to update status", {
        description: "Please try again later.",
      });
    }
  };

  const handleDelete = async (collectionId) => {
    try {
      await CollectionAPI.deleteCollection(collectionId);
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
      const newId = await CollectionAPI.duplicateCollection(collectionId, title, description);
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
                  <CustomPagination 
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
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