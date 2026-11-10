import React, { useEffect, useState } from 'react';
import { Star, Quote } from 'lucide-react';
import { Container } from '../../layout/Container';
import { reviewsService, PublicReview } from '../../../services/reviews-service';

export const Stars: React.FC<{ value: number; className?: string }> = ({ value, className = 'w-4 h-4' }) => (
  <span className="inline-flex text-amber-500" aria-label={`${value} out of 5 stars`}>
    {Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`${className} ${i < value ? 'fill-current' : 'text-neutral-300 dark:text-neutral-600'}`} />
    ))}
  </span>
);

/**
 * "What patients say": real reviews written after real appointments.
 * Renders nothing until there is at least one review, so no placeholder
 * or invented testimonial is ever shown.
 */
const PatientReviews: React.FC = () => {
  const [reviews, setReviews] = useState<PublicReview[]>([]);

  useEffect(() => {
    reviewsService.featured(6).then(setReviews).catch(() => setReviews([]));
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="py-16" aria-labelledby="patient-reviews-title">
      <Container>
        <div className="text-center mb-10">
          <h2 id="patient-reviews-title" className="text-3xl font-bold text-neutral-900 dark:text-white">What patients say</h2>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">Reviews from patients after their HealthCare+ appointments.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <figure key={r.id} className="p-6 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-sm">
              <Quote className="w-6 h-6 text-primary-300 mb-3" aria-hidden />
              <Stars value={r.rating} />
              <blockquote className="mt-3 text-neutral-700 dark:text-neutral-300 leading-relaxed">{r.comment}</blockquote>
              <figcaption className="mt-4 text-sm">
                <span className="font-semibold text-neutral-900 dark:text-white">{r.name}</span>
                {r.doctorName && <span className="text-neutral-500 dark:text-neutral-400"> · visited {r.doctorName}{r.doctorSpecialty ? ` (${r.doctorSpecialty})` : ''}</span>}
                <div className="text-xs text-neutral-400 mt-1">{new Date(r.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
};

export default PatientReviews;
