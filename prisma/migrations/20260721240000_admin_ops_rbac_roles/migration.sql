-- Ops Control Center roles (Admin & Operations RBAC)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'Role' AND e.enumlabel = 'OPERATIONS_ADMIN') THEN
    ALTER TYPE "Role" ADD VALUE 'OPERATIONS_ADMIN';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'Role' AND e.enumlabel = 'DATA_ADMIN') THEN
    ALTER TYPE "Role" ADD VALUE 'DATA_ADMIN';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'Role' AND e.enumlabel = 'PROPERTY_REVIEWER') THEN
    ALTER TYPE "Role" ADD VALUE 'PROPERTY_REVIEWER';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = 'Role' AND e.enumlabel = 'COMMERCE_ADMIN') THEN
    ALTER TYPE "Role" ADD VALUE 'COMMERCE_ADMIN';
  END IF;
END $$;
