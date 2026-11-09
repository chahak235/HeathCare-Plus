// Creating mock data for patient success stories
// This follows the existing mock pattern in the codebase

export interface PatientStory {
    id: number;
    name: string;
    city: string;
    quote: string;
    condition: string;
    imageUrl: string;
    avatarInitials: string;
  }
  
  export const patientStories: PatientStory[] = [
    {
      id: 1,
      name: "Sarah Chen",
      city: "San Francisco, CA",
      quote: "After my asthma diagnosis, the continuous monitoring helped me regain control. I can breathe freely and play with my kids again.",
      condition: "Respiratory Care",
      imageUrl: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?auto=format&fit=crop&w=500&q=80",
      avatarInitials: "SC"
    },
    {
      id: 2,
      name: "Michael Rodriguez",
      city: "Austin, TX",
      quote: "The cardiac monitoring caught irregularities I didn't even feel. Early intervention saved me from a potential heart attack.",
      condition: "Cardiac Monitoring",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80",
      avatarInitials: "MR"
    },
    {
      id: 3,
      name: "Priya Patel",
      city: "Chicago, IL",
      quote: "Managing my diabetes became so much easier with real-time glucose tracking. My A1C is the best it's been in years.",
      condition: "Diabetes Management",
      imageUrl: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=500&q=80",
      avatarInitials: "PP"
    },
    {
      id: 4,
      name: "James Wilson",
      city: "Miami, FL",
      quote: "Post-surgery recovery was smooth with remote monitoring. My doctor knew exactly when I needed adjustments in medication.",
      condition: "Post-Op Recovery",
      imageUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
      avatarInitials: "JW"
    },
    {
      id: 5,
      name: "Elena Vasquez",
      city: "Denver, CO",
      quote: "The anxiety tracking helped me understand my triggers. Combined with my therapist's guidance, I'm living more peacefully.",
      condition: "Mental Wellness",
      imageUrl: "https://images.unsplash.com/photo-1494790108755-2616b612b786?auto=format&fit=crop&w=500&q=80",
      avatarInitials: "EV"
    }
  ];