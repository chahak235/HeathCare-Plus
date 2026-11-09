import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Logo } from '../shared/Logo';
import { Button } from '../ui/Button';
import { 
  Menu, 
  X, 
  MessageSquare, 
  Home, 
  Users,
  Settings,
  UserCircle,
  Moon,
  Sun,
  AlertTriangle,
  Map,
  Info
} from 'lucide-react';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext'; // Add this import
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/shared/LanguageSwitcher';


const navigationItems = [
  { nameKey: 'home', href: '/', icon: Home },
  { nameKey: 'features', href: '/features', icon: Settings },
  { nameKey: 'doctors', href: '/doctors', icon: Users },
  { nameKey: 'mapPrediction', href: '/map-prediction', icon: Map },
  { nameKey: 'about', href: '/about', icon: Info },
  { nameKey: 'emergency', href: 'tel:911', icon: AlertTriangle, isExternal: true }
];

export const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const { isAuthenticated, user, toggleAuth } = useAuth(); // Get auth state
  const { t } = useTranslation();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/10">
      <div className="container-wide">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <NavLink to="/" className="flex items-center">
              <Logo size="md" />
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              if (item.isExternal) {
                return (
                  <a
                    key={item.nameKey}
                    href={item.href}
                    onClick={(e) => {
                      if (item.nameKey === 'emergency') {
                        const confirmCall = window.confirm(
                          t('navigation.emergencyConfirm')
                        );
                        if (!confirmCall) {
                          e.preventDefault();
                        }
                      }
                    }}
                    className="flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {t(`navigation.${item.nameKey}`)}
                  </a>
                );
              }
              
              return (
                <NavLink
                  key={item.nameKey}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                        : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {t(`navigation.${item.nameKey}`)}
                </NavLink>
              );
            })}
          </div>

          {/* Right side actions - UPDATED WITH AUTH */}
          <div className="flex items-center space-x-3">
            <LanguageSwitcher />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDarkMode}
              className="hidden sm:inline-flex"
              aria-label={darkMode ? t('navigation.switchToLight') : t('navigation.switchToDark')}
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            {/* Auth Display */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2">
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-8 h-8 rounded-full border-2 border-primary-100"
                    />
                  ) : (
                    <UserCircle className="w-8 h-8 text-primary-600" />
                  )}
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {t('navigation.hi')}, {user?.name?.split(' ')[0] || t('navigation.user')}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAuth}
                  leftIcon={<LogOut className="w-4 h-4" />}
                  className="hidden sm:inline-flex"
                >
                  {t('navigation.logout')}
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={toggleAuth}
                leftIcon={<LogIn className="w-4 h-4" />}
                className="hidden sm:inline-flex"
              >
                {t('navigation.loginDemo')}
              </Button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu - UPDATED WITH AUTH */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-neutral-200 dark:border-neutral-800 mt-2 pt-2 pb-3">
            <div className="px-2 space-y-1">
              {navigationItems.map((item) => {
                if (item.isExternal) {
                  return (
                    <a
                      key={item.nameKey}
                      href={item.href}
                      onClick={(e) => {
                        if (item.nameKey === 'emergency') {
                          const confirmCall = window.confirm(
                            t('navigation.emergencyConfirm')
                          );
                          if (!confirmCall) {
                            e.preventDefault();
                          } else {
                            setIsMenuOpen(false);
                          }
                        }
                      }}
                      className={`flex items-center px-3 py-2 rounded-lg text-base font-medium ${
                        item.nameKey === 'emergency'
                          ? 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300'
                          : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {t(`navigation.${item.nameKey}`)}
                    </a>
                  );
                }
                
                return (
                  <NavLink
                    key={item.nameKey}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-lg text-base font-medium ${
                        isActive
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                          : 'text-neutral-600 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5 mr-3" />
                    {t(`navigation.${item.nameKey}`)}
                  </NavLink>
                );
              })}
              
              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
                {/* Dark Mode Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth
                  onClick={toggleDarkMode}
                  leftIcon={darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                >
                  {darkMode ? t('navigation.lightMode') : t('navigation.darkMode')}
                </Button>
                
                {/* Auth Toggle for Mobile */}
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center px-3 py-2">
                      {user?.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-8 h-8 rounded-full mr-3 border-2 border-primary-100"
                        />
                      ) : (
                        <UserCircle className="w-8 h-8 mr-3 text-primary-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-neutral-500">{user?.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      fullWidth
                      onClick={() => {
                        toggleAuth();
                        setIsMenuOpen(false);
                      }}
                      leftIcon={<LogOut className="w-4 h-4" />}
                    >
                      {t('navigation.logout')}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => {
                      toggleAuth();
                      setIsMenuOpen(false);
                    }}
                    leftIcon={<LogIn className="w-4 h-4" />}
                  >
                    {t('navigation.loginDemo')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};