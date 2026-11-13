/**
 * Interface translations.
 *
 * Scope, deliberately limited: this translates the *chrome* — navigation,
 * buttons, headings, the quiz, form labels, footer. Dish names and descriptions
 * come from the database and stay in English, because a dish called "Isombe"
 * does not need translating and a machine translation of a menu is worse than
 * none.
 *
 * Kinyarwanda is written here as it is spoken in Kigali, not a literal gloss of
 * the English. Where a direct translation would sound like a textbook, the
 * natural phrase wins — "Fungura ibiryo" is what a person says, not "Reba menu".
 */

export type Lang = 'en' | 'rw' | 'fr';

export const LANGUAGES: { code: Lang; label: string; short: string }[] = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'rw', label: 'Kinyarwanda', short: 'RW' },
  { code: 'fr', label: 'Français', short: 'FR' },
];

/** Every translatable string in the interface. Keys are dotted by area. */
export type Dict = Record<string, string>;

const en: Dict = {
  'nav.home': 'Home',
  'nav.menu': 'Menu',
  'nav.recommend': 'Find my dish',
  'nav.about': 'About',
  'nav.orders': 'My orders',
  'nav.cart': 'Basket',
  'nav.signin': 'Sign in',
  'nav.signout': 'Sign out',
  'nav.admin': 'Dashboard',
  'nav.book': 'Book a table',

  'home.hero.line1': 'Good food',
  'home.hero.line2': 'creates',
  'home.hero.line3': 'better days',
  'home.hero.explore': 'Explore our menu',
  'home.hero.ask': 'Ask the AI',
  'home.aside.kicker': 'A seat at our table.',
  'home.aside.title1': 'Your next',
  'home.aside.title2': 'favourite',
  'home.aside.lead': 'A little about your taste. A little more delight on your plate.',
  'home.aside.body':
    'Tell us what you enjoy. We’ll save your preferences and show you dishes that answer them.',
  'home.aside.cta': 'View your taste profile',

  'dishes.kicker': 'Something for every craving',
  'dishes.title': 'A taste of',
  'dishes.title.accent': 'Camelia.',
  'dishes.body':
    'Six sections, twenty-six dishes, and one AI that reads the whole menu before making a suggestion. These are the plates guests keep coming back for.',
  'dishes.all': 'All dishes',
  'dishes.view': 'View now',
  'dishes.empty.title': 'The kitchen is offline',
  'dishes.empty.body': 'We could not load the menu just now. Please refresh the page in a moment.',
  'dishes.loading': 'Setting the table…',

  'ai.kicker': 'Made a little more personal',
  'ai.title1': 'Not sure what to order?',
  'ai.title2': 'Let the menu ask.',
  'ai.body':
    'Answer five short questions and Camelia’s recommender scores every available dish against your answers — diet, spice, budget, cuisine and occasion. Dietary needs are hard filters: if it is not halal, it will never appear in a halal result.',
  'ai.cta': 'Start the 60-second quiz',
  'ai.how': 'How it works',
  'ai.stat1': 'Dishes ranked',
  'ai.stat2': 'Text similarity',
  'ai.stat3': 'Preference rules',
  'ai.stat4': 'Occasion match',

  'quiz.step1.title': 'Tell us your taste',
  'quiz.step1.body': 'Diet, spice, budget, cuisine and the occasion — five quick questions.',
  'quiz.step2.title': 'The AI ranks the menu',
  'quiz.step2.body': 'Your taste, diet, budget, popularity and the occasion are blended into one score.',
  'quiz.step3.title': 'Your top 5, explained',
  'quiz.step3.body': 'Every dish comes with a score and a plain-English reason you can trust.',

  'quote.cta': 'Find your dish',

  'footer.explore': 'Explore',
  'footer.about': 'About us',
  'footer.visit': 'Visit & subscribe',
  'footer.brand.body':
    'Charcoal grill, Rwandan coffee and a menu that asks what you feel like before it suggests anything. Kiyovu, Kigali.',
  'footer.menu': 'Our menu',
  'footer.find': 'Find my dish',
  'footer.how': 'How it works',
  'footer.orders': 'My orders',
  'footer.basket': 'Basket',
  'footer.story': 'Our story',
  'footer.team': 'Meet the team',
  'footer.location': 'Location',
  'footer.hours': 'Opening hours',
  'footer.contact': 'Contact us',
  'footer.news': 'Stay updated with the latest news and offers!',
  'footer.email': 'you@email.com',
  'footer.submit': 'Submit',
  'footer.rights': 'All rights reserved.',
  'footer.privacy': 'Privacy',
  'footer.hours.line': 'Mon – Sun · 07:00 – 22:00',

  'common.language': 'Language',
  'common.close': 'Close',
  'common.menu': 'Menu',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.loading': 'Loading…',
  'common.error': 'Something went wrong. Please try again.',
  'common.required': 'Required',

  'menu.kicker': 'Our menu',
  'menu.title': 'A taste of',
  'menu.title.accent': 'Camellia.',
  'menu.body':
    'Everything the kitchen is serving today — filtered by category, diet, price or a word you remember. Prices in Rwandan francs.',
  'menu.search': 'Search dishes',
  'menu.all': 'All',
  'menu.sort.popular': 'Most popular',
  'menu.sort.price': 'Price: low to high',
  'menu.price': 'Price',
  'menu.add': 'Add',
  'menu.added': 'Added',

  'dish.ingredients': 'Ingredients',
  'dish.about': 'About this dish',
  'dish.add': 'Add to basket',
  'dish.rate': 'Rate this dish',
  'dish.back': 'Back to the menu',
  'dish.notfound': 'This dish is not on the menu',

  'cart.title': 'Your basket',
  'cart.empty': 'Your basket is empty.',
  'cart.subtotal': 'Subtotal',
  'cart.checkout': 'Place the order',
  'cart.remove': 'Remove',
  'cart.browse': 'Browse the menu',

  'orders.title': 'My orders',
  'orders.empty': 'You have not placed an order yet.',
  'orders.status': 'Status',

  'login.title': 'Sign in',
  'login.email': 'Email address',
  'login.password': 'Password',
  'login.submit': 'Sign in',
  'login.create': 'Create an account',
  'login.noaccount': 'No account yet?',
  'login.haveaccount': 'Already have an account?',

  'recommend.title': 'Find your dish',
  'recommend.subtitle': 'Five questions. One recommendation, explained.',
  'recommend.start': 'Start',
  'recommend.again': 'Start again',
  'recommend.results': 'Your top five',
  'recommend.why': 'Why this one',
};

