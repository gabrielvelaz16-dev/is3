-- Sprint 3: Expedientes (S3-01 a S3-06)
-- Tablas: expedientes, secuencias. Enums: EstadoExpediente, Prioridad.

-- Enums
CREATE TYPE "EstadoExpediente" AS ENUM ('BORRADOR', 'EN_TRAMITE', 'EN_REVISION', 'RESUELTO', 'ARCHIVADO');
CREATE TYPE "Prioridad" AS ENUM ('BAJA', 'MEDIA', 'ALTA');

-- Secuencia para generar números de expediente por año
CREATE TABLE "secuencias" (
    "anio" INTEGER NOT NULL,
    "ultimo_numero" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "secuencias_pkey" PRIMARY KEY ("anio")
);

-- Expedientes
CREATE TABLE "expedientes" (
    "id" SERIAL NOT NULL,
    "numero" VARCHAR(20) NOT NULL,
    "caratula" VARCHAR(255) NOT NULL,
    "asunto" TEXT NOT NULL,
    "tipo" VARCHAR(60) NOT NULL,
    "iniciador" VARCHAR(160) NOT NULL,
    "estado" "EstadoExpediente" NOT NULL DEFAULT 'BORRADOR',
    "prioridad" "Prioridad" NOT NULL DEFAULT 'MEDIA',
    "dependencia_actual_id" INTEGER NOT NULL,
    "creado_por_id" INTEGER NOT NULL,
    "responsable_id" INTEGER,
    "fecha_vencimiento" TIMESTAMP(3),
    "descripcion" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "expedientes_pkey" PRIMARY KEY ("id")
);

-- Índices
CREATE UNIQUE INDEX "expedientes_numero_key" ON "expedientes"("numero");
CREATE INDEX "expedientes_estado_idx" ON "expedientes"("estado");
CREATE INDEX "expedientes_dependencia_actual_id_idx" ON "expedientes"("dependencia_actual_id");
CREATE INDEX "expedientes_fecha_vencimiento_idx" ON "expedientes"("fecha_vencimiento");
CREATE INDEX "expedientes_creado_por_id_idx" ON "expedientes"("creado_por_id");

-- FK
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_dependencia_actual_id_fkey"
    FOREIGN KEY ("dependencia_actual_id") REFERENCES "dependencias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_creado_por_id_fkey"
    FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_responsable_id_fkey"
    FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
