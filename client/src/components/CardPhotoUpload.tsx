import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Image, Camera, Trash2, RefreshCw } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

interface CardPhotoUploadProps {
  collectionCardId: number;
  userId: number;
  cardName: string;
}

type CardPhoto = {
  id: number;
  collectionCardId: number;
  userId: number;
  photoUrl: string;
  isFront: number;
  quality: string;
  notes: string;
  uploadedAt: string;
};

export default function CardPhotoUpload({ collectionCardId, userId, cardName }: CardPhotoUploadProps) {
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isFront, setIsFront] = useState<number>(1); // 1 for front, 0 for back
  const [quality, setQuality] = useState<string>('normal');
  const [notes, setNotes] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Query to fetch existing photos for this card
  const { data: photos, isLoading: isLoadingPhotos } = useQuery({
    queryKey: ['/api/card-photos/card', collectionCardId],
    queryFn: async () => {
      const res = await fetch(`/api/card-photos/card/${collectionCardId}`);
      if (!res.ok) throw new Error('Failed to fetch card photos');
      return res.json() as Promise<CardPhoto[]>;
    }
  });
  
  // Mutation to upload a new photo
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!uploadFile) throw new Error('No file selected');
      
      const formData = new FormData();
      formData.append('photo', uploadFile);
      formData.append('collectionCardId', collectionCardId.toString());
      formData.append('userId', userId.toString());
      formData.append('isFront', isFront.toString());
      formData.append('quality', quality);
      formData.append('notes', notes);
      
      const res = await fetch('/api/card-photos/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to upload photo');
      }
      
      return res.json();
    },
    onSuccess: () => {
      // Reset form and invalidate query to refresh photos
      setUploadFile(null);
      setPreviewUrl(null);
      setNotes('');
      queryClient.invalidateQueries({ queryKey: ['/api/card-photos/card', collectionCardId] });
      toast({
        title: 'Photo uploaded successfully',
        description: 'Your card photo has been added to your collection.',
      });
      // Switch to manage tab after successful upload
      setActiveTab('manage');
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Mutation to delete a photo
  const deleteMutation = useMutation({
    mutationFn: async (photoId: number) => {
      const res = await apiRequest('DELETE', `/api/card-photos/${photoId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete photo');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/card-photos/card', collectionCardId] });
      toast({
        title: 'Photo deleted',
        description: 'The photo has been removed from your collection.',
      });
      setSelectedPhotoId(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate();
  };
  
  // Handle photo deletion
  const handleDeletePhoto = (photoId: number) => {
    if (confirm('Are you sure you want to delete this photo?')) {
      deleteMutation.mutate(photoId);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Card Photos</CardTitle>
        <CardDescription>Upload and manage your own photos of {cardName}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload Photo</TabsTrigger>
            <TabsTrigger value="manage">
              Manage Photos
              {photos?.length ? ` (${photos.length})` : ''}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="photo">Card Photo</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    id="photo" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    required 
                  />
                  <Button 
                    type="button" 
                    size="icon" 
                    variant="outline"
                    onClick={() => {
                      setUploadFile(null);
                      setPreviewUrl(null);
                    }}
                    disabled={!uploadFile}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {previewUrl && (
                <div className="w-full max-w-sm mx-auto">
                  <AspectRatio ratio={2/3} className="bg-muted overflow-hidden rounded-md">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="object-cover w-full h-full"
                    />
                  </AspectRatio>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="side">Card Side</Label>
                  <Select 
                    value={isFront.toString()} 
                    onValueChange={(value) => setIsFront(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select side" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Front</SelectItem>
                      <SelectItem value="0">Back</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="quality">Card Quality</Label>
                  <Select 
                    value={quality} 
                    onValueChange={setQuality}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select quality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mint">Mint</SelectItem>
                      <SelectItem value="near-mint">Near Mint</SelectItem>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="played">Played</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  placeholder="Add any notes about this card (condition, distinguishing marks, etc.)" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={!uploadFile || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="manage">
            {isLoadingPhotos ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : photos?.length ? (
              <div className="space-y-4">
                <Carousel className="w-full">
                  <CarouselContent>
                    {photos.map((photo) => (
                      <CarouselItem key={photo.id} className="md:basis-1/2 lg:basis-1/3">
                        <Card className="overflow-hidden">
                          <AspectRatio ratio={2/3}>
                            <img 
                              src={photo.photoUrl} 
                              alt={`${cardName} - ${photo.isFront ? 'Front' : 'Back'}`}
                              className="object-cover w-full h-full"
                            />
                          </AspectRatio>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-sm font-medium">
                                  {photo.isFront ? 'Front' : 'Back'}
                                </span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  {photo.quality}
                                </span>
                              </div>
                              <div className="flex space-x-1">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={() => setSelectedPhotoId(photo.id)}>
                                      <Image className="h-4 w-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-lg">
                                    <DialogHeader>
                                      <DialogTitle>{cardName} - {photo.isFront ? 'Front' : 'Back'}</DialogTitle>
                                    </DialogHeader>
                                    <div className="w-full max-w-md mx-auto">
                                      <AspectRatio ratio={2/3} className="overflow-hidden rounded-md">
                                        <img 
                                          src={photo.photoUrl} 
                                          alt={`${cardName} - ${photo.isFront ? 'Front' : 'Back'}`}
                                          className="object-cover w-full h-full"
                                        />
                                      </AspectRatio>
                                    </div>
                                    {photo.notes && (
                                      <div className="mt-2 text-sm text-muted-foreground">
                                        <p><strong>Notes:</strong> {photo.notes}</p>
                                      </div>
                                    )}
                                  </DialogContent>
                                </Dialog>
                                
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeletePhoto(photo.id)}
                                  disabled={deleteMutation.isPending && selectedPhotoId === photo.id}
                                >
                                  {deleteMutation.isPending && selectedPhotoId === photo.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
                
                <Button 
                  variant="outline" 
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/card-photos/card', collectionCardId] })}
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Photos
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Camera className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p>No photos added yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload your own photos of this card to keep track of your collection
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('upload')}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload First Photo
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}