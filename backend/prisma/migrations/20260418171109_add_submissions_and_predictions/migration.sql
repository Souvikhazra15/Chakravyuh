-- CreateTable
CREATE TABLE "submissions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "submission_id" TEXT NOT NULL,
    "school_id" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "submitted_by" TEXT NOT NULL,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verified_at" DATETIME,
    "verified_by" INTEGER
);

-- CreateTable
CREATE TABLE "predictions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "prediction_id" TEXT NOT NULL,
    "school_id" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "risk_score" REAL NOT NULL,
    "confidence" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verified_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "submissions_submission_id_key" ON "submissions"("submission_id");

-- CreateIndex
CREATE INDEX "submissions_school_id_idx" ON "submissions"("school_id");

-- CreateIndex
CREATE INDEX "submissions_category_idx" ON "submissions"("category");

-- CreateIndex
CREATE INDEX "submissions_status_idx" ON "submissions"("status");

-- CreateIndex
CREATE INDEX "submissions_date_idx" ON "submissions"("date");

-- CreateIndex
CREATE UNIQUE INDEX "predictions_prediction_id_key" ON "predictions"("prediction_id");

-- CreateIndex
CREATE INDEX "predictions_school_id_idx" ON "predictions"("school_id");

-- CreateIndex
CREATE INDEX "predictions_category_idx" ON "predictions"("category");

-- CreateIndex
CREATE INDEX "predictions_status_idx" ON "predictions"("status");
