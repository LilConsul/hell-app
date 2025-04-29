import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

import { CollectionCard } from "@/components/collections/card";
import { CollectionFilters } from "@/components/collections/filters";
import { EmptyCollections, LoadingCollections, ErrorCollections } from "@/components/collections/handle-collections";

function Collections() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: "all",
    questionCount: [0, 100],
    createdBy: "all",
  });
  
  useEffect(() => {
    fetchCollections();
  }, [activeFilter]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let endpoint = "/api/v1/exam/teacher/collections/";
      
      if (activeFilter === "published") {
        endpoint = "/api/v1/exam/teacher/collections/public";
      }
      
      const response = await fetch(endpoint, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Fetch detailed data for each collection to get questions
      const detailedCollections = await Promise.all(
        data.data.map(async (collection) => {
          try {
            const detailResponse = await fetch(`/api/v1/exam/teacher/collections/${collection.id}`, {
              credentials: "include",
            })
            
            if (!detailResponse.ok) {
              console.error(`Failed to fetch details for collection ${collection.id}`)
              return collection
            }
            
            const detailData = await detailResponse.json()
            return detailData.data
          } catch (err) {
            console.error(`Error fetching details for collection ${collection.id}:`, err)
            return collection
          }
        })
      )
      
      setCollections(detailedCollections)
    } catch (err) {
      console.error("Error fetching collections:", err)
      setError("Failed to load collections. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  // TODO
  const applyFilters = () => {
    console.log("Applying filters:", filters)
    fetchCollections()
  }

  // Search bar
  const filteredCollections = collections.filter((collection) => {
    return (
      collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      collection.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  // Collection status change
  const handleStatusChange = async (collectionId, newStatus) => {
    try {
      const data = collections.find(collection => collection.id === collectionId)
      if (!data) {
        throw new Error("Collection not found")
      }
      
      const response = await fetch(`/api/v1/exam/teacher/collections/${collectionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description, 
          status: newStatus
        }),
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      
      // Update locally
      setCollections(collections.map(collection => 
        collection.id === collectionId 
          ? { ...collection, status: newStatus }
          : collection
      ))
    } catch (err) {
      console.error("Error updating collection status:", err)
      setError("Failed to update collection status. Please try again.")
    }
  }
  
  // Collection deletion
  const handleDelete = async (collectionId) => {
    try {
      const response = await fetch(`/api/v1/exam/teacher/collections/${collectionId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
      
      // Update locally
      setCollections(collections.filter(collection => collection.id !== collectionId))
    } catch (err) {
      console.error("Error deleting collection:", err)
      setError("Failed to delete collection. Please try again.")
    }
  }

  // collection duplication
  const handleDuplicate = async (collectionId, title, description) => {
    try {
      setLoading(true)

      // Get the original collection with questions
      const detailResponse = await fetch(`/api/v1/exam/teacher/collections/${collectionId}`, {
        credentials: "include",
      })
      
      if (!detailResponse.ok) {
        throw new Error(`HTTP error! Status: ${detailResponse.status}`);
      }
      
      const detailData = await detailResponse.json()
      const originalCollection = detailData.data
      const questions = originalCollection.questions || []
      
      // Create a new collection
      const createResponse = await fetch("/api/v1/exam/teacher/collections/", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          status: "draft"
        }),
        credentials: 'include'
      })
      
      if (!createResponse.ok) {
        throw new Error(`HTTP error! Status: ${createResponse.status}`);
      }
      
      const newCollectionData = await createResponse.json();
      const newCollectionId = newCollectionData.data.collection_id;
      
      // Copy each question to the new collection
      if (questions && questions.length > 0) {
        for (const question of questions) {
          if (question) {
            const questionPayload = {
              question_text: question.question_text,
              type: question.type,
              weight: question.weight || 1,
              has_katex: question.has_katex || false
            }
            
            // Add correct answer
            if (question.type === 'shortanswer' && question.correct_input_answer) {
              questionPayload.correct_input_answer = question.correct_input_answer
            }
            
            // Add options for multiple choice
            if ((question.type === 'mcq' || question.type === 'singlechoice') && question.options) {
              // Remove id fields
              const cleanOptions = question.options.map(option => ({
                text: option.text,
                is_correct: option.is_correct
              }))
              questionPayload.options = cleanOptions
            }
            
            await fetch(`/api/v1/exam/teacher/collections/${newCollectionId}/questions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(questionPayload),
              credentials: 'include'
            })
          }
        }
      }
      
      fetchCollections()
    } catch (err) {
      console.error("Error duplicating collection:", err)
      setError("Failed to duplicate collection. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 space-y-4 p-8 pt-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Test Collections</h2>
            <p className="text-muted-foreground">Create and manage your test question collections</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button asChild>
              <Link to="/collections/create">
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
            applyFilters={applyFilters}
          />

          {loading ? (
            <LoadingCollections />
          ) : error ? (
            <ErrorCollections error={error} retryAction={fetchCollections} />
          ) : (
            <div className="space-y-4">
              {filteredCollections.length === 0 ? (
                <EmptyCollections />
              ) : (
                filteredCollections.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default Collections