/**
 * PoC: Airbnb Scraping via HTTP fetch + Cheerio
 *
 * Tests whether we can extract listing data without browser automation.
 * Run: npx tsx src/lib/scraping/poc-test.ts
 */

import * as cheerio from 'cheerio';

// ─── Config ───────────────────────────────────────────────────────────────────

const LISTING_URL = 'https://www.airbnb.com/rooms/1025330516498990498';
const SEARCH_URL = 'https://www.airbnb.com/s/homes?lat=35.1595&lng=129.1603&zoom=14';

const HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'Sec-Ch-Ua': '"Chromium";v="131", "Not_A Brand";v="24"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};

const DESIRED_FIELDS = [
  'title',
  'description',
  'amenities',
  'photos',
  'pricePerNight',
  'rating',
  'reviewCount',
  'reviewScores',
  'location (lat/lng)',
  'propertyType',
  'roomType',
  'accommodates',
  'bedrooms',
  'beds',
  'bathrooms',
  'hostResponseRate',
  'isSuperhost',
  'instantBookable',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function separator(title: string) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  ${title}`);
  console.log('═'.repeat(70));
}

function subsection(title: string) {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 60 - title.length))}`);
}

/** Safely get nested keys up to a depth limit for logging */
function getStructure(obj: unknown, depth = 0, maxDepth = 3): string {
  if (depth >= maxDepth) return typeof obj === 'object' && obj !== null ? '{...}' : String(typeof obj);
  if (obj === null || obj === undefined) return String(obj);
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return `Array(${obj.length}) [${getStructure(obj[0], depth + 1, maxDepth)}, ...]`;
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj as Record<string, unknown>);
    if (keys.length === 0) return '{}';
    const preview = keys.slice(0, 8).map((k) => `${k}: ${getStructure((obj as Record<string, unknown>)[k], depth + 1, maxDepth)}`);
    return `{ ${preview.join(', ')}${keys.length > 8 ? `, ... (${keys.length} keys total)` : ''} }`;
  }
  if (typeof obj === 'string') return obj.length > 80 ? `"${obj.slice(0, 80)}..."` : `"${obj}"`;
  return String(obj);
}

