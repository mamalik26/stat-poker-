import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import BackButton from './BackButton';

const AppLayout = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar pour utilisateurs connectés */}
      {user && <Sidebar />}
      
      {/* Bouton retour */}
      <BackButton />

      {/* Contenu principal */}
      <div className={`min-h-screen ${user ? 'lg:ml-64' : ''}`}>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;