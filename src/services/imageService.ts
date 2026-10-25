/**
 * Real-Time Educational Example Image Service
 * Fetches real-time educational diagrams, photographs, and scientific illustrations
 * from external web sources (Wikipedia / Wikimedia Commons, Pollinations educational diagrams)
 * when in visual mode or when explicitly requested by the student (in text, voice, or live mode).
 */

export interface RealtimeExampleImage {
  url: string;
  title: string;
  source: string;
  caption: string;
  tags?: string[];
}

const GREETINGS_AND_TRIVIAL = new Set([
  'hi', 'hello', 'hey', 'hiya', 'hola', 'namaste', 'vanakkam', 'sup', 'yo',
  'good morning', 'good afternoon', 'good evening', 'good night',
  'how are you', 'how r u', 'how are you doing', 'what is up', 'whats up',
  'ok', 'okay', 'yes', 'no', 'yeah', 'yep', 'nope', 'bye', 'goodbye',
  'thanks', 'thank you', 'thx', 'thank u', 'nice', 'cool', 'awesome', 'great',
  'sure', 'fine', 'welcome', 'testing', 'test', 'help', 'start', 'begin',
]);

/**
 * Checks if a text message is a casual greeting or trivial pleasantry.
 * Images should NEVER be fetched for simple greetings like "hi" or "hello".
 */
