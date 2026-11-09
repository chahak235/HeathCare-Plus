export interface MedicalInsight {
    id: number;
    title: string;
    author: string;
    date: string;
    readTime: string;
    category: 'Cardiology' | 'Respiratory' | 'Mental Health' | 'Oncology' | 'Preventive Care' | 'Nutrition' | 'Pediatrics';
    excerpt: string;
    fullContent: string;
    imageUrl: string;
    authorAvatar: string;
    tags: string[];
    relatedArticles?: number[];
  }
  
  export const medicalInsights: MedicalInsight[] = [
    {
      id: 1,
      title: 'Understanding Heart Health: Preventive Measures That Matter',
      author: 'Dr. Sarah Chen',
      date: 'Jan 15, 2024',
      readTime: '8 min read',
      category: 'Cardiology',
      excerpt: 'Learn about evidence-based preventive measures for maintaining optimal heart health and reducing cardiovascular risks.',
      fullContent: `# Understanding Heart Health: Preventive Measures That Matter
  
  Cardiovascular disease remains the leading cause of death globally, but many cases are preventable through proper care and monitoring.
  
  ## Key Preventive Strategies
  
  ### 1. Regular Monitoring
  - Blood pressure checks every 6 months
  - Cholesterol screening annually after age 40
  - Regular ECG monitoring for at-risk individuals
  
  ### 2. Lifestyle Modifications
  - 150 minutes of moderate exercise weekly
  - Mediterranean diet rich in fruits, vegetables, and healthy fats
  - Stress management through meditation and mindfulness
  
  ### 3. Technology Integration
  Wearable devices now provide continuous heart rate monitoring, sleep tracking, and activity analysis. Our platform integrates this data to provide personalized insights.`,
      imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=600&q=80',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      tags: ['Heart Health', 'Prevention', 'Cardiology', 'Wellness'],
      relatedArticles: [2, 3]
    },
    {
      id: 2,
      title: 'Managing Asthma in Changing Environments',
      author: 'Dr. Michael Rodriguez',
      date: 'Jan 12, 2024',
      readTime: '6 min read',
      category: 'Respiratory',
      excerpt: 'Practical strategies for asthma management considering urban pollution, seasonal changes, and modern lifestyle factors.',
      fullContent: `# Managing Asthma in Changing Environments
  
  Urban environments present unique challenges for respiratory health. Here's how to manage asthma effectively.
  
  ## Environmental Control
  
  ### Air Quality Management
  - Monitor local AQI (Air Quality Index) daily
  - Use HEPA air purifiers in living spaces
  - Keep windows closed during high pollution days
  
  ### Medication Adherence
  - Regular use of controller medications
  - Proper inhaler technique (often overlooked)
  - Asthma action plan for emergencies
  
  ### Digital Monitoring
  Our platform tracks:
  - Peak flow measurements
  - Symptom frequency
  - Environmental triggers
  - Medication effectiveness`,
      imageUrl: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=600&q=80',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
      tags: ['Asthma', 'Respiratory', 'Environment', 'Management'],
      relatedArticles: [1, 4]
    },
    {
      id: 3,
      title: 'Digital Tools for Mental Wellness',
      author: 'Dr. Lisa Wang',
      date: 'Jan 10, 2024',
      readTime: '7 min read',
      category: 'Mental Health',
      excerpt: 'How digital therapeutics and AI-powered tools are enhancing traditional mental health treatments.',
      fullContent: `# Digital Tools for Mental Wellness
  
  The integration of technology in mental healthcare has created new opportunities for support and treatment.
  
  ## Available Digital Interventions
  
  ### 1. AI-Powered Chatbots
  - 24/7 emotional support
  - Cognitive behavioral therapy exercises
  - Crisis intervention resources
  
  ### 2. Mood Tracking Apps
  - Pattern recognition in mood fluctuations
  - Trigger identification
  - Progress monitoring
  
  ### 3. Virtual Reality Therapy
  - Exposure therapy for phobias
  - Relaxation and mindfulness environments
  - Social skills training
  
  ## Clinical Evidence
  Studies show 45% improvement in treatment adherence when digital tools complement traditional therapy.`,
      imageUrl: 'https://images.unsplash.com/photo-1493836512294-502baa1986e2?auto=format&fit=crop&w=600&q=80',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
      tags: ['Mental Health', 'Digital Therapy', 'Wellness', 'AI'],
      relatedArticles: [4, 5]
    },
    {
      id: 4,
      title: 'Nutrition for Chronic Disease Prevention',
      author: 'Dr. James Wilson',
      date: 'Jan 8, 2024',
      readTime: '5 min read',
      category: 'Nutrition',
      excerpt: 'Evidence-based dietary approaches to prevent and manage chronic conditions like diabetes and hypertension.',
      fullContent: `# Nutrition for Chronic Disease Prevention
  
  Diet plays a crucial role in preventing and managing chronic diseases. Here are evidence-based approaches.
  
  ## Dietary Patterns with Proven Benefits
  
  ### Mediterranean Diet
  - Rich in fruits, vegetables, whole grains
  - Healthy fats from olive oil and nuts
  - Moderate fish and poultry consumption
  - Red wine in moderation
  
  ### DASH Diet (Dietary Approaches to Stop Hypertension)
  - Low sodium intake
  - High potassium from fruits and vegetables
  - Rich in magnesium and calcium
  
  ## Practical Implementation
  
  ### Portion Control
  - Use smaller plates
  - Measure servings
  - Mindful eating practices
  
  ### Meal Timing
  - Regular meal schedules
  - Avoid late-night eating
  - Balanced macronutrients throughout the day`,
      imageUrl: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&w=600&q=80',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
      tags: ['Nutrition', 'Prevention', 'Diet', 'Chronic Disease'],
      relatedArticles: [2, 3]
    },
    {
      id: 5,
      title: 'Sleep Hygiene for Optimal Health',
      author: 'Dr. Emma Johnson',
      date: 'Jan 5, 2024',
      readTime: '6 min read',
      category: 'Preventive Care',
      excerpt: 'Science-backed strategies for improving sleep quality and establishing healthy sleep patterns.',
      fullContent: `# Sleep Hygiene for Optimal Health
  
  Quality sleep is essential for cognitive function, immune health, and emotional wellbeing.
  
  ## Key Principles of Good Sleep Hygiene
  
  ### 1. Consistent Schedule
  - Same bedtime and wake time daily
  - Even on weekends
  - Helps regulate circadian rhythm
  
  ### 2. Optimized Sleep Environment
  - Cool temperature (60-67°F or 15-19°C)
  - Complete darkness
  - Quiet or white noise
  - Comfortable mattress and pillows
  
  ### 3. Pre-Sleep Routine
  - 30-60 minute wind-down period
  - No screens 1 hour before bed
  - Relaxation techniques (reading, meditation)
  - Warm bath or shower
  
  ## Technology Assistance
  Sleep tracking devices provide insights into:
  - Sleep stages (REM, deep, light)
  - Sleep duration and efficiency
  - Resting heart rate and HRV
  - Room temperature and noise levels`,
      imageUrl: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      tags: ['Sleep', 'Wellness', 'Preventive Care', 'Health'],
      relatedArticles: [3, 4]
    },
    {
      id: 6,
      title: 'Pediatric Care in the Digital Age',
      author: 'Dr. Alex Thompson',
      date: 'Jan 3, 2024',
      readTime: '7 min read',
      category: 'Pediatrics',
      excerpt: 'Modern approaches to pediatric healthcare incorporating telemedicine and digital monitoring tools.',
      fullContent: `# Pediatric Care in the Digital Age
  
  Technology is transforming how we care for children's health from infancy through adolescence.
  
  ## Digital Tools for Pediatrics
  
  ### 1. Remote Monitoring
  - Temperature tracking
  - Feeding and sleep patterns
  - Developmental milestone tracking
  
  ### 2. Telemedicine Visits
  - Reduced exposure to illnesses
  - Convenient for busy families
  - Quick access to specialists
  
  ### 3. Educational Resources
  - Age-appropriate health education
  - Parent support communities
  - Emergency response guidance
  
  ## Safety Considerations
  - HIPAA-compliant platforms
  - Secure data encryption
  - Parental controls and consent
  - Age-appropriate interfaces`,
      imageUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=600&q=80',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      tags: ['Pediatrics', 'Telemedicine', 'Children Health', 'Digital Care'],
      relatedArticles: [4, 5]
    }
  ];