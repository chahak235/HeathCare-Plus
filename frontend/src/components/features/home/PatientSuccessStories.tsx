import React, { useState, useEffect, useCallback } from 'react';
import { patientStories } from '../../../mocks/patientStories';
import './PatientSuccessStories.css';

const PatientSuccessStories: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === patientStories.length - 1 ? 0 : prevIndex + 1
    );
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? patientStories.length - 1 : prevIndex - 1
    );
  }, []);

  // Auto-slide every 5 seconds
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [nextSlide, isPaused]);

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  return (
    <section 
      className="patient-stories-section"
      aria-label="Patient success stories"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="section-header">
        <h2 className="section-title">Patient Success Stories</h2>
        <p className="section-subtitle">Real experiences from our community</p>
      </div>

      <div className="stories-carousel-container">
        {/* Previous arrow */}
        <button 
          className="carousel-arrow carousel-arrow-prev"
          onClick={prevSlide}
          aria-label="Previous story"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Carousel content */}
        <div className="stories-carousel">
          <div 
            className="stories-track"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {patientStories.map((story) => (
              <div key={story.id} className="story-slide">
                <div className="story-card glass-card">
                  <div className="story-image-container">
                    <img 
                      src={story.imageUrl} 
                      alt={`${story.name}, ${story.condition}`}
                      className="story-image"
                      loading="lazy"
                    />
                    <div className="story-image-overlay"></div>
                  </div>
                  
                  <div className="story-content">
                    <div className="story-avatar">
                      <span className="avatar-initials">{story.avatarInitials}</span>
                    </div>
                    
                    <div className="story-quote">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="quote-icon" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 11H6C5.46957 11 4.96086 10.7893 4.58579 10.4142C4.21071 10.0391 4 9.53043 4 9V7C4 6.46957 4.21071 5.96086 4.58579 5.58579C4.96086 5.21071 5.46957 5 6 5H8C8.53043 5 9.03914 5.21071 9.41421 5.58579C9.78929 5.96086 10 6.46957 10 7V15C10 16.1046 9.10457 17 8 17H7C5.89543 17 5 16.1046 5 15V15" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M20 11H16C15.4696 11 14.9609 10.7893 14.5858 10.4142C14.2107 10.0391 14 9.53043 14 9V7C14 6.46957 14.2107 5.96086 14.5858 5.58579C14.9609 5.21071 15.4696 5 16 5H18C18.5304 5 19.0391 5.21071 19.4142 5.58579C19.7893 5.96086 20 6.46957 20 7V15C20 16.1046 19.1046 17 18 17H17C15.8954 17 15 16.1046 15 15V15" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <p className="quote-text">"{story.quote}"</p>
                    </div>
                    
                    <div className="story-meta">
                      <h3 className="patient-name">{story.name}</h3>
                      <div className="patient-details">
                        <span className="patient-city">{story.city}</span>
                        <span className="condition-badge">{story.condition}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next arrow */}
        <button 
          className="carousel-arrow carousel-arrow-next"
          onClick={nextSlide}
          aria-label="Next story"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Dots indicator */}
      <div className="carousel-dots">
        {patientStories.map((_, index) => (
          <button
            key={index}
            className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to story ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default PatientSuccessStories;