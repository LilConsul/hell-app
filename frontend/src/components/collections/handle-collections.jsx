import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Library, PlusCircle } from "lucide-react";
import { Loader2 } from "lucide-react";

export function EmptyCollections() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-10">
        <Library className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-center text-muted-foreground">No collections found</p>
        <Button variant="outline" className="mt-4" asChild>
          <Link to="/collections/create">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Collection
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export function LoadingCollections() {
  return (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export function ErrorCollections({ error, retryAction }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-10">
        <p className="text-center text-destructive">{error}</p>
        <Button variant="outline" className="mt-4" onClick={retryAction}>
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
}
