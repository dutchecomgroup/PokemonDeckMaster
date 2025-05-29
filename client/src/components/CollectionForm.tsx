import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCollectionContext } from '@/context/CollectionContext';

interface CollectionFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const CollectionForm: React.FC<CollectionFormProps> = ({ isOpen, onClose }) => {
  const { createCollection } = useCollectionContext();
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('english');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      if (typeof window.showToast === 'function') {
        window.showToast('Please enter a collection name.', 'error');
      }
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createCollection({
        name: name.trim(),
        language
      });
      
      if (typeof window.showToast === 'function') {
        window.showToast(`Collection "${name}" created successfully.`, 'success');
      }
      
      // Reset form and close
      setName('');
      setLanguage('english');
      onClose();
    } catch (error) {
      console.error('Failed to create collection:', error);
      if (typeof window.showToast === 'function') {
        window.showToast('Failed to create collection. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">Create New Collection</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Set up a new collection to organize your cards.
          </DialogDescription>
        </DialogHeader>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="collectionName">Collection Name:</Label>
            <Input
              id="collectionName"
              placeholder="e.g., Scarlet & Violet Master Set"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-input text-foreground"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="collectionLanguage">Language (optional):</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-input text-foreground">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="japanese">Japanese</SelectItem>
                <SelectItem value="german">German</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="italian">Italian</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="portuguese">Portuguese</SelectItem>
                <SelectItem value="korean">Korean</SelectItem>
                <SelectItem value="chinese">Chinese</SelectItem>
                <SelectItem value="dutch">Dutch</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-medium"
            disabled={isSubmitting}
          >
            <i className="fas fa-plus-circle mr-2"></i>
            {isSubmitting ? 'Creating...' : 'Create Collection'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CollectionForm;
