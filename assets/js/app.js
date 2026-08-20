const DATA_URL = 'data/roasters.json';
const app = document.querySelector('#app');
const toast = document.querySelector('[data-toast]');

const ROAST_LABELS = {
  1: '浅煎り',
  2: '浅中煎り',
  3: '中煎り',
  4: '中深煎り',
  5: '深煎り',
};

const FLAVOR_LABELS = {
  fruity: 'フルーティー系',
  nutty_choco: 'ナッツ・チョコ系',
  spicy: 'スパイス系',
};

const FEATURE_LABELS = {
  subscription: '定期便あり',
  giftWrapping: 'ギフト対応',
  trialPack: 'お試しあり',
};

// Googleフォームの「都道府県」選択肢と同じ順番・同じ表記（末尾の都道府県は付けない）
const PREFECTURES = [
  '北海道', '青森', '岩手', '宮城', '秋田', '山形', '福島',
  '茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川',
  '新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜', '静岡', '愛知', '三重',
  '滋賀', '京都', '大阪', '兵庫', '奈良', '和歌山',
  '鳥取', '島根', '岡山', '広島', '山口',
  '徳島', '香川', '愛媛', '高知',
  '福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '沖縄',
];

const PREFECTURE_SUFFIX_MAP = { 東京: '都', 大阪: '府', 京都: '府' };
function prefectureLabel(name) {
  if (!name) return '';
  if (name === '北海道') return name;
  return name + (PREFECTURE_SUFFIX_MAP[name] || '県');
}

const QUESTIONS = [
  {
    id: 'drink',
    title: '普段好きな飲み物のタイプは？',
    lead: '近いものをひとつ選んでください。',
    options: [
      {
        value: 'fresh',
        label: 'さっぱり・軽やか',
        note: 'お茶や柑橘のような爽やかさ',
        icon: 'citrus',
        roast: 1.6,
        flavors: { fruity: 2 },
      },
      {
        value: 'milky',
        label: 'ミルクたっぷり',
        note: '丸みのある、やさしい味',
        icon: 'milk',
        roast: 3.5,
        flavors: { nutty_choco: 2 },
      },
      {
        value: 'bitter',
        label: 'ビター・しっかり',
        note: 'カカオのような深い味',
        icon: 'dark',
        roast: 4.7,
        flavors: { nutty_choco: 1.5, spicy: 0.5 },
      },
    ],
  },
  {
    id: 'mood',
    title: 'コーヒーに求めるものは？',
    lead: '飲みたい気分に近いものを選んでください。',
    options: [
      {
        value: 'clear',
        label: '気分をすっきりさせたい',
        note: '軽く、透明感のある一杯',
        icon: 'wind',
        roast: 2,
        flavors: { fruity: 1.2 },
      },
      {
        value: 'relax',
        label: 'ゆっくり、まったりしたい',
        note: '甘さとコクを感じる一杯',
        icon: 'cup',
        roast: 3.4,
        flavors: { nutty_choco: 1.5 },
      },
      {
        value: 'reward',
        label: 'ご褒美気分を味わいたい',
        note: '余韻が長い、印象的な一杯',
        icon: 'spark',
        roast: 4.1,
        flavors: { nutty_choco: 0.8, spicy: 0.8 },
      },
    ],
  },
  {
    id: 'flavor',
    title: '果物とチョコ、選ぶならどっち？',
    lead: 'コーヒー以外の好みから、味の方向を探します。',
    options: [
      {
        value: 'fruit',
        label: 'みずみずしい果物',
        note: '柑橘、ベリー、桃など',
        icon: 'fruit',
        roast: 2,
        flavors: { fruity: 3 },
      },
      {
        value: 'chocolate',
        label: 'チョコ・ナッツ',
        note: 'カカオ、アーモンドなど',
        icon: 'chocolate',
        roast: 3.7,
        flavors: { nutty_choco: 3 },
      },
      {
        value: 'spice',
        label: '香りのあるスパイス',
        note: 'シナモン、黒糖のような印象',
        icon: 'spice',
        roast: 4.1,
        flavors: { spicy: 3 },
      },
    ],
  },
  {
    id: 'scene',
    title: 'どんなときに飲むことが多い？',
    lead: '任意の質問です。サービスの相性を見る参考にします。',
    optional: true,
    options: [
      {
        value: 'daily',
        label: 'ほぼ毎日、いつもの一杯に',
        note: '切らさず楽しみたい',
        icon: 'calendar',
        feature: 'subscription',
      },
      {
        value: 'gift',
        label: '誰かへの贈り物に',
        note: '特別な一杯を届けたい',
        icon: 'gift',
        feature: 'giftWrapping',
      },
      {
        value: 'explore',
        label: '少しずつ試してみたい',
        note: '自分の好みを探したい',
        icon: 'sampler',
        feature: 'trialPack',
      },
    ],
  },
];

const state = {
  status: 'loading',
  error: null,
  roasters: [],
  quiz: {
    step: 0,
    answers: {},
    transitioning: false,
  },
  results: [],
  resultProfile: null,
  resultMeta: null,
  filters: {
    roasts: new Set(),
    flavors: new Set(),
    features: new Set(),
    prefecture: '',
    search: '',
    sort: 'newest',
    panelOpen: false,
  },
};

const PLACEHOLDER_IMAGE = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
    <rect width="1200" height="900" fill="#f3f3f1"/>
    <rect x="390" y="190" width="420" height="520" rx="25" fill="#fff" stroke="#d9d9d9" stroke-width="4"/>
    <rect x="455" y="340" width="290" height="210" rx="8" fill="#fafafa" stroke="#1a1a1a" stroke-width="3"/>
    <text x="600" y="430" text-anchor="middle" font-family="Arial,sans-serif" font-size="42" font-weight="700" fill="#1a1a1a">roscolle</text>
    <text x="600" y="485" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#666">PHOTO</text>
  </svg>
`)}`;

function escapeHTML(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function safeImagePath(value) {
  if (typeof value !== 'string' || !value.trim()) return PLACEHOLDER_IMAGE;
  const trimmed = value.trim();
  if (/^(?:\.\/)?images\/roasters\/[a-zA-Z0-9._-]+$/.test(trimmed)) return trimmed;
  return PLACEHOLDER_IMAGE;
}

function safeExternalUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value, window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch {
    return '';
  }
}

