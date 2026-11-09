import React from 'react';
import { useTranslation } from 'react-i18next';
import { Logo } from '../shared/Logo';
import { 
  Heart,
  Shield,
  Lock,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Github
} from 'lucide-react';
import { MedicalDisclaimer } from '../shared/MedicalDisclaimer';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800">
      <div className="container-wide py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <Logo size="lg" />
            <p className="mt-4 text-neutral-600 dark:text-neutral-400">
              {t('footer.description')}
            </p>
            <div className="flex space-x-4 mt-6">
              <a href="#" className="text-neutral-400 hover:text-primary-600 transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary-600 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary-600 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary-600 transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              {t('footer.featuresHeading')}
            </h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-neutral-600 hover:text-primary-600 dark:text-neutral-400 transition-colors">
                  {t('footer.links.imageAnalysis')}
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-600 hover:text-primary-600 dark:text-neutral-400 transition-colors">
                  {t('footer.links.chatAssistant')}
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-600 hover:text-primary-600 dark:text-neutral-400 transition-colors">
                  {t('footer.links.voiceToText')}
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-600 hover:text-primary-600 dark:text-neutral-400 transition-colors">
                  {t('footer.links.clinicalAnalytics')}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              {t('footer.contactHeading')}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center text-neutral-600 dark:text-neutral-400">
                <Mail className="w-4 h-4 mr-3" />
                support@healthcareplus.ai
              </li>
              <li className="flex items-center text-neutral-600 dark:text-neutral-400">
                <Phone className="w-4 h-4 mr-3" />
                +1 (555) 123-4567
              </li>
              <li className="flex items-center text-neutral-600 dark:text-neutral-400">
                <MapPin className="w-4 h-4 mr-3" />
                {t('footer.contact.address')}
              </li>
            </ul>
          </div>

          {/* Trust Badges */}
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              {t('footer.trustHeading')}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-primary-600 mr-2" />
                <span className="text-neutral-600 dark:text-neutral-400">
                  {t('footer.trust.hipaa')}
                </span>
              </div>
              <div className="flex items-center">
                <Lock className="w-5 h-5 text-primary-600 mr-2" />
                <span className="text-neutral-600 dark:text-neutral-400">
                  {t('footer.trust.encryption')}
                </span>
              </div>
              <div className="flex items-center">
                <Heart className="w-5 h-5 text-primary-600 mr-2" />
                <span className="text-neutral-600 dark:text-neutral-400">
                  {t('footer.trust.privacy')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <MedicalDisclaimer className="mb-6" />

        <div className="border-t border-neutral-200 dark:border-neutral-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              {t('footer.bottom.rights', { year: new Date().getFullYear() })}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-neutral-600 hover:text-primary-600 dark:text-neutral-400 transition-colors">
                {t('footer.bottom.privacyPolicy')}
              </a>
              <a href="#" className="text-sm text-neutral-600 hover:text-primary-600 dark:text-neutral-400 transition-colors">
                {t('footer.bottom.termsOfService')}
              </a>
              <a href="#" className="text-sm text-neutral-600 hover:text-primary-600 dark:text-neutral-400 transition-colors">
                {t('footer.bottom.cookiePolicy')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};