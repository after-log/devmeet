CREATE TABLE matching_presets (
    id binary(16) PRIMARY KEY,
    series_id binary(16) NOT NULL,
    version int NOT NULL,
    name varchar(60) NOT NULL,
    description varchar(300) NOT NULL,
    values_weight int NOT NULL,
    meeting_weight int NOT NULL,
    contact_weight int NOT NULL,
    legacy_scoring boolean NOT NULL DEFAULT false,
    created_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE(series_id, version),
    CHECK(values_weight BETWEEN 0 AND 100),
    CHECK(meeting_weight BETWEEN 0 AND 100),
    CHECK(contact_weight BETWEEN 0 AND 100),
    CHECK(legacy_scoring OR values_weight + meeting_weight + contact_weight = 100)
);
INSERT INTO matching_presets(id,series_id,version,name,description,values_weight,meeting_weight,contact_weight,legacy_scoring) VALUES
(UUID_TO_BIN('00000000-0000-0000-0000-000000000001'),UUID_TO_BIN('00000000-0000-0000-0000-000000000001'),1,'기존 추천','현재 서비스에서 사용하던 점수 계산 방식입니다. 만남·연락 방식 일치에 각각 20점, 가치관 답변 일치마다 1점을 더합니다.',1,20,20,true),
(UUID_TO_BIN('00000000-0000-0000-0000-000000000002'),UUID_TO_BIN('00000000-0000-0000-0000-000000000002'),1,'균형형','가치관과 만남·연락 방식을 고르게 반영합니다.',40,30,30,false),
(UUID_TO_BIN('00000000-0000-0000-0000-000000000003'),UUID_TO_BIN('00000000-0000-0000-0000-000000000003'),1,'가치관 중심','가치관 답변이 비슷한 회원을 우선 추천합니다.',70,15,15,false),
(UUID_TO_BIN('00000000-0000-0000-0000-000000000004'),UUID_TO_BIN('00000000-0000-0000-0000-000000000004'),1,'소통 방식 중심','만남과 연락 방식이 맞는 회원을 우선 추천합니다.',20,40,40,false);
CREATE TABLE matching_settings (
    id int PRIMARY KEY,
    active_preset_id binary(16) NOT NULL,
    updated_at timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    FOREIGN KEY(active_preset_id) REFERENCES matching_presets(id),
    CHECK(id = 1)
);
INSERT INTO matching_settings(id,active_preset_id) VALUES(1,UUID_TO_BIN('00000000-0000-0000-0000-000000000001'));
ALTER TABLE recommendation_batches
    ADD COLUMN preset_id binary(16) NULL,
    ADD COLUMN generated_at timestamp(6) NULL,
    ADD COLUMN matching_question_ids json NULL,
    ADD FOREIGN KEY(preset_id) REFERENCES matching_presets(id),
    ADD INDEX recommendation_preset_history(preset_id,generated_at);
