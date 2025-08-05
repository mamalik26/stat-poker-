import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Drawer, DrawerContent, DrawerTrigger } from './ui/drawer';
import {
  Home,
  User,
  BarChart3,
  Calculator,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  Crown
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    {
      icon: <Home className="h-5 w-5" />,
      label: "Accueil",
      href: "/",
      description: "Revenir à la page d'accueil"
    },
    {
      icon: <User className="h-5 w-5" />,
      label: "Mon compte",
      href: "/account",
      description: "Modifier ses informations personnelles"
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Tableau de bord",
      href: "/dashboard",
      description: "Voir statut, profil, résumé des actions"
    },
    {
      icon: <Calculator className="h-5 w-5" />,
      label: "Calculateur",
      href: "/calculator",
      description: "Accéder au moteur d'analyse de main"
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: "Abonnement",
      href: "/pricing",
      description: "Choisir ou modifier son offre"
    },
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Paramètres",
      href: "/settings",
      description: "Gérer préférences ou langues"
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/login');
    }
  };

  const handleLinkClick = (href) => {
    setMobileOpen(false);
    // La navigation sera gérée par React Router Link
  };

  const isActive = (href) => {
    return location.pathname === href;
  };

  const getInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(word => word[0]).join('').toUpperCase();
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  const getSubscriptionStatus = () => {
    if (user?.role === 'moderator' || user?.role === 'admin') {
      return { status: 'moderator', label: 'Modérateur', color: 'bg-purple-600' };
    }
    if (user?.subscription_status === 'active') {
      return { status: 'active', label: 'Abonnement actif', color: 'bg-green-600' };
    }
    return { status: 'inactive', label: 'Non abonné', color: 'bg-red-600' };
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0F3D2E] text-white">
      {/* Header avec avatar utilisateur */}
      <div className="p-6 border-b border-emerald-800/30">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="bg-emerald-600 text-white">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {user?.name || 'Utilisateur'}
            </p>
            <p className="text-xs text-emerald-300 truncate">
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => handleLinkClick(item.href)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-300 group ${
                active
                  ? 'bg-emerald-600/30 text-emerald-300 shadow-lg'
                  : 'text-gray-300 hover:bg-emerald-800/20 hover:text-white'
              }`}
            >
              <span className={`${active ? 'text-emerald-300' : 'text-gray-400 group-hover:text-emerald-400'} transition-colors`}>
                {item.icon}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{item.label}</span>
                {active && (
                  <p className="text-xs text-emerald-400 mt-0.5">
                    {item.description}
                  </p>
                )}
              </div>
            </Link>
          );
        })}

        <Separator className="my-4 bg-emerald-800/30" />

        {/* Bouton déconnexion */}
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="w-full justify-start space-x-3 px-3 py-2.5 text-gray-300 hover:bg-red-600/20 hover:text-red-300 transition-all duration-300"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Déconnexion</span>
        </Button>
      </nav>

      {/* Footer avec statut d'abonnement */}
      <div className="p-4 border-t border-emerald-800/30">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-300">Statut</span>
            <Badge className={`${getSubscriptionStatus().color} text-white text-xs px-2 py-1`}>
              {getSubscriptionStatus().status === 'moderator' && <Crown className="h-3 w-3 mr-1" />}
              {getSubscriptionStatus().label}
            </Badge>
          </div>
          <Link
            to="/pricing"
            onClick={() => handleLinkClick('/pricing')}
            className="block w-full text-center px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs rounded-md transition-all duration-300"
          >
            Gérer l'abonnement
          </Link>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0 lg:fixed lg:inset-y-0 lg:left-0 lg:z-40">
        <div className="w-64 h-full">
          <SidebarContent />
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="lg:hidden">
        <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
          <DrawerTrigger asChild>
            <Button
              variant="ghost"
              className="fixed top-4 left-4 z-50 p-2 bg-muted/80 hover:bg-muted"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Ouvrir le menu</span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="h-full">
            <SidebarContent />
          </DrawerContent>
        </Drawer>
      </div>
    </>
  );
};

export default Sidebar;