const rw: Dict = {
  'nav.home': 'Ahabanza',
  'nav.menu': 'Ibiryo',
  'nav.recommend': 'Shakira ibiryo byanjye',
  'nav.about': 'Ibitwerekeyeho',
  'nav.orders': 'Ibyo natumije',
  'nav.cart': 'Agatebo',
  'nav.signin': 'Injira',
  'nav.signout': 'Sohoka',
  'nav.admin': 'Ubuyobozi',
  'nav.book': 'Fata ikigwi',

  'home.hero.line1': 'Ibiryo byiza',
  'home.hero.line2': 'bituma',
  'home.hero.line3': 'umunsi ushira neza',
  'home.hero.explore': 'Reba ibiryo byacu',
  'home.hero.ask': 'Baza AI',
  'home.aside.kicker': 'Ikigwi kuri meza yacu.',
  'home.aside.title1': 'Ibiryo byawe',
  'home.aside.title2': 'ukunda',
  'home.aside.lead': 'Bike ku byo ukunda. Byinshi ku munezero wo ku isahane yawe.',
  'home.aside.body':
    'Tubwire ibyo ukunda. Tuzabika ibyo wahisemo kandi tukwereke ibiryo bihuye nabyo.',
  'home.aside.cta': 'Reba umwirondoro wawe',

  'dishes.kicker': 'Kuri buri kifuzo',
  'dishes.title': 'Uburyohe bwa',
  'dishes.title.accent': 'Camelia.',
  'dishes.body':
    'Ibyiciro byenye, ibiryo makumyabiri na gatandatu, na AI imwe isoma menu yose mbere yo kugira icyo yifuza. Ibi ni ibiryo abakiriya bagarukiraho.',
  'dishes.all': 'Ibiryo byose',
  'dishes.view': 'Reba ubu',
  'dishes.empty.title': 'Iyo gikoni irafunze',
  'dishes.empty.body': 'Ntitwabashije kubona menu ubu. Ongera ugerageze ukanda uze.',
  'dishes.loading': 'Tegura ameza…',

  'ai.kicker': 'Byaguteguriwe',
  'ai.title1': 'Ntuzi icyo kurya?',
  'ai.title2': 'Reka menu ikubaze.',
  'ai.body':
    'Subiza ibibazo bitanu kandi sisitemu ya Camelia itanga amanota ku biryo byose ukurikije ibyo wasubije — indyo, urugero rw’ibirungo, ingengo y’imari, ubwoko bw’ibiryo n’igihe. Indyo zisabwa nta gukebwa zigomba: niba atari halal, ntizizigera ziboneka mu bisubizo bya halal.',
  'ai.cta': 'Tangira ibibazo by’amasegonda 60',
  'ai.how': 'Bikora gute',
  'ai.stat1': 'Ibiryo bipimwa',
  'ai.stat2': 'Ihura ry’inyandiko',
  'ai.stat3': 'Amabwiriza y’ibyifuzo',
  'ai.stat4': 'Guhura n’igihe',

  'quiz.step1.title': 'Tubwire uko urya',
  'quiz.step1.body': 'Indyo, ibirungo, ingengo y’imari, ubwoko bw’ibiryo n’igihe — ibibazo bitanu byihuse.',
  'quiz.step2.title': 'AI ipima menu',
  'quiz.step2.body': 'Ibyo ukunda, indyo, ingengo y’imari, icyamamare n’igihe bihurizwa hamwe mu manota amwe.',
  'quiz.step3.title': 'Ibiryo byawe bitanu, bisobanuye',
  'quiz.step3.body': 'Buri kiryo kiza n’amanota n’impamvu yoroshye wizera.',

  'quote.cta': 'Shakira ikiryo cyawe',

  'footer.explore': 'Reba',
  'footer.about': 'Ibitwerekeyeho',
  'footer.visit': 'Sura kandi wiyandikishe',
  'footer.brand.body':
    'Ibiryoshye ku makara, ikawa y’u Rwanda na menu ibaza uko wumva mbere yo kugira icyo yifuza. Kiyovu, Kigali.',
  'footer.menu': 'Menu yacu',
  'footer.find': 'Shakira ibiryo byanjye',
  'footer.how': 'Bikora gute',
  'footer.orders': 'Ibyo natumije',
  'footer.basket': 'Agatebo',
  'footer.story': 'Inkuru yacu',
  'footer.team': 'Menya itsinda',
  'footer.location': 'Aho tubarizwa',
  'footer.hours': 'Amasaha y’akazi',
  'footer.contact': 'Twandikire',
  'footer.news': 'Menya amakuru mashya n’ibiciro bishya!',
  'footer.email': 'imeri@yawe.com',
  'footer.submit': 'Ohereza',
  'footer.rights': 'Uburenganzira bwose burafitwe.',
  'footer.privacy': 'Ibanga',
  'footer.hours.line': 'Kuwa mbere – Ku cyumweru · 07:00 – 22:00',

  'common.language': 'Ururimi',
  'common.close': 'Funga',
  'common.menu': 'Menu',
  'common.back': 'Subira',
  'common.next': 'Komeza',
  'common.loading': 'Biratwara…',
  'common.error': 'Hari ikiduze. Ongera ugerageze.',
  'common.required': 'Bisabwa',

  'menu.kicker': 'Menu yacu',
  'menu.title': 'Uburyohe bwa',
  'menu.title.accent': 'Camellia.',
  'menu.body':
    'Ibiryo byose gikoni itanga uyu munsi — bishunguwe ku byiciro, indyo, igiciro cyangwa ijambo wibuka. Ibiciro mu mafaranga y’u Rwanda.',
  'menu.search': 'Shakisha ibiryo',
  'menu.all': 'Byose',
  'menu.sort.popular': 'Ibyamamare',
  'menu.sort.price': 'Igiciro: gito ugera ku kinini',
  'menu.price': 'Igiciro',
  'menu.add': 'Ongeraho',
  'menu.added': 'Byongewe',

  'dish.ingredients': 'Ibirimo',
  'dish.about': 'Ku byerekeye iki kiryo',
  'dish.add': 'Ongera mu gatebo',
  'dish.rate': 'Tanga amanota',
  'dish.back': 'Subira kuri menu',
  'dish.notfound': 'Iki kiryo nticyabonetse kuri menu',

  'cart.title': 'Agatebo kawe',
  'cart.empty': 'Agatebo kawe ni ubusa.',
  'cart.subtotal': 'Igiteranyo',
  'cart.checkout': 'Tuma ibiryo',
  'cart.remove': 'Kuraho',
  'cart.browse': 'Reba menu',

  'orders.title': 'Ibyo natumije',
  'orders.empty': 'Ntabwo waratumije ibiryo.',
  'orders.status': 'Uko bimeze',

  'login.title': 'Injira',
  'login.email': 'Aderesi ya imeri',
  'login.password': 'Ijambo ry’ibanga',
  'login.submit': 'Injira',
  'login.create': 'Fungura konti',
  'login.noaccount': 'Nta konti ufite?',
  'login.haveaccount': 'Usanzwe ufite konti?',

  'recommend.title': 'Shakira ikiryo cyawe',
  'recommend.subtitle': 'Ibibazo bitanu. Igisubizo kimwe, gisobanuye.',
  'recommend.start': 'Tangira',
  'recommend.again': 'Tangira bushya',
  'recommend.results': 'Ibiryo byawe bitanu bya mbere',
  'recommend.why': 'Kuki iki',
};

