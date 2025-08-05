import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { useToast } from '../hooks/use-toast';
import { AuthAPI } from '../services/authAPI';
import { User, Mail, Crown, Calendar, Shield } from 'lucide-react';

const Account = () => {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simuler une mise à jour du profil
      // Dans une vraie app, on ferait un appel API ici
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mettre à jour les données utilisateur localement
      const updatedUser = { ...user, ...formData };
      setUser(updatedUser);
      
      toast({
        title: "Profil mis à jour",
        description: "Vos informations ont été sauvegardées avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    if (user?.name) {
      return user.name.split(' ').map(word => word[0]).join('').toUpperCase();
    }
    return user?.email?.slice(0, 2).toUpperCase() || 'U';
  };

  const getSubscriptionStatus = () => {
    if (user?.role === 'moderator' || user?.role === 'admin') {
      return { status: 'moderator', label: 'Modérateur', color: 'bg-purple-600', icon: <Crown className="h-4 w-4" /> };
    }
    if (user?.subscription_status === 'active') {
      return { status: 'active', label: 'Abonnement actif', color: 'bg-green-600', icon: <Shield className="h-4 w-4" /> };
    }
    return { status: 'inactive', label: 'Non abonné', color: 'bg-red-600', icon: <User className="h-4 w-4" /> };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non disponible';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Mon Compte</h1>
          <p className="text-muted-foreground">
            Gérez vos informations personnelles et préférences de compte
          </p>
        </div>

        {/* Profil utilisateur */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-emerald-600 text-white text-xl">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-semibold">{user?.name || 'Utilisateur'}</h2>
                  <Badge className={`${getSubscriptionStatus().color} text-white`}>
                    {getSubscriptionStatus().icon}
                    <span className="ml-1">{getSubscriptionStatus().label}</span>
                  </Badge>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Membre depuis le {formatDate(user?.created_at)}</span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulaire de modification */}
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
              <CardDescription>
                Modifiez vos informations de profil
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Votre nom complet"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="votre@email.com"
                  />
                </div>

                <Separator />

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  {isLoading ? "Mise à jour..." : "Sauvegarder les modifications"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Informations du compte */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du compte</CardTitle>
              <CardDescription>
                Détails de votre compte et abonnement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Type de compte</span>
                  <Badge variant="outline">{user?.role || 'user'}</Badge>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Statut d'abonnement</span>
                  <Badge className={`${getSubscriptionStatus().color} text-white`}>
                    {getSubscriptionStatus().label}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Date d'inscription</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(user?.created_at)}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">ID utilisateur</span>
                  <span className="text-sm text-muted-foreground font-mono">
                    {user?.id?.slice(0, 8)}...
                  </span>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">Actions rapides</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="mr-2 h-4 w-4" />
                    Changer le mot de passe
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="mr-2 h-4 w-4" />
                    Paramètres de sécurité
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Account;