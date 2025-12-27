import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Smartphone, Monitor, CheckCircle, Vote } from 'lucide-react';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect device
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    setIsAndroid(/android/.test(userAgent));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  const features = [
    'Quick access from your home screen',
    'Works offline with cached content',
    'Fast loading and smooth performance',
    'Push notifications for updates',
    'No app store download required',
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-24">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center">
              <Vote className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Install VotePass
          </h1>
          <p className="text-lg text-muted-foreground">
            Get quick access to voting contests and events right from your home screen
          </p>
        </div>

        {isInstalled ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Already Installed!</h2>
              <p className="text-muted-foreground">
                VotePass is already installed on your device. Look for it on your home screen.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Install on Mobile
                </CardTitle>
                <CardDescription>
                  Add VotePass to your phone's home screen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {deferredPrompt ? (
                  <Button onClick={handleInstall} className="w-full" size="lg">
                    <Download className="mr-2 h-5 w-5" />
                    Install Now
                  </Button>
                ) : isIOS ? (
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">On iPhone/iPad:</p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Tap the Share button in Safari</li>
                      <li>Scroll down and tap "Add to Home Screen"</li>
                      <li>Tap "Add" to confirm</li>
                    </ol>
                  </div>
                ) : isAndroid ? (
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">On Android:</p>
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Tap the menu (3 dots) in Chrome</li>
                      <li>Tap "Add to Home Screen"</li>
                      <li>Tap "Add" to confirm</li>
                    </ol>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Open this page on your mobile device to install the app.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Why Install?
                </CardTitle>
                <CardDescription>
                  Benefits of installing VotePass
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Install;
