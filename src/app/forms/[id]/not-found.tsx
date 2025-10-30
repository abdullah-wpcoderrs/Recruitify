import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileX, Home } from "lucide-react";
import Link from "next/link";

export default function FormNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="max-w-md w-full">
        <CardContent className="text-center py-8">
          <FileX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Not Found</h2>
          <p className="text-gray-600 mb-6">
            The form you&apos;re looking for doesn&apos;t exist or is no longer available.
          </p>
          <Link href="/">
            <Button>
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}