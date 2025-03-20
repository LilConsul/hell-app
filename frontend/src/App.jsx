import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";


export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">FastAPI + React Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">
            This is a FastAPI-React template with Tailwind CSS v4.<br /> Made by LilConsul.
          </p>
          {loading && <Skeleton className="h-6 w-full" />}
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {data && (
            <div className="p-4 bg-gray-50 rounded-md shadow">
              <h2 className="text-lg font-semibold">Message from API</h2>
              <pre className="text-sm text-gray-600 bg-gray-200 p-2 rounded">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
          <div className="flex justify-center">
            <Button asChild>
              <a
                href="https://github.com/LilConsul"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit my GitHub
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
