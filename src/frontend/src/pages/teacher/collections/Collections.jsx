import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle, User } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/auth-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { CollectionsHeader } from "@/components/collections/page-header";
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
  const [sortOption, setSortOption] = useState("updated-newest");
  const [filters, setFilters] = useState({
    dateRange: "all",
    questionCount: [0, 100], // in fact 0 - 100+
    createdBy: "all",
    specificUsers: [],
    lastUpdated: "all",
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
        const errorMessage = err || "Failed to load collections. Please try again later.";
        setError(errorMessage);
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

  // Update status filter when "others" is selected in created by filter
  useEffect(() => {
    if (filters.createdBy === "others" && activeFilter !== "published") {
      setActiveFilter("published");
    }
  }, [filters.createdBy]);

  // Reset created by filter when switching status tabs from "others" filter
  useEffect(() => {
    if (activeFilter !== "published" && filters.createdBy === "others") {
      setFilters(prev => ({ ...prev, createdBy: "all" }));
    }
  }, [activeFilter]);

  const sortCollections = useCallback((filteredCollections) => {
    if (!filteredCollections.length) return [];
    
    const sortedCollections = [...filteredCollections];
    
    // First, sort by the selected sorting option
    switch (sortOption) {
      case "updated-newest":
        sortedCollections.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        break;
      case "updated-oldest":
        sortedCollections.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
        break;
      case "created-newest":
        sortedCollections.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case "created-oldest":
        sortedCollections.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case "questions-high":
        sortedCollections.sort((a, b) => (b.question_count || 0) - (a.question_count || 0));
        break;
      case "questions-low":
        sortedCollections.sort((a, b) => (a.question_count || 0) - (b.question_count || 0));
        break;
      case "user":
        if (filters.specificUsers && filters.specificUsers.length > 0) {
          // Sort by updated date
          sortedCollections.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        }
        break;
    }
    
    // Ensure archived items are at the end
    return sortedCollections.sort((a, b) => {
      if (a.status === "archived" && b.status !== "archived") return 1;
      if (a.status !== "archived" && b.status === "archived") return -1;
      return 0;
    });
    
  }, [sortOption, filters.specificUsers]);

  const applyAllFilters = useCallback(() => {
    if (!allCollections.length) return [];
    
    let filteredCollections = allCollections.filter(collection => {
      if (activeFilter !== "all" && activeFilter !== collection.status) return false;
      
      // Filter by search query
      if (debouncedSearchQuery &&
          !collection.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) &&
          !collection.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) return false;
      
      // Filter by specific users - show if created by ANY of the selected users
      if (filters.specificUsers && filters.specificUsers.length > 0) {
        const userIds = filters.specificUsers.map(user => user.id);
        if (!userIds.includes(collection.created_by?.id)) return false;
      }
      
      // Filter by created date range
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
      
      // Filter by last updated date range
      if (filters.lastUpdated !== "all") {
        const updatedDate = new Date(collection.updated_at);
        const now = new Date();
        switch (filters.lastUpdated) {
          case "today":
            if (updatedDate.toDateString() !== now.toDateString()) return false;
            break;
          case "week":
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            if (updatedDate < weekAgo) return false;
            break;
          case "month":
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            if (updatedDate < monthAgo) return false;
            break;
          case "year":
            const yearAgo = new Date();
            yearAgo.setFullYear(now.getFullYear() - 1);
            if (updatedDate < yearAgo) return false;
            break;
        }
      }
      
      // Filter by question count
      const questionCount = collection.question_count || 0;
      if (questionCount < filters.questionCount[0]) return false;
      // Only apply upper bound if it's not the maximum value (100)
      if (filters.questionCount[1] < 100 && questionCount > filters.questionCount[1]) return false;
      
      // Filter by creator
      if (filters.createdBy !== "all" && user) {
        const isCreatedByCurrentUser = collection.created_by?.id === user.id;
        if ((filters.createdBy === "me" && !isCreatedByCurrentUser) ||
            (filters.createdBy === "others" && isCreatedByCurrentUser)) return false;
      }
      
      return true;
    });
    
    // Apply sorting after filtering
    return sortCollections(filteredCollections);
  }, [activeFilter, debouncedSearchQuery, filters, allCollections, user, sortCollections]);

  useEffect(() => {
    const filtered = applyAllFilters();
    setCollections(filtered);
  }, [debouncedSearchQuery, activeFilter, sortOption, applyAllFilters]);

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
      const filtered = applyAllFilters();
      setCollections(filtered);
    } catch (err) {
      const errorMessage = err || "Failed to update status. Please try again later.";
      setError(errorMessage);
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
    } catch (err) {
      toast.error("Failed to delete collection", {
        description: `${err.message || "Please try again later."}`,
      });
    }
  };

  const handleDuplicate = async (collectionId, title, description) => {
    try {
      setLoading(true);
      const newId = await CollectionAPI.duplicateCollection(collectionId, title, description);
      navigate(`/collections/${newId}`);
    } catch (err) {
      const errorMessage = err || "Failed to duplicate collection. Please try again later.";
      setError(errorMessage);
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
        <CollectionsHeader/>
        <div className="max-w-5xl mx-auto flex flex-col space-y-4">
          <CollectionFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            filters={filters}
            setFilters={setFilters}
            applyFilters={() => {
              const filtered = applyAllFilters();
              setCollections(filtered);
            }}
            sortOption={sortOption}
            setSortOption={setSortOption}
            allCollections={allCollections}
          />
          {loading ? (
            <LoadingCollections />
          ) : error ? (
            <ErrorCollections error={error} retryAction={() => {
              setLoading(true);
              setError(null);
              CollectionAPI.fetchCollections()
                .then(data => {
                  setAllCollections(data);
                  setLoading(false);
                })
                .catch(error => {
                  const errorMessage = error.message || "Failed to load collections. Please try again later.";
                  setError(errorMessage);
                  setLoading(false);
                });
            }} />
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
