// 가입·추천 조건에서 쓰는 선택지. devmeet-mvp와 같은 값을 쓴다.
export const REGIONS: Record<string, string[]> = {
  서울시: [
    '강남구',
    '강동구',
    '강북구',
    '강서구',
    '관악구',
    '광진구',
    '구로구',
    '금천구',
    '노원구',
    '도봉구',
    '동대문구',
    '동작구',
    '마포구',
    '서대문구',
    '서초구',
    '성동구',
    '성북구',
    '송파구',
    '양천구',
    '영등포구',
    '용산구',
    '은평구',
    '종로구',
    '중구',
    '중랑구',
  ],
  경기도: [
    '가평군',
    '고양시',
    '과천시',
    '광명시',
    '광주시',
    '구리시',
    '군포시',
    '김포시',
    '남양주시',
    '동두천시',
    '부천시',
    '성남시',
    '수원시',
    '시흥시',
    '안산시',
    '안성시',
    '안양시',
    '양주시',
    '양평군',
    '여주시',
    '연천군',
    '오산시',
    '용인시',
    '의왕시',
    '의정부시',
    '이천시',
    '파주시',
    '평택시',
    '포천시',
    '하남시',
    '화성시',
  ],
};
export const EDUCATION = ['고등학교 졸업', '전문대학교 졸업', '대학교 졸업', '대학원 졸업'];
export const MEETING = ['주말에 1–2번', '주 2–3번', '상황에 맞춰 유연하게'];
export const CONTACT = ['틈틈이 자주', '바쁜 날에도 짧은 안부', '할 말이 있을 때 편하게'];
export const PREFERENCE = ['상관없어요', '개발자', '비개발자'];
export const SMOKING = ['비흡연', '흡연'];
export const DRINKING = ['마시지 않아요', '거의 안 마셔요', '가끔', '주 1–2회', '주 3회 이상'];
export const RELIGION = ['무교', '기독교', '천주교', '불교', '기타'];
export const OPENERS = ['안녕하세요! 반가워요.', '오늘 하루는 어떠셨어요?', '퇴근하셨나요?'];
export const REPORT_REASONS = ['부적절한 메시지', '허위 프로필', '홍보 또는 금전 요구', '기타'];

/** "서울 성동구", "서울시 성동구" 모두 시·도와 구·시로 나눈다. */
export const splitLocation = (location = '') => {
  const [c, ...rest] = location.trim().split(/\s+/);
  const city = ['서울', '서울시', '서울특별시'].includes(c)
    ? '서울시'
    : ['경기', '경기도'].includes(c)
      ? '경기도'
      : '';
  const district = rest.join(' ');
  return { city, district: city && REGIONS[city].includes(district) ? district : '' };
};
