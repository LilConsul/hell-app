import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function CollectionsHeader() {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`
        bg-background/90 backdrop-blur-sm transition-all duration-200 z-10
        ${isSticky ? "sticky top-12" : ""}
      `}
    >
      <div className="py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Test Collections</h2>
            <p className="text-muted-foreground">
              Create and manage your test question collections
            </p>
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
      </div>
    </div>
  );
}

