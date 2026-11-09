import React from 'react';
import { MedicalCard } from '../../components/ui/MedicalCard';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Calendar, Phone, CheckCircle, Award, Heart, Video, Users, Clock, MapPin, Shield, Star } from 'lucide-react';
import { Doctor } from '../../types/doctor.types';

interface DoctorCardProps {
  doctor: Doctor;
  onBookAppointment: (id: string) => void;
}

export const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, onBookAppointment }) => (
  <MedicalCard key={doctor.id} className="hover-lift">
    <div className="flex flex-col lg:flex-row">
      {/* Doctor Photo & Basic Info */}
      <div className="lg:w-1/3 p-6 border-r border-neutral-200 dark:border-neutral-700">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-primary-100 dark:border-primary-900/30 mb-4">
            <img src={doctor.photoUrl} alt={doctor.name} className="w-full h-full object-cover" />
          </div>
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-1">{doctor.name}</h3>
          <div className="mb-3">
            <Badge variant="outline" className="mb-1">{doctor.specialization}</Badge>
            {doctor.subSpecialty && (
              <div className="text-sm text-neutral-600 dark:text-neutral-400">{doctor.subSpecialty}</div>
            )}
          </div>
          <div className="flex items-center justify-center mb-4">
            <Star className="w-4 h-4 text-yellow-500 fill-current" />
            <span className="ml-1 font-bold">{doctor.rating}</span>
            <span className="ml-2 text-sm text-neutral-500">({doctor.totalRatings} reviews)</span>
          </div>
          {doctor.verified && (
            <div className="flex items-center justify-center text-green-600 dark:text-green-400 mb-4">
              <CheckCircle className="w-4 h-4 mr-1" />
              <span className="text-sm font-medium">Verified Professional</span>
            </div>
          )}
        </div>
      </div>
      {/* Details */}
      <div className="lg:w-2/3 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Qualifications</h4>
            <ul className="space-y-1">
              {doctor.qualifications.map((qual, idx) => (
                <li key={idx} className="text-sm flex items-center">
                  <Award className="w-3 h-3 text-primary-600 mr-2" />
                  {qual}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Experience & Stats</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><span className="text-sm">Experience</span> <span className="font-medium">{doctor.experience} years</span></div>
              <div className="flex items-center justify-between"><span className="text-sm">Success Rate</span> <span className="font-medium text-green-600">{doctor.successRate}%</span></div>
              <div className="flex items-center justify-between"><span className="text-sm">Response Time</span> <span className="font-medium">{doctor.responseTime}</span></div>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Hospital & Availability</h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 text-neutral-400 mr-2" />
              <div>
                <div className="font-medium">{doctor.hospital.name}</div>
                <div className="text-sm text-neutral-500">{doctor.hospital.city} • {doctor.hospital.distance} away</div>
              </div>
            </div>
            <div className="flex items-center"><Clock className="w-4 h-4 text-neutral-400 mr-2" /><span className="text-sm">{doctor.schedule.hours}</span></div>
          </div>
        </div>
        <div className="mb-6">
          <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Consultation Options</h4>
          <div className="flex flex-wrap gap-2">
            {doctor.availability.online && (<Badge variant="outline" className="flex items-center"><Video className="w-3 h-3 mr-1" />Video Consult</Badge>)}
            {doctor.availability.inPerson && (<Badge variant="outline" className="flex items-center"><Users className="w-3 h-3 mr-1" />In-Person</Badge>)}
            {doctor.availability.emergency && (<Badge variant="error" className="flex items-center"><Heart className="w-3 h-3 mr-1" />Emergency</Badge>)}
          </div>
        </div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-1">Languages</h4>
            <div className="flex flex-wrap gap-1">
              {doctor.languages.map((lang) => (<span key={lang} className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded text-xs">{lang}</span>))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-neutral-600 dark:text-neutral-400">Consultation Fee</div>
            <div className="text-2xl font-bold text-primary-600">₹{doctor.consultationFee}</div>
            <div className="flex space-x-3">
              <Button onClick={() => onBookAppointment(doctor.id)} className="flex-1" leftIcon={<Calendar className="w-4 h-4" />}>Book Appointment</Button>
              <Button variant="secondary" leftIcon={<Phone className="w-4 h-4" />}>Call Clinic</Button>
            </div>
          </div>
        </div>
        {/* Bio Section */}
        <div className="border-t border-neutral-200 dark:border-neutral-700 p-6">
          <h4 className="font-medium text-neutral-900 dark:text-white mb-2">About Dr. {doctor.name.split(' ')[1]}</h4>
          <p className="text-neutral-600 dark:text-neutral-400">{doctor.bio}</p>
        </div>
        {/* Reviews Preview */}
        {doctor.patientReviews.length > 0 && (
          <div className="border-t border-neutral-200 dark:border-neutral-700 p-6">
            <h4 className="font-medium text-neutral-900 dark:text-white mb-4">Recent Patient Review</h4>
            {doctor.patientReviews.slice(0, 1).map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                    <span className="font-medium">{review.rating}/5</span>
                    {review.verified && (<Shield className="w-4 h-4 text-green-500 ml-2" />)}
                  </div>
                  <span className="text-sm text-neutral-500">{review.date}</span>
                </div>
                <p className="text-neutral-600 dark:text-neutral-400 italic">"{review.comment}"</p>
                <div className="mt-2 text-sm text-neutral-500">- {review.patientName}</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  </MedicalCard>
);
export default DoctorCard;

