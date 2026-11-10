import React from 'react';
import LegalPage, { CONTACT_EMAIL } from './LegalPage';

/**
 * Plain-language privacy policy that matches what the code actually does.
 * Update it whenever a feature starts collecting or sharing new data.
 */
const Privacy: React.FC = () => (
  <LegalPage
    title="Privacy Policy"
    intro={
      <p>
        HealthCare+ ("we") helps you find doctors and hospitals, book consultations, and use AI tools for general health
        information. This policy explains what we collect, why, who processes it for us, and your choices. We follow
        India's Digital Personal Data Protection Act, 2023.
      </p>
    }
    sections={[
      {
        title: 'What we collect',
        body: (
          <ul>
            <li><strong>Account:</strong> name, email, phone number, password (stored only as a secure hash) and account type (patient, doctor or hospital).</li>
            <li><strong>Health and emergency profile</strong> (optional, filled in by you): height, weight, blood group, allergies, conditions, medical notes, your usual hospital and up to five emergency contacts.</li>
            <li><strong>Appointments:</strong> doctor, date and time, online or in-clinic, symptoms you type, and the Google Meet link for online visits.</li>
            <li><strong>Doctors:</strong> profile, qualifications, fees, working days and hours.</li>
            <li><strong>Location:</strong> only when you press SOS or search for hospitals near you, and only with your browser's permission.</li>
            <li><strong>Voice recordings</strong> you choose to analyse, and <strong>chat messages</strong> you send to the AI assistant.</li>
          </ul>
        ),
      },
      {
        title: 'What stays on your device',
        body: (
          <ul>
            <li><strong>Chest X-ray images</strong> are analysed by a model that runs inside your browser. The image is not uploaded to our servers.</li>
            <li>Voice measurements (pace, pauses, pitch, loudness) are calculated in your browser before anything is sent.</li>
            <li>Your login token and chat history for the bubble are kept in your browser's local storage. Logging out or clearing site data removes them.</li>
          </ul>
        ),
      },
      {
        title: 'How we use your data',
        body: (
          <ul>
            <li>To run your account and show you your bookings.</li>
            <li>To book appointments, create the Google Meet link and calendar invite, and email confirmations to you and your doctor.</li>
            <li>To alert your emergency contacts by email, with your location and health details, when you press SOS.</li>
            <li>To answer your questions with AI and produce the voice wellbeing report.</li>
          </ul>
          ),
      },
      {
        title: 'Who processes data for us',
        body: (
          <>
            <p>We use these services to run HealthCare+. They process data on our behalf and only for these purposes:</p>
            <ul>
              <li><strong>Neon</strong> (database, Singapore region): accounts, profiles, appointments.</li>
              <li><strong>Render</strong> (application server) and <strong>Vercel</strong> (website hosting).</li>
              <li><strong>Groq</strong> (AI): chat messages and voice recordings are sent to Groq to generate replies, transcripts and reports. We do not store voice recordings.</li>
              <li><strong>Google</strong> (Calendar, Meet and Gmail): appointment details and attendee emails for calendar invites, and the emails we send you.</li>
              <li><strong>OpenStreetMap</strong> services: the place or location you search, to list hospitals.</li>
            </ul>
            <p>We do not sell your data or use it for advertising.</p>
          </>
        ),
      },
      {
        title: 'Sharing with doctors and hospitals',
        body: (
          <p>
            When you book, the doctor sees your name, contact details, symptoms and appointment. Doctors and hospital
            staff on the platform may view patient records they need to provide care. We share data with authorities
            only when the law requires it.
          </p>
        ),
      },
      {
        title: 'Security',
        body: (
          <p>
            Data travels over encrypted connections (HTTPS) and is stored with access controls: patients see only their
            own records, and doctors only their own schedules. No system is perfectly secure; tell us at once at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> if you suspect a problem.
          </p>
        ),
      },
      {
        title: 'How long we keep data',
        body: (
          <p>
            We keep your account and appointment records while your account is active, and delete them within 30 days
            after you ask us to close your account, unless the law requires us to keep them longer.
          </p>
        ),
      },
      {
        title: 'Your rights',
        body: (
          <p>
            You can see and update your profile at any time, withdraw consent, and ask us to correct or delete your
            data, or to explain how it is used, by emailing <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            We reply within 30 days. You may also complain to the Data Protection Board of India.
          </p>
        ),
      },
      {
        title: 'Children',
        body: <p>HealthCare+ is for people aged 18 and over. A parent or guardian must create and manage any account used for a child.</p>,
      },
      {
        title: 'Changes and contact',
        body: (
          <p>
            We will post changes here and update the date above; for important changes we will also email you. Grievance
            and data contact: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        ),
      },
    ]}
  />
);

export default Privacy;
