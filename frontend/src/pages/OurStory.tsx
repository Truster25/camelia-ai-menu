import { Link } from 'react-router-dom';
import { ArrowRight, Quote } from 'lucide-react';
import { useMemo } from 'react';
import { useLang } from '../context/LanguageContext';

type Person = {
  name: string;
  role: string;
  image: string;
  alt: string;
  line: string;
};

/**
 * "Our story" — the page the footer's About links point at.
 *
 * Written as a real restaurant story rather than filler: who cooks, when the
 * place opened, and why the menu is what it is. The team section is the part
 * guests actually read, so each person gets a photograph and one honest line
 * instead of a job title alone.
 */
export function OurStory() {
  const { t } = useLang();

  const team: Person[] = useMemo(
    () => [
      {
        name: 'Aline Mukamana',
        role: t('story.team.aline.role'),
        image: '/images/team/chef-aline.jpg',
        alt: 'Head chef Aline plating grilled tilapia in the Camelia kitchen',
        line: t('story.team.aline.line'),
      },
      {
        name: 'Eric Nshuti',
        role: t('story.team.eric.role'),
        image: '/images/team/barista-eric.jpg',
        alt: 'Eric pouring latte art at the Camelia coffee bar',
        line: t('story.team.eric.line'),
      },
      {
        name: 'Chantal Uwase',
        role: t('story.team.chantal.role'),
        image: '/images/team/floor-chantal.jpg',
        alt: 'Floor manager Chantal welcoming guests at the Camelia entrance',
        line: t('story.team.chantal.line'),
      },
      {
        name: 'Jean-Paul Habimana',
        role: t('story.team.jeanpaul.role'),
        image: '/images/team/grill-jeanpaul.jpg',
        alt: 'Jean-Paul turning brochettes over the charcoal grill',
        line: t('story.team.jeanpaul.line'),
      },
    ],
    [t],
  );

  const milestones = useMemo(
    () => [
      { year: '2016', title: t('story.milestone.2016.title'), body: t('story.milestone.2016.body') },
      { year: '2019', title: t('story.milestone.2019.title'), body: t('story.milestone.2019.body') },
      { year: '2022', title: t('story.milestone.2022.title'), body: t('story.milestone.2022.body') },
      { year: '2026', title: t('story.milestone.2026.title'), body: t('story.milestone.2026.body') },
    ],
    [t],
  );

  return (
    <div data-header-theme="dark">
      {/* ---------------------------------------------------------- opening */}
      <section className="relative overflow-hidden bg-forest-950 px-5 pb-16 pt-32 sm:px-8 lg:px-10 lg:pt-40">
        <div className="mx-auto max-w-[1180px]">
          <p className="kicker">{t('story.since')}</p>
          <h1 className="mt-5 max-w-[20ch] font-display text-[clamp(2.4rem,5vw,4rem)] leading-[1.06] tracking-[-0.03em] text-cream">
            {t('story.hero.pre')} <em className="not-italic text-amber-logo">{t('story.hero.accent')}</em>
          </h1>
          <p className="mt-7 max-w-[62ch] text-[15px] leading-[1.85] text-sage-300">
            {t('story.hero.body')}
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- numbers */}
      <section className="bg-forest-950 px-5 pb-16 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-6 border-y border-white/10 py-9 sm:grid-cols-4">
          {[
            ['10', t('story.stat.years')],
            ['130', t('story.stat.dishes')],
            ['4', t('story.stat.people')],
            ['1', t('story.stat.menu')],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="font-display text-3xl text-amber-pale">{value}</p>
              <p className="mt-1.5 text-[9.5px] uppercase leading-relaxed tracking-[0.14em] text-sage-400">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* -------------------------------------------------------------- team */}
      <section id="team" className="scroll-mt-24 bg-forest-950 px-5 pb-20 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[1180px]">
          <p className="kicker">{t('story.team.kicker')}</p>
          <h2 className="mt-4 max-w-[24ch] font-display text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.1] tracking-[-0.02em] text-cream">
            {t('story.team.title.pre')} <em className="not-italic text-amber-soft">{t('story.team.title.accent')}</em>
          </h2>
          <p className="mt-4 max-w-[56ch] text-sm leading-relaxed text-sage-400">
            {t('story.team.body')}
          </p>

          <div className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {team.map((person) => (
              <article key={person.name} className="group flex flex-col">
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-forest-800">
                  <img
                    src={person.image}
                    alt={person.alt}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                  />
                  <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent to-transparent" />
                </div>
                <p className="mt-4 text-[9px] uppercase tracking-[0.18em] text-[#b98a4f]">{person.role}</p>
                <h3 className="mt-1.5 font-display text-lg text-cream">{person.name}</h3>
                <p className="mt-2 text-[12.5px] leading-[1.8] text-sage-400">{person.line}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- milestones */}
      <section data-header-theme="light" className="bg-cream px-5 py-16 text-ink sm:px-8 md:py-20 lg:px-10">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#8a5a2b]">{t('story.milestones.kicker')}</p>
          <h2 className="mt-4 max-w-[22ch] font-display text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.1] tracking-[-0.02em]">
            {t('story.milestones.title.pre')} <em className="not-italic text-[#8a5a2b]">{t('story.milestones.title.accent')}</em>
          </h2>

          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {milestones.map((m) => (
              <li key={m.year} className="border-t border-[#26271e]/15 pt-5">
                <p className="font-display text-2xl text-[#8a5a2b]">{m.year}</p>
                <h3 className="mt-2 text-[13px] font-semibold uppercase leading-snug tracking-[0.02em]">
                  {m.title}
                </h3>
                <p className="mt-2.5 text-[12.5px] leading-[1.8] text-[#6b6f63]">{m.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* -------------------------------------------------------------- quote */}
      <section className="bg-forest-950 px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-[820px] flex-col items-center gap-6 text-center">
          <Quote size={26} strokeWidth={1.2} className="text-amber-soft" aria-hidden="true" />
          <p className="font-display text-[clamp(1.3rem,2.4vw,1.85rem)] leading-snug text-cream">
            {t('story.quote')}
          </p>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-sage-400">
            Aline Mukamana · {t('story.team.aline.role')}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link to="/menu" className="btn-primary">
              {t('cart.browse')} <ArrowRight size={15} />
            </Link>
            <Link to="/contact" className="btn-quiet">{t('story.findUs')}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
