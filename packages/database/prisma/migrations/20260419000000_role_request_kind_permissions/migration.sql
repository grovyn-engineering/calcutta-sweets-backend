-- CreateEnum
CREATE TYPE "RoleRequestKind" AS ENUM ('ROLE_CHANGE', 'PERMISSION_EXTENSION');

-- AlterTable
ALTER TABLE "RoleRequest" ADD COLUMN "kind" "RoleRequestKind" NOT NULL DEFAULT 'ROLE_CHANGE';
ALTER TABLE "RoleRequest" ADD COLUMN "requestedPermissions" JSONB;
ALTER TABLE "RoleRequest" ALTER COLUMN "requestedRole" DROP NOT NULL;
