import React from 'react';
import { Link } from 'wouter';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-card text-muted-foreground py-4 border-t border-border mt-auto">
      <div className="container mx-auto px-4 text-center text-sm">
        <p>
          &copy; {currentYear} TCG DeckMaster. Data via <a href="https://pokemontcg.io" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/90">pokemontcg.io</a>.
          <span className="mx-2">•</span>
          <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">Admin</Link>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
