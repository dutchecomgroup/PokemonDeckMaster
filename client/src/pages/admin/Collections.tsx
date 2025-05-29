import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Loader2, MoreHorizontal, Pencil, Trash2, Eye, FolderPlus } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Collection {
  id: number;
  name: string;
  description?: string;
  userId: number;
  username: string; // Added for display purposes
  cardCount: number;
  createdAt: string;
}

const CollectionsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['/api/admin/collections'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/admin/collections');
        if (!res.ok) throw new Error('Failed to fetch collections');
        return res.json();
      } catch (error) {
        console.error('Error fetching collections:', error);
        return [];
      }
    },
  });

  const filteredCollections = collections.filter((collection: Collection) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      collection.name.toLowerCase().includes(query) ||
      (collection.description && collection.description.toLowerCase().includes(query)) ||
      collection.username.toLowerCase().includes(query)
    );
  });

  const handleDeleteCollection = async () => {
    if (!selectedCollection) return;
    
    try {
      // In een echte implementatie zou deze code de collectie verwijderen
      // await fetch(`/api/admin/collections/${selectedCollection.id}`, {
      //   method: 'DELETE',
      // });
      
      // Voor nu sluiten we alleen het dialoogvenster
      setIsDeleteDialogOpen(false);
      setSelectedCollection(null);
    } catch (error) {
      console.error('Error deleting collection:', error);
    }
  };

  return (
    <AdminLayout title="Collectiebeheer">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Collecties</CardTitle>
            <CardDescription>Beheer alle collecties in het systeem</CardDescription>
          </div>
          <Button className="flex items-center">
            <FolderPlus className="mr-2 h-4 w-4" /> Nieuwe collectie
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Zoeken op collectienaam of gebruiker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-md"
            />
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCollections.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Naam</TableHead>
                    <TableHead>Gebruiker</TableHead>
                    <TableHead>Aantal kaarten</TableHead>
                    <TableHead>Aangemaakt op</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCollections.map((collection: Collection) => (
                    <TableRow key={collection.id}>
                      <TableCell>{collection.id}</TableCell>
                      <TableCell>
                        <div className="font-medium">{collection.name}</div>
                        {collection.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {collection.description}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{collection.username}</TableCell>
                      <TableCell>{collection.cardCount}</TableCell>
                      <TableCell>{formatDate(collection.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acties</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                              setSelectedCollection(collection);
                              setIsViewDialogOpen(true);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Bekijken
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Pencil className="mr-2 h-4 w-4" />
                              Bewerken
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedCollection(collection);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Verwijderen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex justify-center py-8 text-muted-foreground">
              Geen collecties gevonden.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Collection Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collectie verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je de collectie <strong>{selectedCollection?.name}</strong> van gebruiker <strong>{selectedCollection?.username}</strong> wilt verwijderen?
              Deze actie kan niet ongedaan worden gemaakt en alle kaarten in deze collectie zullen worden verwijderd.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCollection}
            >
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Collection Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Collectie details</DialogTitle>
            <DialogDescription>
              Details van de collectie <strong>{selectedCollection?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedCollection && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Collectie informatie</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-sm font-medium">Naam</p>
                      <p>{selectedCollection.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Eigenaar</p>
                      <p>{selectedCollection.username}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Aangemaakt op</p>
                      <p>{formatDate(selectedCollection.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Aantal kaarten</p>
                      <p>{selectedCollection.cardCount}</p>
                    </div>
                  </div>
                </div>
                
                {selectedCollection.description && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Beschrijving</h3>
                    <p className="mt-1">{selectedCollection.description}</p>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Kaarten</h3>
                  <p className="text-muted-foreground mt-1">
                    Hier zouden de kaarten in deze collectie getoond worden.
                  </p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsViewDialogOpen(false)}
            >
              Sluiten
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default CollectionsPage;