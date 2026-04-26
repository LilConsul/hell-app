import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { User, X } from "lucide-react"

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
  const selectedCategories = Array.isArray(collectionData.categories)
    ? collectionData.categories
    : [];
  const [categoryInput, setCategoryInput] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const filteredCategories = useMemo(() => {
    const query = categoryInput.trim().toLowerCase();
    const categories = availableCategories
      .map((category) => category?.name)
      .filter((name) => Boolean(name) && !selectedCategories.includes(name));

    if (!query) return categories;
    return categories.filter((name) => name.toLowerCase().includes(query));
  }, [availableCategories, categoryInput, selectedCategories]);

  const addCategory = (value) => {
    const categoryName = value.trim();
    if (!categoryName || selectedCategories.includes(categoryName)) {
      return;
    }

    onCategoryChange([...selectedCategories, categoryName]);
    setCategoryInput("");
    setIsCategoryDropdownOpen(false);
  };

  const removeCategory = (categoryName) => {
    onCategoryChange(selectedCategories.filter((name) => name !== categoryName));
  };

  const handleCategoryKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCategory(categoryInput);
      return;
    }

    if (e.key === "Backspace" && !categoryInput.trim() && selectedCategories.length > 0) {
      removeCategory(selectedCategories[selectedCategories.length - 1]);
    }
  };

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
            <Label htmlFor="category">Categories</Label>
            <div className="relative">
              <div
                className={`flex min-h-10 flex-wrap items-center gap-2 rounded-md border px-3 py-2 ${
                  (!canEdit || isArchived)
                    ? "opacity-70 cursor-not-allowed bg-muted"
                    : ""
                }`}
              >
                {selectedCategories.map((name) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs"
                  >
                    {name}
                    {canEdit && !isArchived && (
                      <button
                        type="button"
                        className="rounded-full hover:bg-muted"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          removeCategory(name);
                        }}
                        aria-label={`Remove ${name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}

                <Input
                  id="category"
                  value={categoryInput}
                  onFocus={() => setIsCategoryDropdownOpen(true)}
                  onBlur={() => {
                    setTimeout(() => setIsCategoryDropdownOpen(false), 120);
                  }}
                  onChange={(e) => {
                    setCategoryInput(e.target.value);
                    setIsCategoryDropdownOpen(true);
                  }}
                  onKeyDown={handleCategoryKeyDown}
                  placeholder="Type category and press Enter"
                  readOnly={!canEdit || isArchived}
                  className="h-7 min-w-[180px] flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
                />
              </div>

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
                          addCategory(name);
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
