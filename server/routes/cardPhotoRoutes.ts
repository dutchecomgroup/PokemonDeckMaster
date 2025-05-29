import express from 'express';
import { 
  uploadCardPhoto, 
  getCardPhotos, 
  deleteCardPhoto, 
  updateCardPhoto 
} from '../controllers/cardPhotoController';

const router = express.Router();

// Upload a new card photo
router.post('/upload', uploadCardPhoto);

// Get photos for a collection card
router.get('/card/:collectionCardId', getCardPhotos);

// Delete a card photo
router.delete('/:photoId', deleteCardPhoto);

// Update a card photo's details
router.patch('/:photoId', updateCardPhoto);

export default router;