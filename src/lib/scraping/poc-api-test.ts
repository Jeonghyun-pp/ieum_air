/**
 * PoC #2: Airbnb Internal API Direct Call Test
 *
 * Tests whether we can call Airbnb's internal GraphQL/REST APIs directly
 * to get the fields missing from SSR scraping (56% coverage):
 *   - amenities, pricePerNight, reviewScores (category breakdown)
 *   - bedrooms/beds/bathrooms, hostResponseRate, instantBookable
 *
 * Run: npx tsx src/lib/scraping/poc-api-test.ts
 */

import * as cheerio from 'cheerio';

// ─── Config ───────────────────────────────────────────────────────────────────

const LISTING_ID = '37239310'; // 제주도 listing, confirmed working
const LISTING_URL = `https://www.airbnb.co.kr/rooms/${LISTING_ID}`;
const LISTING_URL_WITH_DATES = `https://www.airbnb.co.kr/rooms/${LISTING_ID}?adults=2&check_in=2026-04-15&check_out=2026-04-17&currency=KRW`;

const BROWSER_HEADERS: Record<string, string> = {
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

const MISSING_FIELDS = [
  'amenities',
  'pricePerNight',
  'reviewScores (category breakdown)',
  'bedrooms',
  'beds',
  'bathrooms',
  'hostResponseRate',
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

function deepFind(obj: unknown, targetKey: string, maxDepth = 15, currentDepth = 0): unknown {
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

function deepFindAll(obj: unknown, targetKey: string, maxDepth = 15, currentDepth = 0): unknown[] {
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

// ─── Step 1: Extract API Key from listing page ────────────────────────────────

async function extractApiKey(): Promise<{ apiKey: string | null; html: string }> {
  separator('STEP 1: EXTRACT AIRBNB API KEY');
  console.log(`Fetching: ${LISTING_URL}`);

  const res = await fetch(LISTING_URL, {
    headers: BROWSER_HEADERS,
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
  });
  console.log(`Status: ${res.status}`);
  const html = await res.text();
  console.log(`HTML length: ${html.length.toLocaleString()} chars`);

  const $ = cheerio.load(html);
  let apiKey: string | null = null;

  // Method 1: meta tag
  subsection('Method 1: <meta> tag');
  const metaApiKey = $('meta[name="airbnb-api-key"]').attr('content');
  if (metaApiKey) {
    console.log(`  Found via meta tag: ${metaApiKey}`);
    apiKey = metaApiKey;
  } else {
    console.log('  Not found in meta tags');
    // Check all meta tags for anything API-related
    $('meta').each((_, el) => {
      const name = $(el).attr('name') || $(el).attr('property') || '';
      if (name.toLowerCase().includes('api') || name.toLowerCase().includes('key')) {
        console.log(`    meta[${name}] = ${$(el).attr('content')}`);
      }
    });
  }

  // Method 2: search in inline scripts for AIRBNB_API_KEY / X-Airbnb-API-Key
  subsection('Method 2: Search inline scripts');
  const scriptPatterns = [
    /AIRBNB_API_KEY\s*[=:]\s*["']([^"']+)["']/,
    /api_key\s*[=:]\s*["']([^"']+)["']/i,
    /X-Airbnb-API-Key\s*[=:]\s*["']([^"']+)["']/,
    /"key"\s*:\s*"(d306zoyjsyarp7ifhu67rjxn52tv0t20)"/,  // known public key
    /["']([a-z0-9]{32})["']/,  // generic 32-char hex key
  ];

  const allScripts = $('script:not([src])');
  console.log(`  Scanning ${allScripts.length} inline scripts...`);

  allScripts.each((i, el) => {
    const content = $(el).html() || '';
    if (content.length < 100) return;

    for (const pattern of scriptPatterns.slice(0, 3)) {
      const match = content.match(pattern);
      if (match) {
        console.log(`  Found in script #${i} via pattern ${pattern.source}: ${match[1]}`);
        if (!apiKey) apiKey = match[1];
      }
    }

    // Also search for known Airbnb API key value
    if (content.includes('d306zoyjsyarp7ifhu67rjxn52tv0t20')) {
      console.log(`  Found known Airbnb public API key in script #${i}`);
      if (!apiKey) apiKey = 'd306zoyjsyarp7ifhu67rjxn52tv0t20';
    }
  });

  // Method 3: data-deferred-state JSON blobs
  subsection('Method 3: Search data-deferred-state blobs');
  $('script[id^="data-deferred-state"]').each((_, el) => {
    const content = $(el).html() || '';
    if (content.length === 0) return;
    const id = $(el).attr('id');

    // Search for API key patterns in JSON
    const keyPatterns = [
      /"api_key"\s*:\s*"([^"]+)"/,
      /"apiKey"\s*:\s*"([^"]+)"/,
      /"key"\s*:\s*"([a-z0-9]{20,40})"/,
      /d306zoyjsyarp7ifhu67rjxn52tv0t20/,
    ];

    for (const pattern of keyPatterns) {
      const match = content.match(pattern);
      if (match) {
        const foundKey = match[1] || 'd306zoyjsyarp7ifhu67rjxn52tv0t20';
        console.log(`  Found in ${id} via ${pattern.source}: ${foundKey}`);
        if (!apiKey) apiKey = foundKey;
      }
    }
  });

  // Method 4: search raw HTML for the known key
  subsection('Method 4: Raw HTML search');
  const knownKeys = ['d306zoyjsyarp7ifhu67rjxn52tv0t20'];
  for (const key of knownKeys) {
    if (html.includes(key)) {
      console.log(`  Known API key "${key}" found in HTML!`);
      const idx = html.indexOf(key);
      console.log(`  Context: ...${html.slice(Math.max(0, idx - 50), idx + key.length + 50)}...`);
      if (!apiKey) apiKey = key;
    } else {
      console.log(`  Known key "${key}" NOT found in HTML`);
    }
  }

  // Method 5: search for any "key" that looks like an API key in the HTML
  subsection('Method 5: Broad pattern search');
  // Airbnb API keys are typically 32-char alphanumeric
  const broadMatch = html.match(/"(?:api[_-]?key|airbnb[_-]?key|client[_-]?key|x[_-]airbnb[_-]api[_-]key)"\s*[:=]\s*"([^"]+)"/i);
  if (broadMatch) {
    console.log(`  Found broad match: ${broadMatch[1]}`);
    if (!apiKey) apiKey = broadMatch[1];
  } else {
    console.log('  No broad pattern matches');
  }

  // Check for _AIRBNB_ prefixed config
  const configMatch = html.match(/_AIRBNB_[A-Z_]*KEY[A-Z_]*\s*=\s*["']([^"']+)["']/);
  if (configMatch) {
    console.log(`  Found config match: ${configMatch[1]}`);
    if (!apiKey) apiKey = configMatch[1];
  }

  if (!apiKey) {
    console.log('\n  WARNING: Could not find API key. Will try known public key as fallback.');
    apiKey = 'd306zoyjsyarp7ifhu67rjxn52tv0t20';
  }

  console.log(`\n  RESULT: API Key = ${apiKey}`);
  return { apiKey, html };
}

