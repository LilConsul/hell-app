import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Globe, Lock, Save } from "lucide-react"
import { Link } from "react-router-dom"

export function PageHeader({ 
  title = "Create Test Collection", 
  subtitle = "Create a new collection of test questions", 
  status, 
  onStatusChange, 
  onSave, 
  isSaveDisabled 
}) {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className={`bg-background/90 backdrop-blur-sm py-4 transition-all duration-200 z-10 
        ${isSticky ? 'sticky top-12' : ''}`}
    >
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" className="mr-2" asChild>
              <Link to="/collections">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <div>
              <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
              <p className="text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => onStatusChange(status === "draft" ? "published" : "draft")}
              className={status !== "draft" ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-900/40" : ""}
            >
              {status === "draft" ? (
                <>
                  <Lock className="mr-2 h-4 w-4" />
                  Draft
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Public
                </>
              )}
            </Button>
            <Button onClick={onSave} disabled={isSaveDisabled}>
              <Save className="mr-2 h-4 w-4" />
              Save Collection
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}