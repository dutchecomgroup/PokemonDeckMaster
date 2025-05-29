import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

const CardRecognitionPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Card Recognition</h1>
        <p className="text-muted-foreground">
          Add Pokémon cards to your collection
        </p>
      </div>
      
      <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="ml-2">Feature temporarily unavailable</AlertTitle>
        <AlertDescription className="ml-2 mt-2">
          The automatic card recognition feature is currently unavailable due to technical limitations. 
          Please use the manual search functionality to add cards to your collection.
        </AlertDescription>
      </Alert>
      
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-lg font-semibold mb-4">Alternative Methods</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-medium text-primary">Search by Card Name</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Use the search feature to find cards by name, then add them to your collection.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/collection-manager">Go to Search</Link>
            </Button>
          </div>
          
          <div className="border border-border rounded-lg p-4">
            <h3 className="font-medium text-primary">Browse Set Collections</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Browse through complete Pokémon sets and add cards directly to your collection.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/my-collection">View Collections</Link>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-amber-100 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-md">
        <h3 className="text-amber-800 dark:text-amber-400 font-medium mb-2">Coming Soon</h3>
        <p className="text-sm text-amber-700 dark:text-amber-300">
          We're working on improvements to our card recognition feature. Stay tuned for updates!
        </p>
      </div>
    </div>
  );
};

export default CardRecognitionPage;