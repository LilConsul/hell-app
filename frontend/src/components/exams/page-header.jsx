import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export function ExamHeader({ 
  title = "Assign New Exam",
  subtitle = "Create and assign an exam to students",
  onSubmit,
  loading = false,
  canSubmit = true
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
      className={`bg-background/90 backdrop-blur-sm transition-all duration-200 z-10 
        ${isSticky ? 'sticky top-12' : ''}`}
    >
      <div className="py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button variant="ghost" size="sm" className="mr-2" asChild>
                <Link to="/exams">
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
                type="button" 
                onClick={onSubmit} 
                disabled={loading || !canSubmit}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  "Assign Exam"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}