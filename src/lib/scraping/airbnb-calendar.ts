// ============================================
// Airbnb Calendar Scraper — iCal 방식
// ============================================

import type { CalendarDay, ScrapeResult } from '@/types/scraping';

/**
 * Airbnb 리스팅의 캘린더 데이터를 iCal 피드로 수집합니다.
 *
 * Airbnb는 각 리스팅에 대해 공개 iCal URL을 제공합니다:
 * https://www.airbnb.co.kr/calendar/ical/{listingId}.ics
 *
 * 이 방식은 API 키 없이도 작동하며, 차단 위험이 낮습니다.
 */
export async function scrapeCalendar(
  listingId: string,
  months: number = 3
): Promise<ScrapeResult<CalendarDay[]>> {
  const startTime = Date.now();
  const url = `https://www.airbnb.co.kr/calendar/ical/${listingId}.ics`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/calendar',
        'User-Agent': 'Mozilla/5.0 (compatible; CalendarBot/1.0)',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: response.status === 404 ? 'NOT_FOUND' : 'BLOCKED',
          message: `HTTP ${response.status}`,
          httpStatus: response.status,
        },
        duration: Date.now() - startTime,
        retryCount: 0,
      };
    }

    const icalText = await response.text();
    const bookedDates = parseICalBookedDates(icalText);
    const calendar = generateCalendarDays(bookedDates, months);

    return {
      success: true,
      data: calendar,
      duration: Date.now() - startTime,
      retryCount: 0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: {
        code: message.includes('timeout') ? 'TIMEOUT' : 'UNKNOWN',
        message,
      },
      duration: Date.now() - startTime,
      retryCount: 0,
    };
  }
}

/**
 * iCal 텍스트에서 예약된 날짜 범위를 추출합니다.
 *
 * Airbnb iCal 형식:
 * BEGIN:VEVENT
 * DTSTART;VALUE=DATE:20260315
 * DTEND;VALUE=DATE:20260318
 * SUMMARY:Airbnb (Not available)
 * END:VEVENT
 */
function parseICalBookedDates(icalText: string): Set<string> {
  const bookedDates = new Set<string>();
  const events = icalText.split('BEGIN:VEVENT');

  for (const event of events.slice(1)) {
    const dtStartMatch = event.match(/DTSTART(?:;VALUE=DATE)?:(\d{8})/);
    const dtEndMatch = event.match(/DTEND(?:;VALUE=DATE)?:(\d{8})/);

    if (dtStartMatch && dtEndMatch) {
      const startDate = parseICalDate(dtStartMatch[1]);
      const endDate = parseICalDate(dtEndMatch[1]);

      if (startDate && endDate) {
        // DTEND is exclusive in iCal (체크아웃 날짜는 포함하지 않음)
        const current = new Date(startDate);
        while (current < endDate) {
          bookedDates.add(formatDate(current));
          current.setDate(current.getDate() + 1);
        }
      }
    }
  }

  return bookedDates;
}

function parseICalDate(dateStr: string): Date | null {
  if (dateStr.length !== 8) return null;
  const year = parseInt(dateStr.slice(0, 4));
  const month = parseInt(dateStr.slice(4, 6)) - 1;
  const day = parseInt(dateStr.slice(6, 8));
  return new Date(Date.UTC(year, month, day));
}

function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 향후 N개월의 캘린더를 생성합니다.
 * iCal에서 예약된 날짜를 unavailable로 표시합니다.
 * 가격 정보는 iCal에 포함되지 않으므로 undefined입니다.
 */
function generateCalendarDays(bookedDates: Set<string>, months: number): CalendarDay[] {
  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endDate = new Date(today);
  endDate.setMonth(endDate.getMonth() + months);

  const current = new Date(today);
  while (current < endDate) {
    const dateStr = formatDate(current);
    days.push({
      date: dateStr,
      available: !bookedDates.has(dateStr),
      price: undefined, // iCal에는 가격 정보 없음
    });
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * 캘린더 데이터에서 점유율을 계산합니다.
 */
export function calculateOccupancyRate(calendar: CalendarDay[]): {
  total: number;
  booked: number;
  available: number;
  occupancyRate: number;
} {
  const total = calendar.length;
  const booked = calendar.filter((d) => !d.available).length;
  const available = total - booked;
  return {
    total,
    booked,
    available,
    occupancyRate: total > 0 ? Math.round((booked / total) * 100) : 0,
  };
}
