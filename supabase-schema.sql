-- 邊美醬預約資料表
CREATE TABLE IF NOT EXISTS "yuemeiBookings" (
  "id" SERIAL PRIMARY KEY,
  "lineUserId" VARCHAR(100) NOT NULL,
  "customerName" VARCHAR(100) NOT NULL,
  "customerPhone" VARCHAR(20) NOT NULL,
  "treatmentCategory" VARCHAR(100) NOT NULL,
  "treatmentName" VARCHAR(200) NOT NULL,
  "preferredDate" DATE NOT NULL,
  "preferredTime" VARCHAR(50) NOT NULL,
  "doctorPreference" VARCHAR(100),
  "notes" TEXT,
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  "confirmedAt" TIMESTAMP,
  "completedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS "idx_yuemeiBookings_lineUserId" ON "yuemeiBookings" ("lineUserId");
CREATE INDEX IF NOT EXISTS "idx_yuemeiBookings_status" ON "yuemeiBookings" ("status");
CREATE INDEX IF NOT EXISTS "idx_yuemeiBookings_preferredDate" ON "yuemeiBookings" ("preferredDate");
CREATE INDEX IF NOT EXISTS "idx_yuemeiBookings_createdAt" ON "yuemeiBookings" ("createdAt");

-- 自動更新 updatedAt 欄位的觸發器
CREATE OR REPLACE FUNCTION update_yuemeiBookings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_yuemeiBookings_updated_at
BEFORE UPDATE ON "yuemeiBookings"
FOR EACH ROW
EXECUTE FUNCTION update_yuemeiBookings_updated_at();

-- 啟用 Row Level Security (RLS)
ALTER TABLE "yuemeiBookings" ENABLE ROW LEVEL SECURITY;

-- 允許所有人讀取和寫入（可根據需求調整）
CREATE POLICY "Enable all access for yuemeiBookings" ON "yuemeiBookings"
FOR ALL
USING (true)
WITH CHECK (true);
