CREATE TABLE IF NOT EXISTS value_sections (
    id varchar(40) PRIMARY KEY,
    label varchar(60) NOT NULL UNIQUE,
    english varchar(60) NOT NULL,
    icon varchar(20) NOT NULL,
    description varchar(300) NOT NULL,
    sort_order int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

CREATE TABLE IF NOT EXISTS value_questions (
    id varchar(40) PRIMARY KEY,
    section_id varchar(40) NOT NULL,
    text varchar(200) NOT NULL,
    purpose varchar(20) NOT NULL,
    options json NOT NULL,
    active boolean NOT NULL DEFAULT true,
    sort_order int NOT NULL,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY(section_id) REFERENCES value_sections(id),
    CHECK(purpose IN ('매칭', '프로필')),
    CONSTRAINT value_questions_options_count CHECK(JSON_LENGTH(options) BETWEEN 2 AND 10),
    INDEX value_questions_section(section_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_as_cs;

INSERT INTO value_sections(id,label,english,icon,description,sort_order) VALUES('daily','일상','DAILY','☀','생활 습관, 소비, 활동성',0) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D01','daily','쉬는 날은 주로 어떻게 보내나요?','프로필',JSON_ARRAY('집에서 휴식','집에서 취미생활','가벼운 외출','적극적인 야외활동'),0) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D02','daily','주말 약속은 어떻게 정하는 게 좋나요?','매칭',JSON_ARRAY('미리 계획하기','큰 일정만 정하기','당일 상황에 따라','즉흥적으로 정하기'),1) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D03','daily','평소 생활 리듬은 어떤 편인가요?','매칭',JSON_ARRAY('확실한 아침형','약간 아침형','약간 저녁형','확실한 저녁형'),2) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D04','daily','새로운 사람을 만나는 모임을 얼마나 좋아하나요?','프로필',JSON_ARRAY('거의 좋아하지 않음','소규모만 선호','가끔 큰 모임도 좋음','큰 모임도 매우 좋아함'),3) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D05','daily','연인과 쉬는 날을 보내는 방식은?','매칭',JSON_ARRAY('대부분 집에서','집과 외출을 적절히','외출 위주로','새로운 활동을 자주'),4) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D06','daily','평소 정리정돈은 어느 정도 하나요?','프로필',JSON_ARRAY('필요할 때만','주기적으로','거의 매일','항상 깔끔하게 유지'),5) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D07','daily','집안이 조금 어질러져 있을 때 어떻게 느끼나요?','매칭',JSON_ARRAY('전혀 신경 안 씀','어느 정도 괜찮음','금방 정리하고 싶음','정리되어 있어야 편함'),6) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D08','daily','평소 식사는 어떤 방식이 편한가요?','프로필',JSON_ARRAY('직접 요리','집밥과 배달 반반','배달·포장 위주','외식 위주'),7) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D09','daily','연인과 식사 취향이 다르면 어떤가요?','매칭',JSON_ARRAY('서로 맞출 수 있음','번갈아 선택','비슷한 취향이 좋음','식사 취향이 매우 중요'),8) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D10','daily','운동은 얼마나 자주 하나요?','프로필',JSON_ARRAY('거의 안 함','주 1~2회','주 3~4회','주 5회 이상'),9) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D11','daily','연인이 술을 마시는 빈도는 어느 정도까지 괜찮나요?','매칭',JSON_ARRAY('전혀 마시지 않았으면','월 몇 회까지','주 1~2회까지','빈도는 상관없음'),10) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D12','daily','연인의 흡연에 대해 어떻게 생각하나요?','매칭',JSON_ARRAY('비흡연자만 가능','금연할 생각이 있다면 가능','내 앞에서 피우지 않으면 가능','흡연 여부 상관없음'),11) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D13','daily','반려동물과 함께 사는 것에 대한 생각은?','매칭',JSON_ARRAY('함께 살고 싶음','상황이 맞으면 가능','따로 사는 것이 좋음','알레르기 등으로 어려움'),12) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D14','daily','여행할 때 선호하는 방식은?','프로필',JSON_ARRAY('분 단위 계획','주요 일정만 계획','그날그날 결정','계획 없는 자유여행'),13) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D15','daily','평소 소비 성향은 어떤가요?','매칭',JSON_ARRAY('최대한 절약','저축 우선','저축과 소비 균형','현재의 경험·만족 우선'),14) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D16','daily','데이트에 돈을 쓰는 방식은?','매칭',JSON_ARRAY('가성비가 가장 중요','평소엔 절약, 가끔 특별하게','적당히 자유롭게 지출','좋은 경험이라면 큰 지출도 가능'),15) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D17','daily','함께 살게 된다면 집안일은 어떻게 나누고 싶나요?','매칭',JSON_ARRAY('역할을 명확히 분담','상황에 따라 유연하게','잘하는 일을 각자 담당','시간·경제적 여유에 맞게'),16) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D18','daily','하루에 혼자만의 시간이 얼마나 필요한가요?','매칭',JSON_ARRAY('거의 필요 없음','가끔 필요','매일 조금 필요','매일 충분히 필요'),17) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D19','daily','새로운 취미나 활동을 시도하는 편인가요?','프로필',JSON_ARRAY('익숙한 활동 선호','가끔 시도','자주 시도','새로운 경험을 적극적으로 찾음'),18) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('D20','daily','평소 연락 알림을 확인하는 방식은?','매칭',JSON_ARRAY('대부분 바로 확인','여유가 생기면 확인','정해진 시간에 몰아서','알림을 거의 꺼둠'),19) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_sections(id,label,english,icon,description,sort_order) VALUES('love','연애','LOVE','♡','연락, 애정표현, 갈등, 관계 속도',1) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L01','love','연인과 어느 정도 자주 연락하고 싶나요?','매칭',JSON_ARRAY('필요할 때만','하루 1~2번','틈틈이 여러 번','수시로 연락'),0) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L02','love','연인의 답장이 어느 정도 늦어도 괜찮나요?','매칭',JSON_ARRAY('30분 이내가 좋음','1~2시간','반나절','하루 정도도 괜찮음'),1) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L03','love','애정표현은 어떤 방식이 가장 좋나요?','매칭',JSON_ARRAY('다정한 말','스킨십','행동으로 챙기기','선물이나 이벤트','함께 시간 보내기'),2) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L04','love','연인에게 애정표현을 얼마나 자주 하나요?','매칭',JSON_ARRAY('특별한 순간에','가끔','거의 매일','기회가 있을 때마다'),3) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L05','love','다툼이 생기면 언제 대화하고 싶나요?','매칭',JSON_ARRAY('바로 이야기','몇 시간 진정한 뒤','다음 날','충분히 정리된 뒤'),4) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L06','love','갈등이 생겼을 때 가장 선호하는 방식은?','매칭',JSON_ARRAY('감정을 먼저 공감','원인과 해결책부터','각자 생각을 정리한 뒤','자연스럽게 화해'),5) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L07','love','연인과 의견이 충돌하면 보통 어떻게 하나요?','매칭',JSON_ARRAY('먼저 양보','절충안 찾기','충분히 설득·토론','서로 다른 의견을 인정'),6) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L08','love','연인과 일주일에 얼마나 만나고 싶나요?','매칭',JSON_ARRAY('주 1회 이하','주 2회','주 3~4회','거의 매일'),7) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L09','love','데이트 일정은 누가 정하는 게 좋나요?','매칭',JSON_ARRAY('주로 내가 계획','번갈아 계획','함께 결정','상대가 주도하면 좋음'),8) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L10','love','연인과 취미를 어느 정도 공유하고 싶나요?','매칭',JSON_ARRAY('각자 즐기는 게 좋음','일부만 공유','대부분 함께','모든 취미를 함께하고 싶음'),9) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L11','love','연인 사이에 사생활은 어느 정도 필요하다고 생각하나요?','매칭',JSON_ARRAY('거의 모든 것을 공유','중요한 것은 공유','개인 영역을 충분히 존중','사생활은 철저히 구분'),10) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L12','love','연인이 이성 친구와 단둘이 만나는 건 어떤가요?','매칭',JSON_ARRAY('받아들이기 어려움','사전 공유와 합의가 필요','상황에 따라 괜찮음','자유롭게 존중'),11) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L13','love','과거 연애 이야기를 나누는 것에 대한 생각은?','매칭',JSON_ARRAY('듣고 싶지 않음','필요한 내용만','자연스럽게 이야기','솔직히 자세히 공유'),12) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L14','love','기념일은 어느 정도 챙기고 싶나요?','매칭',JSON_ARRAY('특별히 챙기지 않음','생일·기념일 정도','100일 등도 챙김','작은 기념일도 챙김'),13) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L15','love','데이트 비용은 어떻게 부담하는 게 좋나요?','매칭',JSON_ARRAY('가능한 반반','소득에 비례','번갈아 결제','상황에 따라 자연스럽게'),14) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L16','love','SNS에 연애 사실을 공개하는 것에 대한 생각은?','매칭',JSON_ARRAY('공개하지 않음','가끔 사진만','자연스럽게 공개','적극적으로 공유'),15) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L17','love','연애 초반 관계가 발전하는 속도는?','매칭',JSON_ARRAY('천천히 알아가기','자연스럽게 조금씩','마음이 맞으면 빠르게','처음부터 적극적으로'),16) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L18','love','스킨십은 언제부터 편안한가요?','매칭',JSON_ARRAY('충분한 신뢰가 쌓인 뒤','연인 관계가 확실해진 뒤','서로 호감이 확실하다면','서로 동의한다면 초반에도'),17) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L19','love','연인과 하루 일과를 얼마나 공유하고 싶나요?','매칭',JSON_ARRAY('중요한 일만','하루를 간단히 요약','소소한 일상까지','거의 모든 일을 공유'),18) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L20','love','연인이 혼자만의 시간을 원하면 어떻게 생각하나요?','매칭',JSON_ARRAY('되도록 함께하고 싶음','가끔은 이해 가능','충분히 존중','각자의 시간이 꼭 필요'),19) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L21','love','연인이 친구들과 보내는 시간은 어느 정도 괜찮나요?','매칭',JSON_ARRAY('연인과의 시간이 우선','적당히 조절하면 좋음','각자 자유롭게','사생활은 거의 관여하지 않음'),20) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L22','love','연인과 장거리 연애가 가능할까요?','매칭',JSON_ARRAY('어려움','단기간만 가능','정기적으로 만나면 가능','장기간도 가능'),21) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L23','love','연인과의 연락이 뜸해질 때 어떻게 행동하나요?','매칭',JSON_ARRAY('바로 이유를 물어봄','조금 기다렸다가 이야기','바쁘다고 생각하고 기다림','연락 빈도 변화에 크게 신경 쓰지 않음'),22) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L24','love','연인의 가족과 어느 정도 가까워지고 싶나요?','매칭',JSON_ARRAY('특별한 날에만','가끔 교류','정기적으로 교류','가족처럼 가깝게'),23) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('L25','love','연애에서 가장 중요하게 생각하는 것은?','매칭',JSON_ARRAY('신뢰와 안정감','설렘과 애정표현','소통과 공감','함께하는 성장','서로의 자유 존중'),24) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_sections(id,label,english,icon,description,sort_order) VALUES('future','미래·가치관','FUTURE','✧','결혼, 가족, 그리고 삶의 방향',2) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('V01','future','현재 어떤 관계를 기대하고 있나요?','매칭',JSON_ARRAY('가볍게 알아가는 만남','좋은 인연이 생기면 진지하게','장기적인 연애','결혼을 고려한 만남'),0) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('V02','future','결혼에 대한 생각은 어떤가요?','매칭',JSON_ARRAY('결혼 생각 없음','아직 잘 모르겠음','좋은 사람이 있다면','결혼을 원함'),1) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('V03','future','결혼을 생각한다면 시기는 언제가 좋나요?','매칭',JSON_ARRAY('1~2년 이내','3~5년 이내','5년 이후','시기보다 상대가 중요','결혼 계획 없음'),2) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('V04','future','미래에 자녀를 갖는 것에 대한 생각은?','매칭',JSON_ARRAY('원하지 않음','아직 모르겠음','상황에 따라 결정','자녀를 원함'),3) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('V05','future','결혼 전 동거에 대한 생각은?','매칭',JSON_ARRAY('원하지 않음','상황에 따라 가능','긍정적으로 생각','꼭 해보고 싶음'),4) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('V06','future','결혼 후 경제 관리는 어떻게 하는 게 좋나요?','매칭',JSON_ARRAY('각자 완전히 관리','공동 생활비만 합산','공동과 개인 자산 병행','대부분 공동 관리'),5) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('V07','future','장기적인 재정 계획에서 가장 중요한 것은?','매칭',JSON_ARRAY('안정적인 저축','주거 마련','투자와 자산 증식','현재의 삶의 질'),6) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('V08','future','연인과 종교가 달라도 괜찮나요?','매칭',JSON_ARRAY('같은 종교가 중요','종교 활동을 강요하지 않으면 가능','서로 존중하면 가능','종교는 상관없음'),7) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('V09','future','결혼 후 양가 가족과의 교류는 어느 정도가 좋나요?','매칭',JSON_ARRAY('명절·특별한 날만','월 1회 정도','월 여러 차례','가족처럼 자주'),8) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('V10','future','연인을 위해 거주지를 옮길 수 있나요?','매칭',JSON_ARRAY('현재 지역을 유지하고 싶음','가까운 지역까지','국내 어디든 가능','해외 이주도 가능'),9) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('V11','future','결혼 후 맞벌이에 대한 생각은?','매칭',JSON_ARRAY('맞벌이를 원함','상황에 따라 결정','한 사람의 외벌이도 좋음','역할보다 개인의 선택이 중요'),10) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('V12','future','인생에서 가장 우선하는 가치는 무엇인가요?','매칭',JSON_ARRAY('가족과 사랑','경제적 안정','성장과 성취','자유와 경험','건강과 평온'),11) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('V13','future','중요한 결정을 내릴 때 선호하는 방식은?','매칭',JSON_ARRAY('충분한 정보 분석','주변 사람들과 상의','직관과 감정 고려','결정 후 유연하게 수정'),12) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('V14','future','연인의 정치·사회적 가치관이 다르다면?','매칭',JSON_ARRAY('비슷해야 함','중요한 쟁점은 맞아야 함','서로 존중하면 가능','달라도 상관없음'),13) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('V15','future','미래의 삶에서 가장 원하는 모습은?','매칭',JSON_ARRAY('안정적인 가정','경제적으로 여유로운 삶','지속적인 성장과 도전','여행과 다양한 경험','소박하고 평온한 삶'),14) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_sections(id,label,english,icon,description,sort_order) VALUES('career','커리어','CAREER','⌘','일과 삶의 균형, 함께하는 성장',3) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('C01','career','일과 개인 생활 중 어느 쪽이 더 중요한가요?','매칭',JSON_ARRAY('개인 생활 최우선','개인 생활이 조금 더 중요','균형이 중요','커리어가 조금 더 중요','커리어 최우선'),0) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('C02','career','연인이 일 때문에 바쁜 시기를 보내면?','매칭',JSON_ARRAY('자주 만나기 어렵다면 힘듦','단기간이면 이해','장기간도 조율하면 가능','바쁜 커리어를 적극 존중'),1) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('C03','career','직업을 선택할 때 무엇이 가장 중요한가요?','프로필',JSON_ARRAY('연봉과 보상','안정성','성장 가능성','일의 의미와 재미','근무환경'),2) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('C04','career','이직이나 새로운 도전에 대한 생각은?','프로필',JSON_ARRAY('안정적인 직장 선호','충분히 준비되면 도전','기회가 오면 도전','새로운 도전을 적극 추구'),3) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('C05','career','퇴근 후 시간을 어떻게 보내고 싶나요?','매칭',JSON_ARRAY('일과 완전히 분리','대부분 휴식','휴식과 자기계발 병행','공부나 프로젝트에 적극 투자'),4) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('C06','career','연인이 다른 지역으로 발령받거나 이직한다면?','매칭',JSON_ARRAY('장거리·이주 모두 어려움','단기간 장거리 가능','장거리로 관계 유지 가능','함께 이주도 고려 가능'),5) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('C07','career','장기적인 커리어 목표는 무엇인가요?','프로필',JSON_ARRAY('안정적인 직장생활','전문성 향상','높은 소득과 자산 형성','리더십·관리직','창업·독립'),6) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('C08','career','연인과 직장 이야기를 얼마나 나누고 싶나요?','매칭',JSON_ARRAY('거의 나누지 않음','중요한 일만 공유','일상적으로 나누기','고민과 의사결정까지 공유'),7) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('C09','career','가족이나 연인을 위해 커리어를 조정할 수 있나요?','매칭',JSON_ARRAY('커리어를 유지하고 싶음','일시적으로 가능','서로 조율하며 조정','가족·연인이 우선'),8) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('C10','career','연인이 주말이나 휴일에 일해야 한다면?','매칭',JSON_ARRAY('받아들이기 어려움','가끔은 괜찮음','자주 있어도 조율 가능','근무 일정은 최대한 존중'),9) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_sections(id,label,english,icon,description,sort_order) VALUES('style','스타일·외모','STYLE','✿','자기관리, 취향, 서로의 개성',4) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('S01','style','평소 외출할 때 옷차림은 어떤 편인가요?','프로필',JSON_ARRAY('편안함 최우선','편안하지만 단정하게','상황에 맞춰 꾸미기','항상 스타일에 신경 쓰기'),0) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('S02','style','패션이나 미용에 얼마나 관심이 있나요?','프로필',JSON_ARRAY('거의 없음','기본적인 관리만','꾸준히 관심','매우 관심이 많음'),1) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('S03','style','평소 운동이나 체형 관리는 어느 정도 하나요?','프로필',JSON_ARRAY('특별히 하지 않음','건강 유지 정도','꾸준히 관리','체계적으로 적극 관리'),2) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('S04','style','연인이 외모에 투자하는 정도는 어느 정도가 좋나요?','매칭',JSON_ARRAY('크게 신경 쓰지 않음','기본적인 관리면 충분','어느 정도 꾸미면 좋음','적극적으로 관리하면 좋음'),3) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('S05','style','연인에게 타투가 있다면 어떤가요?','매칭',JSON_ARRAY('받아들이기 어려움','작고 눈에 띄지 않으면 가능','대부분 괜찮음','전혀 상관없음'),4) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('S06','style','연인이 개성 있는 헤어나 패션을 즐긴다면?','매칭',JSON_ARRAY('단정한 스타일 선호','과하지 않다면 괜찮음','개성을 존중','독특한 스타일도 좋아함'),5) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('S07','style','연인의 외모나 스타일에 대해 조언하는 것은?','매칭',JSON_ARRAY('서로 관여하지 않기','물어볼 때만 조언','자연스럽게 의견 공유','함께 스타일을 만들어가기'),6) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('S08','style','데이트에서 사진을 찍는 것을 얼마나 좋아하나요?','프로필',JSON_ARRAY('거의 찍지 않음','가끔 기념사진','자주 사진으로 남김','사진 촬영 자체를 즐김'),7) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('S09','style','커플룩이나 비슷한 스타일로 맞춰 입는 건?','매칭',JSON_ARRAY('선호하지 않음','특별한 날은 가능','가끔 맞추고 싶음','자주 맞춰 입고 싶음'),8) ON DUPLICATE KEY UPDATE id=VALUES(id);
INSERT INTO value_questions(id,section_id,text,purpose,options,sort_order) VALUES('S10','style','연인을 선택할 때 외모의 중요도는?','매칭',JSON_ARRAY('거의 중요하지 않음','성격과 분위기가 더 중요','외모와 성격 모두 중요','외모가 매우 중요'),9) ON DUPLICATE KEY UPDATE id=VALUES(id);