// ─── Step 2: Try StaysPdpSections API ─────────────────────────────────────────

async function tryStaysPdpSections(apiKey: string) {
  separator('STEP 2: CALL StaysPdpSections API');

  // Known operation hashes that have been observed in Airbnb's client
  const knownHashes = [
    'b6e650f7160b7b4e5ad7e10ee7a04e244f5ab42dd8cfb94b76b14b11cb6fe0c6',
    '0cee38db8f498b0aaeb10e8f8fcaab7c0258c15b0b54c4bca1a133f7ee0b0f38',
    'a2879e88ec0e14e4a9120c85a37ba5352fe25bb8f5fa1a38f5e33b46f0a9de08',
    'ac3fb7e85ea07e3e66a4eac30e5c357d3b89fd1f8c5207e6b015e7f7ab370b07',
    'bfbb4d97069cac3de20f4f28e20954a7b22c86ac04e49c016ac78a3caec6ca8a',
  ];

  const variables = {
    id: LISTING_ID,
    pdpSectionsRequest: {
      adults: '2',
      layouts: ['SIDEBAR', 'SINGLE_COLUMN'],
      sectionIds: null,
      checkIn: '2026-04-15',
      checkOut: '2026-04-17',
    },
  };

  const apiHeaders: Record<string, string> = {
    'User-Agent': BROWSER_HEADERS['User-Agent'],
    'Accept': 'application/json',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Content-Type': 'application/json',
    'X-Airbnb-API-Key': apiKey,
    'X-Airbnb-GraphQL-Platform': 'web',
    'X-Airbnb-GraphQL-Platform-Client': 'minimalist-niobe',
    'X-Airbnb-Supports-Airlock-V2': 'true',
    'X-CSRF-Token': '',
    'X-CSRF-Without-Token': '1',
    'Origin': 'https://www.airbnb.co.kr',
    'Referer': `https://www.airbnb.co.kr/rooms/${LISTING_ID}`,
  };

  for (let i = 0; i < knownHashes.length; i++) {
    const hash = knownHashes[i];
    subsection(`Attempt ${i + 1}/${knownHashes.length} (hash: ${hash.slice(0, 16)}...)`);

    const params = new URLSearchParams({
      operationName: 'StaysPdpSections',
      locale: 'ko',
      currency: 'KRW',
      variables: JSON.stringify(variables),
      extensions: JSON.stringify({
        persistedQuery: {
          version: 1,
          sha256Hash: hash,
        },
      }),
    });

    const url = `https://www.airbnb.co.kr/api/v3/StaysPdpSections/${hash}?${params.toString()}`;

    try {
      const res = await fetch(url, {
        method: 'GET',
        headers: apiHeaders,
        signal: AbortSignal.timeout(15000),
      });

      console.log(`  Status: ${res.status} ${res.statusText}`);
      console.log(`  Content-Type: ${res.headers.get('content-type')}`);

      const body = await res.text();
      console.log(`  Response length: ${body.length.toLocaleString()} chars`);

      if (res.ok && body.length > 100) {
        try {
          const data = JSON.parse(body);

          // Check for errors
          if (data.errors) {
            console.log(`  GraphQL errors: ${JSON.stringify(data.errors).slice(0, 300)}`);
            continue;
          }

          console.log(`  SUCCESS! Top-level keys: ${Object.keys(data).join(', ')}`);
          console.log(`  Structure: ${getStructure(data, 0, 2)}`);

          // Extract the sections
          analyzeApiResponse(data, 'StaysPdpSections');
          return data;
        } catch {
          console.log(`  Response is not valid JSON. First 300 chars: ${body.slice(0, 300)}`);
        }
      } else if (res.status === 403 || res.status === 401) {
        console.log(`  Auth error. Response: ${body.slice(0, 300)}`);
      } else {
        console.log(`  Error response: ${body.slice(0, 300)}`);
      }
    } catch (err) {
      console.log(`  Request failed: ${err}`);
    }
  }

  // Also try POST method
  subsection('Trying POST method');
  const postBody = {
    operationName: 'StaysPdpSections',
    variables,
    extensions: {
      persistedQuery: {
        version: 1,
        sha256Hash: knownHashes[0],
      },
    },
  };

  try {
    const res = await fetch('https://www.airbnb.co.kr/api/v3/StaysPdpSections', {
      method: 'POST',
      headers: apiHeaders,
      body: JSON.stringify(postBody),
      signal: AbortSignal.timeout(15000),
    });
    console.log(`  Status: ${res.status}`);
    const body = await res.text();
    console.log(`  Response length: ${body.length.toLocaleString()} chars`);
    if (body.length > 0) {
      console.log(`  Response: ${body.slice(0, 500)}`);
    }
  } catch (err) {
    console.log(`  POST failed: ${err}`);
  }

  return null;
}

