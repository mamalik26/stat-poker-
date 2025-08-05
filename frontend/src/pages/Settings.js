import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { useToast } from '../hooks/use-toast';
import { 
  Settings as SettingsIcon, 
  Globe, 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  Database,
  Palette,
  Volume2
} from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [settings, setSettings] = useState({
    language: 'fr',
    theme: 'dark',
    notifications: true,
    soundEffects: true,
    autoSave: true,
    simulations: '100000',
    compactMode: false,
    analyticsOptIn: true
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Simuler la sauvegarde des paramètres
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Paramètres sauvegardés",
        description: "Vos préférences ont été mises à jour avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSettings({
      language: 'fr',
      theme: 'dark',
      notifications: true,
      soundEffects: true,
      autoSave: true,
      simulations: '100000',
      compactMode: false,
      analyticsOptIn: true
    });
    
    toast({
      title: "Paramètres réinitialisés",
      description: "Les paramètres par défaut ont été restaurés.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <SettingsIcon className="h-8 w-8 text-emerald-500" />
            <h1 className="text-3xl font-bold">Paramètres</h1>
          </div>
          <p className="text-muted-foreground">
            Personnalisez votre expérience d'utilisation du calculateur de poker
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Paramètres d'affichage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Interface et affichage</span>
              </CardTitle>
              <CardDescription>
                Personnalisez l'apparence de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Langue</Label>
                  <p className="text-sm text-muted-foreground">
                    Choisir la langue de l'interface
                  </p>
                </div>
                <Select
                  value={settings.language}
                  onValueChange={(value) => handleSettingChange('language', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">🇫🇷 Français</SelectItem>
                    <SelectItem value="en">🇺🇸 English</SelectItem>
                    <SelectItem value="es">🇪🇸 Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Thème</Label>
                  <p className="text-sm text-muted-foreground">
                    Mode sombre ou clair
                  </p>
                </div>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => handleSettingChange('theme', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">
                      <div className="flex items-center space-x-2">
                        <Moon className="h-4 w-4" />
                        <span>Sombre</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="light">
                      <div className="flex items-center space-x-2">
                        <Sun className="h-4 w-4" />
                        <span>Clair</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Mode compact</Label>
                  <p className="text-sm text-muted-foreground">
                    Interface plus dense
                  </p>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Paramètres des notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notifications et sons</span>
              </CardTitle>
              <CardDescription>
                Gérez les alertes et les effets sonores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Recevoir des alertes en temps réel
                  </p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Effets sonores</Label>
                  <p className="text-sm text-muted-foreground">
                    Sons lors des actions
                  </p>
                </div>
                <Switch
                  checked={settings.soundEffects}
                  onCheckedChange={(checked) => handleSettingChange('soundEffects', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Sauvegarde automatique</Label>
                  <p className="text-sm text-muted-foreground">
                    Enregistrer automatiquement les mains analysées
                  </p>
                </div>
                <Switch
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Paramètres du calculateur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Calculateur de probabilités</span>
              </CardTitle>
              <CardDescription>
                Configuration des simulations Monte Carlo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Nombre de simulations</Label>
                  <p className="text-sm text-muted-foreground">
                    Plus élevé = plus précis mais plus lent
                  </p>
                </div>
                <Select
                  value={settings.simulations}
                  onValueChange={(value) => handleSettingChange('simulations', value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10000">10K</SelectItem>
                    <SelectItem value="50000">50K</SelectItem>
                    <SelectItem value="100000">100K</SelectItem>
                    <SelectItem value="500000">500K</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-medium">Paramètres avancés</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Les paramètres avancés de précision et d'algorithme sont disponibles 
                  avec un abonnement Pro actif.
                </p>
                {user?.subscription_status !== 'active' && user?.role !== 'moderator' && (
                  <Badge variant="outline" className="mt-2 text-xs">
                    Pro requis
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Paramètres de confidentialité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Confidentialité et données</span>
              </CardTitle>
              <CardDescription>
                Contrôlez vos données et votre vie privée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Analytiques</Label>
                  <p className="text-sm text-muted-foreground">
                    Partager des données d'utilisation anonymes
                  </p>
                </div>
                <Switch
                  checked={settings.analyticsOptIn}
                  onCheckedChange={(checked) => handleSettingChange('analyticsOptIn', checked)}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Actions sur les données</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start text-sm">
                    <Database className="mr-2 h-4 w-4" />
                    Exporter mes données
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-sm text-red-600 hover:text-red-700">
                    <Shield className="mr-2 h-4 w-4" />
                    Supprimer mon compte
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <Button variant="outline" onClick={handleReset}>
            Réinitialiser
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? "Sauvegarde..." : "Sauvegarder les paramètres"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;