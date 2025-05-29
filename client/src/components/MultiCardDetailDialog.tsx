import React from 'react';
import { Card as PokemonCard } from '@/api/pokemonTCG';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import CardDetail from '@/components/CardDetail';

interface MultiCardDetailDialogProps {
  card: PokemonCard | null;
  isOpen: boolean;
  onClose: () => void;
}

const MultiCardDetailDialog: React.FC<MultiCardDetailDialogProps> = ({ 
  card, 
  isOpen, 
  onClose 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="p-0">
        {card && <CardDetail card={card} isOpen={isOpen} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  );
};

export default MultiCardDetailDialog;