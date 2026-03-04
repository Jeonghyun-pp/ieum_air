import * as cheerio from 'cheerio';

export interface AirbnbScrapedData {
  title?: string;
  photos?: string[];
  pricePerNight?: number;
  currency?: string;
  rating?: number;
  reviewCount?: number;
}

/**
 * 에어비앤비 리스팅 URL에서 기본 정보를 스크래핑합니다.
 * 실패 시 빈 객체를 반환합니다 (폴백).
 */
export async function scrapeAirbnbListing(url: string): Promise<AirbnbScrapedData> {
  try {
    // URL 검증
    const parsed = new URL(url);
    if (!parsed.hostname.includes('airbnb')) {
      throw new Error('Not an Airbnb URL');
    }

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const result: AirbnbScrapedData = {};

    // 제목 추출 — 여러 셀렉터 시도
    const titleSelectors = [
      'h1[data-testid="listing-title"]',
      'h1._fecoyn4',
      'h1',
      'title',
    ];
    for (const sel of titleSelectors) {
      const text = $(sel).first().text().trim();
      if (text && text.length < 200) {
        result.title = text.replace(/ - Airbnb$/, '').replace(/ · .*$/, '');
        break;
      }
    }

    // 사진 추출 — og:image 및 img 태그
    const ogImage = $('meta[property="og:image"]').attr('content');
    if (ogImage) {
      result.photos = [ogImage];
    }

    // 추가 이미지 수집
    const photos: string[] = result.photos || [];
    $('img[data-original-uri], picture img').each((_, el) => {
      const src = $(el).attr('data-original-uri') || $(el).attr('src');
      if (src && src.startsWith('http') && !photos.includes(src) && photos.length < 10) {
        photos.push(src);
      }
    });
    if (photos.length > 0) {
      result.photos = photos;
    }

    // 가격 추출 — JSON-LD 또는 텍스트 파싱
    const scripts = $('script[type="application/ld+json"]');
    scripts.each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '');
        if (json['@type'] === 'Product' && json.offers) {
          result.pricePerNight = parseFloat(json.offers.price);
          result.currency = json.offers.priceCurrency || 'KRW';
        }
      } catch {
        // JSON 파싱 실패 무시
      }
    });

    // 평점 추출
    const ratingText = $('[data-testid="pdp-reviews-highlight-banner-host-rating"]').text()
      || $('span[aria-label*="rating"]').first().text()
      || '';
    const ratingMatch = ratingText.match(/([\d.]+)/);
    if (ratingMatch) {
      result.rating = parseFloat(ratingMatch[1]);
    }

    // 리뷰 수 추출
    const reviewText = $('button[aria-label*="review"]').text()
      || $('a[href*="reviews"]').text()
      || '';
    const reviewMatch = reviewText.match(/([\d,]+)\s*(개|reviews?|후기)/i);
    if (reviewMatch) {
      result.reviewCount = parseInt(reviewMatch[1].replace(/,/g, ''));
    }

    return result;
  } catch (error) {
    console.error('Airbnb scraping failed:', error);
    return {};
  }
}
