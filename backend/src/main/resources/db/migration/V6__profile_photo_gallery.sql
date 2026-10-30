ALTER TABLE profiles ADD COLUMN photos JSON;
UPDATE profiles SET photos = JSON_ARRAY(photo);
ALTER TABLE profiles MODIFY COLUMN photos JSON NOT NULL DEFAULT (JSON_ARRAY());
-- Existing single-photo profiles need additional photos and a fresh review.
UPDATE profiles SET photo_status = 'PENDING',
    photo_review_reason = '프로필 사진을 최소 3장 등록한 뒤 다시 검수를 받아 주세요.'
WHERE JSON_LENGTH(photos) < 3;
