// Single API surface — currently returns mock data.
// Swap implementations later for real backend calls.

export type LangCode =
  | "hi" | "en" | "ur" | "ta"
  | "bn" | "mr" | "te" | "gu" | "kn" | "ml" | "pa" | "or" | "as"
  | "mai" | "sa" | "kok" | "ne" | "sd" | "doi" | "ks" | "mni" | "brx" | "sat";

export interface LanguageMeta {
  code: LangCode;
  name: string;
  native: string;
  tier: "verified" | "supported";
  script: "latin" | "devanagari" | "tamil" | "arabic" | "bengali" | "gujarati" | "kannada" | "telugu" | "malayalam" | "gurmukhi" | "odia";
}

export const LANGUAGES: LanguageMeta[] = [
  { code: "hi", name: "Hindi", native: "हिन्दी", tier: "verified", script: "devanagari" },
  { code: "en", name: "English", native: "English", tier: "verified", script: "latin" },
  { code: "ur", name: "Urdu", native: "اُردُو", tier: "verified", script: "arabic" },
  { code: "ta", name: "Tamil", native: "தமிழ்", tier: "verified", script: "tamil" },
  { code: "bn", name: "Bengali", native: "বাংলা", tier: "supported", script: "bengali" },
  { code: "mr", name: "Marathi", native: "मराठी", tier: "supported", script: "devanagari" },
  { code: "te", name: "Telugu", native: "తెలుగు", tier: "supported", script: "telugu" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", tier: "supported", script: "gujarati" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", tier: "supported", script: "kannada" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", tier: "supported", script: "malayalam" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", tier: "supported", script: "gurmukhi" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", tier: "supported", script: "odia" },
  { code: "as", name: "Assamese", native: "অসমীয়া", tier: "supported", script: "bengali" },
  { code: "mai", name: "Maithili", native: "मैथिली", tier: "supported", script: "devanagari" },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्", tier: "supported", script: "devanagari" },
  { code: "kok", name: "Konkani", native: "कोंकणी", tier: "supported", script: "devanagari" },
  { code: "ne", name: "Nepali", native: "नेपाली", tier: "supported", script: "devanagari" },
  { code: "sd", name: "Sindhi", native: "سنڌي", tier: "supported", script: "arabic" },
  { code: "doi", name: "Dogri", native: "डोगरी", tier: "supported", script: "devanagari" },
  { code: "ks", name: "Kashmiri", native: "كٲشُر", tier: "supported", script: "arabic" },
  { code: "mni", name: "Manipuri", native: "মৈতৈলোন্", tier: "supported", script: "bengali" },
  { code: "brx", name: "Bodo", native: "बड़ो", tier: "supported", script: "devanagari" },
  { code: "sat", name: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ", tier: "supported", script: "devanagari" },
];

export interface DocumentRecord {
  id: string;
  title: string;
  language: LangCode;
  sourceType: "news" | "report" | "transcript" | "social" | "leaked-cable" | "academic";
  date: string;
  ingested: string;
  excerpt: string;
  excerptOriginal?: string;
  pages: number;
}

export interface CitationSource {
  documentId: string;
  documentTitle: string;
  snippet: string;
  snippetOriginal?: string;
  language: LangCode;
  confidence: number; // 0..1
  page: number;
}

export interface QueryResult {
  id: string;
  query: string;
  detectedLanguage: LangCode;
  answer: string;
  sources: CitationSource[];
  generatedAt: string;
}

export interface Entity {
  id: string;
  name: string;
  type: "person" | "org" | "location" | "date";
  mentions: number;
  aliases?: string[];
  summary?: string;
}

export interface Edge { from: string; to: string; weight: number; label?: string; }

export interface CaseRecord {
  id: string;
  title: string;
  status: "open" | "closed" | "review";
  owner: string;
  updated: string;
  summary: string;
  queries: string[]; // QueryResult ids
  findings: string[];
}

export interface IngestionJob {
  id: string;
  filename: string;
  language: LangCode;
  size: string;
  stage: "queued" | "ocr" | "embedding" | "indexed" | "failed";
  progress: number;
  startedAt: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  role: "analyst" | "admin";
  query: string;
  language: LangCode;
}

// ---------- mock data ----------
const documents: DocumentRecord[] = [
  { id: "D-1042", title: "सीमा क्षेत्र में बढ़ती गतिविधि — फील्ड रिपोर्ट", language: "hi", sourceType: "report", date: "2025-02-11", ingested: "2025-02-12T09:14:00Z", pages: 14,
    excerpt: "Field observers report a 23% increase in unmarked vehicular movement along Sector 7 between 02:00 and 04:00 IST over the past fortnight.",
    excerptOriginal: "क्षेत्रीय पर्यवेक्षकों ने सेक्टर 7 में पिछले पखवाड़े के दौरान रात 02:00 से 04:00 IST के बीच अचिह्नित वाहन आवाजाही में 23% वृद्धि की सूचना दी है।" },
  { id: "D-1043", title: "Karachi shipping registry — Q4 anomalies", language: "en", sourceType: "leaked-cable", date: "2025-01-28", ingested: "2025-02-02T11:00:00Z", pages: 31,
    excerpt: "Three vessels registered to a single P.O. box in DHA Phase 5 declared cargo manifests inconsistent with port-of-call sequencing." },
  { id: "D-1044", title: "اسلام آباد سفارتی گفتگو — منٹس", language: "ur", sourceType: "transcript", date: "2025-02-05", ingested: "2025-02-06T16:22:00Z", pages: 8,
    excerpt: "Minutes reference a third-party broker, identified only as 'A.M.', coordinating a procurement channel through Dubai.",
    excerptOriginal: "میٹنگ کے منٹس میں ایک تیسرے فریق کے دلال کا حوالہ دیا گیا ہے، جس کی شناخت صرف 'A.M.' کے طور پر کی گئی ہے، جو دبئی کے ذریعے ایک خریداری چینل کو مربوط کر رہا ہے۔" },
  { id: "D-1045", title: "சென்னை துறைமுக கொள்கலன் தணிக்கை", language: "ta", sourceType: "report", date: "2025-02-09", ingested: "2025-02-10T07:45:00Z", pages: 22,
    excerpt: "Container audit flags 14 mis-declared shipments routed via Colombo with terminal handlers linked to two prior cases.",
    excerptOriginal: "சென்னை துறைமுகத்தில் கொள்கலன் தணிக்கை, கொழும்பு வழியாக அனுப்பப்பட்ட 14 தவறாக அறிவிக்கப்பட்ட கப்பல் சரக்குகளைக் குறிக்கிறது." },
  { id: "D-1046", title: "Open-source aviation tracking — Feb digest", language: "en", sourceType: "academic", date: "2025-02-20", ingested: "2025-02-21T10:01:00Z", pages: 6,
    excerpt: "ADS-B traces indicate four turboprop registrations toggled transponders within a 40 km corridor north of Jaisalmer." },
  { id: "D-1047", title: "ঢাকা সংবাদপত্র সংকলন — সীমান্ত", language: "bn", sourceType: "news", date: "2025-02-15", ingested: "2025-02-16T12:30:00Z", pages: 4,
    excerpt: "Local press coverage of recent border-area arrests names two intermediaries previously surfaced in case file C-204.",
    excerptOriginal: "সম্প্রতি সীমান্ত এলাকায় গ্রেপ্তারের স্থানীয় সংবাদপত্রের কভারেজে দুই মধ্যস্থতাকারীর নাম উল্লেখ করা হয়েছে যারা পূর্বে কেস ফাইল C-204-এ উঠে এসেছিল।" },
  { id: "D-1048", title: "Telegram channel scrape — Kashmiri-language posts", language: "ks", sourceType: "social", date: "2025-02-22", ingested: "2025-02-22T18:55:00Z", pages: 2,
    excerpt: "Translated posts coordinate a meeting in Sopore on 26 Feb; tone consistent with prior recruitment patterns." },
  { id: "D-1049", title: "ਅੰਮ੍ਰਿਤਸਰ — ਆਰਥਿਕ ਅਪਰਾਧ ਸ਼ਾਖਾ ਨੋਟ", language: "pa", sourceType: "report", date: "2025-01-19", ingested: "2025-01-20T08:10:00Z", pages: 11,
    excerpt: "Economic offences wing notes hawala remittances totalling ₹3.4 crore through three Amritsar storefronts." },
];

const entities: Entity[] = [
  { id: "E-1", name: "A. Mehrotra", type: "person", mentions: 17, aliases: ["A.M.", "Mehrotra Sahib"], summary: "Procurement broker; surfaces across Karachi and Dubai cables." },
  { id: "E-2", name: "Sector 7 corridor", type: "location", mentions: 11, summary: "Border sub-sector flagged for off-hours movement." },
  { id: "E-3", name: "Crescent Maritime LLC", type: "org", mentions: 9, summary: "Shell entity holding three vessel registrations." },
  { id: "E-4", name: "26 Feb 2025", type: "date", mentions: 6 },
  { id: "E-5", name: "Sopore", type: "location", mentions: 5 },
  { id: "E-6", name: "Colombo terminal handlers", type: "org", mentions: 7 },
  { id: "E-7", name: "R. Khurana", type: "person", mentions: 4, summary: "Customs intermediary, Amritsar." },
];

const edges: Edge[] = [
  { from: "E-1", to: "E-3", weight: 6, label: "directs" },
  { from: "E-1", to: "E-4", weight: 2 },
  { from: "E-3", to: "E-6", weight: 5, label: "ships via" },
  { from: "E-2", to: "E-4", weight: 3 },
  { from: "E-5", to: "E-4", weight: 4 },
  { from: "E-7", to: "E-1", weight: 2, label: "transacts" },
  { from: "E-7", to: "E-3", weight: 1 },
];

const queries: QueryResult[] = [
  {
    id: "Q-501",
    query: "Who is the broker referenced as A.M. and what channels are described?",
    detectedLanguage: "en",
    generatedAt: "2025-02-22T10:14:00Z",
    answer:
      "Cross-source analysis identifies 'A.M.' as A. Mehrotra [1], a procurement broker coordinating a Dubai-routed channel referenced in Islamabad meeting minutes [2]. Karachi shipping registry data ties three vessels held by Crescent Maritime LLC to the same broker, with cargo manifests inconsistent with declared port sequencing [3]. A separate Amritsar economic-offences note links remittances of ₹3.4 crore through associated storefronts [4].",
    sources: [
      { documentId: "D-1044", documentTitle: "اسلام آباد سفارتی گفتگو — منٹس", language: "ur", page: 3, confidence: 0.91,
        snippet: "Minutes reference a third-party broker, identified only as 'A.M.', coordinating a procurement channel through Dubai.",
        snippetOriginal: "میٹنگ کے منٹس میں ایک تیسرے فریق کے دلال 'A.M.' کا حوالہ دیا گیا ہے، جو دبئی کے ذریعے ایک خریداری چینل کو مربوط کر رہا ہے۔" },
      { documentId: "D-1043", documentTitle: "Karachi shipping registry — Q4 anomalies", language: "en", page: 12, confidence: 0.88,
        snippet: "Three vessels registered to a single P.O. box in DHA Phase 5 declared cargo manifests inconsistent with port-of-call sequencing." },
      { documentId: "D-1049", documentTitle: "ਅੰਮ੍ਰਿਤਸਰ — ਆਰਥਿਕ ਅਪਰਾਧ ਸ਼ਾਖਾ ਨੋਟ", language: "pa", page: 5, confidence: 0.62,
        snippet: "Economic offences wing notes hawala remittances totalling ₹3.4 crore through three Amritsar storefronts." },
      { documentId: "D-1042", documentTitle: "सीमा क्षेत्र में बढ़ती गतिविधि", language: "hi", page: 2, confidence: 0.54,
        snippet: "Field observers report a 23% increase in unmarked vehicular movement along Sector 7.",
        snippetOriginal: "क्षेत्रीय पर्यवेक्षकों ने सेक्टर 7 में अचिह्नित वाहन आवाजाही में 23% वृद्धि की सूचना दी है।" },
    ],
  },
];

const cases: CaseRecord[] = [
  { id: "C-204", title: "Crescent Maritime — vessel registration anomalies", status: "open", owner: "Analyst Rao", updated: "2025-02-22", summary: "Active workup on three vessels and associated broker network.", queries: ["Q-501"], findings: [
      "Three vessels tied to a single P.O. box in DHA Phase 5.",
      "Broker 'A.M.' corroborated across Urdu and English sources.",
      "Amritsar remittance pattern is plausible but low-confidence."] },
  { id: "C-198", title: "Sector 7 — off-hours movement", status: "review", owner: "Analyst Banerjee", updated: "2025-02-19", summary: "Awaiting independent confirmation of ADS-B corridor.", queries: [], findings: ["23% increase in 02:00–04:00 IST movements over 14 days."] },
  { id: "C-187", title: "Sopore meeting — 26 Feb", status: "open", owner: "Analyst Iqbal", updated: "2025-02-22", summary: "Telegram coordination matches prior recruitment-pattern indicators.", queries: [], findings: [] },
  { id: "C-176", title: "Amritsar hawala storefronts", status: "closed", owner: "Analyst Kaur", updated: "2025-01-30", summary: "Referred to ED with full source bundle.", queries: [], findings: ["₹3.4 crore aggregate across three storefronts."] },
];

const ingestion: IngestionJob[] = [
  { id: "J-9001", filename: "delhi-cable-2025-02-22.pdf", language: "en", size: "4.1 MB", stage: "indexed", progress: 100, startedAt: "2025-02-22T08:14:00Z" },
  { id: "J-9002", filename: "श्रीनगर-रिपोर्ट-फरवरी.pdf", language: "hi", size: "2.6 MB", stage: "embedding", progress: 72, startedAt: "2025-02-22T09:01:00Z" },
  { id: "J-9003", filename: "karachi-port-scan-q1.tiff", language: "ur", size: "18.4 MB", stage: "ocr", progress: 41, startedAt: "2025-02-22T09:22:00Z" },
  { id: "J-9004", filename: "chennai-container-audit.docx", language: "ta", size: "850 KB", stage: "queued", progress: 0, startedAt: "2025-02-22T09:30:00Z" },
  { id: "J-9005", filename: "dhaka-press-clip.pdf", language: "bn", size: "1.2 MB", stage: "indexed", progress: 100, startedAt: "2025-02-21T17:00:00Z" },
];

const audit: AuditEntry[] = [
  { id: "A-1", timestamp: "2025-02-22T10:14:00Z", user: "analyst.rao", role: "analyst", query: "Who is the broker referenced as A.M.?", language: "en" },
  { id: "A-2", timestamp: "2025-02-22T10:02:00Z", user: "analyst.banerjee", role: "analyst", query: "Sector 7 में रात की गतिविधि का सारांश", language: "hi" },
  { id: "A-3", timestamp: "2025-02-22T09:51:00Z", user: "admin.shah", role: "admin", query: "List ingestion jobs failed in last 7 days", language: "en" },
  { id: "A-4", timestamp: "2025-02-22T09:33:00Z", user: "analyst.iqbal", role: "analyst", query: "Sopore meeting indicators", language: "en" },
  { id: "A-5", timestamp: "2025-02-21T18:12:00Z", user: "analyst.kaur", role: "analyst", query: "ਹਵਾਲਾ remittance pattern Amritsar", language: "pa" },
];

const delay = <T,>(v: T, ms = 250) => new Promise<T>((r) => setTimeout(() => r(v), ms));

export const api = {
  async getSystemHealth() {
    return delay({
      offline: true,
      externalCalls: 0,
      uptimeHours: 412,
      indexSizeGB: 38.7,
      lastIngestion: "2025-02-22T09:30:00Z",
      services: [
        { name: "Index", status: "ok" as const },
        { name: "OCR", status: "ok" as const },
        { name: "Embedding", status: "ok" as const },
        { name: "Translator", status: "degraded" as const },
      ],
    });
  },
  async getCorpusStats() {
    const langs = new Set(documents.map((d) => d.language));
    return delay({
      documents: 12_847,
      languagesPresent: langs.size + 9,
      lastIngestion: "2025-02-22T09:30:00Z",
      newToday: 23,
    });
  },
  async getDocuments() { return delay(documents); },
  async getDocument(id: string) { return delay(documents.find((d) => d.id === id) ?? null); },
  async getEntities() { return delay({ entities, edges }); },
  async getCases() { return delay(cases); },
  async getCase(id: string) { return delay(cases.find((c) => c.id === id) ?? null); },
  async getRecentQueries() { return delay(queries); },
  async getAuditLog() { return delay(audit); },
  async getIngestionJobs() { return delay(ingestion); },
  async submitQuery(query: string): Promise<QueryResult> {
    return delay({ ...queries[0], id: "Q-" + Math.floor(Math.random() * 9000 + 1000), query, generatedAt: new Date().toISOString() }, 600);
  },
  async uploadDocument(filename: string): Promise<IngestionJob> {
    return delay({ id: "J-" + Math.floor(Math.random() * 9000), filename, language: "en", size: "—", stage: "queued", progress: 0, startedAt: new Date().toISOString() });
  },
};

export function detectLanguage(text: string): LangCode {
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  if (/[\u0600-\u06FF]/.test(text)) return "ur";
  if (/[\u0B80-\u0BFF]/.test(text)) return "ta";
  if (/[\u0980-\u09FF]/.test(text)) return "bn";
  if (/[\u0A00-\u0A7F]/.test(text)) return "pa";
  return "en";
}

export function scriptFontClass(lang: LangCode): string {
  const meta = LANGUAGES.find((l) => l.code === lang);
  switch (meta?.script) {
    case "devanagari": return "font-devanagari";
    case "tamil": return "font-tamil";
    case "arabic": return "font-arabic";
    default: return "";
  }
}
