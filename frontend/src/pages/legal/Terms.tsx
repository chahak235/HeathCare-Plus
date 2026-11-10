import React from 'react';
import { Link } from 'react-router-dom';
import LegalPage, { CONTACT_EMAIL } from './LegalPage';

const Terms: React.FC = () => (
  <LegalPage
    title="Terms of Use"
    intro={
      <p>
        These terms apply when you use the HealthCare+ website and services. By creating an account or booking a
        consultation you agree to them and to our <Link to="/privacy">Privacy Policy</Link>.
      </p>
    }
    sections={[
      {
        title: 'Not for emergencies',
        body: (
          <p>
            <strong>In a medical emergency, call 112 or go to the nearest emergency department.</strong> The SOS button
            helps you call and alert contacts, but it does not dispatch an ambulance or guarantee anyone will respond.
          </p>
        ),
      },
      {
        title: 'AI tools are not medical advice',
        body: (
          <ul>
            <li>The AI chat gives general health information. It is not a diagnosis or a prescription.</li>
            <li>The chest X-ray tool is a screening aid with about 88.5% accuracy in testing. It can be wrong and is not a diagnostic device; a qualified doctor must review any X-ray.</li>
            <li>The voice analyser is a wellbeing check, not a mental health diagnosis. If you are in crisis, call Tele-MANAS on 14416 or 112.</li>
            <li>Always talk to a qualified doctor before acting on any result.</li>
          </ul>
        ),
      },
      {
        title: 'Consultations',
        body: (
          <ul>
            <li>Doctors on HealthCare+ are responsible for the medical care they give. We provide the booking and video tools.</li>
            <li>Online consultations take place on Google Meet using the link in your confirmation email.</li>
            <li>Fees, if any, are shown on the doctor's profile. Please cancel from your account if you cannot attend.</li>
          </ul>
        ),
      },
      {
        title: 'Your account',
        body: (
          <ul>
            <li>You must be 18 or over, give accurate details, and keep your password private.</li>
            <li>Doctors must hold a valid registration to practise in India and keep their profile and hours accurate.</li>
            <li>Do not misuse the service: no false bookings, no access to other people's records, no attempts to break security.</li>
          </ul>
        ),
      },
      {
        title: 'Availability',
        body: (
          <p>
            We aim to keep HealthCare+ running but cannot promise it will always be available or error-free. Pages may
            take up to a minute to load after a quiet period. We may change or pause features.
          </p>
        ),
      },
      {
        title: 'Liability',
        body: (
          <p>
            To the extent the law allows, HealthCare+ is not liable for decisions made from AI results, for the medical
            care given by doctors, or for losses caused by service interruptions. Nothing here limits rights you have
            under Indian consumer protection law.
          </p>
        ),
      },
      {
        title: 'Ending your account',
        body: (
          <p>
            You can ask us to close your account at any time by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            We may suspend accounts that break these terms.
          </p>
        ),
      },
      {
        title: 'Law and contact',
        body: (
          <p>
            These terms are governed by the laws of India. We may update them and will post the new date above.
            Contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        ),
      },
    ]}
  />
);

export default Terms;
