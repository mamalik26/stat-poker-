import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Pages où le bouton retour ne doit pas apparaître
  const hiddenRoutes = ['/', '/login', '/register', '/pricing'];
  
  if (hiddenRoutes.includes(location.pathname)) {
    return null;
  }

  const handleBack = () => {
    // Vérifier s'il y a un historique de navigation
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback vers le dashboard si pas d'historique
      navigate('/dashboard');
    }
  };

  return (
    <Button
      onClick={handleBack}
      variant="ghost"
      className="absolute top-6 left-6 z-50 flex items-center gap-2 bg-muted/80 hover:bg-muted text-sm rounded-md px-4 py-2 shadow transition-all duration-300 hover:scale-105"
      aria-label="Retour à la page précédente"
    >
      <ArrowLeft className="h-4 w-4" />
      Retour
    </Button>
  );
};

export default BackButton;