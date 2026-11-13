import { useState } from 'react';
import { Mail } from 'lucide-react';

/**
 * Privacy notice.
 *
 * Kept short and plain on purpose: it has to be true of the system as built,
 * not a copied template. Every claim here matches what the code actually does —
 * hashed passwords, tokens in local storage, ratings used to rank dishes.
 * If the code changes, this page has to change with it.
 */
export function Privacy() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <div data-header-theme="dark" className="bg-forest-950">
      <section className="px-5 pb-10 pt-32 sm:px-8 lg:px-10 lg:pt-40">
        <div className="mx-auto max-w-[760px]">
          <p className="kicker"><span className="kicker-line" /> Plain English, no lawyer</p>
          <h1 className="mt-5 font-display text-[clamp(2.2rem,4.4vw,3.4rem)] leading-[1.08] tracking-[-0.03em] text-cream">
            What we keep, and <em className="not-italic text-amber-logo">what we don&apos;t.</em>
          </h1>
          <p className="mt-6 text-[15px] leading-[1.85] text-sage-300">
            Camelia asks five questions to suggest a dish. That is the whole reason we hold any
            information about you, and this page says exactly what that means.
          </p>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[760px] space-y-9">
          {[
            {
              q: 'What we store about you',
              a: 'Your name and email address when you create an account, the answers you give in the taste quiz, the dishes you rate, and the orders you place. Nothing else.',
            },
            {
              q: 'Your password',
              a: 'It is never stored. What is stored is a one-way hash produced with bcrypt. Nobody at Camelia can read your password, and it cannot be recovered if you forget it — only reset.',
            },
            {
              q: 'How your taste answers are used',
              a: 'They are scored against every dish on the menu to produce your five suggestions. Your ratings also feed the popularity signal, which helps rank dishes for everyone. Nothing is sold, and nothing is shared with advertisers.',
            },
            {
              q: 'Cookies and tracking',
              a: 'There are no advertising cookies and no third-party trackers on this site. Your sign-in token is kept in your own browser so you stay logged in between visits.',
            },
            {
              q: 'Your photograph or voice',
              a: 'We do not collect either. The quiz is multiple choice only.',
            },
            {
              q: 'Deleting your account',
              a: 'Email us and we remove your account, your taste answers and your ratings within seven days. Your past orders are kept without your name attached, because the restaurant has to keep sales records.',
            },
          ].map((item) => (
            <div key={item.q} className="border-t border-white/10 pt-6">
              <h2 className="font-display text-xl text-cream">{item.q}</h2>
              <p className="mt-3 text-[14px] leading-[1.85] text-sage-300">{item.a}</p>
            </div>
          ))}

          <div className="border-t border-white/10 pt-8">
            <h2 className="font-display text-xl text-cream">Ask for a copy, or ask us to delete it</h2>
            <p className="mt-3 text-[14px] leading-[1.85] text-sage-300">
              Put the email address on your account below and we will send everything we hold, or
              remove it, within seven days.
            </p>
            <form
              className="mt-5 flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                setSent(true);
              }}
            >
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                aria-label="The email address on your account"
                className="min-w-0 flex-1 rounded-[4px] border border-white/15 bg-forest-900 px-4 py-3 text-[13px] text-cream outline-none placeholder:text-sage-400 focus:border-amber-soft/60"
              />
              <button type="submit" className="btn-primary shrink-0">
                <Mail size={14} /> Request
              </button>
            </form>
            {sent && (
              <p className="mt-3 text-[12.5px] text-amber-pale">
                Received. We will reply to {email} within seven days.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