function normalizeRoaster(item) {
  const roastMin = Number(item?.roastLevel?.min);
  const roastMax = Number(item?.roastLevel?.max);
  const priceMin = Number(item?.priceRange?.min);
  const priceMax = Number(item?.priceRange?.max);
  const threshold = Number(item?.shipping?.freeThreshold);
  const flavors = Array.isArray(item?.flavorTags)
    ? item.flavorTags.filter((tag) => Object.hasOwn(FLAVOR_LABELS, tag))
    : [];

  return {
    id: typeof item?.id === 'string' ? item.id : '',
    name: typeof item?.name === 'string' ? item.name : '',
    ecUrl: typeof item?.ecUrl === 'string' ? item.ecUrl : '',
    sns: item?.sns && typeof item.sns === 'object'
      ? {
          type: typeof item.sns.type === 'string' ? item.sns.type : '',
          handle: typeof item.sns.handle === 'string' ? item.sns.handle : '',
        }
      : null,
    photo: typeof item?.photo === 'string' ? item.photo : '',
    roasterPhoto: typeof item?.roasterPhoto === 'string' ? item.roasterPhoto : '',
    description: typeof item?.description === 'string' ? item.description : '',
    roastLevel: {
      min: Number.isFinite(roastMin) ? Math.min(5, Math.max(1, roastMin)) : 3,
      max: Number.isFinite(roastMax) ? Math.min(5, Math.max(1, roastMax)) : 3,
    },
    flavorTags: flavors,
    priceRange: {
      min: Number.isFinite(priceMin) ? Math.max(0, priceMin) : 0,
      max: Number.isFinite(priceMax) ? Math.max(0, priceMax) : 0,
      unit: typeof item?.priceRange?.unit === 'string' ? item.priceRange.unit : '',
    },
    shipping: {
      freeThreshold: Number.isFinite(threshold) && threshold > 0 ? threshold : null,
    },
    subscription: Boolean(item?.subscription),
    giftWrapping: Boolean(item?.giftWrapping),
    flagshipProduct: typeof item?.flagshipProduct === 'string' ? item.flagshipProduct : '',
    trialPack: Boolean(item?.trialPack),
    shippingSpeed: typeof item?.shippingSpeed === 'string' ? item.shippingSpeed : '',
    roasterMessage: typeof item?.roasterMessage === 'string' ? item.roasterMessage : '',
    registeredAt: typeof item?.registeredAt === 'string' ? item.registeredAt : '',
    prefecture: typeof item?.prefecture === 'string' && PREFECTURES.includes(item.prefecture) ? item.prefecture : '',
    published: item?.published !== false,
  };
}

