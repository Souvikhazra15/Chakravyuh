-- CreateTable
CREATE TABLE "reports" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "school_id" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "condition_score" REAL NOT NULL,
    "photo_url" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "work_orders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "school_id" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "assigned_to" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "report_id" INTEGER,
    CONSTRAINT "work_orders_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "repairs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "work_order_id" INTEGER NOT NULL,
    "school_id" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "gps_location" TEXT,
    "notes" TEXT,
    "completed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "repairs_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "work_orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "reports_school_id_idx" ON "reports"("school_id");

-- CreateIndex
CREATE INDEX "reports_category_idx" ON "reports"("category");

-- CreateIndex
CREATE INDEX "reports_timestamp_idx" ON "reports"("timestamp");

-- CreateIndex
CREATE INDEX "work_orders_school_id_idx" ON "work_orders"("school_id");

-- CreateIndex
CREATE INDEX "work_orders_category_idx" ON "work_orders"("category");

-- CreateIndex
CREATE INDEX "work_orders_created_at_idx" ON "work_orders"("created_at");

-- CreateIndex
CREATE INDEX "repairs_school_id_idx" ON "repairs"("school_id");

-- CreateIndex
CREATE INDEX "repairs_category_idx" ON "repairs"("category");

-- CreateIndex
CREATE INDEX "repairs_work_order_id_idx" ON "repairs"("work_order_id");
