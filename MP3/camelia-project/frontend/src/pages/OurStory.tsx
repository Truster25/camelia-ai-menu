import { Link } from 'react-router-dom';
import { ArrowRight, Quote } from 'lucide-react';

type Person = {
  name: string;
  role: string;
  image: string;
  alt: string;
  line: string;
};

const team: Person[] = [
  {
    name: 'Aline Mukamana',
    role: 'Head chef',
    image: '/images/team/chef-aline.jpg',
    alt: 'Head chef Aline plating grilled tilapia in the Camelia kitchen',
    line: 'Fifteen years at the grill. She decides what goes on the fire each morning, and she will tell you honestly which dish is better today.',
  },
  {
    name: 'Eric Nshuti',
    role: 'Coffee lead',
    image: '/images/team/barista-eric.jpg',
    alt: 'Eric pouring latte art at the Camelia coffee bar',
    line: 'Roasts and pours. If your latte arrives with a fern on it, that is Eric — and he will remember how you take it next time.',
  },
  {
    name: 'Chantal Uwase',
    role: 'Floor manager',
    image: '/images/team/floor-chantal.jpg',
    alt: 'Floor manager Chantal welcoming guests at the Camelia entrance',
    line: 'Runs the room. Finds you a table on a Friday, and quietly moves the speaker when a birthday needs one.',
  },
  {
    name: 'Jean-Paul Habimana',
    role: 'Kitchen — brochettes',
    image: '/images/team/grill-jeanpaul.jpg',
    alt: 'Jean-Paul turning brochettes over the charcoal grill',
    line: 'Tends the charcoal from six in the morning. The reason the brochettes taste of smoke rather than of gas.',
  },
];

const milestones = [
  {
    year: '2016',
    title: 'One grill, six tables',
    body: 'Camelia opens on KG 7 Avenue with a charcoal grill, a coffee machine and a short menu of dishes the family already cooked at home.',
  },
  {
    year: '2019',
    title: 'The coffee bar',
    body: 'Rwandan single-origin beans replace the imported blend. The pour over and the signature latte join the menu, and the afternoon crowd arrives.',
  },
  {
    year: '2022',
    title: 'The garden plates',
    body: 'A supplier relationship with growers in Bugesera brings the salad menu. Leaves are cut the same morning they are served.',
  },
  {
    year: '2026',
    title: 'The menu that asks',
    body: 'Camelia adds an AI assistant that reads the whole menu against your taste, diet, budget and occasion — so nobody has to guess.',
  },
];

/**
 * "Our story" — the page the footer's About links point at.
 *
 * Written as a real restaurant story rather than filler: who cooks, when the
 * place opened, and why the menu is what it is. The team section is the part
 * guests actually read, so each person gets a photograph and one honest line
 * instead of a job title alone.
 */
export function OurStory() {
  return (
    <div data-header-theme="dark">
      {/* ---------------------------------------------------------- opening */}
      <section className="relative overflow-hidden bg-forest-950 px-5 pb-16 pt-32 sm:px-8 lg:px-10 lg:pt-40">
        <div className="mx-auto max-w-[1180px]">
          <p className="kicker"><span className="kicker-line" /> Since 2016 · Kigali</p>
          <h1 className="mt-5 max-w-[20ch] font-display text-[clamp(2.4rem,5vw,4rem)] leading-[1.06] tracking-[-0.03em] text-cream">
            We started with one grill and <em className="not-italic text-amber-logo">a short menu.</em>
          </h1>
          <p className="mt-7 max-w-[62ch] text-[15px] leading-[1.85] text-sage-300">
            Camelia is a family kitchen on KG 7 Avenue in Kigali. It has never been a place that
            chases trends. The brochettes still go on charcoal, the beans still simmer for hours, and
            the leaves are still cut the morning you eat them. What has changed is how quickly we can
            work out what you actually feel like eating.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------- numbers */}
      <section className="bg-forest-950 px-5 pb-16 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1180px] grid-cols-2 gap-6 border-y border-white/10 py-9 sm:grid-cols-4">
          {[
            ['10', 'Years on the same street'],
            ['26', 'Dishes on the menu'],
            ['4', 'People in the kitchen'],
            ['1', 'Menu that asks first'],
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
          <p className="kicker"><span className="kicker-line" /> The people who cook it</p>
          <h2 className="mt-4 max-w-[24ch] font-display text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.1] tracking-[-0.02em] text-cream">
            Every plate here belongs to <em className="not-italic text-amber-soft">someone.</em>
          </h2>
          <p className="mt-4 max-w-[56ch] text-sm leading-relaxed text-sage-400">
            Four of the people you will meet, and what each of them is responsible for.
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
          <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#8a5a2b]">How we got here</p>
          <h2 className="mt-4 max-w-[22ch] font-display text-[clamp(1.8rem,3.4vw,2.6rem)] leading-[1.1] tracking-[-0.02em]">
            Four moments that changed <em className="not-italic text-[#8a5a2b]">the kitchen.</em>
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
            “We are not trying to be the biggest restaurant in Kigali. We are trying to be the one
            people bring their parents to.”
          </p>
          <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-sage-400">
            Aline Mukamana · Head chef
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link to="/menu" className="btn-primary">
              Browse the menu <ArrowRight size={15} />
            </Link>
            <Link to="/contact" className="btn-quiet">Find us</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
