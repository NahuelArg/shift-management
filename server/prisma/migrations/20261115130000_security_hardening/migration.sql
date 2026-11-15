-- Zona horaria del negocio (los datos existentes usan Europe/Madrid)
ALTER TABLE "public"."Business" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Europe/Madrid';

-- Row Level Security: bloquea el acceso a las tablas a través de la Data API
-- pública de Supabase (roles anon/authenticated). Sin políticas = sin acceso.
-- La app no se ve afectada: Prisma se conecta como "postgres" (dueño de las
-- tablas y con BYPASSRLS).
ALTER TABLE "public"."User"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Business"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Service"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Schedule"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Booking"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CashRegister"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CashMovement"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."CashClosing"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