export const isGreetingOrTrivial = (text: string): boolean => {
  if (!text) return true;
  const normalized = text.toLowerCase().trim().replace(/[?!.,;:'"()]/g, '');
  if (normalized.length <= 2) return true;
  return GREETINGS_AND_TRIVIAL.has(normalized);
};

/**
 * Checks if the student explicitly requested an image or visual example in their text or voice speech.
 */
export const isImageExplicitlyRequested = (text: string): boolean => {
  if (!text || isGreetingOrTrivial(text)) return false;
  const t = text.toLowerCase();
  const triggers = [
    /\b(show|display|give|see|view|fetch|find|bring|provide|send|render|attach|need|want|load)\b.*\b(image|images|picture|pictures|photo|photos|pic|pics|diagram|diagrams|illustration|illustrations|figure|figures|drawing|drawings|visual|visuals|graphic|graphics|schematic|schematics|chart|charts)\b/i,
    /\b(image|images|picture|pictures|photo|photos|pic|pics|diagram|diagrams|illustration|illustrations|visual|visuals)\s+(of|for|about|showing|related)\b/i,
    /\b(example|sample|real-?time)\s+(image|images|picture|pictures|photo|photos|diagram|diagrams|illustration|illustrations|visual|visuals)\b/i,
    /\bwhat\s+does\s+(it|this|that|a|an|the)?\s*.*look\s+like\b/i,
    /\bhow\s+does\s+(it|this|that|a|an|the)?\s*.*look\b/i,
    /\b(draw|illustrate|visualize)\b/i,
    /\b(show\s+image|show\s+picture|show\s+diagram|show\s+photo)\b/i,
  ];
  return triggers.some((r) => r.test(t));
};

/**
 * Extracts the primary educational subject noun from recent conversation messages
 * when the student asks "show some example images" without repeating the subject.
 */
export const extractSubjectFromHistory = (historyText?: string): string => {
  if (!historyText) return '';
  const cleaned = historyText
    .replace(/I (can't|cannot) show pictures[^.!?]*[.!?]/gi, '')
    .replace(/[?!.,;:"'()\[\]{}]/g, ' ')
    .toLowerCase();
  const words = cleaned.split(/\s+/).filter(Boolean);
  const stopWords = new Set([
    'picture', 'pictures', 'image', 'images', 'photo', 'photos', 'bouncy', 'tiny', 'tinier', 'dots',
    'ball', 'center', 'little', 'bees', 'like', 'looks', 'what', 'that', 'this', 'have', 'from',
    'with', 'about', 'some', 'show', 'here', 'your', 'will', 'help', 'can', 'cant', 'cannot',
    'hello', 'think', 'thought', 'moving', 'around', 'imagine', 'fast', 'fast-moving',
    'the', 'is', 'are', 'was', 'were', 'a', 'an', 'and', 'or', 'in', 'for', 'of', 'to', 'by', 'it', 'its'
  ]);
  const candidates = words.filter((w) => w.length >= 3 && !stopWords.has(w));
  if (candidates.length === 0) return '';
  const freqMap: Record<string, number> = {};
  for (const w of candidates) {
    freqMap[w] = (freqMap[w] || 0) + 1;
  }
  const sorted = Object.entries(freqMap).sort((a, b) => b[1] - a[1]);
  return sorted[0] ? sorted[0][0] : '';
};

/**
 * Cleans any legacy "I can't show pictures" statements from AI responses,
 * converting them into positive educational visual descriptions.
 */
export const cleanAIVisualResponse = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/I (can't|cannot|am unable to) show (pictures|images|diagrams|photos|visuals),?\s*but I can help you imagine one!?\s*/gi, 'Here is a visual model for you! ')
    .replace(/I (can't|cannot|am unable to) show (pictures|images|diagrams|photos|visuals)[^.!?]*[.!?]\s*/gi, 'Here is a visual example for you! ')
    .replace(/I don't have (eyes|the ability to show pictures|the capability to display images)[^.!?]*[.!?]\s*/gi, '')
    .replace(/As an AI, I (can't|cannot) (show|display|generate) (images|pictures|photos)[^.!?]*[.!?]\s*/gi, 'Here is a visual diagram for you! ')
    .trim();
};

/**
 * Cleans and extracts the core educational visual keyword from a chat query or topic.
 */
export const extractVisualKeyword = (
  text: string,
  topic?: string,
  historyContext?: string
): string => {
  if (isGreetingOrTrivial(text)) {
    return topic && topic !== 'General Learning' && !topic.includes('Concepts') ? topic.trim() : '';
  }

  // Remove common visual and conversational request fluff
  const cleaned = text
    .replace(/\b(can you|could you|please|kindly|i want to|show me|show|display|fetch|find|bring|give me|give)\b/gi, '')
    .replace(/\b(an?|the|some|any|few|all|example|sample|real-?time)\s+(image|images|picture|pictures|photo|photos|pic|pics|diagram|diagrams|illustration|illustrations|figure|figures|drawing|drawings|visual|visuals|graphic|graphics|schematic|schematics|chart|charts)\s+(of|for|about|showing|related)?\b/gi, '')
    .replace(/\b(image|images|picture|pictures|photo|photos|pic|pics|diagram|diagrams|illustration|illustrations|figure|figures|drawing|drawings|visual|visuals|graphic|graphics)\b/gi, '')
    .replace(/\b(explain|tell me about|what is|how does|what are|why is|define|describe|draw|visualize)\b/gi, '')
    .replace(/\b(what does|look like|how does it look)\b/gi, '')
    .replace(/[?!.,;:"'()]/g, '')
    .trim();

  const words = cleaned.split(/\s+/).filter(Boolean);
  const stopWords = new Set(['the', 'is', 'are', 'was', 'were', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'for', 'of', 'to', 'with', 'by', 'from', 'it', 'its', 'this', 'that', 'some', 'me', 'us', 'you']);
  const meaningful = words.filter((w) => !stopWords.has(w.toLowerCase()));

  if (meaningful.length > 0 && meaningful.length <= 5) {
    return meaningful.join(' ');
  }

  if (meaningful.length > 5) {
    return meaningful.slice(0, 4).join(' ');
  }

  // If the query only contained request words (like "show some example images"), check conversation context
  if (historyContext) {
    const fromHistory = extractSubjectFromHistory(historyContext);
    if (fromHistory) return fromHistory;
  }

  if (topic && topic !== 'General Learning' && !topic.includes('Concepts')) {
    return topic.trim();
  }

  return '';
};

/**
 * Searches Wikipedia's official open API for an authentic encyclopedia image.
 */
const fetchWikipediaImage = async (keyword: string): Promise<RealtimeExampleImage | null> => {
  try {
    const formatted = encodeURIComponent(keyword.trim());
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${formatted}&generator=search&gsrsearch=${formatted}&gsrlimit=1&prop=pageimages|extracts&exintro=1&explaintext=1&pithumbsize=800&format=json&origin=*`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2800);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();
    if (!data.query || !data.query.pages) return null;

    const pages = Object.values(data.query.pages) as any[];
    for (const page of pages) {
      if (page.thumbnail && page.thumbnail.source) {
        return {
          url: page.thumbnail.source,
          title: page.title || keyword,
          source: 'Wikipedia / Wikimedia Commons',
          caption: page.extract ? `${page.extract.slice(0, 140)}...` : `Educational encyclopedia reference image for ${page.title}.`,
          tags: [keyword, 'Encyclopedia', 'Wikimedia'],
        };
      }
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Generates an educational diagram or illustration URL via Pollinations
 * formatted for high pedagogical clarity and accurate visual representation.
 */
const generateEducationalDiagramUrl = (keyword: string, subject?: string): RealtimeExampleImage => {
  const subjectPrefix = subject && subject !== 'General (All Subjects)' ? `${subject}: ` : '';
  const prompt = `${subjectPrefix}${keyword} educational diagram, scientific illustration, clear labels, textbook quality`;
  const encodedPrompt = encodeURIComponent(prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=720&height=440&nologo=true`;

  return {
    url: imageUrl,
    title: keyword.toUpperCase(),
    source: 'External Web // Real-Time Educational Diagram',
    caption: `Visual example diagram illustrating ${keyword} in ${subject || 'curriculum'}.`,
    tags: [keyword, subject || 'Academic', 'Diagram'],
  };
};

/**
 * Fetches a real-time example image based on the student's conversation.
 * 1. Checks Wikipedia / Wikimedia Commons first for real encyclopedia images.
 * 2. Falls back to real-time educational diagram generation for conceptual clarity.
 * Returns null if the query is a greeting or empty.
 */
export const getRealtimeExampleImage = async (
  queryOrTopic: string,
  subject?: string,
  historyContext?: string,
  forceDiagram = false
): Promise<RealtimeExampleImage | null> => {
  if (isGreetingOrTrivial(queryOrTopic)) {
    return null;
  }

  const keyword = extractVisualKeyword(queryOrTopic, subject, historyContext);
  if (!keyword || keyword.length < 2 || isGreetingOrTrivial(keyword)) {
    return null;
  }

  if (!forceDiagram) {
    const wikiImage = await fetchWikipediaImage(keyword);
    if (wikiImage) {
      return wikiImage;
    }
  }

  return generateEducationalDiagramUrl(keyword, subject);
};

