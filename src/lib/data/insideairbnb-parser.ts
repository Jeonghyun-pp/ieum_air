// ============================================
// InsideAirbnb CSV Parser — 무료 비교군 데이터
// ============================================

import type { InsideAirbnbRecord } from '@/types/scraping';

/**
 * InsideAirbnb CSV 텍스트를 파싱합니다.
 *
 * InsideAirbnb.com에서 제공하는 listings.csv 형식:
 * - 서울, 부산, 제주 등 한국 주요 도시 데이터
 * - 월 1회 업데이트
 * - CSV 헤더: id, name, description, latitude, longitude, property_type, ...
 */
export function parseInsideAirbnbCSV(csvText: string): InsideAirbnbRecord[] {
  const lines = csvText.split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const headerMap = new Map(headers.map((h, i) => [h.trim().toLowerCase(), i]));

  const records: InsideAirbnbRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const values = parseCSVLine(line);
      const record = mapToRecord(values, headerMap);
      if (record) records.push(record);
    } catch {
      // 파싱 실패한 행은 건너뜀
      continue;
    }
  }

  return records;
}

function mapToRecord(
  values: string[],
  headerMap: Map<string, number>
): InsideAirbnbRecord | null {
  const get = (key: string): string => {
    const idx = headerMap.get(key);
    return idx !== undefined ? values[idx]?.trim() ?? '' : '';
  };

  const id = get('id');
  if (!id) return null;

  const lat = parseFloat(get('latitude'));
  const lng = parseFloat(get('longitude'));
  if (isNaN(lat) || isNaN(lng)) return null;

  return {
    id,
    name: get('name'),
    description: get('description'),
    latitude: lat,
    longitude: lng,
    property_type: get('property_type'),
    room_type: get('room_type'),
    accommodates: parseInt(get('accommodates')) || 0,
    bedrooms: parseInt(get('bedrooms')) || 0,
    beds: parseInt(get('beds')) || 0,
    bathrooms: parseBathrooms(get('bathrooms_text') || get('bathrooms')),
    amenities: parseAmenities(get('amenities')),
    price: parsePrice(get('price')),
    review_scores_rating: parseFloat(get('review_scores_rating')) || 0,
    number_of_reviews: parseInt(get('number_of_reviews')) || 0,
    host_is_superhost: get('host_is_superhost') === 't',
    instant_bookable: get('instant_bookable') === 't',
  };
}

/**
 * CSV 행을 파싱합니다 (RFC 4180 준수 — 따옴표 이스케이프 처리).
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);

  return result;
}

/** 가격 문자열 파싱: "$85.00" → 85, "₩85,000" → 85000 */
function parsePrice(priceStr: string): number {
  const cleaned = priceStr.replace(/[$₩,\s]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
}

/** 편의시설 JSON 배열 문자열 파싱: '["WiFi", "Kitchen"]' → ['WiFi', 'Kitchen'] */
function parseAmenities(amenitiesStr: string): string[] {
  if (!amenitiesStr) return [];
  try {
    // InsideAirbnb uses Python-style lists: '["WiFi", "Kitchen"]'
    // or sometimes: '{WiFi,Kitchen}'
    if (amenitiesStr.startsWith('[') || amenitiesStr.startsWith('{')) {
      const cleaned = amenitiesStr
        .replace(/^\{/, '[')
        .replace(/\}$/, ']')
        .replace(/'/g, '"');
      return JSON.parse(cleaned);
    }
    return amenitiesStr.split(',').map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

/** 욕실 수 파싱: "1.5 baths" → 1.5, "2" → 2 */
function parseBathrooms(bathroomsStr: string): number {
  const match = bathroomsStr.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}
