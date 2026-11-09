import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Container } from '../components/layout/Container';
import { GlassCard } from '../components/layout/GlassCard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { ImageAnalysisModal } from '../components/features/ImageAnalysisModal';
import { 
  Brain,
  MessageSquare,
  Mic,
  BarChart3,
  Code,
  Shield,
  Zap,
  Lock,
  Users,
  Globe,
  Cloud,
  Cpu,
  Database,
  Server,
  Terminal,
  FileText,
  Video,
  Calendar,
  Bell,
  Camera, // Add this import
  X, // Add this import
  CheckCircle, // Add this import
  Upload // Add this import
} from 'lucide-react';

export const Features: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showImageAnalysis, setShowImageAnalysis] = useState(false); // Add this state

  const mainFeatures = [
    {
      id: 'image-analysis',
      title: t('featuresPage.featuresList.image.title'),
      description: t('featuresPage.featuresList.image.desc'),
      icon: <Brain className="w-8 h-8 text-primary-600" />,
      highlights: [
        t('featuresPage.featuresList.image.h1'),
        t('featuresPage.featuresList.image.h2'),
        t('featuresPage.featuresList.image.h3'),
        t('featuresPage.featuresList.image.h4')
      ],
      isComingSoon: false,
      onTryNow: () => setShowImageAnalysis(true)
    },
    {
      id: 'chat-assistant',
      title: t('featuresPage.featuresList.chat.title'),
      description: t('featuresPage.featuresList.chat.desc'),
      icon: <MessageSquare className="w-8 h-8 text-primary-600" />,
      highlights: [
        t('featuresPage.featuresList.chat.h1'),
        t('featuresPage.featuresList.chat.h2'),
        t('featuresPage.featuresList.chat.h3'),
        t('featuresPage.featuresList.chat.h4')
      ],
      isComingSoon: false,
      onTryNow: () => window.location.href = '/chat'
    },
    {
      id: 'voice-to-text',
      title: t('featuresPage.featuresList.voice.title'),
      description: t('featuresPage.featuresList.voice.desc'),
      icon: <Mic className="w-8 h-8 text-primary-600" />,
      highlights: [
        t('featuresPage.featuresList.voice.h1'),
        t('featuresPage.featuresList.voice.h2'),
        t('featuresPage.featuresList.voice.h3'),
        t('featuresPage.featuresList.voice.h4')
      ],
      isComingSoon: true,
      onTryNow: null
    },
    {
      id: 'analytics',
      title: t('featuresPage.featuresList.analytics.title'),
      description: t('featuresPage.featuresList.analytics.desc'),
      icon: <BarChart3 className="w-8 h-8 text-primary-600" />,
      highlights: [
        t('featuresPage.featuresList.analytics.h1'),
        t('featuresPage.featuresList.analytics.h2'),
        t('featuresPage.featuresList.analytics.h3')
      ],
      isComingSoon: false,
      onTryNow: () => navigate('/dashboard')
    },
    {
      id: 'code-generator',
      title: t('featuresPage.featuresList.code.title'),
      description: t('featuresPage.featuresList.code.desc'),
      icon: <Code className="w-8 h-8 text-primary-600" />,
      highlights: [
        t('featuresPage.featuresList.code.h1'),
        t('featuresPage.featuresList.code.h2'),
        t('featuresPage.featuresList.code.h3'),
        t('featuresPage.featuresList.code.h4')
      ],
      isComingSoon: true,
      onTryNow: null
    },
    {
      id: 'security',
      title: t('featuresPage.featuresList.security.title'),
      description: t('featuresPage.featuresList.security.desc'),
      icon: <Shield className="w-8 h-8 text-primary-600" />,
      highlights: [
        t('featuresPage.featuresList.security.h1'),
        t('featuresPage.featuresList.security.h2'),
        t('featuresPage.featuresList.security.h3'),
        t('featuresPage.featuresList.security.h4')
      ],
      isComingSoon: true,
      onTryNow: null
    },
    {
      id: 'telemedicine',
      title: t('featuresPage.featuresList.telemedicine.title'),
      description: t('featuresPage.featuresList.telemedicine.desc'),
      icon: <Video className="w-8 h-8 text-primary-600" />,
      highlights: [
        t('featuresPage.featuresList.telemedicine.h1'),
        t('featuresPage.featuresList.telemedicine.h2'),
        t('featuresPage.featuresList.telemedicine.h3')
      ],
      isComingSoon: false,
      onTryNow: () => navigate('/doctors')
    },
    {
      id: 'appointment',
      title: t('featuresPage.featuresList.appointment.title'),
      description: t('featuresPage.featuresList.appointment.desc'),
      icon: <Calendar className="w-8 h-8 text-primary-600" />,
      highlights: [
        t('featuresPage.featuresList.appointment.h1'),
        t('featuresPage.featuresList.appointment.h2'),
        t('featuresPage.featuresList.appointment.h3')
      ],
      isComingSoon: false,
      onTryNow: () => navigate('/doctors')
    }
  ];

  const infrastructureFeatures = [
    {
      title: t('featuresPage.infraList.cloud.title'),
      description: t('featuresPage.infraList.cloud.desc'),
      icon: <Cloud className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: t('featuresPage.infraList.ai.title'),
      description: t('featuresPage.infraList.ai.desc'),
      icon: <Cpu className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: t('featuresPage.infraList.data.title'),
      description: t('featuresPage.infraList.data.desc'),
      icon: <Database className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: t('featuresPage.infraList.api.title'),
      description: t('featuresPage.infraList.api.desc'),
      icon: <Server className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Add the modal */}
      <ImageAnalysisModal 
        isOpen={showImageAnalysis} 
        onClose={() => setShowImageAnalysis(false)} 
      />

      <Container>
        {/* Hero Section */}
        <div className="pt-12 pb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t('featuresPage.heroTitle')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            {t('featuresPage.heroSubtitle')}
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="primary">
              <Users className="w-5 h-5 mr-2" />
              {t('featuresPage.scheduleDemo')}
            </Button>
            <Button size="lg" variant="secondary">
              <FileText className="w-5 h-5 mr-2" />
              {t('featuresPage.viewDocs')}
            </Button>
          </div>
        </div>

        {/* Try Now Banner */}
        <div className="mb-12">
          <GlassCard className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('featuresPage.bannerTitle')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('featuresPage.bannerDesc')}
                </p>
              </div>
              <Button 
                onClick={() => setShowImageAnalysis(true)}
                size="lg"
                variant="primary"
                leftIcon={<Camera className="w-5 h-5" />}
              >
                {t('featuresPage.tryAnalysis')}
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Main Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
            {t('featuresPage.coreTitle')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8 max-w-2xl mx-auto">
            {t('featuresPage.coreSubtitle')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mainFeatures.map((feature) => (
              <Card 
                key={feature.id} 
                className="hover-lift transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/20 dark:to-primary-900/10 rounded-xl">
                      {feature.icon}
                    </div>
                    {feature.isComingSoon && (
                      <Badge variant="outline" className="ml-auto">
                        {t('featuresPage.comingSoon')}
                      </Badge>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {feature.description}
                  </p>
                  
                  <ul className="space-y-2 mb-6">
                    {feature.highlights.map((highlight, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                  
                  {!feature.isComingSoon && feature.onTryNow && (
                    <Button 
                      onClick={feature.onTryNow}
                      variant="secondary"
                      className="w-full"
                      leftIcon={<Zap className="w-4 h-4" />}
                    >
                      {t('featuresPage.tryNow')}
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Infrastructure Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-2">
            {t('featuresPage.infraTitle')}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-center mb-8 max-w-2xl mx-auto">
            {t('featuresPage.infraSubtitle')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {infrastructureFeatures.map((feature, index) => (
              <div key={index} className="text-center">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} mb-4`}>
                  {feature.icon}
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('featuresPage.ctaTitle')}
          </h2>
          <p className="text-primary-100 mb-6 max-w-2xl mx-auto">
            {t('featuresPage.ctaSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary">
              <Terminal className="w-5 h-5 mr-2" />
              {t('featuresPage.getStarted')}
            </Button>
            <Button size="lg" variant="ghost" className="text-white border-white">
              <Globe className="w-5 h-5 mr-2" />
              {t('featuresPage.contactSales')}
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
};