// ─── Step 3: Try PdpAvailabilityCalendar API ──────────────────────────────────

async function tryCalendarApi(apiKey: string) {
  separator('STEP 3: CALL PdpAvailabilityCalendar / Pricing API');

  const apiHeaders: Record<string, string> = {
    'User-Agent': BROWSER_HEADERS['User-Agent'],
    'Accept': 'application/json',
    'Accept-Language': 'ko-KR,ko;q=0.9',
    'X-Airbnb-API-Key': apiKey,
    'X-Airbnb-GraphQL-Platform': 'web',
    'X-CSRF-Without-Token': '1',
    'Origin': 'https://www.airbnb.co.kr',
    'Referer': `https://www.airbnb.co.kr/rooms/${LISTING_ID}`,
  };

  // Try the calendar/pricing endpoints
  const calendarEndpoints = [
    {
      name: 'PdpAvailabilityCalendar (GET)',
      method: 'GET' as const,
      url: `https://www.airbnb.co.kr/api/v3/PdpAvailabilityCalendar?operationName=PdpAvailabilityCalendar&locale=ko&currency=KRW&variables=${encodeURIComponent(JSON.stringify({
        request: {
          count: 12,
          listingId: LISTING_ID,
          month: 4,
          year: 2026,
        },
      }))}&extensions=${encodeURIComponent(JSON.stringify({
        persistedQuery: {
          version: 1,
          sha256Hash: '8f08e03c7bd16fcad3c92a3592c19a8b559a0d0571a1d585d4e3571f2dcdf382',
        },
      }))}`,
    },
    {
      name: 'Calendar via listing API',
      method: 'GET' as const,
      url: `https://www.airbnb.co.kr/api/v3/PdpAvailabilityCalendar/8f08e03c7bd16fcad3c92a3592c19a8b559a0d0571a1d585d4e3571f2dcdf382?operationName=PdpAvailabilityCalendar&locale=ko&currency=KRW&variables=${encodeURIComponent(JSON.stringify({
        request: {
          count: 3,
          listingId: LISTING_ID,
          month: 4,
          year: 2026,
        },
      }))}&extensions=${encodeURIComponent(JSON.stringify({
        persistedQuery: {
          version: 1,
          sha256Hash: '8f08e03c7bd16fcad3c92a3592c19a8b559a0d0571a1d585d4e3571f2dcdf382',
        },
      }))}`,
    },
    {
      name: 'Legacy calendar endpoint',
      method: 'GET' as const,
      url: `https://www.airbnb.co.kr/calendar/ical/${LISTING_ID}.ics`,
    },
    {
      name: 'Booking details endpoint',
      method: 'GET' as const,
      url: `https://www.airbnb.co.kr/api/v2/booking_details?listing_id=${LISTING_ID}&check_in=2026-04-15&check_out=2026-04-17&number_of_adults=2&key=${apiKey}&currency=KRW&locale=ko`,
    },
    {
      name: 'Listing endpoint (v2 API)',
      method: 'GET' as const,
      url: `https://www.airbnb.co.kr/api/v2/listings/${LISTING_ID}?key=${apiKey}&currency=KRW&locale=ko&_format=for_native`,
    },
    {
      name: 'Listing endpoint (v3 API)',
      method: 'GET' as const,
      url: `https://www.airbnb.co.kr/api/v3/listings/${LISTING_ID}?key=${apiKey}&currency=KRW&locale=ko`,
    },
  ];

  for (const endpoint of calendarEndpoints) {
    subsection(endpoint.name);
    console.log(`  URL: ${endpoint.url.slice(0, 150)}...`);

    try {
      const res = await fetch(endpoint.url, {
        method: endpoint.method,
        headers: endpoint.name.includes('ical') ? BROWSER_HEADERS : apiHeaders,
        signal: AbortSignal.timeout(15000),
      });

      console.log(`  Status: ${res.status} ${res.statusText}`);
      const body = await res.text();
      console.log(`  Response length: ${body.length.toLocaleString()} chars`);

      if (res.ok && body.length > 50) {
        // Try JSON
        try {
          const data = JSON.parse(body);
          if (data.errors) {
            console.log(`  GraphQL errors: ${JSON.stringify(data.errors).slice(0, 300)}`);
          } else {
            console.log(`  SUCCESS! Structure: ${getStructure(data, 0, 3)}`);
            analyzeApiResponse(data, endpoint.name);
          }
        } catch {
          // Not JSON - maybe iCal
          if (body.includes('BEGIN:VCALENDAR')) {
            console.log(`  Got iCal data! Lines: ${body.split('\n').length}`);
            const events = body.split('BEGIN:VEVENT').length - 1;
            console.log(`  Events (booked dates): ${events}`);
            console.log(`  First 500 chars: ${body.slice(0, 500)}`);
          } else {
            console.log(`  Non-JSON response: ${body.slice(0, 300)}`);
          }
        }
      } else {
        console.log(`  Response: ${body.slice(0, 300)}`);
      }
    } catch (err) {
      console.log(`  Failed: ${err}`);
    }
  }
}

