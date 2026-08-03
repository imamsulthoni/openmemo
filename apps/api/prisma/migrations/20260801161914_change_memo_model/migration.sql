/*
  Warnings:

  - You are about to drop the column `content` on the `Memo` table. All the data in the column will be lost.
  - You are about to drop the column `jobId` on the `Memo` table. All the data in the column will be lost.
  - The `status` column on the `Memo` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "MemoStatus" AS ENUM ('pending', 'completed', 'failed');

-- DropIndex
DROP INDEX "Memo_jobId_idx";

-- DropIndex
DROP INDEX "Memo_sessionId_idx";

-- AlterTable
ALTER TABLE "Memo" DROP COLUMN "content",
DROP COLUMN "jobId",
ALTER COLUMN "filename" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "MemoStatus" NOT NULL DEFAULT 'pending';