const fr: Dict = {
  'nav.home': 'Accueil',
  'nav.menu': 'Carte',
  'nav.recommend': 'Trouver mon plat',
  'nav.about': 'À propos',
  'nav.orders': 'Mes commandes',
  'nav.cart': 'Panier',
  'nav.signin': 'Se connecter',
  'nav.signout': 'Se déconnecter',
  'nav.admin': 'Tableau de bord',
  'nav.book': 'Réserver une table',

  'home.hero.line1': 'La bonne cuisine',
  'home.hero.line2': 'crée',
  'home.hero.line3': 'de belles journées',
  'home.hero.explore': 'Découvrir la carte',
  'home.hero.ask': 'Demander à l’IA',
  'home.aside.kicker': 'Une place à notre table.',
  'home.aside.title1': 'Votre prochain',
  'home.aside.title2': 'plat préféré',
  'home.aside.lead': 'Un peu de vos goûts. Beaucoup plus de plaisir dans votre assiette.',
  'home.aside.body':
    'Dites-nous ce que vous aimez. Nous enregistrons vos préférences et vous montrons les plats qui y correspondent.',
  'home.aside.cta': 'Voir votre profil',

  'dishes.kicker': 'Pour toutes les envies',
  'dishes.title': 'Un avant-goût de',
  'dishes.title.accent': 'Camelia.',
  'dishes.body':
    'Six catégories, vingt-six plats, et une IA qui lit toute la carte avant de suggérer. Voici les plats que nos clients redemandent.',
  'dishes.all': 'Tous les plats',
  'dishes.view': 'Voir maintenant',
  'dishes.empty.title': 'La cuisine est hors ligne',
  'dishes.empty.body': 'Nous n’avons pas pu charger la carte. Rechargez la page dans un instant.',
  'dishes.loading': 'On dresse la table…',

  'ai.kicker': 'Un peu plus personnel',
  'ai.title1': 'Vous hésitez ?',
  'ai.title2': 'Laissez la carte vous demander.',
  'ai.body':
    'Répondez à cinq questions : Camelia note chaque plat selon vos réponses — régime, épices, budget, cuisine et occasion. Les régimes sont des filtres stricts : un plat non halal n’apparaîtra jamais dans un résultat halal.',
  'ai.cta': 'Commencer le test de 60 secondes',
  'ai.how': 'Comment ça marche',
  'ai.stat1': 'Plats classés',
  'ai.stat2': 'Similarité du texte',
  'ai.stat3': 'Règles de préférence',
  'ai.stat4': 'Correspondance d’occasion',

  'quiz.step1.title': 'Dites-nous vos goûts',
  'quiz.step1.body': 'Régime, épices, budget, cuisine et occasion — cinq questions rapides.',
  'quiz.step2.title': 'L’IA classe la carte',
  'quiz.step2.body': 'Vos goûts, votre régime, votre budget, la popularité et l’occasion sont réunis en une seule note.',
  'quiz.step3.title': 'Vos cinq plats, expliqués',
  'quiz.step3.body': 'Chaque plat vient avec une note et une raison claire.',

  'quote.cta': 'Trouver mon plat',

  'footer.explore': 'Explorer',
  'footer.about': 'À propos',
  'footer.visit': 'Nous rendre visite',
  'footer.brand.body':
    'Grillade au charbon, café rwandais et une carte qui demande ce qui vous ferait plaisir avant de proposer quoi que ce soit. Kiyovu, Kigali.',
  'footer.menu': 'Notre carte',
  'footer.find': 'Trouver mon plat',
  'footer.how': 'Comment ça marche',
  'footer.orders': 'Mes commandes',
  'footer.basket': 'Panier',
  'footer.story': 'Notre histoire',
  'footer.team': 'L’équipe',
  'footer.location': 'Nous trouver',
  'footer.hours': 'Horaires',
  'footer.contact': 'Nous contacter',
  'footer.news': 'Restez informé des nouveautés et des offres !',
  'footer.email': 'vous@email.com',
  'footer.submit': 'Envoyer',
  'footer.rights': 'Tous droits réservés.',
  'footer.privacy': 'Confidentialité',
  'footer.hours.line': 'Lun – Dim · 07:00 – 22:00',

  'common.language': 'Langue',
  'common.close': 'Fermer',
  'common.menu': 'Carte',
  'common.back': 'Retour',
  'common.next': 'Continuer',
  'common.loading': 'Chargement…',
  'common.error': 'Une erreur est survenue. Veuillez réessayer.',
  'common.required': 'Obligatoire',

  'menu.kicker': 'Notre carte',
  'menu.title': 'Un avant-goût de',
  'menu.title.accent': 'Camellia.',
  'menu.body':
    'Tout ce que la cuisine sert aujourd’hui — filtré par catégorie, régime, prix ou un mot dont vous vous souvenez. Prix en francs rwandais.',
  'menu.search': 'Rechercher un plat',
  'menu.all': 'Tout',
  'menu.sort.popular': 'Les plus populaires',
  'menu.sort.price': 'Prix : croissant',
  'menu.price': 'Prix',
  'menu.add': 'Ajouter',
  'menu.added': 'Ajouté',

  'dish.ingredients': 'Ingrédients',
  'dish.about': 'À propos de ce plat',
  'dish.add': 'Ajouter au panier',
  'dish.rate': 'Noter ce plat',
  'dish.back': 'Retour à la carte',
  'dish.notfound': 'Ce plat n’est pas sur la carte',

  'cart.title': 'Votre panier',
  'cart.empty': 'Votre panier est vide.',
  'cart.subtotal': 'Sous-total',
  'cart.checkout': 'Passer la commande',
  'cart.remove': 'Retirer',
  'cart.browse': 'Voir la carte',

  'orders.title': 'Mes commandes',
  'orders.empty': 'Vous n’avez pas encore passé de commande.',
  'orders.status': 'Statut',

  'login.title': 'Se connecter',
  'login.email': 'Adresse e-mail',
  'login.password': 'Mot de passe',
  'login.submit': 'Se connecter',
  'login.create': 'Créer un compte',
  'login.noaccount': 'Pas encore de compte ?',
  'login.haveaccount': 'Vous avez déjà un compte ?',

  'recommend.title': 'Trouver votre plat',
  'recommend.subtitle': 'Cinq questions. Une recommandation, expliquée.',
  'recommend.start': 'Commencer',
  'recommend.again': 'Recommencer',
  'recommend.results': 'Vos cinq meilleurs plats',
  'recommend.why': 'Pourquoi celui-ci',
};

export const DICTS: Record<Lang, Dict> = { en, rw, fr };

/** Falls back to English when a key is missing, so no label ever renders blank. */
export function translate(lang: Lang, key: string): string {
  return DICTS[lang]?.[key] ?? DICTS.en[key] ?? key;
}