// ─── Step 4: Fetch listing with dates (SSR with pricing?) ─────────────────────

async function tryListingWithDates() {
  separator('STEP 4: LISTING PAGE WITH DATES (SSR PRICING TEST)');

  const urls = [
    {
      name: 'Korean domain + dates + currency',
      url: LISTING_URL_WITH_DATES,
    },
    {
      name: '.com domain + dates + currency',
      url: `https://www.airbnb.com/rooms/${LISTING_ID}?adults=2&check_in=2026-04-15&check_out=2026-04-17&currency=KRW`,
    },
    {
      name: 'Korean domain + dates + extra params',
      url: `https://www.airbnb.co.kr/rooms/${LISTING_ID}?adults=2&children=0&infants=0&check_in=2026-04-15&check_out=2026-04-17&currency=KRW&source_impression_id=p3_1234567890`,
    },
  ];

  for (const { name, url } of urls) {
    subsection(name);
    console.log(`  URL: ${url}`);

    try {
      const res = await fetch(url, {
        headers: BROWSER_HEADERS,
        redirect: 'follow',
        signal: AbortSignal.timeout(30000),
      });
      console.log(`  Status: ${res.status}`);
      console.log(`  Final URL: ${res.url}`);
      const html = await res.text();
      console.log(`  HTML length: ${html.length.toLocaleString()} chars`);

      if (html.length < 10000) {
        console.log(`  Short response. Preview: ${html.slice(0, 300)}`);
        continue;
      }

      const $ = cheerio.load(html);

      // Parse all deferred-state scripts
      $('script[id^="data-deferred-state"]').each((_, el) => {
        const id = $(el).attr('id');
        const content = $(el).html() || '';
        if (content.length === 0) return;
        console.log(`\n  ${id}: ${content.length.toLocaleString()} chars`);

        try {
          const data = JSON.parse(content);

          // ── PRICING ──
          const priceKeys = [
            'priceForDisplay', 'priceString', 'originalPrice', 'discountedPrice',
            'priceBreakdown', 'structuredDisplayPrice', 'priceItems',
            'priceSummary', 'totalPrice', 'priceDetail', 'basePrice',
            'rateWithServiceFee', 'rate', 'nightlyPrice',
          ];
          console.log('\n  Price-related fields:');
          for (const key of priceKeys) {
            const vals = deepFindAll(data, key);
            if (vals.length > 0) {
              console.log(`    ${key}: ${vals.length} occurrences`);
              for (const v of vals.slice(0, 2)) {
                console.log(`      -> ${getStructure(v, 0, 2)}`);
              }
            }
          }

          // ── AMENITIES ──
          const amenityKeys = ['amenities', 'amenityGroups', 'seeAllAmenityGroups', 'previewAmenities', 'listingAmenities'];
          console.log('\n  Amenity-related fields:');
          for (const key of amenityKeys) {
            const vals = deepFindAll(data, key);
            if (vals.length > 0) {
              console.log(`    ${key}: ${vals.length} occurrences`);
              for (const v of vals.slice(0, 1)) {
                if (Array.isArray(v) && v.length > 0) {
                  console.log(`      -> Array(${v.length}), first: ${getStructure(v[0], 0, 2)}`);
                } else {
                  console.log(`      -> ${getStructure(v, 0, 2)}`);
                }
              }
            }
          }

          // ── REVIEW SCORES (category breakdown) ──
          const reviewKeys = ['categoryRatings', 'ratingHistogram', 'overallRating', 'reviewDetails', 'categoryReviewScores'];
          console.log('\n  Review-related fields:');
          for (const key of reviewKeys) {
            const vals = deepFindAll(data, key);
            if (vals.length > 0) {
              console.log(`    ${key}: ${vals.length} occurrences`);
              for (const v of vals.slice(0, 2)) {
                console.log(`      -> ${getStructure(v, 0, 3)}`);
              }
            }
          }

          // ── BEDROOMS / BEDS / BATHROOMS ──
          const roomKeys = [
            'bedrooms', 'beds', 'bathrooms', 'bedroomCount', 'bedCount', 'bathroomCount',
            'bedroomLabel', 'bedLabel', 'bathLabel', 'guestLabel', 'overviewItems',
            'detailItems', 'listingDetails', 'roomTypeCategory',
          ];
          console.log('\n  Room detail fields:');
          for (const key of roomKeys) {
            const vals = deepFindAll(data, key);
            if (vals.length > 0) {
              console.log(`    ${key}: ${vals.length} occurrences`);
              for (const v of vals.slice(0, 2)) {
                console.log(`      -> ${getStructure(v, 0, 2)}`);
              }
            }
          }

          // ── HOST RESPONSE RATE ──
          const hostKeys = ['hostResponseRate', 'responseRate', 'responseTime', 'hostDetails', 'hostProfileSection'];
          console.log('\n  Host-related fields:');
          for (const key of hostKeys) {
            const vals = deepFindAll(data, key);
            if (vals.length > 0) {
              console.log(`    ${key}: ${vals.length} occurrences`);
              for (const v of vals.slice(0, 2)) {
                console.log(`      -> ${getStructure(v, 0, 2)}`);
              }
            }
          }

          // ── INSTANT BOOKABLE ──
          const bookKeys = ['instantBookable', 'isInstantBookable', 'bookingPrefetch', 'instantBook'];
          console.log('\n  Booking-related fields:');
          for (const key of bookKeys) {
            const vals = deepFindAll(data, key);
            if (vals.length > 0) {
              console.log(`    ${key}: ${vals.length} occurrences`);
              for (const v of vals.slice(0, 2)) {
                console.log(`      -> ${getStructure(v, 0, 2)}`);
              }
            }
          }

          // ── SECTIONS ANALYSIS ──
          // Look for section types (the PDP is broken into sections)
          const sectionTypes = deepFindAll(data, 'sectionId');
          if (sectionTypes.length > 0) {
            console.log(`\n  Section IDs found (${sectionTypes.length}):`);
            for (const s of sectionTypes) {
              if (typeof s === 'string') console.log(`    - ${s}`);
            }
          }

          const sectionComponentTypes = deepFindAll(data, '__typename');
          if (sectionComponentTypes.length > 0) {
            const uniqueTypes = [...new Set(sectionComponentTypes.filter((t): t is string => typeof t === 'string'))];
            console.log(`\n  Unique __typename values (${uniqueTypes.length}):`);
            for (const t of uniqueTypes.slice(0, 30)) {
              console.log(`    - ${t}`);
            }
          }

        } catch (err) {
          console.log(`  Failed to parse: ${err}`);
        }
      });
    } catch (err) {
      console.log(`  Failed: ${err}`);
    }
  }
}

