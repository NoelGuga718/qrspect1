import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { FeaturesLanding } from '@/components/FeaturesLanding';
import { MainScanButton } from '@/components/scan/MainScanButton';
import { QRScanner } from '@/components/scan/QRScanner';
import { ScanResultDisplay } from '@/components/scan/ScanResult';
import { StatsCards } from '@/components/scan/StatsCards';
import { HistoryList } from '@/components/history/HistoryList';
import { SignUpModal } from '@/components/auth/SignUpModal';
import { SignInModal } from '@/components/auth/SignInModal';
import { useAuth } from '@/hooks/useAuth';
import { useScans } from '@/hooks/useScans';
import { useScanner } from '@/hooks/useScanner';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import './App.css';

function App() {
  const { user, signUp, signIn, signInWithGoogle, logout, useFirebase } = useAuth();
  const { stats, filteredScans, activeFilter, filterScans, addScan, refreshStats } = useScans(user?.uid);
  const { isScanning, result, scanUrl, clearResult } = useScanner();

  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [isDashboard, setIsDashboard] = useState(() => window.location.pathname === '/dashboard');

  useEffect(() => {
    const handlePopState = () => setIsDashboard(window.location.pathname === '/dashboard');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const showDashboard = () => {
    if (window.location.pathname !== '/dashboard') {
      window.history.pushState({}, '', '/dashboard');
    }
    setIsDashboard(true);
  };

  const showLanding = () => {
    if (window.location.pathname !== '/') {
      window.history.pushState({}, '', '/');
    }
    setIsDashboard(false);
  };

  const handleQRScan = async (url: string) => {
    setShowQRScanner(false);
    const result = await scanUrl(url, 'qr', user?.uid);
    if (result) {
      addScan(result);
      refreshStats();
      toast.success('QR Code scanned successfully');
    }
  };

  const handleLinkScan = async (url: string) => {
    const result = await scanUrl(url, 'link', user?.uid);
    if (result) {
      addScan(result);
      refreshStats();
      toast.success('Link scanned successfully');
    }
  };

  const handleSignUp = async (email: string, password: string, displayName: string) => {
    try {
      const newUser = await signUp(email, password, displayName);
      if (newUser) {
        toast.success(`Welcome, ${newUser.displayName || 'User'}!`);
        setShowSignUp(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign up');
      throw error;
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      const newUser = await signIn(email, password);
      if (newUser) {
        toast.success(`Welcome back, ${newUser.displayName || 'User'}!`);
        setShowSignIn(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to sign in');
      throw error;
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const newUser = await signInWithGoogle();
      if (newUser) {
        toast.success(`Welcome, ${newUser.displayName || 'User'}!`);
        setShowSignIn(false);
      }
    } catch (error) {
      toast.error('Failed to sign in with Google');
      throw error;
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Signed out successfully');
  };

  return (
    <div className="min-h-screen" style={{ background: '#0E0E0E' }}>
      {isDashboard ? (
        <>
          <Header
            user={user}
            onSignIn={() => setShowSignIn(true)}
            onSignUp={() => setShowSignUp(true)}
            onLogout={handleLogout}
            onHome={showLanding}
          />

          <main className="max-w-6xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            <div className="space-y-4 sm:space-y-8">
              <section className="glass-card-strong p-3 sm:p-6">
                <MainScanButton
                  onScanQR={() => setShowQRScanner(true)}
                  onScanLink={handleLinkScan}
                  isScanning={isScanning}
                />
              </section>

              <section>
                <StatsCards stats={stats} />
              </section>
            </div>

            <div className="space-y-4 sm:space-y-8">
              <section className="glass-card-strong p-3 sm:p-6">
                <HistoryList
                  scans={filteredScans}
                  activeFilter={activeFilter}
                  onFilterChange={filterScans}
                />
              </section>

              <section className="glass-card p-3 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4" style={{ color: '#FFFFFF' }}>About QRspect</h3>
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm" style={{ color: '#A0A0A0' }}>
                  <p>
                    QRspect uses built-in URL checks to help identify suspicious links:
                  </p>
                  <ul className="space-y-1 sm:space-y-2 ml-2 sm:ml-4">
                    <li className="flex items-center gap-1 sm:gap-2">
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full" style={{ background: '#ef4444' }} />
                      Phishing attacks
                    </li>
                    <li className="flex items-center gap-1 sm:gap-2">
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full" style={{ background: '#ef4444' }} />
                      Malware distribution sites
                    </li>
                    <li className="flex items-center gap-1 sm:gap-2">
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full" style={{ background: '#ef4444' }} />
                      Suspicious redirects
                    </li>
                    <li className="flex items-center gap-1 sm:gap-2">
                      <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full" style={{ background: '#ef4444' }} />
                      Typosquatting domains
                    </li>
                  </ul>
                  <p className="pt-1 sm:pt-2">
                    Built-in checks work without an API key; optional AI analysis can be configured locally.
                  </p>
                </div>
              </section>
            </div>
          </div>
          </main>
        </>
      ) : (
        <FeaturesLanding
          onSignIn={() => setShowSignIn(true)}
          onSignUp={() => setShowSignUp(true)}
          onGetStarted={showDashboard}
        />
      )}

      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}

      {result && (
        <ScanResultDisplay
          result={result}
          onClose={clearResult}
        />
      )}

      <SignUpModal
        isOpen={showSignUp}
        onClose={() => setShowSignUp(false)}
        onSignUp={handleSignUp}
      />

      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSignIn={handleSignIn}
        onGoogleSignIn={handleGoogleSignIn}
        useFirebase={useFirebase}
      />

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
          },
        }}
      />
    </div>
  );
}

export default App;
