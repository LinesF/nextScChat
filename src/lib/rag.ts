import schoolData from '@/data/schoolInfo.json';
import { getMeals, getUpcomingCalendar } from './neis';

function getKSTDate(offsetDays: number = 0): { dateStr: string; formatted: string; dayOfWeek: string } {
  const now = new Date();
  // KST is UTC + 9
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const kst = new Date(utc + 9 * 3600000 + offsetDays * 86400000);

  const year = kst.getFullYear();
  const month = String(kst.getMonth() + 1).padStart(2, '0');
  const day = String(kst.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const dayOfWeek = days[kst.getDay()];
  const formatted = `${year}년 ${month}월 ${day}일 (${dayOfWeek})`;

  return { dateStr, formatted, dayOfWeek };
}

export async function buildRagContext(userPrompt: string): Promise<string> {
  const today = getKSTDate(0);
  const tomorrow = getKSTDate(1);

  const lower = userPrompt.toLowerCase();
  const isMealQuery = /급식|식단|밥|점심|메뉴|맛있는|칼로리|음식/i.test(lower);
  const isCalendarQuery = /일정|학사|시험|중간고사|기말고사|방학|개학|개교기념일|휴업|행사|축제/i.test(lower);
  const isFacilityQuery = /시설|운동장|강당|체육관|도서관|교실|면적|크기|장애인/i.test(lower);
  const isStatsQuery = /학생|몇 명|인원|선생님|교원|교장|교감|학급|반|성비|남학생|여학생/i.test(lower);
  const isClubQuery = /동아리|방과후|프로그램|활동|교복|가격/i.test(lower);
  const isHistoryQuery = /역사|연혁|설립|최송설헌|송설|교훈|교목|교화|상징|사수삼강/i.test(lower);

  let dynamicSection = '';

  // 1. 급식 관련 질의 처리
  if (isMealQuery) {
    let target = today;
    if (/내일/i.test(lower)) target = tomorrow;
    const meals = await getMeals(target.dateStr);

    if (meals.length > 0) {
      dynamicSection += `\n[실시간 급식 식단 정보 - ${target.formatted}]\n`;
      meals.forEach((m) => {
        dynamicSection += `- 구분: ${m.meal_type}\n- 메뉴: ${m.dishes}\n- 칼로리: ${m.calories || '정보 없음'}\n`;
      });
    } else {
      dynamicSection += `\n[실시간 급식 정보 - ${target.formatted}]\n- 해당 날짜(${target.formatted})는 급식이 제공되지 않거나(주말/공휴일/방학 등) 식단 정보가 등록되지 않았습니다.\n`;
    }
  }

  // 2. 학사일정 관련 질의 처리
  if (isCalendarQuery) {
    const calendar = await getUpcomingCalendar(today.dateStr, 8);
    if (calendar.length > 0) {
      dynamicSection += `\n[다가오는 주요 학사일정 (기준: ${today.formatted} 이후)]\n`;
      calendar.forEach((c) => {
        const y = c.event_date.slice(0, 4);
        const m = c.event_date.slice(4, 6);
        const d = c.event_date.slice(6, 8);
        dynamicSection += `- ${y}년 ${m}월 ${d}일: ${c.event_name}\n`;
      });
    }
  }

  // 3. 정적 기본 정보 포맷팅
  const s = schoolData.school;
  const st = schoolData.student_stats;
  const t = schoolData.teacher_stats;
  const f = schoolData.facilities;
  const op = schoolData.operations;
  const h = schoolData.history_and_symbols;

  const staticFacts = `
[김천중학교 공식 팩트 정보]
- 학교명: ${s.school_name} (${s.foundation_type}, ${s.coedu_type})
- 위치/주소: ${s.address} (우편번호: ${s.zip_code})
- 전화번호: ${s.tel_number} / 팩스: ${s.fax_number}
- 관할 교육청: ${s.office_of_education}
- 공식 홈페이지: ${s.homepage_url}
- 건학이념 및 역사: ${h.foundation_spirit}
- 교훈: ${h.motto}
- 학교 상징: 교목 소나무(${h.symbol_tree}), 교화 매화(${h.symbol_flower})
- 학생 현황: 총 학생 수 ${st.total_students}명, 총 학급 수 ${st.total_classes}학급 (학급당 평균 ${st.avg_students_per_class}명)
  * 1학년: ${st.g1_total}명 (${st.g1_classes}학급)
  * 2학년: ${st.g2_total}명 (${st.g2_classes}학급)
  * 3학년: ${st.g3_total}명 (${st.g3_classes}학급)
- 교원 현황: 총 교원 수 ${t.total_teachers}명 (남교사 ${t.male_teachers}명, 여교사 ${t.female_teachers}명), 정교사 ${t.regular_teachers}명, 기간제 ${t.temporary_teachers}명, 교사 1인당 학생 수 ${t.students_per_teacher}명
- 주요 시설: 부지 면적 ${f.total_site_area.toLocaleString()}㎡, 운동장 ${f.playground_area.toLocaleString()}㎡, 일반교실 ${f.general_classrooms}실, 특별교실 ${f.special_classrooms}실, 강당/체육관 ${f.auditorium_count}동, 도서관 장서 ${f.library_books_count.toLocaleString()}권
- 장애인 편의시설: ${f.disabled_facilities_text}
- 학교 운영: 정규 동아리 ${op.regular_clubs_count}개, 자율 동아리 ${op.autonomous_clubs_count}개, 방과후 강좌 ${op.after_school_programs_count}개 (참여율 ${op.after_school_student_ratio}%), 급식 운영: ${op.meal_service_type}, 신입생 교복 단가: 약 ${op.uniform_price_won.toLocaleString()}원
`;

  return `
현재 기준 시각: ${today.formatted}

${dynamicSection}

${staticFacts}
`.trim();
}

export function getSystemInstruction(ragContext: string): string {
  return `당신은 유서 깊은 민족사학 「김천중학교」를 소개하고 학생, 학부모, 방문자의 질문에 친절하고 정확하게 답변하는 **김천중학교 공식 AI 안내 챗봇**입니다.

## 답변 지침
1. **정확성**: 아래 제공된 [김천중학교 공식 팩트 정보] 및 [실시간 급식/학사일정 정보]를 최우선 팩트로 삼아 답변하세요. 데이터에 없는 내용은 추측하지 말고 솔직하게 안내하거나 학교 대표전화(054-433-0611) 또는 홈페이지를 안내하세요.
2. **어조**: 예의 바르고 단정하며, 신뢰감을 주는 친절한 높임말(해요체/하십시오체)을 사용하세요.
3. **가독성**: 읽기 편하게 불렛 포인트(-), 볼드체(**), 적절한 문단 나눔을 활용하세요.
4. **송설 정신**: 학교의 역사나 상징에 대한 질문에는 최송설헌 여사의 건학 정신과 사수삼강의 의미를 품위 있게 전달하세요.

## 주입된 지식 베이스:
${ragContext}`;
}