// ─── Analyze API Response ─────────────────────────────────────────────────────

function analyzeApiResponse(data: unknown, source: string) {
  subsection(`Analysis of ${source} response`);

  const record = data as Record<string, unknown>;

  // Check for our missing fields
  const results: Record<string, { found: boolean; value?: string }> = {};

  // Amenities
  const amenityGroups = deepFind(record, 'amenityGroups') || deepFind(record, 'seeAllAmenityGroups');
  const amenities = deepFind(record, 'amenities');
  if (amenityGroups || (Array.isArray(amenities) && amenities.length > 0)) {
    results['amenities'] = { found: true, value: `amenityGroups: ${getStructure(amenityGroups, 0, 2)}` };
  } else {
    results['amenities'] = { found: false };
  }

  // Price
  const price = deepFind(record, 'priceForDisplay') || deepFind(record, 'priceString') || deepFind(record, 'nightlyPrice') || deepFind(record, 'basePrice');
  if (price) {
    results['pricePerNight'] = { found: true, value: String(price) };
  } else {
    results['pricePerNight'] = { found: false };
  }

  // Review scores
  const categoryRatings = deepFind(record, 'categoryRatings');
  if (categoryRatings) {
    results['reviewScores'] = { found: true, value: getStructure(categoryRatings, 0, 3) };
  } else {
    results['reviewScores'] = { found: false };
  }

  // Bedrooms/beds/bathrooms
  const bedrooms = deepFind(record, 'bedrooms') || deepFind(record, 'bedroomCount');
  const beds = deepFind(record, 'beds') || deepFind(record, 'bedCount');
  const bathrooms = deepFind(record, 'bathrooms') || deepFind(record, 'bathroomCount');
  results['bedrooms'] = { found: !!bedrooms, value: bedrooms ? String(bedrooms) : undefined };
  results['beds'] = { found: !!beds, value: beds ? String(beds) : undefined };
  results['bathrooms'] = { found: !!bathrooms, value: bathrooms ? String(bathrooms) : undefined };

  // Host response rate
  const hostResponseRate = deepFind(record, 'hostResponseRate') || deepFind(record, 'responseRate');
  results['hostResponseRate'] = { found: !!hostResponseRate, value: hostResponseRate ? String(hostResponseRate) : undefined };

  // Instant bookable
  const instantBookable = deepFind(record, 'instantBookable') || deepFind(record, 'isInstantBookable');
  results['instantBookable'] = { found: instantBookable !== undefined, value: instantBookable !== undefined ? String(instantBookable) : undefined };

  // Print results
  console.log('\n  Missing field recovery:');
  for (const [field, result] of Object.entries(results)) {
    console.log(`    ${result.found ? '[OK]' : '[--]'} ${field}${result.value ? `: ${result.value.slice(0, 100)}` : ''}`);
  }

  const recovered = Object.values(results).filter((r) => r.found).length;
  console.log(`\n  Recovered: ${recovered}/${Object.keys(results).length} missing fields`);
}

