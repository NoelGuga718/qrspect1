import { User, LogOut, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User as UserType } from '@/types';

interface HeaderProps {
  user: UserType | null;
  onSignIn: () => void;
  onSignUp: () => void;
  onLogout: () => void;
  onHome: () => void;
}

export function Header({ user, onSignIn, onSignUp, onLogout, onHome }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl border-b" style={{ background: 'rgba(18, 18, 18, 0.9)', borderColor: 'rgba(255, 255, 255, 0.08)' }}>
      <div className="max-w-6xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center sm:justify-between h-auto sm:h-16 py-2 sm:py-0">
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button type="button" onClick={onHome} className="flex items-center gap-2 sm:gap-3 text-left" aria-label="Go to QRspect home">
              <div className="p-2 rounded-xl" style={{ background: 'rgba(237, 237, 237, 0.1)' }}>
                <img src="/logo.png" alt="" className="h-6 w-6 object-contain" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold" style={{ color: '#EDEDED' }}>QRspect</h1>
                <p className="text-xs hidden sm:block" style={{ color: '#A0A0A0' }}>QR Code Security Scanner</p>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-0 w-full sm:w-auto justify-end">
            {user && !user.isAnonymous ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full" style={{ background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <UserCircle className="h-5 w-5" style={{ color: '#A0A0A0' }} />
                  )}
                  <span className="text-sm hidden sm:inline" style={{ color: '#FFFFFF' }}>
                    {user.displayName || 'User'}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onLogout}
                  className="rounded-xl"
                  style={{ color: '#A0A0A0' }}
                  title="Sign Out"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full" style={{ background: 'rgba(26, 26, 26, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <UserCircle className="h-5 w-5" style={{ color: '#A0A0A0' }} />
                  <span className="text-sm hidden sm:inline" style={{ color: '#A0A0A0' }}>Guest</span>
                </div>
                <Button
                  variant="ghost"
                  onClick={onSignIn}
                  className="rounded-xl text-sm"
                  style={{ color: '#A0A0A0' }}
                >
                  Sign In
                </Button>
                <Button
                  onClick={onSignUp}
                  className="glow-button text-sm rounded-xl"
                >
                  <User className="h-4 w-4 mr-2" />
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