function validateRoasters(data) {
  if (!Array.isArray(data)) throw new Error('roasters.json のルートは配列である必要があります。');
  const normalized = data
    .map(normalizeRoaster)
    .filter((item) => item.id && item.name && item.published);
  if (!normalized.length) throw new Error('表示できる焙煎所データがありません。');
  return normalized;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function shortName(name) {
  return String(name).replace(/^ROSCOLLE DEMO \d+｜/, '');
}

function demoLabel(name) {
  const match = String(name).match(/^ROSCOLLE DEMO (\d+)｜/);
  return match ? `DEMO ${match[1]}` : '';
}

function roastRangeLabel(roastLevel) {
  const min = Math.round(roastLevel?.min || 3);
  const max = Math.round(roastLevel?.max || min);
  if (min === max) return ROAST_LABELS[min] || '中煎り';
  return `${ROAST_LABELS[min] || min}〜${ROAST_LABELS[max] || max}`;
}

function priceLabel(roaster) {
  const { min, max, unit } = roaster.priceRange;
  if (!min && !max) return '';
  const price = min === max || !max
    ? formatCurrency(min || max)
    : `${formatCurrency(min)}〜${formatCurrency(max)}`;
  return unit ? `${price} / ${unit}` : price;
}

function renderChips(roaster, { limit = 4 } = {}) {
  const labels = [
    roastRangeLabel(roaster.roastLevel),
    ...roaster.flavorTags.map((tag) => FLAVOR_LABELS[tag]).filter(Boolean),
  ].slice(0, limit);
  return labels.map((label) => `<span class="chip">${escapeHTML(label)}</span>`).join('');
}

function iconSVG(name) {
  const icons = {
    citrus: '<circle cx="32" cy="32" r="23"/><path d="M32 9v46M9 32h46M16 16l32 32M48 16 16 48"/>',
    milk: '<path d="M18 14h24l5 9v31H17V23l1-9Z"/><path d="M18 23h29M25 14V8h11v6M26 34c5 5 9 5 14 0"/>',
    dark: '<path d="M18 16h28l-3 38H21l-3-38Z"/><path d="M15 16h34M24 27h16M24 36h16M25 45h14"/>',
    wind: '<path d="M8 24h31c9 0 9-12 1-12-4 0-6 2-7 5M8 33h41c9 0 9 12 1 12-4 0-6-2-7-5M8 42h22"/>',
    cup: '<path d="M13 19h35v22c0 9-7 16-16 16h-3c-9 0-16-7-16-16V19Z"/><path d="M48 25h4c8 0 8 13 0 13h-4M23 10c-4 4 4 6 0 10M34 8c-4 4 4 6 0 10"/>',
    spark: '<path d="m32 7 5 17 17 5-17 5-5 17-5-17-17-5 17-5 5-17Z"/><path d="m51 45 2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7Z"/>',
    fruit: '<path d="M32 18c11-13 25-5 25 9 0 15-12 29-25 29S7 42 7 27c0-14 14-22 25-9Z"/><path d="M32 18c-1-8 3-12 10-14M34 12c5-5 11-5 16-1"/>',
    chocolate: '<rect x="10" y="12" width="44" height="44" rx="4"/><path d="M10 27h44M10 42h44M25 12v44M40 12v44"/>',
    spice: '<path d="M15 51 43 9l7 5-28 42-7-5Z"/><path d="M37 18c7 1 12 4 16 9M29 29c7 1 12 4 16 9M22 40c7 1 12 4 16 9"/>',
    calendar: '<rect x="9" y="13" width="46" height="42" rx="4"/><path d="M9 25h46M20 7v12M44 7v12M20 35h6M38 35h6M20 45h6M38 45h6"/>',
    gift: '<rect x="9" y="25" width="46" height="31" rx="3"/><path d="M32 25v31M7 17h50v10H7V17ZM32 17c-10 0-15-3-15-8 0-4 5-6 9-3 4 3 6 11 6 11ZM32 17c10 0 15-3 15-8 0-4-5-6-9-3-4 3-6 11-6 11Z"/>',
    sampler: '<path d="M11 18h14l3 39H14l-3-39ZM36 10h15l2 47H38l-2-47Z"/><path d="M11 27h15M36 22h16M17 38h6M42 34h6"/>',
  };
  return `<svg viewBox="0 0 64 64" aria-hidden="true">${icons[name] || icons.cup}</svg>`;
}

function roasterCard(roaster, options = {}) {
  const name = shortName(roaster.name);
  const demo = demoLabel(roaster.name);
  const price = priceLabel(roaster);
  const badge = options.badge || demo;
  return `
    <a class="roaster-card" href="#/roaster/${encodeURIComponent(roaster.id)}" aria-label="${escapeHTML(name)}の詳細を見る">
      <div class="roaster-card-image">
        <img src="${escapeHTML(safeImagePath(roaster.photo))}" alt="${escapeHTML(name)}の商品写真" loading="lazy" width="1200" height="900">
        ${badge ? `<span class="card-badge">${escapeHTML(badge)}</span>` : ''}
        ${options.rank ? `<span class="card-rank">${String(options.rank).padStart(2, '0')}</span>` : ''}
      </div>
      <div class="roaster-card-body">
        <div class="roaster-card-meta">
          <span>登録 ${escapeHTML(formatDate(roaster.registeredAt))}</span>
          <span>${escapeHTML(price)}</span>
        </div>
        <h3>${escapeHTML(name)}</h3>
        <p class="roaster-card-description">${escapeHTML(roaster.description)}</p>
        <div class="chips">${renderChips(roaster)}</div>
        <div class="roaster-card-footer">
          <span class="price-small">${roaster.trialPack ? 'お試しセットあり' : '公式ECで商品を見る'}</span>
          <span class="card-arrow" aria-hidden="true">→</span>
        </div>
      </div>
    </a>`;
}

function getRoute() {
  const raw = window.location.hash.startsWith('#/')
    ? window.location.hash.slice(2)
    : 'home';
  const [pathPart = 'home', queryPart = ''] = raw.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  return {
    name: segments[0] || 'home',
    id: segments[1] ? decodeURIComponent(segments[1]) : '',
    params: new URLSearchParams(queryPart),
  };
}

function setDocumentTitle(title) {
  document.title = title ? `${title}｜roscolle` : 'roscolle｜オンラインにも、行きつけができる。';
}

function updateActiveNav(routeName) {
  const activeRoute = routeName === 'roaster' ? 'list' : routeName === 'results' ? 'quiz' : routeName;
  document.querySelectorAll('[data-nav]').forEach((link) => {
    const active = link.dataset.nav === activeRoute;
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function closeMenu() {
  const button = document.querySelector('[data-menu-button]');
  const menu = document.querySelector('[data-mobile-menu]');
  if (!button || !menu) return;
  button.setAttribute('aria-expanded', 'false');
  button.querySelector('.sr-only').textContent = 'メニューを開く';
  menu.hidden = true;
  document.body.classList.remove('menu-open');
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

function renderLoading() {
  app.innerHTML = `
    <section class="loading-screen" aria-label="読み込み中">
      <div class="loading-mark" aria-hidden="true"><span></span><span></span><span></span></div>
      <p>焙煎所の情報を読み込んでいます。</p>
    </section>`;
}

function renderError() {
  setDocumentTitle('読み込みエラー');
  app.innerHTML = `
    <section class="error-screen">
      <div class="error-box">
        <p class="eyebrow">Data loading error</p>
        <h1>焙煎所データを読み込めませんでした。</h1>
        <p>${escapeHTML(state.error?.message || '不明なエラーが発生しました。')}</p>
        <p>ローカルで確認するときは、ファイルを直接開かずHTTPサーバーから表示してください。</p>
        <code>python3 -m http.server 8000</code>
        <button class="btn btn--primary" type="button" data-action="retry-data">もう一度読み込む</button>
      </div>
    </section>`;
}

function homeTemplate() {
  const newest = [...state.roasters]
    .sort((a, b) => String(b.registeredAt).localeCompare(String(a.registeredAt)))
    .slice(0, 3);
  const heroRoaster = newest[0] || state.roasters[0];
  const heroName = shortName(heroRoaster.name);

  return `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">自家焙煎珈琲豆のポータルサイト</p>
        <h1><span>自家焙煎珈琲豆にも、</span><span>オンラインの行きつけを。</span></h1>
        <p class="hero-lead">いくつかの質問に答えるだけで、今のあなたに合う自家焙煎珈琲豆のお店をご案内します。専門用語は必要ありません。</p>
        <div class="btn-row">
          <a class="btn btn--primary" href="#/quiz">味の好み診断をはじめる</a>
          <a class="btn" href="#/list">一覧から探す</a>
        </div>
        <p class="hero-note">全4問・約1分。登録やログインは不要です。</p>
      </div>
      <div class="hero-visual">
        <img class="hero-main-image" src="${escapeHTML(safeImagePath(heroRoaster.photo))}" alt="${escapeHTML(heroName)}の商品写真" width="1200" height="900">
        <div class="hero-floating">
          <div class="hero-floating-label"><span>NEW ROASTER</span><span>${escapeHTML(formatDate(heroRoaster.registeredAt))}</span></div>
          <strong>${escapeHTML(heroName)}</strong>
          <p>${escapeHTML(roastRangeLabel(heroRoaster.roastLevel))}・${escapeHTML(heroRoaster.flavorTags.map((tag) => FLAVOR_LABELS[tag]).filter(Boolean).join(' / '))}</p>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="section-heading">
          <div>
            <p class="section-kicker">Two ways to find</p>
            <h2>迷わず見つける、2つの入口。</h2>
          </div>
          <p>好みがまだ言葉になっていない人は診断から。自分で比べたい人は、タグと価格から探せます。</p>
        </div>
        <div class="entry-grid">
          <article class="entry-panel">
            <span class="entry-number">01 / TASTE QUIZ</span>
            <div>
              <h3>質問に答えて見つける</h3>
              <p>「さっぱり」「チョコっぽい」など、日常の言葉で好みを聞きます。結果には、おすすめする理由も添えます。</p>
            </div>
            <a class="text-link" href="#/quiz">診断してみる</a>
          </article>
          <article class="entry-panel">
            <span class="entry-number">02 / DIRECTORY</span>
            <div>
              <h3>一覧を見比べて探す</h3>
              <p>味の傾向、価格、定期便やギフト対応を見ながら、気になる焙煎所を自分のペースで選べます。</p>
            </div>
            <a class="text-link" href="#/list">焙煎所一覧へ</a>
          </article>
        </div>
      </div>
    </section>

    <section class="section section--surface">
      <div class="container">
        <div class="section-heading">
          <div>
            <p class="section-kicker">New roasters</p>
            <h2>新着の焙煎所</h2>
          </div>
          <a class="text-link" href="#/list">すべて見る</a>
        </div>
        <div class="roaster-grid">${newest.map((roaster) => roasterCard(roaster)).join('')}</div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="taste-panel">
          <p class="section-kicker">Browse by taste</p>
          <h2>いま飲みたい味から、気軽に探す。</h2>
          <p>細かな産地や精製方法を知らなくても大丈夫。近いイメージを選ぶと、その味を得意とする焙煎所に絞り込みます。</p>
          <div class="chips">
            <button class="chip" type="button" data-action="quick-filter" data-filter-type="roast" data-filter-value="1">軽やか・浅煎り</button>
            <button class="chip" type="button" data-action="quick-filter" data-filter-type="flavor" data-filter-value="fruity">果物のような明るさ</button>
            <button class="chip" type="button" data-action="quick-filter" data-filter-type="flavor" data-filter-value="nutty_choco">チョコ・ナッツの甘さ</button>
            <button class="chip" type="button" data-action="quick-filter" data-filter-type="roast" data-filter-value="5">しっかり・深煎り</button>
            <button class="chip" type="button" data-action="quick-filter" data-filter-type="feature" data-filter-value="trialPack">少量から試したい</button>
            <button class="chip" type="button" data-action="quick-filter" data-filter-type="feature" data-filter-value="giftWrapping">贈り物を探したい</button>
          </div>
        </div>
      </div>
    </section>

    <section class="section" id="about">
      <div class="container">
        <div class="about-grid">
          <div>
            <p class="section-kicker">About roscolle</p>
            <h2>顔の見える一杯を、いつもの選択肢に。</h2>
          </div>
          <div class="about-copy">
            <p>roscolleは、全国の小さな自家焙煎所を集めたポータルサイトです。一度きりの発見で終わらず、気に入った店をオンラインの「行きつけ」にできる場所を目指しています。</p>
            <p>購入はそれぞれの公式ECサイトで行います。ロスコレは店と出会う入口に徹し、焙煎者がつくる商品の魅力と、その人らしさを丁寧に紹介します。</p>
            <div class="about-points">
              <div class="about-point"><strong>診断で出会う</strong><span>専門用語なしで、好みに近い店をご案内</span></div>
              <div class="about-point"><strong>自分で比べる</strong><span>タグ・価格・サービスから自由に検索</span></div>
              <div class="about-point"><strong>公式店で買う</strong><span>気になる店のECサイトへ直接アクセス</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>`;
}

function quizTemplate() {
  const step = Math.min(state.quiz.step, QUESTIONS.length - 1);
  const question = QUESTIONS[step];
  const selected = state.quiz.answers[question.id] || '';
  const progress = ((step + 1) / QUESTIONS.length) * 100;

  return `
    <section class="quiz-shell">
      <div class="quiz-topbar">
        <button class="quiz-back" type="button" data-action="quiz-back">${step === 0 ? 'トップへ戻る' : 'ひとつ戻る'}</button>
        <span class="quiz-step">${step + 1} / ${QUESTIONS.length}</span>
        <span aria-hidden="true"></span>
        <div class="quiz-progress" aria-label="診断の進捗 ${step + 1}/${QUESTIONS.length}"><span style="width:${progress}%"></span></div>
      </div>

      <div class="quiz-heading">
        <p class="eyebrow">Taste quiz</p>
        <h1>${escapeHTML(question.title)}</h1>
        <p>${escapeHTML(question.lead)}</p>
      </div>

      <div class="quiz-options" role="group" aria-label="${escapeHTML(question.title)}">
        ${question.options.map((option) => `
          <button class="quiz-option" type="button" aria-pressed="${selected === option.value}" data-action="quiz-option" data-question="${escapeHTML(question.id)}" data-value="${escapeHTML(option.value)}">
            <span class="option-icon">${iconSVG(option.icon)}</span>
            <span><strong>${escapeHTML(option.label)}</strong><span>${escapeHTML(option.note)}</span></span>
          </button>`).join('')}
      </div>

      ${question.optional ? '<div class="quiz-controls"><button class="skip-button" type="button" data-action="quiz-skip">今回は選ばずに結果を見る</button></div>' : ''}
    </section>`;
}

function buildQuizProfile() {
  const roastValues = [];
  const flavorWeights = { fruity: 0, nutty_choco: 0, spicy: 0 };
  let desiredFeature = '';

  QUESTIONS.forEach((question) => {
    const answer = state.quiz.answers[question.id];
    const option = question.options.find((item) => item.value === answer);
    if (!option) return;
    if (Number.isFinite(option.roast)) roastValues.push(option.roast);
    Object.entries(option.flavors || {}).forEach(([key, weight]) => {
      flavorWeights[key] = (flavorWeights[key] || 0) + weight;
    });
    if (option.feature) desiredFeature = option.feature;
  });

  const targetRoast = roastValues.length
    ? roastValues.reduce((sum, value) => sum + value, 0) / roastValues.length
    : 3;
  const desiredFlavors = Object.entries(flavorWeights)
    .filter(([, weight]) => weight > 0)
    .sort((a, b) => b[1] - a[1]);

  return { targetRoast, flavorWeights, desiredFlavors, desiredFeature };
}

function distanceFromRange(target, min, max) {
  if (target < min) return min - target;
  if (target > max) return target - max;
  return 0;
}

function generateReason(roaster, profile) {
  const shared = profile.desiredFlavors.find(([tag]) => roaster.flavorTags.includes(tag));
  const flavor = shared?.[0] || roaster.flavorTags[0];
  const flavorPhrases = {
    fruity: '果物を思わせる明るさがあり、',
    nutty_choco: 'チョコやナッツのような甘いコクがあり、',
    spicy: 'カカオやスパイスを思わせる印象があり、',
  };
  const midpoint = (roaster.roastLevel.min + roaster.roastLevel.max) / 2;
  const roastPhrase = midpoint <= 2.2
    ? 'すっきり軽やかな一杯を探しているあなたに合いそうです。'
    : midpoint >= 4.2
      ? 'しっかりした飲みごたえを求める日に向いています。'
      : '甘さと飲みやすさのバランスを楽しめます。';
  const featurePhrase = profile.desiredFeature && roaster[profile.desiredFeature]
    ? ` ${FEATURE_LABELS[profile.desiredFeature]}なので、飲み方の希望にも合っています。`
    : '';
  return `${flavorPhrases[flavor] || '味わいのバランスがよく、'}${roastPhrase}${featurePhrase}`;
}

function runDiagnosis() {
  const profile = buildQuizProfile();
  const totalFlavorWeight = Math.max(
    1,
    Object.values(profile.flavorWeights).reduce((sum, value) => sum + value, 0),
  );

  const scored = state.roasters.map((roaster) => {
    const distance = distanceFromRange(
      profile.targetRoast,
      roaster.roastLevel.min,
      roaster.roastLevel.max,
    );
    const matchedFlavorWeight = roaster.flavorTags.reduce(
      (sum, tag) => sum + (profile.flavorWeights[tag] || 0),
      0,
    );
    const roastScore = Math.max(8, 58 - distance * 18);
    const flavorScore = (matchedFlavorWeight / totalFlavorWeight) * 32;
    const featureScore = profile.desiredFeature && roaster[profile.desiredFeature] ? 8 : 0;
    const rangeBonus = distance === 0 ? 2 : 0;
    const tieBreaker = Math.random() * 2.5;
    const rawScore = roastScore + flavorScore + featureScore + rangeBonus;
    const percent = Math.max(52, Math.min(98, Math.round(rawScore)));
    const primaryFlavor = profile.desiredFlavors[0]?.[0];
    const exact = distance === 0 && (!primaryFlavor || roaster.flavorTags.includes(primaryFlavor));

    return {
      roaster,
      score: rawScore + tieBreaker,
      percent,
      exact,
      reason: generateReason(roaster, profile),
    };
  });

  scored.sort((a, b) => b.score - a.score);
  state.results = scored.slice(0, Math.min(3, scored.length));
  state.resultProfile = profile;
  state.resultMeta = { exactCount: scored.filter((item) => item.exact).length };
  try {
    window.sessionStorage.setItem('roscolleQuizAnswers', JSON.stringify(state.quiz.answers));
  } catch {
    // Storage may be unavailable in privacy-restricted contexts; diagnosis still works.
  }
  window.location.hash = '#/results';
}

function resultsTemplate() {
  if (!state.results.length) {
    return `
      <section class="not-found-screen">
        <p class="eyebrow">No diagnosis yet</p>
        <h1>まだ診断結果がありません。</h1>
        <p>4つの質問から、今の好みに近い焙煎所を探します。</p>
        <a class="btn btn--primary" href="#/quiz">診断をはじめる</a>
      </section>`;
  }

  const relaxed = state.resultMeta?.exactCount === 0;
  return `
    <section class="section">
      <div class="container">
        <div class="result-intro">
          <div class="result-check" aria-hidden="true">✓</div>
          <p class="eyebrow">Your matches</p>
          <h1>あなたにおすすめの焙煎所</h1>
          <p>${relaxed ? '完全一致がなかったため、条件を少し広げて近い味わいから選びました。' : '回答に近い味を得意とする店を、相性の高い順にご案内します。'}</p>
        </div>

        <div class="result-grid">
          ${state.results.map((result, index) => {
            const roaster = result.roaster;
            const name = shortName(roaster.name);
            return `
              <article class="result-card">
                <div class="result-image">
                  <img src="${escapeHTML(safeImagePath(roaster.photo))}" alt="${escapeHTML(name)}の商品写真" width="1200" height="900">
                  <span class="card-rank">${String(index + 1).padStart(2, '0')}</span>
                  <span class="match-score">マッチ度 ${result.percent}%</span>
                </div>
                <div class="result-card-body">
                  <h2>${escapeHTML(name)}</h2>
                  <p class="result-reason">${escapeHTML(result.reason)}</p>
                  <div class="chips">${renderChips(roaster)}</div>
                  <div class="result-actions">
                    <a class="btn btn--primary btn--small" href="#/roaster/${encodeURIComponent(roaster.id)}">詳しく見る</a>
                    ${safeExternalUrl(roaster.ecUrl) ? `<a class="btn btn--small btn--external" href="${escapeHTML(safeExternalUrl(roaster.ecUrl))}" target="_blank" rel="noopener noreferrer">公式ECへ</a>` : ''}
                  </div>
                </div>
              </article>`;
          }).join('')}
        </div>

        <div class="result-followup">
          <div>
            <h2>ほかの店も見比べてみる</h2>
            <p>味のタグや価格から、すべての焙煎所を自由に探せます。</p>
          </div>
          <div class="btn-row">
            <a class="btn btn--primary" href="#/list">一覧ページへ</a>
            <button class="btn" type="button" data-action="reset-quiz">もう一度診断する</button>
          </div>
        </div>
      </div>
    </section>`;
}

function resetFilters() {
  state.filters.roasts.clear();
  state.filters.flavors.clear();
  state.filters.features.clear();
  state.filters.prefecture = '';
  state.filters.search = '';
  state.filters.sort = 'newest';
}

function filterButton(group, value, label) {
  const selected = state.filters[group].has(String(value));
  return `<button class="chip" type="button" aria-pressed="${selected}" data-action="toggle-filter" data-filter-group="${escapeHTML(group)}" data-filter-value="${escapeHTML(value)}">${escapeHTML(label)}</button>`;
}

function filteredRoasters() {
  const search = state.filters.search.trim().toLocaleLowerCase('ja');
  const result = state.roasters.filter((roaster) => {
    if (search) {
      const haystack = [
        roaster.name,
        roaster.description,
        roaster.flagshipProduct,
        ...roaster.flavorTags.map((tag) => FLAVOR_LABELS[tag] || ''),
      ].join(' ').toLocaleLowerCase('ja');
      if (!haystack.includes(search)) return false;
    }

    if (state.filters.roasts.size) {
      const matchesRoast = [...state.filters.roasts].some((value) => {
        const level = Number(value);
        return level >= roaster.roastLevel.min && level <= roaster.roastLevel.max;
      });
      if (!matchesRoast) return false;
    }

    if (state.filters.flavors.size) {
      const matchesFlavor = [...state.filters.flavors].some((tag) => roaster.flavorTags.includes(tag));
      if (!matchesFlavor) return false;
    }

    if (state.filters.features.size) {
      const matchesFeatures = [...state.filters.features].every((feature) => Boolean(roaster[feature]));
      if (!matchesFeatures) return false;
    }

    if (state.filters.prefecture) {
      if (roaster.prefecture !== state.filters.prefecture) return false;
    }

    return true;
  });

  return result.sort((a, b) => {
    switch (state.filters.sort) {
      case 'price-low':
        return (a.priceRange.min || Number.MAX_SAFE_INTEGER) - (b.priceRange.min || Number.MAX_SAFE_INTEGER);
      case 'price-high':
        return (b.priceRange.max || 0) - (a.priceRange.max || 0);
      case 'name':
        return shortName(a.name).localeCompare(shortName(b.name), 'ja');
      case 'newest':
      default:
        return String(b.registeredAt).localeCompare(String(a.registeredAt));
    }
  });
}

function directoryTemplate() {
  const roasters = filteredRoasters();
  const isDesktop = window.matchMedia('(min-width: 1021px)').matches;
  const panelOpen = isDesktop || state.filters.panelOpen;
  const activeCount = state.filters.roasts.size + state.filters.flavors.size + state.filters.features.size
    + (state.filters.prefecture ? 1 : 0);

  return `
    <section class="page-hero">
      <div class="container">
        <div class="breadcrumbs"><a href="#/home">トップ</a><span>/</span><span>焙煎所一覧</span></div>
        <p class="eyebrow">Roaster directory</p>
        <h1>焙煎所を探す</h1>
        <p>味のイメージやサービスから絞り込み、気になる小さな焙煎所を見つけられます。</p>
      </div>
    </section>

    <section class="section">
      <div class="container directory-layout">
        <details class="filter-panel" ${panelOpen ? 'open' : ''}>
          <summary>絞り込み ${activeCount ? `<span class="chip chip--dark">${activeCount}</span>` : ''}</summary>
          <div class="filter-content">
            <div class="filter-group">
              <span class="filter-title">都道府県</span>
              <label class="search-field">
                <span class="sr-only">都道府県で絞り込み</span>
                <input type="text" list="prefecture-options" value="${escapeHTML(state.filters.prefecture)}" placeholder="都道府県で検索・選択" data-directory-prefecture>
              </label>
              <datalist id="prefecture-options">
                ${PREFECTURES.map((name) => `<option value="${escapeHTML(name)}">${escapeHTML(prefectureLabel(name))}</option>`).join('')}
              </datalist>
              ${state.filters.prefecture ? `<button class="filter-clear" type="button" data-action="clear-prefecture">「${escapeHTML(prefectureLabel(state.filters.prefecture))}」を解除</button>` : ''}
            </div>
            <div class="filter-group">
              <span class="filter-title">焙煎の深さ</span>
              <div class="chips">
                ${Object.entries(ROAST_LABELS).map(([value, label]) => filterButton('roasts', value, label)).join('')}
              </div>
            </div>
            <div class="filter-group">
              <span class="filter-title">味のイメージ</span>
              <div class="chips">
                ${Object.entries(FLAVOR_LABELS).map(([value, label]) => filterButton('flavors', value, label)).join('')}
              </div>
              <p class="filter-help">同じ項目の中では、選んだタグのどれかに当てはまる店を表示します。</p>
            </div>
            <div class="filter-group">
              <span class="filter-title">サービス</span>
              <div class="chips">
                ${Object.entries(FEATURE_LABELS).map(([value, label]) => filterButton('features', value, label)).join('')}
              </div>
              <p class="filter-help">サービスは、選んだ条件をすべて満たす店に絞り込みます。</p>
            </div>
            <button class="filter-clear" type="button" data-action="clear-filters">条件をすべて解除</button>
          </div>
        </details>

        <div class="directory-main">
          <div class="quiz-banner">
            <div><strong>どれを選べばいいか迷ったら</strong><span>4つの質問から、好みに近い焙煎所をご案内します。</span></div>
            <a class="btn btn--small" href="#/quiz">味の好み診断</a>
          </div>

          <div class="directory-toolbar">
            <label class="search-field">
              <span class="sr-only">店名・キーワードで検索</span>
              <input type="search" value="${escapeHTML(state.filters.search)}" placeholder="店名・キーワードで検索" data-directory-search>
            </label>
            <label>
              <span class="sr-only">並び替え</span>
              <select data-directory-sort>
                <option value="newest" ${state.filters.sort === 'newest' ? 'selected' : ''}>新着順</option>
                <option value="price-low" ${state.filters.sort === 'price-low' ? 'selected' : ''}>価格が低い順</option>
                <option value="price-high" ${state.filters.sort === 'price-high' ? 'selected' : ''}>価格が高い順</option>
                <option value="name" ${state.filters.sort === 'name' ? 'selected' : ''}>店名順</option>
              </select>
            </label>
          </div>

          <div class="directory-status">
            <span>${roasters.length}件を表示</span>
            <span>${activeCount || state.filters.search ? '条件を反映中' : `全${state.roasters.length}件`}</span>
          </div>

          <div class="directory-grid">
            ${roasters.length
              ? roasters.map((roaster) => roasterCard(roaster)).join('')
              : `<div class="empty-state"><h2>条件に合う焙煎所がありません。</h2><p>タグを減らすか、検索キーワードを変えてお試しください。</p><button class="btn btn--primary" type="button" data-action="clear-filters">条件を解除する</button></div>`}
          </div>
        </div>
      </div>
    </section>`;
}

function snsUrl(sns) {
  if (!sns?.handle) return '';
  if (/^https?:\/\//i.test(sns.handle)) return safeExternalUrl(sns.handle);
  const handle = sns.handle.replace(/^@/, '').trim();
  if (!handle) return '';
  if (sns.type.toLowerCase() === 'instagram') return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
  if (['x', 'twitter'].includes(sns.type.toLowerCase())) return `https://x.com/${encodeURIComponent(handle)}`;
  return '';
}

function infoRow(label, value) {
  if (!value) return '';
  return `<div class="info-row"><dt>${escapeHTML(label)}</dt><dd>${escapeHTML(value)}</dd></div>`;
}

function relatedRoasters(current) {
  const midpoint = (current.roastLevel.min + current.roastLevel.max) / 2;
  return state.roasters
    .filter((roaster) => roaster.id !== current.id)
    .map((roaster) => {
      const shared = roaster.flavorTags.filter((tag) => current.flavorTags.includes(tag)).length;
      const otherMidpoint = (roaster.roastLevel.min + roaster.roastLevel.max) / 2;
      return { roaster, score: shared * 10 - Math.abs(midpoint - otherMidpoint) };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.roaster);
}

function detailTemplate(roaster) {
  if (!roaster) {
    return `
      <section class="not-found-screen">
        <p class="eyebrow">Not found</p>
        <h1>焙煎所が見つかりません。</h1>
        <p>掲載が終了したか、URLが変更された可能性があります。</p>
        <a class="btn btn--primary" href="#/list">焙煎所一覧へ</a>
      </section>`;
  }

  const name = shortName(roaster.name);
  const demo = demoLabel(roaster.name);
  const ecUrl = safeExternalUrl(roaster.ecUrl);
  const socialUrl = snsUrl(roaster.sns);
  const related = relatedRoasters(roaster);
  const storyExists = Boolean(roaster.roasterPhoto || roaster.roasterMessage);

  const infoRows = [
    roaster.prefecture ? infoRow('所在地', prefectureLabel(roaster.prefecture)) : '',
    infoRow('価格帯の目安', priceLabel(roaster)),
    roaster.shipping.freeThreshold
      ? infoRow('送料無料ライン', `${formatCurrency(roaster.shipping.freeThreshold)}以上`)
      : '',
    infoRow('定期便（サブスク）', roaster.subscription ? 'あり' : 'なし'),
    infoRow('ギフト包装', roaster.giftWrapping ? '対応あり' : '対応なし'),
    roaster.flagshipProduct ? infoRow('看板商品', roaster.flagshipProduct) : '',
    roaster.trialPack ? infoRow('お試しセット', 'あり') : '',
    roaster.shippingSpeed ? infoRow('発送までの目安', roaster.shippingSpeed) : '',
  ].join('');

  return `
    <section class="detail-hero">
      <div class="container">
        <div class="breadcrumbs"><a href="#/home">トップ</a><span>/</span><a href="#/list">焙煎所一覧</a><span>/</span><span>${escapeHTML(name)}</span></div>
        <div class="detail-grid">
          <div class="detail-main-image">
            <img src="${escapeHTML(safeImagePath(roaster.photo))}" alt="${escapeHTML(name)}の商品写真" width="1200" height="900">
          </div>
          <div class="detail-content">
            <p class="eyebrow">${escapeHTML(demo || 'Independent roaster')}</p>
            <h1>${escapeHTML(name)}</h1>
            <p class="detail-date">掲載日 ${escapeHTML(formatDate(roaster.registeredAt))}</p>
            <div class="chips">${renderChips(roaster, { limit: 6 })}</div>
            <p class="detail-description">${escapeHTML(roaster.description)}</p>
            <dl class="info-table">${infoRows}</dl>
            ${ecUrl ? `<a class="btn btn--primary btn--wide btn--external" href="${escapeHTML(ecUrl)}" target="_blank" rel="noopener noreferrer">公式ECサイトで購入する</a><p class="detail-cta-note">別サイトが開きます。購入・決済は各焙煎所の公式ECサイトで行います。</p>` : ''}
            ${socialUrl ? `<a class="sns-link" href="${escapeHTML(socialUrl)}" target="_blank" rel="noopener noreferrer"><span>${escapeHTML(roaster.sns.type === 'instagram' ? 'Instagram' : 'X')}</span><span>${escapeHTML(roaster.sns.handle)}</span></a>` : ''}
          </div>
        </div>
      </div>
    </section>

    ${storyExists ? `
      <section class="story-section">
        <div class="container story-grid ${roaster.roasterPhoto ? '' : 'story-grid--text-only'}">
          ${roaster.roasterPhoto ? `<div class="story-image"><img src="${escapeHTML(safeImagePath(roaster.roasterPhoto))}" alt="${escapeHTML(name)}の焙煎者イメージ" loading="lazy" width="1200" height="800"></div>` : ''}
          <div class="story-copy">
            <p class="section-kicker">From the roaster</p>
            <h2>${roaster.roasterMessage ? '焙煎者から、ひとこと。' : 'このコーヒーを焙煎する人。'}</h2>
            ${roaster.roasterMessage ? `<p class="story-message">${escapeHTML(roaster.roasterMessage)}</p>` : ''}
          </div>
        </div>
      </section>` : ''}

    ${related.length ? `
      <section class="related-section">
        <div class="container">
          <div class="section-heading">
            <div><p class="section-kicker">More roasters</p><h2>ほかの焙煎所も見る</h2></div>
            <a class="text-link" href="#/list">一覧へ戻る</a>
          </div>
          <div class="roaster-grid">${related.map((item) => roasterCard(item)).join('')}</div>
        </div>
      </section>` : ''}`;
}

function renderRoute({ scroll = true } = {}) {
  if (state.status === 'loading') {
    renderLoading();
    return;
  }
  if (state.status === 'error') {
    renderError();
    return;
  }

  const route = getRoute();
  updateActiveNav(route.name);

  switch (route.name) {
    case 'quiz':
      setDocumentTitle('味の好み診断');
      app.innerHTML = quizTemplate();
      break;
    case 'results':
      setDocumentTitle('診断結果');
      app.innerHTML = resultsTemplate();
      break;
    case 'list':
      setDocumentTitle('焙煎所一覧');
      app.innerHTML = directoryTemplate();
      break;
    case 'roaster': {
      const roaster = state.roasters.find((item) => item.id === route.id);
      setDocumentTitle(roaster ? shortName(roaster.name) : '焙煎所が見つかりません');
      app.innerHTML = detailTemplate(roaster);
      break;
    }
    case 'home':
    default:
      setDocumentTitle('');
      app.innerHTML = homeTemplate();
      break;
  }

  if (scroll) {
    window.scrollTo({ top: 0, behavior: 'instant' });
    app.focus({ preventScroll: true });
  }

  if (route.name === 'home' && route.params.get('section') === 'about') {
    window.requestAnimationFrame(() => {
      document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

async function loadData() {
  state.status = 'loading';
  state.error = null;
  renderLoading();
  try {
    const response = await fetch(DATA_URL, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${DATA_URL} の取得に失敗しました（HTTP ${response.status}）。`);
    const data = await response.json();
    state.roasters = validateRoasters(data);
    state.status = 'ready';
    renderRoute();
  } catch (error) {
    console.error(error);
    state.status = 'error';
    state.error = error instanceof Error ? error : new Error('データの読み込みに失敗しました。');
    renderError();
  }
}

/**
 * 診断画面をフェードアウトさせてから callback を実行する（次の設問・結果表示への切り替え用）。
 * .quiz-shell が見つからない場合や、動きを減らす設定が有効な場合は、待たずに即実行する。
 */
function fadeOutQuiz(callback) {
  const shell = document.querySelector('.quiz-shell');
  const prefersReducedMotion = window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!shell || prefersReducedMotion) {
    callback();
    return;
  }

  shell.classList.add('is-leaving');
  window.setTimeout(callback, 400); // CSS側の .quiz-shell.is-leaving の transition時間と合わせる
}

function resetQuiz() {
  state.quiz.step = 0;
  state.quiz.answers = {};
  state.quiz.transitioning = false;
  state.results = [];
  state.resultProfile = null;
  state.resultMeta = null;
  try {
    window.sessionStorage.removeItem('roscolleQuizAnswers');
  } catch {
    // Storage is optional.
  }
  if (getRoute().name === 'quiz') renderRoute({ scroll: true });
  else window.location.hash = '#/quiz';
}

function handleAppClick(event) {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  if (action === 'retry-data') {
    loadData();
    return;
  }

  if (action === 'quiz-option') {
    if (state.quiz.transitioning) return; // 選択中の二重クリックを防ぐ
    state.quiz.answers[target.dataset.question] = target.dataset.value;
    state.quiz.transitioning = true;
    renderRoute({ scroll: false }); // 選択した状態をいったん見せる
    window.setTimeout(() => {
      fadeOutQuiz(() => {
        state.quiz.transitioning = false;
        if (state.quiz.step >= QUESTIONS.length - 1) runDiagnosis();
        else {
          state.quiz.step += 1;
          renderRoute({ scroll: true });
        }
      });
    }, 260);
    return;
  }

  if (action === 'quiz-back') {
    if (state.quiz.transitioning) return;
    fadeOutQuiz(() => {
      state.quiz.transitioning = false;
      if (state.quiz.step === 0) window.location.hash = '#/home';
      else {
        state.quiz.step -= 1;
        renderRoute({ scroll: true });
      }
    });
    return;
  }

  if (action === 'quiz-skip') {
    if (state.quiz.transitioning) return;
    state.quiz.transitioning = true;
    fadeOutQuiz(() => {
      state.quiz.transitioning = false;
      delete state.quiz.answers[QUESTIONS[state.quiz.step].id];
      runDiagnosis();
    });
    return;
  }

  if (action === 'reset-quiz') {
    resetQuiz();
    return;
  }

  if (action === 'toggle-filter') {
    state.filters.panelOpen = true;
    const group = target.dataset.filterGroup;
    const value = String(target.dataset.filterValue);
    if (!(state.filters[group] instanceof Set)) return;
    if (state.filters[group].has(value)) state.filters[group].delete(value);
    else state.filters[group].add(value);
    renderRoute({ scroll: false });
    return;
  }

  if (action === 'clear-filters') {
    resetFilters();
    renderRoute({ scroll: false });
    showToast('絞り込み条件を解除しました。');
    return;
  }

  if (action === 'clear-prefecture') {
    state.filters.prefecture = '';
    renderRoute({ scroll: false });
    return;
  }

  if (action === 'quick-filter') {
    resetFilters();
    const type = target.dataset.filterType;
    const value = String(target.dataset.filterValue);
    const group = type === 'roast' ? 'roasts' : type === 'flavor' ? 'flavors' : 'features';
    state.filters[group].add(value);
    window.location.hash = '#/list';
  }
}

let searchTimer = null;
function handleAppInput(event) {
  if (event.target.matches('[data-directory-search]')) {
    state.filters.search = event.target.value;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      const value = state.filters.search;
      renderRoute({ scroll: false });
      const input = document.querySelector('[data-directory-search]');
      if (input) {
        input.focus();
        input.setSelectionRange(value.length, value.length);
      }
    }, 180);
    return;
  }

  if (event.target.matches('[data-directory-prefecture]')) {
    const typed = event.target.value.trim();
    // datalistの選択肢と完全一致した時点で確定として絞り込む（入力途中の再描画でフォーカスが崩れるのを防ぐ）
    if (typed === '' || PREFECTURES.includes(typed)) {
      state.filters.prefecture = typed;
      renderRoute({ scroll: false });
      const input = document.querySelector('[data-directory-prefecture]');
      if (input) {
        input.focus();
        input.setSelectionRange(typed.length, typed.length);
      }
    }
  }
}

function handleAppChange(event) {
  if (!event.target.matches('[data-directory-sort]')) return;
  state.filters.sort = event.target.value;
  renderRoute({ scroll: false });
}

function handleAppToggle(event) {
  if (event.target.matches('details.filter-panel')) {
    state.filters.panelOpen = event.target.open;
  }
}

function handleImageError(event) {
  if (!(event.target instanceof HTMLImageElement)) return;
  if (event.target.src === PLACEHOLDER_IMAGE) return;
  event.target.src = PLACEHOLDER_IMAGE;
}

function restoreQuizState() {
  try {
    const saved = JSON.parse(window.sessionStorage.getItem('roscolleQuizAnswers') || '{}');
    if (saved && typeof saved === 'object') state.quiz.answers = saved;
  } catch {
    // Storage is optional; ignore access errors.
  }
}

function bindGlobalEvents() {
  window.addEventListener('hashchange', () => {
    closeMenu();
    renderRoute({ scroll: true });
  });

  document.querySelector('[data-menu-button]')?.addEventListener('click', (event) => {
    const button = event.currentTarget;
    const menu = document.querySelector('[data-mobile-menu]');
    const expanded = button.getAttribute('aria-expanded') === 'true';
    button.setAttribute('aria-expanded', String(!expanded));
    button.querySelector('.sr-only').textContent = expanded ? 'メニューを開く' : 'メニューを閉じる';
    menu.hidden = expanded;
    document.body.classList.toggle('menu-open', !expanded);
  });

  document.querySelectorAll('[data-mobile-menu] a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('click', (event) => {
    const aboutLink = event.target.closest('[data-scroll-about]');
    if (!aboutLink || getRoute().name !== 'home') return;
    event.preventDefault();
    document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    closeMenu();
  });

  app.addEventListener('click', handleAppClick);
  app.addEventListener('input', handleAppInput);
  app.addEventListener('change', handleAppChange);
  app.addEventListener('toggle', handleAppToggle, true);
  app.addEventListener('error', handleImageError, true);
}

function init() {
  if (!window.location.hash) window.history.replaceState(null, '', '#/home');
  restoreQuizState();
  bindGlobalEvents();
  loadData();
}

init();
