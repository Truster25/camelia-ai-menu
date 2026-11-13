import { Clock, Mail, MapPin, Phone } from 'lucide-react';

/** Where Camelia actually is. Used for the map link and the directions block. */
const ADDRESS = {
  lines: ['KG 7 Avenue', 'Kiyovu, Kigali', 'Rwanda'],
  /** Opens the restaurant pin in Google Maps. */
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=KG+7+Ave,+Kiyovu,+Kigali,+Rwanda',
  /** Turn-by-turn directions to the same pin. */
  directionsUrl:
    'https://www.google.com/maps/dir/?api=1&destination=KG+7+Ave,+Kiyovu,+Kigali,+Rwanda',
};

const hours = [
  ['Monday – Thursday', '07:00 – 22:00'],
  ['Friday – Saturday', '07:00 – 23:30'],
  ['Sunday', '08:00 – 21:00'],
  ['Public holidays', '08:00 – 21:00'],
];

/**
 * "Contact & location" — the page behind every "Location" link in the footer.
 *
 * The map is an embedded OpenStreetMap frame rather than a Google Maps key:
 * no API key to leak, no billing account, and it loads without consent.
 * The two Google links are ordinary outbound links, which need no key.
 */
export function Contact() {
  return (
    <div data-header-theme="dark">
      <section className="bg-forest-950 px-5 pb-14 pt-32 sm:px-8 lg:px-10 lg:pt-40">
        <div className="mx-auto max-w-[1180px]">
          <p className="kicker"><span className="kicker-line" /> Come and sit down</p>
          <h1 className="mt-5 max-w-[18ch] font-display text-[clamp(2.4rem,5vw,4rem)] leading-[1.06] tracking-[-0.03em] text-cream">
            Find the table with <em className="not-italic text-amber-logo">your name on it.</em>
          </h1>
          <p className="mt-7 max-w-[58ch] text-[15px] leading-[1.85] text-sage-300">
            We are on KG 7 Avenue in Kiyovu, a short walk from the Kigali Convention Centre. Walk in,
            or call ahead if there are more than six of you.
          </p>
        </div>
      </section>

      <section className="bg-forest-950 px-5 pb-20 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-[1180px] gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          {/* details */}
          <div className="space-y-8">
            <div className="flex gap-4">
              <MapPin size={18} className="mt-1 shrink-0 text-amber-soft" aria-hidden="true" />
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-sage-400">Address</p>
                <p className="mt-2 text-sm leading-relaxed text-cream">
                  {ADDRESS.lines.map((line) => (
                    <span key={line} className="block">{line}</span>
                  ))}
                </p>
                <a
                  href={ADDRESS.directionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-block text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-logo underline-offset-4 hover:underline"
                >
                  Get directions
                </a>
              </div>
            </div>

            <div id="hours" className="flex scroll-mt-28 gap-4">
              <Clock size={18} className="mt-1 shrink-0 text-amber-soft" aria-hidden="true" />
              <div className="w-full">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-sage-400">
                  Opening hours
                </p>
                <dl className="mt-2 max-w-sm space-y-1.5">
                  {hours.map(([day, time]) => (
                    <div key={day} className="flex justify-between gap-6 text-[13px]">
                      <dt className="text-sage-300">{day}</dt>
                      <dd className="text-cream">{time}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="flex gap-4">
              <Phone size={18} className="mt-1 shrink-0 text-amber-soft" aria-hidden="true" />
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-sage-400">Telephone</p>
                <a href="tel:+250788000000" className="mt-2 block text-sm text-cream hover:text-amber-pale">
                  +250 788 000 000
                </a>
              </div>
            </div>

            <div className="flex gap-4">
              <Mail size={18} className="mt-1 shrink-0 text-amber-soft" aria-hidden="true" />
              <div>
                <p className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-sage-400">Email</p>
                <a
                  href="mailto:hello@camelia.rw"
                  className="mt-2 block text-sm text-cream hover:text-amber-pale"
                >
                  hello@camelia.rw
                </a>
              </div>
            </div>
          </div>

          {/* Map. The address panel sits underneath the frame, so if the
              map service is blocked or slow the block still says where we are
              rather than showing an empty rectangle. */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-forest-900">
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center">
              <MapPin size={22} className="text-amber-soft" aria-hidden="true" />
              <p className="text-[13px] leading-relaxed text-sage-300">
                KG 7 Avenue, Kiyovu
                <br />
                Kigali, Rwanda
              </p>
              <a
                href={ADDRESS.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-logo underline-offset-4 hover:underline"
              >
                Open the map
              </a>
            </div>
            <iframe
              title="Map showing Camelia on KG 7 Avenue, Kiyovu, Kigali"
              src="https://www.openstreetmap.org/export/embed.html?bbox=30.050%2C-1.960%2C30.080%2C-1.935&layer=mapnik&marker=-1.9475%2C30.0655"
              className="relative h-[320px] w-full border-0 sm:h-[440px] lg:h-full lg:min-h-[440px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-[1180px]">
          <a href={ADDRESS.mapsUrl} target="_blank" rel="noreferrer" className="btn-quiet">
            Open in Google Maps
          </a>
        </div>
      </section>
    </div>
  );
}
