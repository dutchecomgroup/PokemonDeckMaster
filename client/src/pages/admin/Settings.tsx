import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AppSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  language: string;
  theme: string;
  primaryColor: string;
  accentColor: string;
  headerBanner: string;
  welcomeText: string;
  footerText: string;
  registrationEnabled: boolean;
  defaultCollectionName: string;
  apiEnabled: boolean;
  apiRateLimit: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

const SettingsPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>({
    siteName: 'TCG DeckMaster',
    siteDescription: 'Pokémon Trading Card Game Collection Manager',
    contactEmail: 'admin@tcgdeckmaster.com',
    language: 'nl',
    theme: 'light',
    primaryColor: '#6D28D9',
    accentColor: '#A855F7',
    headerBanner: 'Welkom bij TCG DeckMaster - Uw Pokémon kaartcollectie beheerder',
    welcomeText: 'Welkom bij TCG DeckMaster, uw ultieme Pokémon kaartencollectie beheerder. Organiseer uw collecties, zoek zeldzame kaarten, en deel uw collectie met vrienden!',
    footerText: '© 2025 TCG DeckMaster - Alle rechten voorbehouden',
    registrationEnabled: true,
    defaultCollectionName: 'Mijn Collectie',
    apiEnabled: true,
    apiRateLimit: 100,
    maintenanceMode: false,
    maintenanceMessage: 'De website is tijdelijk offline voor onderhoud. Probeer het later opnieuw.',
  });
  
  const { isLoading } = useQuery({
    queryKey: ['/api/admin/settings'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (!res.ok) throw new Error('Failed to fetch settings');
        const data = await res.json();
        
        // Zet de instellingen om naar het juiste formaat
        const formattedSettings = {
          siteName: data.general?.siteName || settings.siteName,
          siteDescription: data.general?.siteDescription || settings.siteDescription,
          contactEmail: data.general?.contactEmail || settings.contactEmail,
          language: data.general?.language || settings.language,
          theme: data.general?.theme || settings.theme,
          primaryColor: data.appearance?.primaryColor || settings.primaryColor,
          accentColor: data.appearance?.accentColor || settings.accentColor,
          headerBanner: data.appearance?.headerBanner || settings.headerBanner,
          welcomeText: data.appearance?.welcomeText || settings.welcomeText,
          footerText: data.appearance?.footerText || settings.footerText,
          registrationEnabled: data.users?.registrationEnabled ?? settings.registrationEnabled,
          defaultCollectionName: data.users?.defaultCollectionName || settings.defaultCollectionName,
          apiEnabled: data.system?.apiEnabled ?? settings.apiEnabled,
          apiRateLimit: data.system?.apiRateLimit || settings.apiRateLimit,
          maintenanceMode: data.system?.maintenanceMode ?? settings.maintenanceMode,
          maintenanceMessage: data.system?.maintenanceMessage || settings.maintenanceMessage,
        };
        
        setSettings(formattedSettings);
        return formattedSettings;
      } catch (error) {
        console.error('Error fetching settings:', error);
        return settings;
      }
    },
  });

  const handleSaveSettings = async () => {
    setIsSubmitting(true);
    
    try {
      // Zet de instellingen om naar het juiste formaat voor de API
      const apiSettings = {
        general: {
          siteName: settings.siteName,
          siteDescription: settings.siteDescription,
          contactEmail: settings.contactEmail,
          language: settings.language,
          theme: settings.theme,
        },
        appearance: {
          primaryColor: settings.primaryColor,
          accentColor: settings.accentColor,
          headerBanner: settings.headerBanner,
          welcomeText: settings.welcomeText,
          footerText: settings.footerText,
        },
        users: {
          registrationEnabled: settings.registrationEnabled,
          defaultCollectionName: settings.defaultCollectionName,
        },
        system: {
          apiEnabled: settings.apiEnabled,
          apiRateLimit: settings.apiRateLimit,
          maintenanceMode: settings.maintenanceMode,
          maintenanceMessage: settings.maintenanceMessage,
        }
      };
      
      // Stuur de instellingen naar de server
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiSettings),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Er is een fout opgetreden bij het opslaan');
      }
      
      // Verversen van de cache zodat de nieuwe instellingen worden weergegeven
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      
      toast({
        title: 'Instellingen opgeslagen',
        description: 'De instellingen zijn succesvol bijgewerkt.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Fout bij opslaan',
        description: error instanceof Error ? error.message : 'Er is een fout opgetreden bij het opslaan van de instellingen.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (key: keyof AppSettings, value: string | boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetSettings = async (category: string) => {
    const defaultSettings: Record<string, Partial<AppSettings>> = {
      general: {
        siteName: 'TCG DeckMaster',
        siteDescription: 'Pokémon Trading Card Game Collection Manager',
        contactEmail: 'admin@tcgdeckmaster.com',
        language: 'nl',
        theme: 'light',
      },
      appearance: {
        primaryColor: '#6D28D9',
        accentColor: '#A855F7',
        headerBanner: 'Welkom bij TCG DeckMaster - Uw Pokémon kaartcollectie beheerder',
        welcomeText: 'Welkom bij TCG DeckMaster, uw ultieme Pokémon kaartencollectie beheerder. Organiseer uw collecties, zoek zeldzame kaarten, en deel uw collectie met vrienden!',
        footerText: '© 2025 TCG DeckMaster - Alle rechten voorbehouden',
      },
      users: {
        registrationEnabled: true,
        defaultCollectionName: 'Mijn Collectie',
      },
      system: {
        apiEnabled: true,
        apiRateLimit: 100,
        maintenanceMode: false,
        maintenanceMessage: 'De website is tijdelijk offline voor onderhoud. Probeer het later opnieuw.',
      }
    };
    
    const defaults = defaultSettings[category] || {};

    // Update lokale state
    setSettings(prev => ({
      ...prev,
      ...defaults
    }));

    // Ook opslaan naar de server
    setIsSubmitting(true);
    
    try {
      // Bereid API request voor
      const apiSettings: Record<string, any> = {};
      apiSettings[category] = defaults;
      
      // Stuur de gereset instellingen naar de server
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiSettings),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Er is een fout opgetreden bij het resetten');
      }
      
      // Verversen van de cache
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings'] });
      
      toast({
        title: 'Instellingen gereset',
        description: `De ${category} instellingen zijn teruggezet naar de standaardwaarden.`,
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast({
        title: 'Fout bij resetten',
        description: error instanceof Error ? error.message : 'Er is een fout opgetreden bij het resetten van de instellingen.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Instellingen">
      <Tabs 
        defaultValue="general" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Algemeen</TabsTrigger>
          <TabsTrigger value="appearance">Weergave</TabsTrigger>
          <TabsTrigger value="users">Gebruikers</TabsTrigger>
          <TabsTrigger value="system">Systeem</TabsTrigger>
        </TabsList>
        
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>Algemene instellingen</CardTitle>
                  <CardDescription>
                    Basisinstellingen voor de applicatie
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="siteName" className="text-sm font-medium">Websitenaam</label>
                      <Input
                        id="siteName"
                        value={settings.siteName}
                        onChange={(e) => handleInputChange('siteName', e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        De naam van de website zoals weergegeven in de header en titel
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="contactEmail" className="text-sm font-medium">Contact e-mail</label>
                      <Input
                        id="contactEmail"
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        E-mailadres voor systeemmeldingen en gebruikerscontact
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="siteDescription" className="text-sm font-medium">Website beschrijving</label>
                    <Textarea
                      id="siteDescription"
                      value={settings.siteDescription}
                      onChange={(e) => handleInputChange('siteDescription', e.target.value)}
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">
                      Korte beschrijving van de website, gebruikt in zoekmachines en meta-tags
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="language" className="text-sm font-medium">Taal</label>
                      <Select
                        value={settings.language}
                        onValueChange={(value) => handleInputChange('language', value)}
                      >
                        <SelectTrigger id="language">
                          <SelectValue placeholder="Selecteer een taal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nl">Nederlands</SelectItem>
                          <SelectItem value="en">Engels</SelectItem>
                          <SelectItem value="de">Duits</SelectItem>
                          <SelectItem value="fr">Frans</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Standaardtaal voor de gebruikersinterface
                      </p>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="theme" className="text-sm font-medium">Thema</label>
                      <Select
                        value={settings.theme}
                        onValueChange={(value) => handleInputChange('theme', value)}
                      >
                        <SelectTrigger id="theme">
                          <SelectValue placeholder="Selecteer een thema" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="light">Licht</SelectItem>
                          <SelectItem value="dark">Donker</SelectItem>
                          <SelectItem value="system">Systeemvoorkeur</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Standaardthema voor de gebruikersinterface
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => handleResetSettings('general')}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resetten
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Bezig met opslaan...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Opslaan
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Weergave-instellingen</CardTitle>
                  <CardDescription>
                    Pas de visuele stijl en teksten van de website aan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Kleuren</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="primaryColor" className="text-sm font-medium">Primaire kleur</label>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full border" 
                            style={{ backgroundColor: settings.primaryColor }}
                          />
                          <Input
                            id="primaryColor"
                            type="text"
                            value={settings.primaryColor}
                            onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Primaire kleur voor knoppen, headers en belangrijke elementen
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="accentColor" className="text-sm font-medium">Accentkleur</label>
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full border" 
                            style={{ backgroundColor: settings.accentColor }}
                          />
                          <Input
                            id="accentColor"
                            type="text"
                            value={settings.accentColor}
                            onChange={(e) => handleInputChange('accentColor', e.target.value)}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Secundaire kleur voor highlights, links en call-to-actions
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Website Teksten</h3>
                    <div className="space-y-2">
                      <label htmlFor="headerBanner" className="text-sm font-medium">Header Banner Tekst</label>
                      <Input
                        id="headerBanner"
                        value={settings.headerBanner}
                        onChange={(e) => handleInputChange('headerBanner', e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Tekst die wordt weergegeven in de banner bovenaan de website
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="welcomeText" className="text-sm font-medium">Welkomtekst</label>
                      <Textarea
                        id="welcomeText"
                        value={settings.welcomeText}
                        onChange={(e) => handleInputChange('welcomeText', e.target.value)}
                        rows={4}
                      />
                      <p className="text-sm text-muted-foreground">
                        Welkomstbericht op de homepage voor nieuwe en terugkerende gebruikers
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="footerText" className="text-sm font-medium">Footer Tekst</label>
                      <Input
                        id="footerText"
                        value={settings.footerText}
                        onChange={(e) => handleInputChange('footerText', e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Tekst die wordt weergegeven in de footer van de website
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => handleResetSettings('appearance')}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resetten
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Bezig met opslaan...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Opslaan
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Gebruikersinstellingen</CardTitle>
                  <CardDescription>
                    Instellingen voor gebruikersaccounts en registratie
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <h4 className="text-base font-medium">
                        Registratie inschakelen
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Sta nieuwe gebruikers toe om zich te registreren
                      </p>
                    </div>
                    <Switch
                      checked={settings.registrationEnabled}
                      onCheckedChange={(value) => handleInputChange('registrationEnabled', value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="defaultCollectionName" className="text-sm font-medium">Standaard collectienaam</label>
                    <Input
                      id="defaultCollectionName"
                      value={settings.defaultCollectionName}
                      onChange={(e) => handleInputChange('defaultCollectionName', e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Naam van de standaardcollectie die wordt aangemaakt voor nieuwe gebruikers
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => handleResetSettings('users')}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resetten
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Bezig met opslaan...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Opslaan
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="system">
              <Card>
                <CardHeader>
                  <CardTitle>Systeeminstellingen</CardTitle>
                  <CardDescription>
                    Geavanceerde instellingen voor systeembeheer
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <h4 className="text-base font-medium">
                        API inschakelen
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Schakel de REST API in voor externe toegang
                      </p>
                    </div>
                    <Switch
                      checked={settings.apiEnabled}
                      onCheckedChange={(value) => handleInputChange('apiEnabled', value)}
                    />
                  </div>
                  
                  {settings.apiEnabled && (
                    <div className="space-y-2">
                      <label htmlFor="apiRateLimit" className="text-sm font-medium">API-snelheidslimiet (verzoeken per minuut)</label>
                      <Input
                        id="apiRateLimit"
                        type="number"
                        min="1"
                        max="1000"
                        value={settings.apiRateLimit}
                        onChange={(e) => handleInputChange('apiRateLimit', parseInt(e.target.value) || 1)}
                      />
                      <p className="text-sm text-muted-foreground">
                        Maximum aantal API-verzoeken per minuut per gebruiker
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <h4 className="text-base font-medium">
                        Onderhoudsmodus
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Zet de website in onderhoudsmodus (alleen toegankelijk voor admins)
                      </p>
                    </div>
                    <Switch
                      checked={settings.maintenanceMode}
                      onCheckedChange={(value) => handleInputChange('maintenanceMode', value)}
                    />
                  </div>
                  
                  {settings.maintenanceMode && (
                    <div className="space-y-2">
                      <label htmlFor="maintenanceMessage" className="text-sm font-medium">Onderhoudsbericht</label>
                      <Textarea
                        id="maintenanceMessage"
                        value={settings.maintenanceMessage}
                        onChange={(e) => handleInputChange('maintenanceMessage', e.target.value)}
                        rows={3}
                      />
                      <p className="text-sm text-muted-foreground">
                        Bericht dat wordt weergegeven aan gebruikers tijdens de onderhoudsmodus
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={() => handleResetSettings('system')}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resetten
                  </Button>
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Bezig met opslaan...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Opslaan
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </AdminLayout>
  );
};

export default SettingsPage;