-- =============================================================
-- 0007_category_label.sql
-- '기타' 카테고리 라벨을 '실험실'로 변경 (카피 전환 반영)
-- Supabase SQL Editor에 붙여넣고 Run. (선택 — 카테고리 라벨 표시용)
-- =============================================================
UPDATE public.categories
SET label_ko = '실험실', label_en = 'Lab', emoji = '🧪'
WHERE slug = 'other';
