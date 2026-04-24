import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { User } from "lucide-react"

export function CollectionDetailsForm({ 
  collectionData, 
  collectionId,
  onInputChange, 
  onContinue,
  isArchived = false,
  canEdit = true,
  createdBy = null,
  availableCategories = [],
  onCategoryChange,
}) {
  const selectedCategory = collectionData.categories?.[0] || "";
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const filteredCategories = useMemo(() => {
    const query = selectedCategory.trim().toLowerCase();
    const categories = availableCategories
      .map((category) => category?.name)
      .filter(Boolean);

    if (!query) return categories;
    return categories.filter((name) => name.toLowerCase().includes(query));
  }, [availableCategories, selectedCategory]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Details about this test collection.</CardDescription>
        </div>
        {createdBy && (
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="mr-2 h-4 w-4" />
            <span>Created by {createdBy.first_name} {createdBy.last_name}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Collection Title</Label>
            <Input
              id="title"
              name="title"
              value={collectionData.title}
              onChange={onInputChange}
              placeholder="e.g., Advanced Algorithms Questions"
              readOnly={!canEdit || isArchived}
              className={(!canEdit || isArchived) ? "opacity-70 cursor-not-allowed" : ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={collectionData.description}
              onChange={onInputChange}
              placeholder="Provide a description of the collection content..."
              readOnly={!canEdit || isArchived}
              className={(!canEdit || isArchived) ? "opacity-70 cursor-not-allowed" : ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="category">Category</Label>
            <div className="relative">
              <Input
                id="category"
                value={selectedCategory}
                onFocus={() => setIsCategoryDropdownOpen(true)}
                onBlur={() => {
                  setTimeout(() => setIsCategoryDropdownOpen(false), 120);
                }}
                onChange={(e) => {
                  onCategoryChange(e.target.value);
                  setIsCategoryDropdownOpen(true);
                }}
                placeholder="Type a new category or pick an existing one"
                readOnly={!canEdit || isArchived}
                className={(!canEdit || isArchived) ? "opacity-70 cursor-not-allowed" : ""}
              />

              {canEdit && !isArchived && isCategoryDropdownOpen && filteredCategories.length > 0 && (
                <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
                  <div className="max-h-56 overflow-y-auto">
                    {filteredCategories.map((name) => (
                      <button
                        key={name}
                        type="button"
                        className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onCategoryChange(name);
                          setIsCategoryDropdownOpen(false);
                        }}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="secondary" className="mr-2" disabled={isArchived || collectionId==="new" ? true : false}>
          <Link to={`/exams/new?collectionId=${collectionId}`}>
            Create Exam
          </Link> 
        </Button>
        <Button onClick={onContinue}>
          {canEdit ? "Continue to Questions" : "View Questions"}
        </Button>
      </CardFooter>
    </Card>
  )
}