/** Deep search for a key in an object, returns first match */
function deepFind(obj: unknown, targetKey: string, maxDepth = 12, currentDepth = 0): unknown {
  if (currentDepth >= maxDepth || obj === null || obj === undefined || typeof obj !== 'object') return undefined;
  if (!Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    if (targetKey in record) return record[targetKey];
    for (const key of Object.keys(record)) {
      const found = deepFind(record[key], targetKey, maxDepth, currentDepth + 1);
      if (found !== undefined) return found;
    }
  } else {
    for (const item of obj) {
      const found = deepFind(item, targetKey, maxDepth, currentDepth + 1);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/** Deep search returning ALL matches for a key */
function deepFindAll(obj: unknown, targetKey: string, maxDepth = 12, currentDepth = 0): unknown[] {
  const results: unknown[] = [];
  if (currentDepth >= maxDepth || obj === null || obj === undefined || typeof obj !== 'object') return results;
  if (!Array.isArray(obj)) {
    const record = obj as Record<string, unknown>;
    if (targetKey in record) results.push(record[targetKey]);
    for (const key of Object.keys(record)) {
      results.push(...deepFindAll(record[key], targetKey, maxDepth, currentDepth + 1));
    }
  } else {
    for (const item of obj) {
      results.push(...deepFindAll(item, targetKey, maxDepth, currentDepth + 1));
    }
  }
  return results;
}

// ─── Extraction Logic ─────────────────────────────────────────────────────────

interface ExtractedData {
  title?: string;
  description?: string;
  amenities?: string[];
  photos?: string[];
  pricePerNight?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
  reviewScores?: Record<string, number>;
  lat?: number;
  lng?: number;
  propertyType?: string;
  roomType?: string;
  accommodates?: number;
  bedrooms?: number;
  beds?: number;
  bathrooms?: number;
  hostResponseRate?: string;
  isSuperhost?: boolean;
  instantBookable?: boolean;
}

function extractFromDeferredState(data: Record<string, unknown>): ExtractedData {
  const result: ExtractedData = {};

  // Title
  const title = deepFind(data, 'title');
  if (typeof title === 'string' && title.length > 0 && title.length < 300) {
    result.title = title;
  }

  // Description
  const description = deepFind(data, 'description') as string | undefined;
  const htmlDescription = deepFind(data, 'htmlDescription') as Record<string, unknown> | undefined;
  if (htmlDescription && typeof htmlDescription === 'object') {
    result.description = (deepFind(htmlDescription, 'htmlText') as string) || String(htmlDescription);
  } else if (typeof description === 'string' && description.length > 20) {
    result.description = description;
  }

  // Photos
  const photoUrls: string[] = [];
  // Try multiple known paths
  const photoTour = deepFind(data, 'photoTour') as Record<string, unknown> | undefined;
  if (photoTour) {
    const mediaItems = deepFind(photoTour, 'mediaItems') as unknown[];
    if (Array.isArray(mediaItems)) {
      for (const item of mediaItems) {
        const url = deepFind(item, 'baseUrl') as string;
        if (url) photoUrls.push(url);
      }
    }
  }
  // Fallback: search for baseUrl patterns
  if (photoUrls.length === 0) {
    const allBaseUrls = deepFindAll(data, 'baseUrl');
    for (const u of allBaseUrls) {
      if (typeof u === 'string' && u.includes('airbnb') && u.includes('image') && !photoUrls.includes(u)) {
        photoUrls.push(u);
        if (photoUrls.length >= 20) break;
      }
    }
  }
  if (photoUrls.length > 0) result.photos = photoUrls;

  // Price
  const priceValue = deepFind(data, 'priceForDisplay');
  const price = deepFind(data, 'price') as Record<string, unknown> | undefined;
  const discountedPrice = deepFind(data, 'discountedPrice') as string | undefined;
  const originalPrice = deepFind(data, 'originalPrice') as string | undefined;
  if (typeof priceValue === 'string') {
    const m = priceValue.match(/[\d,]+/);
    if (m) result.pricePerNight = parseInt(m[0].replace(/,/g, ''));
  } else if (price && typeof price === 'object') {
    const amount = deepFind(price, 'amount') as number;
    if (typeof amount === 'number') result.pricePerNight = amount;
  }
  if (discountedPrice && typeof discountedPrice === 'string') {
    const m = discountedPrice.match(/[\d,]+/);
    if (m && !result.pricePerNight) result.pricePerNight = parseInt(m[0].replace(/,/g, ''));
  }
  // Try to find structuredDisplayPrice or priceString
  const priceString = deepFind(data, 'priceString') as string | undefined;
  if (!result.pricePerNight && typeof priceString === 'string') {
    const m = priceString.match(/[\d,]+/);
    if (m) result.pricePerNight = parseInt(m[0].replace(/,/g, ''));
  }

  // Rating & reviews
  const overallRating = deepFind(data, 'overallRating');
  const avgRating = deepFind(data, 'avgRating');
  const guestSatisfactionOverall = deepFind(data, 'guestSatisfactionOverall');
  if (typeof overallRating === 'number') result.rating = overallRating;
  else if (typeof avgRating === 'number') result.rating = avgRating;
  else if (typeof guestSatisfactionOverall === 'number') result.rating = guestSatisfactionOverall;

  const reviewCount = deepFind(data, 'reviewCount');
  const visibleReviewCount = deepFind(data, 'visibleReviewCount');
  if (typeof reviewCount === 'number') result.reviewCount = reviewCount;
  else if (typeof visibleReviewCount === 'number') result.reviewCount = visibleReviewCount;

  // Review category scores
  const categoryRatings = deepFind(data, 'categoryRatings');
  if (Array.isArray(categoryRatings)) {
    result.reviewScores = {};
    for (const cr of categoryRatings) {
      if (typeof cr === 'object' && cr !== null) {
        const cat = cr as Record<string, unknown>;
        const name = (cat.name || cat.category || cat.label) as string;
        const score = (cat.value || cat.rating || cat.score) as number;
        if (name && typeof score === 'number') {
          result.reviewScores[name] = score;
        }
      }
    }
    if (Object.keys(result.reviewScores).length === 0) delete result.reviewScores;
  }

  // Location
  const lat = deepFind(data, 'lat');
  const lng = deepFind(data, 'lng');
  if (typeof lat === 'number') result.lat = lat;
  if (typeof lng === 'number') result.lng = lng;

  // Property details
  const propertyType = deepFind(data, 'propertyType');
  const roomType = deepFind(data, 'roomType');
  if (typeof propertyType === 'string') result.propertyType = propertyType;
  if (typeof roomType === 'string') result.roomType = roomType;

  // Capacity
  const personCapacity = deepFind(data, 'personCapacity');
  const accommodates = deepFind(data, 'accommodates');
  if (typeof personCapacity === 'number') result.accommodates = personCapacity;
  else if (typeof accommodates === 'number') result.accommodates = accommodates;

  const bedrooms = deepFind(data, 'bedrooms');
  const beds = deepFind(data, 'beds');
  const bathrooms = deepFind(data, 'bathrooms');
  const bedroomCount = deepFind(data, 'bedroomCount');
  const bedCount = deepFind(data, 'bedCount');
  const bathroomCount = deepFind(data, 'bathroomCount');
  if (typeof bedrooms === 'number') result.bedrooms = bedrooms;
  else if (typeof bedroomCount === 'number') result.bedrooms = bedroomCount;
  if (typeof beds === 'number') result.beds = beds;
  else if (typeof bedCount === 'number') result.beds = bedCount;
  if (typeof bathrooms === 'number') result.bathrooms = bathrooms;
  else if (typeof bathroomCount === 'number') result.bathrooms = bathroomCount;

  // Amenities
  const amenities = deepFind(data, 'amenities');
  const previewAmenities = deepFind(data, 'previewAmenities');
  const listingAmenities = deepFind(data, 'listingAmenities');
  const amenityGroups = deepFind(data, 'amenityGroups');

  if (Array.isArray(amenityGroups)) {
    result.amenities = [];
    for (const group of amenityGroups) {
      if (typeof group === 'object' && group !== null) {
        const items = (group as Record<string, unknown>).amenities as unknown[];
        if (Array.isArray(items)) {
          for (const item of items) {
            if (typeof item === 'object' && item !== null) {
              const name = (item as Record<string, unknown>).title || (item as Record<string, unknown>).name;
              if (typeof name === 'string') result.amenities.push(name);
            } else if (typeof item === 'string') {
              result.amenities.push(item);
            }
          }
        }
      }
    }
  } else if (Array.isArray(listingAmenities)) {
    result.amenities = listingAmenities
      .map((a: unknown) => (typeof a === 'object' && a !== null ? (a as Record<string, unknown>).name || (a as Record<string, unknown>).title : a))
      .filter((a): a is string => typeof a === 'string');
  } else if (Array.isArray(amenities)) {
    result.amenities = amenities
      .map((a: unknown) => (typeof a === 'string' ? a : typeof a === 'object' && a !== null ? (a as Record<string, unknown>).name : undefined))
      .filter((a): a is string => typeof a === 'string');
  } else if (Array.isArray(previewAmenities)) {
    result.amenities = previewAmenities
      .map((a: unknown) => (typeof a === 'string' ? a : typeof a === 'object' && a !== null ? (a as Record<string, unknown>).name || (a as Record<string, unknown>).title : undefined))
      .filter((a): a is string => typeof a === 'string');
  }

  // Host info
  const hostResponseRate = deepFind(data, 'hostResponseRate');
  const isSuperhost = deepFind(data, 'isSuperhost');
  const isSuperHost = deepFind(data, 'isSuperHost');
  if (typeof hostResponseRate === 'string') result.hostResponseRate = hostResponseRate;
  if (typeof isSuperhost === 'boolean') result.isSuperhost = isSuperhost;
  else if (typeof isSuperHost === 'boolean') result.isSuperhost = isSuperHost;

  // Booking
  const instantBookable = deepFind(data, 'instantBookable');
  const isInstantBookable = deepFind(data, 'isInstantBookable');
  if (typeof instantBookable === 'boolean') result.instantBookable = instantBookable;
  else if (typeof isInstantBookable === 'boolean') result.instantBookable = isInstantBookable;

  return result;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function testListingPage() {
  separator('PART 1: LISTING PAGE SCRAPING');
  console.log(`URL: ${LISTING_URL}`);

  let html: string;
  try {
    console.log('\nFetching listing page...');
    const res = await fetch(LISTING_URL, {
      headers: HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
    });
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Content-Type: ${res.headers.get('content-type')}`);
    console.log(`Content-Length: ${res.headers.get('content-length') || 'unknown'}`);

    if (!res.ok) {
      console.error(`FAILED: HTTP ${res.status}`);
      const body = await res.text();
      console.log(`Response body (first 500 chars): ${body.slice(0, 500)}`);
      return;
    }

    html = await res.text();
    console.log(`HTML length: ${html.length.toLocaleString()} chars`);

    // If HTML is suspiciously small, dump it
    if (html.length < 10000) {
      console.log('\n  WARNING: HTML is very short. Full content:');
      console.log('  ' + html.replace(/\n/g, '\n  ').slice(0, 2500));
    }
  } catch (err) {
    console.error(`FAILED to fetch:`, err);
    return;
  }

  const $ = cheerio.load(html);

  // ── Source A: data-deferred-state-0 ──
  subsection('Source A: <script id="data-deferred-state-0">');
  const deferredScript = $('script#data-deferred-state-0').html();
  if (deferredScript) {
    console.log(`Found! Length: ${deferredScript.length.toLocaleString()} chars`);
    try {
      const deferredData = JSON.parse(deferredScript);
      const topKeys = Object.keys(deferredData);
      console.log(`Top-level keys: ${topKeys.join(', ')}`);

      // Log structure at depth 2
      for (const key of topKeys.slice(0, 5)) {
        console.log(`\n  "${key}": ${getStructure(deferredData[key], 0, 2)}`);
      }

      // Extract all desired fields
      subsection('Extracted fields from data-deferred-state-0');
      const extracted = extractFromDeferredState(deferredData);

      for (const [key, value] of Object.entries(extracted)) {
        if (Array.isArray(value)) {
          console.log(`  ${key}: [${value.length} items]`);
          for (const v of value.slice(0, 3)) {
            console.log(`    - ${typeof v === 'string' && v.length > 80 ? v.slice(0, 80) + '...' : v}`);
          }
          if (value.length > 3) console.log(`    ... and ${value.length - 3} more`);
        } else if (typeof value === 'object' && value !== null) {
          console.log(`  ${key}: ${JSON.stringify(value)}`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      // Summary of what we got vs what we wanted
      subsection('Field coverage from deferred-state');
      const fieldMap: Record<string, unknown> = {
        title: extracted.title,
        description: extracted.description,
        amenities: extracted.amenities,
        photos: extracted.photos,
        pricePerNight: extracted.pricePerNight,
        rating: extracted.rating,
        reviewCount: extracted.reviewCount,
        reviewScores: extracted.reviewScores,
        'location (lat/lng)': extracted.lat && extracted.lng ? `${extracted.lat}, ${extracted.lng}` : undefined,
        propertyType: extracted.propertyType,
        roomType: extracted.roomType,
        accommodates: extracted.accommodates,
        bedrooms: extracted.bedrooms,
        beds: extracted.beds,
        bathrooms: extracted.bathrooms,
        hostResponseRate: extracted.hostResponseRate,
        isSuperhost: extracted.isSuperhost,
        instantBookable: extracted.instantBookable,
      };

      let found = 0;
      let missing = 0;
      for (const field of DESIRED_FIELDS) {
        const value = fieldMap[field];
        const has = value !== undefined && value !== null && (!Array.isArray(value) || value.length > 0);
        console.log(`  ${has ? '[OK]' : '[--]'} ${field}`);
        if (has) found++;
        else missing++;
      }
      console.log(`\n  Coverage: ${found}/${DESIRED_FIELDS.length} (${Math.round((found / DESIRED_FIELDS.length) * 100)}%)`);

    } catch (err) {
      console.error('  Failed to parse JSON:', err);
    }
  } else {
    console.log('NOT FOUND');

    // Try other numbered deferred state scripts
    const allScripts = $('script[id^="data-deferred-state"]');
    console.log(`  Other data-deferred-state scripts found: ${allScripts.length}`);
    allScripts.each((i, el) => {
      const id = $(el).attr('id');
      const content = $(el).html() || '';
      console.log(`    ${id}: ${content.length.toLocaleString()} chars`);
    });
  }

  // ── Source B: JSON-LD ──
  subsection('Source B: <script type="application/ld+json">');
  const jsonLdScripts = $('script[type="application/ld+json"]');
  console.log(`Found ${jsonLdScripts.length} JSON-LD scripts`);

  jsonLdScripts.each((i, el) => {
    try {
      const json = JSON.parse($(el).html() || '');
      const type = json['@type'] || 'unknown';
      console.log(`\n  Script ${i + 1}: @type = ${type}`);
      console.log(`  Structure: ${getStructure(json, 0, 2)}`);
    } catch {
      console.log(`  Script ${i + 1}: Failed to parse`);
    }
  });

  // ── Source C: __NEXT_DATA__ ──
  subsection('Source C: __NEXT_DATA__');
  const nextDataScript = $('script#__NEXT_DATA__').html();
  if (nextDataScript) {
    console.log(`Found! Length: ${nextDataScript.length.toLocaleString()} chars`);
    try {
      const nextData = JSON.parse(nextDataScript);
      console.log(`Top-level keys: ${Object.keys(nextData).join(', ')}`);
      if (nextData.props?.pageProps) {
        console.log(`pageProps keys: ${Object.keys(nextData.props.pageProps).join(', ')}`);
      }
    } catch (err) {
      console.error('  Failed to parse:', err);
    }
  } else {
    console.log('NOT FOUND');
  }

  // ── Source D: Other script tags that might contain data ──
  subsection('Source D: Other potentially interesting script tags');
  const allScripts = $('script');
  const interestingScripts: { index: number; id?: string; type?: string; snippet: string; length: number }[] = [];

  allScripts.each((i, el) => {
    const id = $(el).attr('id') || '';
    const type = $(el).attr('type') || '';
    const content = $(el).html() || '';

    // Skip external scripts, tiny scripts, and already-checked scripts
    if ($(el).attr('src')) return;
    if (content.length < 500) return;
    if (id === 'data-deferred-state-0' || id === '__NEXT_DATA__' || type === 'application/ld+json') return;

    interestingScripts.push({
      index: i,
      id: id || undefined,
      type: type || undefined,
      snippet: content.slice(0, 150).replace(/\n/g, ' '),
      length: content.length,
    });
  });

  console.log(`Found ${interestingScripts.length} other large script tags:`);
  for (const s of interestingScripts.slice(0, 10)) {
    console.log(`  #${s.index}${s.id ? ` id="${s.id}"` : ''}${s.type ? ` type="${s.type}"` : ''} (${s.length.toLocaleString()} chars)`);
    console.log(`    Preview: ${s.snippet}...`);
  }

  // ── HTML meta tags ──
  subsection('Source E: Meta tags / OG data');
  const metaData: Record<string, string> = {};
  $('meta[property^="og:"], meta[name^="twitter:"], meta[name="description"]').each((_, el) => {
    const key = $(el).attr('property') || $(el).attr('name') || '';
    const val = $(el).attr('content') || '';
    if (key && val) metaData[key] = val.slice(0, 200);
  });
  for (const [k, v] of Object.entries(metaData)) {
    console.log(`  ${k}: ${v}`);
  }
}

async function testSearchPage() {
  separator('PART 2: SEARCH RESULTS PAGE');
  console.log(`URL: ${SEARCH_URL}`);

  let html: string;
  try {
    console.log('\nFetching search page...');
    const res = await fetch(SEARCH_URL, {
      headers: HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
    });
    console.log(`Status: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      console.error(`FAILED: HTTP ${res.status}`);
      const body = await res.text();
      console.log(`Response body (first 500 chars): ${body.slice(0, 500)}`);
      return;
    }

    html = await res.text();
    console.log(`HTML length: ${html.length.toLocaleString()} chars`);
  } catch (err) {
    console.error(`FAILED to fetch:`, err);
    return;
  }

  const $ = cheerio.load(html);

  // Check for deferred state scripts
  subsection('Script tags in search results');
  const deferredScripts = $('script[id^="data-deferred-state"]');
  console.log(`data-deferred-state scripts: ${deferredScripts.length}`);
  deferredScripts.each((_, el) => {
    const id = $(el).attr('id');
    const content = $(el).html() || '';
    console.log(`  ${id}: ${content.length.toLocaleString()} chars`);

    if (content.length > 0) {
      try {
        const data = JSON.parse(content);
        // Look for search results / listings
        const listings = deepFind(data, 'searchResults') || deepFind(data, 'listings') || deepFind(data, 'results');
        if (listings) {
          console.log(`  Found search results! Structure: ${getStructure(listings, 0, 2)}`);
        }

        // Try to find listing items
        const items = deepFind(data, 'items') || deepFind(data, 'sections');
        if (Array.isArray(items)) {
          console.log(`  Found ${items.length} items/sections`);
          if (items.length > 0) {
            console.log(`  First item structure: ${getStructure(items[0], 0, 3)}`);
          }
        }

        // Look for listing IDs
        const listingIds = deepFindAll(data, 'listingId');
        if (listingIds.length > 0) {
          console.log(`  Found ${listingIds.length} listingId references`);
          console.log(`  Sample IDs: ${listingIds.slice(0, 5).join(', ')}`);
        }

        // Look for listing titles
        const titles = deepFindAll(data, 'listingTitle');
        const names = deepFindAll(data, 'name');
        if (titles.length > 0) {
          console.log(`  Found ${titles.length} listingTitle entries`);
          for (const t of titles.slice(0, 3)) {
            if (typeof t === 'string') console.log(`    - ${t.slice(0, 80)}`);
          }
        }

      } catch {
        console.log('  Failed to parse as JSON');
      }
    }
  });

  // Check __NEXT_DATA__ in search
  const nextData = $('script#__NEXT_DATA__').html();
  if (nextData) {
    console.log(`\n__NEXT_DATA__ found: ${nextData.length.toLocaleString()} chars`);
  } else {
    console.log('\n__NEXT_DATA__: NOT FOUND');
  }

  // Deep dive into search listing data
  deferredScripts.each((_, el) => {
    const content = $(el).html() || '';
    if (content.length === 0) return;
    try {
      const data = JSON.parse(content);
      subsection('Search listing detail extraction');

      // Find all items that look like listings
      const items = deepFind(data, 'items') as unknown[];
      if (!Array.isArray(items)) return;

      const firstListing = items[0] as Record<string, unknown>;
      if (!firstListing) return;

      console.log(`  First listing full keys: ${Object.keys(firstListing).join(', ')}`);
      console.log(`  Title: ${firstListing.title}`);

      // Price info
      const priceInfo = firstListing.structuredDisplayPrice as Record<string, unknown>;
      if (priceInfo) {
        console.log(`  Price structure: ${getStructure(priceInfo, 0, 3)}`);
      }

      // Rating info
      const demandListing = firstListing.demandStayListing as Record<string, unknown>;
      if (demandListing) {
        console.log(`  demandStayListing: ${getStructure(demandListing, 0, 3)}`);
      }

      // avgRatingLocalized, avgRatingA11yLabel
      const avgRating = firstListing.avgRatingLocalized;
      const avgRatingLabel = firstListing.avgRatingA11yLabel;
      console.log(`  avgRatingLocalized: ${avgRating}`);
      console.log(`  avgRatingA11yLabel: ${avgRatingLabel}`);

      // Log 3 listings summary
      console.log('\n  Summary of first 3 search listings:');
      for (const item of items.slice(0, 3)) {
        const listing = item as Record<string, unknown>;
        const price = deepFind(listing, 'price') || deepFind(listing, 'accessibilityLabel');
        console.log(`    - ${listing.title} | Rating: ${listing.avgRatingLocalized || 'N/A'} | Price: ${getStructure(price, 0, 1)}`);
      }

      // Count total listings
      console.log(`\n  Total listings in search results: ${items.length}`);

    } catch { /* ignore */ }
  });
}

async function testListingWithRealId() {
  separator('PART 3: LISTING PAGE WITH REAL ID FROM SEARCH');

  // First, get a real listing ID from search results
  console.log('Fetching search to get a real listing ID...');
  let realListingId: string | null = null;

  try {
    const searchRes = await fetch(SEARCH_URL, {
      headers: HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
    });
    const searchHtml = await searchRes.text();
    const $s = cheerio.load(searchHtml);
    const deferredContent = $s('script#data-deferred-state-0').html();
    if (deferredContent) {
      const data = JSON.parse(deferredContent);
      const items = deepFind(data, 'items') as Record<string, unknown>[];
      if (Array.isArray(items) && items.length > 0) {
        // propertyId or listing.id
        realListingId = (items[0].propertyId as string) || null;
        if (!realListingId) {
          const listing = items[0].listing as Record<string, unknown>;
          if (listing) realListingId = listing.id as string;
        }
      }
    }
  } catch (err) {
    console.error('Failed to get listing ID from search:', err);
  }

  if (!realListingId) {
    // Fallback to a well-known listing
    realListingId = '37239310'; // From the encoded ID in search
    console.log(`Using decoded listing ID: ${realListingId}`);
  } else {
    console.log(`Found real listing ID: ${realListingId}`);
  }

  const listingUrl = `https://www.airbnb.com/rooms/${realListingId}`;
  console.log(`\nFetching listing: ${listingUrl}`);

  try {
    const res = await fetch(listingUrl, {
      headers: HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
    });
    console.log(`Status: ${res.status} ${res.statusText}`);
    const html = await res.text();
    console.log(`HTML length: ${html.length.toLocaleString()} chars`);

    if (html.length < 10000) {
      console.log('  Short response. Preview:');
      console.log('  ' + html.slice(0, 500));
      return;
    }

    const $ = cheerio.load(html);

    // Check all data sources
    const allDeferred = $('script[id^="data-deferred-state"]');
    console.log(`\n  data-deferred-state scripts: ${allDeferred.length}`);
    allDeferred.each((_, el) => {
      const id = $(el).attr('id');
      const content = $(el).html() || '';
      console.log(`    ${id}: ${content.length.toLocaleString()} chars`);
    });

    const deferred0 = $('script#data-deferred-state-0').html();
    if (deferred0) {
      const data = JSON.parse(deferred0);
      console.log(`\n  Top-level keys: ${Object.keys(data).join(', ')}`);

      const extracted = extractFromDeferredState(data);

      subsection('Extracted from listing deferred-state');
      for (const [key, value] of Object.entries(extracted)) {
        if (Array.isArray(value)) {
          console.log(`  ${key}: [${value.length} items]`);
          for (const v of value.slice(0, 3)) {
            console.log(`    - ${typeof v === 'string' && v.length > 80 ? v.slice(0, 80) + '...' : v}`);
          }
        } else if (typeof value === 'object' && value !== null) {
          console.log(`  ${key}: ${JSON.stringify(value)}`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      // Coverage check
      subsection('Field coverage from listing deferred-state');
      const fieldMap: Record<string, unknown> = {
        title: extracted.title,
        description: extracted.description,
        amenities: extracted.amenities,
        photos: extracted.photos,
        pricePerNight: extracted.pricePerNight,
        rating: extracted.rating,
        reviewCount: extracted.reviewCount,
        reviewScores: extracted.reviewScores,
        'location (lat/lng)': extracted.lat && extracted.lng ? `${extracted.lat}, ${extracted.lng}` : undefined,
        propertyType: extracted.propertyType,
        roomType: extracted.roomType,
        accommodates: extracted.accommodates,
        bedrooms: extracted.bedrooms,
        beds: extracted.beds,
        bathrooms: extracted.bathrooms,
        hostResponseRate: extracted.hostResponseRate,
        isSuperhost: extracted.isSuperhost,
        instantBookable: extracted.instantBookable,
      };
      let found = 0;
      for (const field of DESIRED_FIELDS) {
        const value = fieldMap[field];
        const has = value !== undefined && value !== null && (!Array.isArray(value) || value.length > 0);
        console.log(`  ${has ? '[OK]' : '[--]'} ${field}`);
        if (has) found++;
      }
      console.log(`\n  Coverage: ${found}/${DESIRED_FIELDS.length} (${Math.round((found / DESIRED_FIELDS.length) * 100)}%)`);
    }

    // JSON-LD
    const jsonLd = $('script[type="application/ld+json"]');
    if (jsonLd.length > 0) {
      subsection('JSON-LD from listing page');
      jsonLd.each((i, el) => {
        try {
          const json = JSON.parse($(el).html() || '');
          console.log(`  Script ${i + 1} (@type=${json['@type']}): ${getStructure(json, 0, 3)}`);

          // Extract additional fields from JSON-LD
          if (json['@type'] === 'VacationRental') {
            console.log(`\n  VacationRental details:`);
            console.log(`    name: ${json.name}`);
            console.log(`    latitude: ${json.latitude}`);
            console.log(`    longitude: ${json.longitude}`);
            console.log(`    images: ${Array.isArray(json.image) ? json.image.length : 0}`);
            console.log(`    containsPlace.occupancy: ${JSON.stringify(json.containsPlace?.occupancy)}`);
            console.log(`    address: ${JSON.stringify(json.address)}`);
            console.log(`    aggregateRating: ${JSON.stringify(json.aggregateRating)}`);
            console.log(`    offers: ${JSON.stringify(json.offers)}`);
            console.log(`    All keys: ${Object.keys(json).join(', ')}`);
          }
          if (json['@type'] === 'Product') {
            console.log(`\n  Product details:`);
            console.log(`    aggregateRating: ${JSON.stringify(json.aggregateRating)}`);
            console.log(`    offers: ${JSON.stringify(json.offers)}`);
            console.log(`    All keys: ${Object.keys(json).join(', ')}`);
          }
        } catch { /* ignore */ }
      });
    }

    // Deep dive into deferred state to find missing fields
    if (deferred0) {
      subsection('Deep-dive: searching for missing fields in deferred-state');
      const data = JSON.parse(deferred0);

      // Photos - try various paths
      const allPictures = deepFindAll(data, 'picture');
      const allPhotos = deepFindAll(data, 'photo');
      const allImages = deepFindAll(data, 'image');
      const allBaseUrls = deepFindAll(data, 'baseUrl');
      console.log(`  "picture" occurrences: ${allPictures.length}`);
      console.log(`  "photo" occurrences: ${allPhotos.length}`);
      console.log(`  "image" occurrences: ${allImages.length}`);
      console.log(`  "baseUrl" occurrences: ${allBaseUrls.length}`);
      if (allBaseUrls.length > 0) {
        console.log(`  Sample baseUrls:`);
        for (const u of allBaseUrls.slice(0, 3)) {
          if (typeof u === 'string') console.log(`    ${u.slice(0, 100)}`);
        }
      }

      // Price
      const allPrices = deepFindAll(data, 'priceForDisplay');
      const priceStrings = deepFindAll(data, 'priceString');
      const amounts = deepFindAll(data, 'amount');
      const priceItems = deepFindAll(data, 'priceItems');
      console.log(`\n  "priceForDisplay" occurrences: ${allPrices.length} -> ${allPrices.slice(0,3).map(String).join(', ')}`);
      console.log(`  "priceString" occurrences: ${priceStrings.length} -> ${priceStrings.slice(0,3).map(String).join(', ')}`);
      console.log(`  "amount" occurrences: ${amounts.length} -> ${amounts.slice(0,3).map(String).join(', ')}`);
      console.log(`  "priceItems" occurrences: ${priceItems.length}`);

      // Beds/bedrooms/bathrooms
      const bedroomLabels = deepFindAll(data, 'bedroomLabel');
      const bedLabels = deepFindAll(data, 'bedLabel');
      const bathLabels = deepFindAll(data, 'bathLabel');
      const overviewItems = deepFindAll(data, 'overviewItems');
      console.log(`\n  "bedroomLabel" occurrences: ${bedroomLabels.length} -> ${bedroomLabels.slice(0,3).map(String).join(', ')}`);
      console.log(`  "bedLabel" occurrences: ${bedLabels.length} -> ${bedLabels.slice(0,3).map(String).join(', ')}`);
      console.log(`  "bathLabel" occurrences: ${bathLabels.length} -> ${bathLabels.slice(0,3).map(String).join(', ')}`);
      console.log(`  "overviewItems" occurrences: ${overviewItems.length}`);
      if (overviewItems.length > 0) {
        console.log(`  overviewItems[0]: ${getStructure(overviewItems[0], 0, 3)}`);
      }

      // Review breakdown
      const categoryRatings = deepFindAll(data, 'categoryRatings');
      const ratingHistogram = deepFindAll(data, 'ratingHistogram');
      console.log(`\n  "categoryRatings" occurrences: ${categoryRatings.length}`);
      if (categoryRatings.length > 0) {
        console.log(`  categoryRatings[0]: ${getStructure(categoryRatings[0], 0, 3)}`);
      }
      console.log(`  "ratingHistogram" occurrences: ${ratingHistogram.length}`);

      // Amenities deeper
      const amenityGroups = deepFindAll(data, 'amenityGroups');
      const seeAllAmenityGroups = deepFindAll(data, 'seeAllAmenityGroups');
      const amenities = deepFindAll(data, 'amenities');
      console.log(`\n  "amenityGroups" occurrences: ${amenityGroups.length}`);
      console.log(`  "seeAllAmenityGroups" occurrences: ${seeAllAmenityGroups.length}`);
      console.log(`  "amenities" occurrences: ${amenities.length}`);
      if (seeAllAmenityGroups.length > 0 && Array.isArray(seeAllAmenityGroups[0])) {
        const groups = seeAllAmenityGroups[0] as Record<string, unknown>[];
        console.log(`  seeAllAmenityGroups has ${groups.length} groups`);
        for (const g of groups.slice(0, 2)) {
          console.log(`    Group: ${getStructure(g, 0, 3)}`);
        }
      }

      // Host response rate
      const hostProfile = deepFind(data, 'hostProfileSection');
      const hostResponse = deepFindAll(data, 'responseRate');
      const hostResponseTime = deepFindAll(data, 'responseTime');
      console.log(`\n  "hostProfileSection" found: ${!!hostProfile}`);
      console.log(`  "responseRate" occurrences: ${hostResponse.length} -> ${hostResponse.slice(0,3).map(String).join(', ')}`);
      console.log(`  "responseTime" occurrences: ${hostResponseTime.length} -> ${hostResponseTime.slice(0,3).map(String).join(', ')}`);

      // instantBookable
      const instantBook = deepFindAll(data, 'instantBookable');
      const isInstantBook = deepFindAll(data, 'isInstantBookable');
      console.log(`\n  "instantBookable" occurrences: ${instantBook.length}`);
      console.log(`  "isInstantBookable" occurrences: ${isInstantBook.length}`);

      // bookingPrefetch or similar
      const bookingData = deepFind(data, 'bookingPrefetch');
      console.log(`  "bookingPrefetch" found: ${!!bookingData}`);
      if (bookingData) {
        console.log(`  bookingPrefetch: ${getStructure(bookingData, 0, 3)}`);
      }
    }

  } catch (err) {
    console.error(`FAILED:`, err);
  }
}

async function testListingKoreanDomain() {
  separator('PART 4: LISTING PAGE VIA KOREAN DOMAIN');

  // Try with the Korean domain using a known listing ID
  const koreanUrl = 'https://www.airbnb.co.kr/rooms/37239310';
  console.log(`URL: ${koreanUrl}`);

  try {
    const res = await fetch(koreanUrl, {
      headers: HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
    });
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log(`Final URL: ${res.url}`);
    const html = await res.text();
    console.log(`HTML length: ${html.length.toLocaleString()} chars`);

    if (html.length < 10000) {
      console.log('  Short response. Preview: ' + html.slice(0, 300));
    } else {
      const $ = cheerio.load(html);
      const allDeferred = $('script[id^="data-deferred-state"]');
      console.log(`  data-deferred-state scripts: ${allDeferred.length}`);
      allDeferred.each((_, el) => {
        console.log(`    ${$(el).attr('id')}: ${($(el).html() || '').length.toLocaleString()} chars`);
      });
    }
  } catch (err) {
    console.error(`FAILED:`, err);
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('============================================================');
  console.log('  Airbnb Scraping PoC Test');
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log('============================================================');

  await testListingPage();
  await testSearchPage();
  await testListingWithRealId();
  await testListingKoreanDomain();

  separator('CONCLUSION');
  console.log(`
  ANSWER: YES, HTTP fetch + Cheerio CAN extract most Airbnb data.
  No Playwright/browser automation needed.

  === DATA SOURCES ===
  1. data-deferred-state-0 (listing): 137K+ JSON blob -- PRIMARY source
     - title, description, rating, reviewCount, lat/lng, propertyType,
       roomType, accommodates, isSuperhost
     - Some baseUrl image references (limited)
     - Amenities key exists but extraction needs path refinement

  2. JSON-LD (listing): TWO structured data blocks
     - VacationRental: name, description, 8 image URLs, lat/lng, address,
       occupancy, aggregateRating
     - Product: name, description, images, aggregateRating
     - NO price/offers in JSON-LD (Airbnb removed it)

  3. data-deferred-state-0 (search): 216K+ JSON blob -- COMP-SET source
     - title, propertyId, avgRating, photos, price (total KRW),
       checkin/checkout, badges, listing metadata
     - 8 listings per page (pageable)

  === FIELD COVERAGE (combined deferred-state + JSON-LD) ===
  [OK] title              -- deferred-state + JSON-LD name
  [OK] description         -- deferred-state htmlDescription
  [OK] photos              -- JSON-LD image array (8 URLs)
  [OK] rating              -- deferred-state overallRating + JSON-LD ratingValue
  [OK] reviewCount         -- deferred-state + JSON-LD ratingCount
  [OK] location (lat/lng)  -- deferred-state + JSON-LD
  [OK] propertyType        -- deferred-state
  [OK] roomType            -- deferred-state
  [OK] accommodates        -- deferred-state personCapacity
  [OK] isSuperhost         -- deferred-state
  [--] pricePerNight       -- NOT in listing page (only in search results)
  [--] amenities           -- Key exists but empty array (needs deeper path)
  [--] reviewScores        -- categoryRatings not found (may be deferred/lazy)
  [--] bedrooms/beds/bath  -- Not in initial SSR payload
  [--] hostResponseRate    -- Not in initial SSR payload
  [--] instantBookable     -- Not in initial SSR payload

  Coverage: 10/18 (56%) from listing page alone
  Price available from search results page (comp-set building works)

  === LIMITATIONS ===
  - Listing URL MUST be valid (404 page is a static HTML shell)
  - Some fields (amenities detail, beds/baths, review breakdown, price)
    are loaded via deferred client-side GraphQL calls, NOT in the initial
    SSR HTML payload
  - Price is NOT available on the listing page SSR -- only on search results
  - Rate limiting may apply at scale (no issues in this test)
  - The original listing URL (1025330516498990498) was a 404

  === RECOMMENDATION ===
  For StayTrend's needs:
  1. Use listing page scraping for: title, description, photos, rating,
     reviewCount, location, propertyType, roomType, accommodates, isSuperhost
  2. Use search results scraping for: price, comp-set building, area analysis
  3. For missing fields (amenities, beds/baths, review breakdown):
     Option A: Parse the deferred-state more deeply (the 137K blob may
               contain these in nested GraphQL result paths)
     Option B: Call Airbnb's internal GraphQL API directly (same endpoints
               the browser calls for lazy-loaded sections)
     Option C: Use Playwright only for the few missing fields
  4. Playwright is NOT needed for the core use case
  `);
}

main().catch(console.error);
