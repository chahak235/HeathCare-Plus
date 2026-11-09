import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'hi' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
      aria-label="Toggle language"
    >
      <Globe className="w-4 h-4" />
      <span>{i18n.language === 'en' ? 'हिंदी' : 'EN'}</span>
    </button>
  );
};
