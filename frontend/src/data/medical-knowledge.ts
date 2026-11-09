export const medicalResponses: Record<string, string> = {
    'fever': `**🤒 Fever Symptoms & Management**
  
  **Common Symptoms:**
  • Elevated body temperature (>100.4°F or 38°C)
  • Chills and shivering
  • Headache
  • Muscle aches
  • Loss of appetite
  • Dehydration
  • General weakness
  
  **Home Care:**
  1. **Rest**: Get plenty of sleep and avoid physical exertion
  2. **Hydration**: Drink water, oral rehydration solutions, or clear broths
  3. **Medication**: Paracetamol (Crocin) or Ibuprofen as directed
  4. **Cool Compress**: Apply damp cloth to forehead and wrists
  5. **Light Clothing**: Wear light, breathable fabrics
  
  **🛑 When to Seek Medical Attention:**
  • Fever above 103°F (39.4°C)
  • Lasting more than 3 days
  • Difficulty breathing
  • Severe headache or stiff neck
  • Rash that doesn't fade under pressure
  • In infants under 3 months
  
  **🏥 Indian Context:**
  • Consult your physician for proper diagnosis
  • Common causes: Viral infections, dengue, malaria (in endemic areas)
  • Get tested if fever persists beyond 48 hours
  
  **⚠️ Disclaimer**: This is general information. Consult a doctor for proper diagnosis and treatment.`,
  
    'headache': `**🤕 Headache Relief & Management**
  
  **Types & Symptoms:**
  • **Tension Headache**: Band-like pressure around head
  • **Migraine**: Throbbing pain, often with nausea, light sensitivity
  • **Cluster Headache**: Severe pain around one eye
  
  **Immediate Relief:**
  1. **Rest in dark, quiet room**
  2. **Cold compress** on forehead
  3. **Hydrate** with water
  4. **Gentle massage** of temples and neck
  5. **Over-the-counter**: Paracetamol, Ibuprofen (as directed)
  
  **Prevention Tips:**
  • Maintain regular sleep schedule
  • Stay hydrated (2-3 liters daily)
  • Manage stress through meditation/yoga
  • Regular exercise
  • Avoid trigger foods (chocolate, cheese, processed meats)
  
  **🚨 Emergency Signs (Seek Immediate Care):**
  • "Worst headache of your life"
  • Sudden, severe headache
  • Headache with fever, stiff neck, confusion
  • Headache after head injury
  • Headache with vision changes or weakness
  
  **🏥 Indian Healthcare Tips:**
  • Ayurvedic options: Shirodhara, Nasya (consult Ayurvedic doctor)
  • Yoga: Pranayama, Shavasana for stress relief
  • Consult neurologist for chronic headaches`,
  
    'cough': `**🤧 Cough Management & Relief**
  
  **Types of Cough:**
  • **Dry Cough**: Tickling sensation, no phlegm
  • **Wet/Productive Cough**: Produces mucus/phlegm
  • **Chronic Cough**: Lasts more than 8 weeks
  
  **Home Remedies:**
  1. **Honey & Warm Water**: 1-2 tsp honey in warm water
  2. **Steam Inhalation**: Add few drops eucalyptus oil
  3. **Salt Water Gargle**: ½ tsp salt in warm water
  4. **Turmeric Milk**: Golden milk with black pepper
  5. **Stay Hydrated**: Warm liquids throughout day
  
  **Medical Treatment:**
  • **Expectorants**: Guaifenesin (for productive cough)
  • **Suppressants**: Dextromethorphan (for dry cough)
  • **Antihistamines**: For allergy-related cough
  • **Inhalers**: For asthma-related cough
  
  **🏥 When to See Doctor:**
  • Cough lasting more than 3 weeks
  • Coughing up blood
  • Shortness of breath or wheezing
  • Fever above 101°F (38.3°C)
  • Unexplained weight loss
  
  **Indian Traditional Remedies:**
  • Tulsi (Holy Basil) leaves with honey
  • Adulsa (Vasaka) leaf extract
  • Mulethi (Licorice) root tea
  • **Note**: Consult Ayurvedic practitioner for proper guidance`
  };
  
  export const getFallbackResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('fever')) return medicalResponses.fever;
    if (lowerQuery.includes('headache')) return medicalResponses.headache;
    if (lowerQuery.includes('cough') || lowerQuery.includes('cold')) return medicalResponses.cough;
    
    return `I understand you're asking about "${query}". For accurate medical advice specific to your situation, I recommend:
  
  1. **Consult a Doctor**: Book appointment with our verified specialists
  2. **Visit Hospital**: Use our map to find nearest healthcare facility
  3. **Emergency**: Call 112 for immediate medical assistance
  
  **Available Resources:**
  • **Doctors Page**: Find specialists by location/specialty
  • **Map Prediction**: Locate hospitals with real-time info
  • **24/7 Helpline**: 112 for emergencies
  
  **⚠️ Remember**: I provide general health information. For personalized medical advice, please consult a healthcare professional.`;
  };