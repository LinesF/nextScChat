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

export async function getMeals(targetDate: string): Promise<MealItem[]> {
  const neisKey = process.env.NEIS_API_KEY?.trim();

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
      console.warn('NEIS meal API fetch error, falling back to local dataset:', e);
    }
  }

  // Fallback to local dataset
  const matched = (mealsFallback as MealItem[]).filter(
    (m) => m.meal_date === targetDate
  );
  return matched;
}

export async function getUpcomingCalendar(startDate: string, limit: number = 10): Promise<CalendarItem[]> {
  const neisKey = process.env.NEIS_API_KEY?.trim();

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
      console.warn('NEIS calendar API fetch error, falling back to local dataset:', e);
    }
  }

  // Fallback to local dataset
  const filtered = (calendarFallback as CalendarItem[])
    .filter((c) => c.event_date >= startDate)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, limit);

  return filtered;
}
