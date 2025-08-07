import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useTranslation } from '../hooks/useTranslation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Switch } from '../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import AuthDebugFixed from '../components/AuthDebugFixed';
import {
  Settings as SettingsIcon,
  Palette,
  Globe,
  Bell,
  Volume2,
  Save,
  Monitor,
  Sun,
  Moon,
  Zap,
  Shield,
  RotateCcw,
  Crown,
  Calculator,
  Eye,
  MousePointer,
  HelpCircle,
  Activity,
  Database,
  Cookie
} from 'lucide-react';

const Settings = () => {
  const { user } = useAuth();
  const { 
    settings, 
    updateSetting, 
    updateSettings, 
    resetSettings, 
    isLoading,
    playNotificationSound,
    showNotification,
    isPremiumFeature
  } = useSettings();
  const { t, getAvailableLanguages, changeLanguage } = useTranslation();
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);

  // Gérer le changement de paramètres avec feedback
  const handleSettingChange = (key, value) => {
    updateSetting(key, value);
    
    // Feedback sonore si activé
    if (settings.soundEffects) {
      playNotificationSound('settings_change');
    }
    
    // Notifications spéciales pour certains changements
    if (key === 'theme') {
      toast({
        title: t('notifications.theme_changed'),
        description: t(`settings.appearance.theme_${value}`)
      });
    } else if (key === 'language') {
      changeLanguage(value);
      toast({
        title: t('notifications.language_changed'),
        description: getAvailableLanguages().find(lang => lang.code === value)?.name
      });
    }
  };

  // Gérer la réinitialisation
  const handleReset = async () => {
    setIsResetting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulation
      resetSettings();
      
      toast({
        title: t('notifications.settings_reset'),
        description: t('settings.reset_section.reset_warning')
      });
      
      showNotification(
        t('notifications.settings_reset'),
        t('settings.reset_section.reset_warning')
      );
    } catch (error) {
      toast({
        title: t('notifications.error_occurred'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Vérifier les permissions premium
  const isUserPremium = () => {
    return user?.role === 'moderator' || 
           user?.role === 'admin' || 
           user?.subscription_status === 'active';
  };

  // Composant pour les paramètres verrouillés
  const PremiumFeatureWrapper = ({ feature, children }) => {
    const isLocked = isPremiumFeature(feature);
    
    if (isLocked) {
      return (
        <div className="relative">
          <div className="opacity-50 pointer-events-none">
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-lg">
            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              <Crown className="w-4 h-4 mr-1" />
              {t('settings.premium.feature_locked')}
            </Badge>
          </div>
        </div>
      );
    }
    
    return children;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <SettingsIcon className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3">
            <SettingsIcon className="w-8 h-8 text-emerald-600" />
            <h1 className="text-3xl font-bold">{t('settings.title')}</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('settings.subtitle')}
          </p>
        </div>

        {/* Debug Panel - Temporary */}
        <AuthDebug />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Apparence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                {t('settings.appearance.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Thème */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  {t('settings.appearance.theme')}
                </Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value) => handleSettingChange('theme', value)}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      {settings.theme === 'light' && <Sun className="w-4 h-4" />}
                      {settings.theme === 'dark' && <Moon className="w-4 h-4" />}
                      {settings.theme === 'auto' && <Monitor className="w-4 h-4" />}
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        {t('settings.appearance.theme_light')}
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        {t('settings.appearance.theme_dark')}
                      </div>
                    </SelectItem>
                    <SelectItem value="auto">
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        {t('settings.appearance.theme_auto')}
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Langue */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  {t('settings.appearance.language')}
                </Label>
                <Select
                  value={settings.language}
                  onValueChange={(value) => handleSettingChange('language', value)}
                >
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableLanguages().map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.nativeName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Mode compact */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    {t('settings.appearance.compact_mode')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Interface plus dense avec moins d'espacement
                  </p>
                </div>
                <Switch
                  checked={settings.compactMode}
                  onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
                />
              </div>

              {/* Animations */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    {t('settings.appearance.animations')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Activer les animations et transitions
                  </p>
                </div>
                <Switch
                  checked={settings.animationsEnabled}
                  onCheckedChange={(checked) => handleSettingChange('animationsEnabled', checked)}
                />
              </div>

            </CardContent>
          </Card>

          {/* Interface */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointer className="w-5 h-5" />
                {t('settings.interface.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Notifications */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    {t('settings.interface.notifications')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Recevoir des notifications système
                  </p>
                </div>
                <Switch
                  checked={settings.notifications}
                  onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                />
              </div>

              {/* Effets sonores */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Volume2 className="w-4 h-4" />
                    {t('settings.interface.sound_effects')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Sons de confirmation et alertes
                  </p>
                </div>
                <Switch
                  checked={settings.soundEffects}
                  onCheckedChange={(checked) => handleSettingChange('soundEffects', checked)}
                />
              </div>

              {/* Sauvegarde automatique */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {t('settings.interface.auto_save')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Sauvegarder automatiquement vos données
                  </p>
                </div>
                <Switch
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
                />
              </div>

              {/* Info-bulles */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    {t('settings.interface.tooltips')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Afficher les conseils d'utilisation
                  </p>
                </div>
                <Switch
                  checked={settings.tooltipsEnabled}
                  onCheckedChange={(checked) => handleSettingChange('tooltipsEnabled', checked)}
                />
              </div>

              {/* Mode avancé (Premium) */}
              <PremiumFeatureWrapper feature="advancedMode">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      {t('settings.interface.advanced_mode')}
                      <Badge variant="secondary" className="text-xs">Premium</Badge>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Fonctionnalités avancées pour experts
                    </p>
                  </div>
                  <Switch
                    checked={settings.advancedMode}
                    onCheckedChange={(checked) => handleSettingChange('advancedMode', checked)}
                  />
                </div>
              </PremiumFeatureWrapper>

            </CardContent>
          </Card>

          {/* Calculateur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                {t('settings.calculator.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Simulations Monte Carlo */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">
                    {t('settings.calculator.simulations')}
                  </Label>
                  <Badge variant="outline" className="text-xs">
                    {settings.simulations.toLocaleString()}
                  </Badge>
                </div>
                <Slider
                  value={[settings.simulations]}
                  onValueChange={([value]) => handleSettingChange('simulations', value)}
                  min={1000}
                  max={1000000}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1,000</span>
                  <span>1,000,000</span>
                </div>
              </div>

              {/* Calcul automatique */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">
                    {t('settings.calculator.auto_calculate')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Recalculer automatiquement lors des changements
                  </p>
                </div>
                <Switch
                  checked={settings.autoCalculate}
                  onCheckedChange={(checked) => handleSettingChange('autoCalculate', checked)}
                />
              </div>

              {/* Détails des probabilités */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    {t('settings.calculator.probability_details')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Afficher les calculs détaillés
                  </p>
                </div>
                <Switch
                  checked={settings.showProbabilityDetails}
                  onCheckedChange={(checked) => handleSettingChange('showProbabilityDetails', checked)}
                />
              </div>

            </CardContent>
          </Card>

          {/* Confidentialité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                {t('settings.privacy.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Analytics (Premium) */}
              <PremiumFeatureWrapper feature="analyticsOptIn">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      {t('settings.privacy.analytics')}
                      <Badge variant="secondary" className="text-xs">Premium</Badge>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Aider à améliorer l'application
                    </p>
                  </div>
                  <Switch
                    checked={settings.analyticsOptIn}
                    onCheckedChange={(checked) => handleSettingChange('analyticsOptIn', checked)}
                  />
                </div>
              </PremiumFeatureWrapper>

              {/* Partage de données (Premium) */}
              <PremiumFeatureWrapper feature="dataSharing">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      {t('settings.privacy.data_sharing')}
                      <Badge variant="secondary" className="text-xs">Premium</Badge>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Partager des données anonymisées
                    </p>
                  </div>
                  <Switch
                    checked={settings.dataSharing}
                    onCheckedChange={(checked) => handleSettingChange('dataSharing', checked)}
                  />
                </div>
              </PremiumFeatureWrapper>

              {/* Cookies */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Cookie className="w-4 h-4" />
                  {t('settings.privacy.cookies')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  Les cookies fonctionnels sont requis pour le bon fonctionnement de l'application.
                </p>
                <Badge variant="outline" className="text-xs">
                  Toujours actif
                </Badge>
              </div>

            </CardContent>
          </Card>

        </div>

        {/* Section de réinitialisation */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <RotateCcw className="w-5 h-5" />
              {t('settings.reset_section.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.reset_section.reset_warning')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  disabled={isResetting}
                  className="w-full sm:w-auto"
                >
                  {isResetting ? (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                      Réinitialisation...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      {t('settings.reset_section.reset_all')}
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('settings.reset_section.confirm_reset')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('settings.reset_section.reset_warning')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleReset}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {t('common.reset')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Settings;