// ─── Step 5: Try fetching with additional query params ────────────────────────

async function tryAlternativeApproaches(apiKey: string) {
  separator('STEP 5: ALTERNATIVE APPROACHES');

  // Approach A: Try the v2 public API with _format=for_rooms_show
  subsection('Approach A: v2 API with _format=for_rooms_show');
  const v2Url = `https://www.airbnb.com/api/v2/listings/${LISTING_ID}?key=${apiKey}&_format=for_rooms_show&currency=KRW&locale=ko`;
  console.log(`  URL: ${v2Url}`);

  try {
    const res = await fetch(v2Url, {
      headers: {
        ...BROWSER_HEADERS,
        Accept: 'application/json',
        'X-Airbnb-API-Key': apiKey,
      },
      signal: AbortSignal.timeout(15000),
    });
    console.log(`  Status: ${res.status}`);
    const body = await res.text();
    console.log(`  Response length: ${body.length.toLocaleString()} chars`);
    if (res.ok) {
      try {
        const data = JSON.parse(body);
        console.log(`  Structure: ${getStructure(data, 0, 2)}`);
        analyzeApiResponse(data, 'v2 API');
      } catch {
        console.log(`  Non-JSON: ${body.slice(0, 300)}`);
      }
    } else {
      console.log(`  Error: ${body.slice(0, 300)}`);
    }
  } catch (err) {
    console.log(`  Failed: ${err}`);
  }

  // Approach B: Try v2 with _format=for_native
  subsection('Approach B: v2 API with _format=for_native');
  const v2NativeUrl = `https://www.airbnb.com/api/v2/listings/${LISTING_ID}?key=${apiKey}&_format=for_native&currency=KRW&locale=ko`;
  try {
    const res = await fetch(v2NativeUrl, {
      headers: {
        Accept: 'application/json',
        'X-Airbnb-API-Key': apiKey,
        'User-Agent': BROWSER_HEADERS['User-Agent'],
      },
      signal: AbortSignal.timeout(15000),
    });
    console.log(`  Status: ${res.status}`);
    const body = await res.text();
    console.log(`  Response length: ${body.length.toLocaleString()} chars`);
    if (res.ok && body.length > 100) {
      try {
        const data = JSON.parse(body);
        console.log(`  SUCCESS! Structure: ${getStructure(data, 0, 2)}`);
        analyzeApiResponse(data, 'v2 native API');
      } catch {
        console.log(`  Non-JSON: ${body.slice(0, 300)}`);
      }
    } else {
      console.log(`  Error: ${body.slice(0, 300)}`);
    }
  } catch (err) {
    console.log(`  Failed: ${err}`);
  }

  // Approach C: Try GraphQL endpoint directly
  subsection('Approach C: GraphQL endpoint with inline query');
  const gqlBody = {
    operationName: 'StaysPdpSections',
    variables: {
      id: LISTING_ID,
      pdpSectionsRequest: {
        adults: '2',
        layouts: ['SIDEBAR', 'SINGLE_COLUMN'],
        checkIn: '2026-04-15',
        checkOut: '2026-04-17',
      },
    },
    query: `query StaysPdpSections($id: String!, $pdpSectionsRequest: StaysPdpSectionsRequest!) {
      presentation {
        stayProductDetailPage(id: $id, request: $pdpSectionsRequest) {
          sections {
            sectionId
            sectionComponentType
            section {
              ... on HostProfileSection { title hostAvatar { baseUrl } }
              ... on PdpAmenitiesSection { title previewAmenities { title icon } seeAllAmenities { title icon } }
              ... on BookingSection { structuredDisplayPrice { primaryLine { price } } }
              ... on PdpReviewsSection { overallRating reviewCount categoryRatings { category localizedName value } }
              ... on PdpOverviewSection { detailItems { title } }
            }
          }
        }
      }
    }`,
  };

  try {
    const res = await fetch('https://www.airbnb.co.kr/api/v3/proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Airbnb-API-Key': apiKey,
        'X-CSRF-Without-Token': '1',
        'User-Agent': BROWSER_HEADERS['User-Agent'],
        Origin: 'https://www.airbnb.co.kr',
        Referer: `https://www.airbnb.co.kr/rooms/${LISTING_ID}`,
      },
      body: JSON.stringify(gqlBody),
      signal: AbortSignal.timeout(15000),
    });
    console.log(`  Status: ${res.status}`);
    const body = await res.text();
    console.log(`  Response length: ${body.length.toLocaleString()} chars`);
    if (body.length > 0) {
      console.log(`  Response: ${body.slice(0, 500)}`);
    }
  } catch (err) {
    console.log(`  Failed: ${err}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('  Airbnb Internal API PoC Test (#2)');
  console.log(`  Time: ${new Date().toISOString()}`);
  console.log(`  Listing: ${LISTING_ID} (제주도)`);
  console.log(`  Goal: Recover missing fields from PoC #1 (56% coverage)`);
  console.log(`  Missing: ${MISSING_FIELDS.join(', ')}`);
  console.log('════════════════════════════════════════════════════════════════════');

  // Step 1: Extract API key
  const { apiKey } = await extractApiKey();
  if (!apiKey) {
    console.error('\nFATAL: Could not find API key. Aborting.');
    return;
  }

  // Step 2: Try StaysPdpSections API
  await tryStaysPdpSections(apiKey);

  // Step 3: Try Calendar/Pricing API
  await tryCalendarApi(apiKey);

  // Step 4: Listing page with dates
  await tryListingWithDates();

  // Step 5: Alternative approaches
  await tryAlternativeApproaches(apiKey);

  // ── Final Summary ──
  separator('FINAL SUMMARY');
  console.log(`
  This PoC tested multiple approaches to recover the 8 fields
  missing from PoC #1's SSR scraping (56% coverage):

  Target fields: ${MISSING_FIELDS.join(', ')}

  Approaches tested:
  1. API key extraction from listing HTML
  2. StaysPdpSections GraphQL API (5 different operation hashes + POST)
  3. PdpAvailabilityCalendar API
  4. Legacy v2 REST API endpoints
  5. iCal calendar endpoint
  6. SSR listing page with dates/currency params
  7. GraphQL with inline query

  See detailed results above for each approach.
  `);
}

main().catch(console.error);
