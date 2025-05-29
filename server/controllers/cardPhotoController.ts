import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../storage';
import { UploadedFile } from 'express-fileupload';
import { insertCardPhotoSchema } from '@shared/schema';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Upload a new card photo
export const uploadCardPhoto = async (req: Request, res: Response) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'No files were uploaded' });
    }

    // Validate and parse the request body
    const { collectionCardId, userId, isFront, quality, notes } = req.body;
    
    // Check if the collection card exists
    const card = await storage.getCollectionCardById(parseInt(collectionCardId));
    if (!card) {
      return res.status(404).json({ message: 'Collection card not found' });
    }
    
    // Upload the file
    const photoFile = req.files.photo as UploadedFile;
    const fileExtension = path.extname(photoFile.name);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);
    
    // Move the file to the uploads directory
    await photoFile.mv(filePath);
    
    // Create a URL for the photo (relative to the server)
    const photoUrl = `/uploads/${fileName}`;
    
    // Create a new card photo in the database
    const photoData = {
      collectionCardId: parseInt(collectionCardId),
      userId: parseInt(userId),
      photoUrl,
      isFront: parseInt(isFront) || 1,
      quality: quality || 'normal',
      notes: notes || ''
    };
    
    const newPhoto = await storage.createCardPhoto(photoData);
    
    res.status(201).json(newPhoto);
  } catch (error: any) {
    console.error('Error uploading card photo:', error);
    res.status(500).json({ message: 'Failed to upload card photo', error: error.message });
  }
};

// Get all photos for a specific collection card
export const getCardPhotos = async (req: Request, res: Response) => {
  try {
    const collectionCardId = parseInt(req.params.collectionCardId);
    if (isNaN(collectionCardId)) {
      return res.status(400).json({ message: 'Invalid collection card ID' });
    }
    
    // Check if the collection card exists
    const card = await storage.getCollectionCardById(collectionCardId);
    if (!card) {
      return res.status(404).json({ message: 'Collection card not found' });
    }
    
    // Fetch all photos for this card
    const photos = await storage.getCardPhotosByCollectionCardId(collectionCardId);
    
    res.json(photos);
  } catch (error: any) {
    console.error('Error fetching card photos:', error);
    res.status(500).json({ message: 'Failed to fetch card photos', error: error.message });
  }
};

// Delete a card photo
export const deleteCardPhoto = async (req: Request, res: Response) => {
  try {
    const photoId = parseInt(req.params.photoId);
    if (isNaN(photoId)) {
      return res.status(400).json({ message: 'Invalid photo ID' });
    }
    
    // Check if the photo exists
    const photo = await storage.getCardPhotoById(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    
    // Make sure the user has permission to delete this photo
    if (photo.userId !== req.user?.id) {
      return res.status(403).json({ message: 'You do not have permission to delete this photo' });
    }
    
    // Delete the photo file from the uploads directory
    if (photo.photoUrl) {
      const filePath = path.join(process.cwd(), photo.photoUrl.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Delete the photo from the database
    await storage.deleteCardPhoto(photoId);
    
    res.json({ message: 'Photo deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting card photo:', error);
    res.status(500).json({ message: 'Failed to delete card photo', error: error.message });
  }
};

// Update a card photo's details
export const updateCardPhoto = async (req: Request, res: Response) => {
  try {
    const photoId = parseInt(req.params.photoId);
    if (isNaN(photoId)) {
      return res.status(400).json({ message: 'Invalid photo ID' });
    }
    
    // Check if the photo exists
    const photo = await storage.getCardPhotoById(photoId);
    if (!photo) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    
    // Make sure the user has permission to update this photo
    if (photo.userId !== req.user?.id) {
      return res.status(403).json({ message: 'You do not have permission to update this photo' });
    }
    
    // Update the photo details
    const updatedPhoto = await storage.updateCardPhoto(photoId, req.body);
    
    res.json(updatedPhoto);
  } catch (error: any) {
    console.error('Error updating card photo:', error);
    res.status(500).json({ message: 'Failed to update card photo', error: error.message });
  }
};