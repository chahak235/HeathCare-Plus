import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../../components/layout/Container';

export const CONTACT_EMAIL = 'healthcareplus.care@gmail.com';
export const LAST_UPDATED = '11 November 2026';

interface Section {
  title: string;
  body: React.ReactNode;
}

/** Shared layout for the Privacy Policy and Terms pages. */
const LegalPage: React.FC<{ title: string; intro: React.ReactNode; sections: Section[] }> = ({ title, intro, sections }) => (
  <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white dark:from-neutral-900 dark:to-neutral-950 py-12">
    <Container>
      <article className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white">{title}</h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Last updated: {LAST_UPDATED}</p>
        <div className="mt-6 text-neutral-700 dark:text-neutral-300 leading-relaxed">{intro}</div>

        <nav aria-label="On this page" className="mt-8 p-4 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            {sections.map((s, i) => (
              <li key={s.title}>
                <a href={`#s${i + 1}`} className="text-primary-700 dark:text-primary-300 hover:underline">{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>

        {sections.map((s, i) => (
          <section key={s.title} id={`s${i + 1}`} className="mt-10 scroll-mt-24">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{i + 1}. {s.title}</h2>
            <div className="mt-3 space-y-3 text-neutral-700 dark:text-neutral-300 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-primary-700 dark:[&_a]:text-primary-300 [&_a]:underline">
              {s.body}
            </div>
          </section>
        ))}

        <p className="mt-12 text-sm text-neutral-500 dark:text-neutral-400">
          Questions? Email <a className="text-primary-700 dark:text-primary-300 underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          See also the <Link className="text-primary-700 dark:text-primary-300 underline" to="/privacy">Privacy Policy</Link> and{' '}
          <Link className="text-primary-700 dark:text-primary-300 underline" to="/terms">Terms of Use</Link>.
        </p>
      </article>
    </Container>
  </div>
);

export default LegalPage;
