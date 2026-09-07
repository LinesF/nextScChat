import mealsFallback from '@/data/meals.json';
import calendarFallback from '@/data/calendar.json';

export interface MealItem {
  school_code: string;
  meal_date: string; // YYYYMMDD
  meal_type: string;
  dishes: string;
  calories?: string;
}

export interface CalendarItem {
  school_code: string;
  event_date: string; // YYYYMMDD
  event_name: string;
  school_year: string;
}

const NEIS_API_URL = 'https://open.neis.go.kr/hub';
const ATPT_OFCDC_SC_CODE = 'R10'; // 경상북도교육청
const SD_SCHUL_CODE = '7480004'; // 김천중학교 표준학교코드

// 김천중학교 공식 홈페이지 (경북교육청 GYO6 포털)
const HOMEPAGE_MEAL_URL = 'https://school.gyo6.net/gimcheonms/ad/fm/foodmenu/selectFoodMenuView.do?mi=126257';
const HOMEPAGE_CALENDAR_URL = 'https://school.gyo6.net/gimcheonms/schl/sv/schdulView/schdulCalendarView.do?mi=126242';

/**
 * 김천중학교 공식 홈페이지에서 특정 날짜(YYYYMMDD)의 급식 식단 실시간 파싱
 */
async function fetchMealFromHomepage(targetDate: string): Promise<MealItem[]> {
  try {
    const ym = targetDate.slice(0, 6);
    const url = `${HOMEPAGE_MEAL_URL}&selectYearMonth=${ym}`;
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const regex = new RegExp(`id=['"]${targetDate}['"][^>]*>([\\s\\S]*?)<\\/td>`, 'i');
    const match = html.match(regex);

    if (match && match[1]) {
      const parts = match[1]
        .replace(/<[^>]+>/g, '|')
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean);

      let calories = '';
      const calPart = parts.find((p) => /Kcal/i.test(p));
      if (calPart) {
        const calMatch = calPart.match(/(\d+(?:\.\d+)?\s*Kcal)/i);
        if (calMatch) calories = calMatch[1];
      }

      const dishes = parts
        .filter(
          (p) =>
            !/^\d{1,2}$/.test(p) &&
            p !== '상세보기' &&
            !/Kcal/i.test(p)
        )
        .join(', ');

      if (dishes) {
        return [
          {
            school_code: 'R000007204',
            meal_date: targetDate,
            meal_type: '중식',
            dishes,
            calories,
          },
        ];
      }
    }
  } catch (e) {
    console.warn('Homepage meal fetch error:', e);
  }
  return [];
}

/**
 * 김천중학교 공식 홈페이지에서 학사일정 실시간 파싱
 */
async function fetchCalendarFromHomepage(startDate: string, limit: number = 10): Promise<CalendarItem[]> {
  try {
    const ym = startDate.slice(0, 6);
    const url = `${HOMEPAGE_CALENDAR_URL}&selectYearMonth=${ym}`;
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const cellRegex = /id=['"](\d{8})['"][^>]*>([\s\S]*?)<\/td>/gi;
    const items: CalendarItem[] = [];

    let m: RegExpExecArray | null;
    while ((m = cellRegex.exec(html)) !== null) {
      const date = m[1];
      if (date >= startDate) {
        const textParts = m[2]
          .replace(/<[^>]+>/g, '|')
          .split('|')
          .map((s) => s.replace(/^[·\s]+/, '').trim())
          .filter((s) => Boolean(s) && !/^\d{1,2}$/.test(s) && s !== '상세보기');

        for (const ev of textParts) {
          items.push({
            school_code: 'R000007204',
            event_date: date,
            event_name: ev,
            school_year: date.slice(0, 4),
          });
        }
      }
    }

    if (items.length > 0) {
      return items.slice(0, limit);
    }
  } catch (e) {
    console.warn('Homepage calendar fetch error:', e);
  }
  return [];
}

/**
 * 급식 정보 조회 (1순위: NEIS API -> 2순위: 학교 공식홈페이지 실시간 파싱 -> 3순위: 로컬 JSON Fallback)
 */
export async function getMeals(targetDate: string): Promise<MealItem[]> {
  const neisKey = process.env.NEIS_API_KEY?.trim();

  // 1. NEIS API 조회 시도
  if (neisKey) {
    try {
      const url = `${NEIS_API_URL}/mealServiceDietInfo?KEY=${neisKey}&Type=json&ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${SD_SCHUL_CODE}&MLSV_YMD=${targetDate}`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = await res.json();
        if (data.mealServiceDietInfo && data.mealServiceDietInfo[1]?.row) {
          const rows = data.mealServiceDietInfo[1].row;
          return rows.map((r: any) => ({
            school_code: 'R000007204',
            meal_date: r.MLSV_YMD,
            meal_type: r.MMEAL_SC_NM || '중식',
            dishes: (r.DDISH_NM || '').replace(/<br\/>/g, ', ').replace(/\([0-9.]+\)/g, '').trim(),
            calories: r.CAL_INFO || '',
          }));
        }
      }
    } catch (e) {
      console.warn('NEIS meal API error:', e);
    }
  }

  // 2. NEIS에 데이터가 없는 경우(사립학교 특성) 김천중 공식 홈페이지에서 실시간 스크래핑
  const homepageMeals = await fetchMealFromHomepage(targetDate);
  if (homepageMeals.length > 0) {
    return homepageMeals;
  }

  // 3. 네트워크 단절 등 예외 시 내장된 로컬 데이터셋 폴백
  const matched = (mealsFallback as MealItem[]).filter(
    (m) => m.meal_date === targetDate
  );
  return matched;
}

/**
 * 학사일정 조회 (1순위: NEIS API -> 2순위: 학교 공식홈페이지 실시간 파싱 -> 3순위: 로컬 JSON Fallback)
 */
export async function getUpcomingCalendar(startDate: string, limit: number = 10): Promise<CalendarItem[]> {
  const neisKey = process.env.NEIS_API_KEY?.trim();

  // 1. NEIS API 조회 시도
  if (neisKey) {
    try {
      const url = `${NEIS_API_URL}/SchoolSchedule?KEY=${neisKey}&Type=json&ATPT_OFCDC_SC_CODE=${ATPT_OFCDC_SC_CODE}&SD_SCHUL_CODE=${SD_SCHUL_CODE}&AA_FROM_YMD=${startDate}&AA_TO_YMD=20261231`;
      const res = await fetch(url, { next: { revalidate: 86400 } });
      if (res.ok) {
        const data = await res.json();
        if (data.SchoolSchedule && data.SchoolSchedule[1]?.row) {
          const rows = data.SchoolSchedule[1].row;
          return rows.slice(0, limit).map((r: any) => ({
            school_code: 'R000007204',
            event_date: r.AA_YMD,
            event_name: r.EVENT_NM,
            school_year: r.AY || '2026',
          }));
        }
      }
    } catch (e) {
      console.warn('NEIS calendar API error:', e);
    }
  }

  // 2. 김천중 공식 홈페이지 실시간 일정 조회
  const homepageCalendar = await fetchCalendarFromHomepage(startDate, limit);
  if (homepageCalendar.length > 0) {
    return homepageCalendar;
  }

  // 3. 로컬 데이터셋 폴백
  const filtered = (calendarFallback as CalendarItem[])
    .filter((c) => c.event_date >= startDate)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, limit);

  return filtered;
}
