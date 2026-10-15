-- Sprint 5: Tareas y seguimiento (S5-01 a S5-05)
-- Tablas: tareas, pases, asignaciones. Enum: EstadoTarea. Motivo en cambios_estado.

CREATE TYPE "EstadoTarea" AS ENUM ('PENDIENTE', 'EN_CURSO', 'COMPLETADA', 'CANCELADA');

ALTER TABLE "cambios_estado" ADD COLUMN "motivo" VARCHAR(500);

CREATE TABLE "tareas" (
    "id" SERIAL NOT NULL,
    "expediente_id" INTEGER NOT NULL,
    "titulo" VARCHAR(160) NOT NULL,
    "descripcion" TEXT,
    "asignado_a_id" INTEGER NOT NULL,
    "creado_por_id" INTEGER NOT NULL,
    "vencimiento" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoTarea" NOT NULL DEFAULT 'PENDIENTE',
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizada_en" TIMESTAMP(3) NOT NULL,
    "cerrada_en" TIMESTAMP(3),
    CONSTRAINT "tareas_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "tareas_titulo_no_vacio" CHECK (length(trim("titulo")) > 0),
    -- Una tarea cerrada (completada o cancelada) tiene fecha de cierre, y viceversa.
    CONSTRAINT "tareas_cierre_coherente" CHECK (("estado" IN ('COMPLETADA', 'CANCELADA')) = ("cerrada_en" IS NOT NULL))
);

CREATE TABLE "pases" (
    "id" SERIAL NOT NULL,
    "expediente_id" INTEGER NOT NULL,
    "origen_id" INTEGER NOT NULL,
    "destino_id" INTEGER NOT NULL,
    "motivo" VARCHAR(500) NOT NULL,
    "enviado_por_id" INTEGER NOT NULL,
    "enviado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recibido_por_id" INTEGER,
    "recibido_en" TIMESTAMP(3),
    CONSTRAINT "pases_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "pases_origen_distinto_destino" CHECK ("origen_id" <> "destino_id"),
    CONSTRAINT "pases_recepcion_completa" CHECK (("recibido_por_id" IS NULL) = ("recibido_en" IS NULL))
);

CREATE TABLE "asignaciones" (
    "id" SERIAL NOT NULL,
    "expediente_id" INTEGER NOT NULL,
    "responsable_id" INTEGER,
    "usuario_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asignaciones_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tareas_expediente_id_idx" ON "tareas"("expediente_id");
CREATE INDEX "tareas_asignado_a_id_estado_idx" ON "tareas"("asignado_a_id", "estado");
CREATE INDEX "tareas_vencimiento_idx" ON "tareas"("vencimiento");
CREATE INDEX "pases_expediente_id_idx" ON "pases"("expediente_id");
CREATE INDEX "pases_destino_id_recibido_en_idx" ON "pases"("destino_id", "recibido_en");
CREATE INDEX "asignaciones_expediente_id_idx" ON "asignaciones"("expediente_id");
-- Un expediente solo puede tener un pase sin recibir (no puede estar en dos tránsitos a la vez).
CREATE UNIQUE INDEX "pases_un_transito_por_expediente" ON "pases"("expediente_id") WHERE "recibido_en" IS NULL;

ALTER TABLE "tareas" ADD CONSTRAINT "tareas_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_asignado_a_id_fkey" FOREIGN KEY ("asignado_a_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tareas" ADD CONSTRAINT "tareas_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pases" ADD CONSTRAINT "pases_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pases" ADD CONSTRAINT "pases_origen_id_fkey" FOREIGN KEY ("origen_id") REFERENCES "dependencias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pases" ADD CONSTRAINT "pases_destino_id_fkey" FOREIGN KEY ("destino_id") REFERENCES "dependencias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pases" ADD CONSTRAINT "pases_enviado_por_id_fkey" FOREIGN KEY ("enviado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pases" ADD CONSTRAINT "pases_recibido_por_id_fkey" FOREIGN KEY ("recibido_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_expediente_id_fkey" FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Asignaciones: solo inserción (historial).
CREATE TRIGGER asignaciones_sin_modificar BEFORE UPDATE OR DELETE ON "asignaciones"
  FOR EACH ROW EXECUTE FUNCTION historial_solo_insercion();
CREATE TRIGGER asignaciones_sin_vaciar BEFORE TRUNCATE ON "asignaciones"
  FOR EACH STATEMENT EXECUTE FUNCTION historial_solo_insercion();

-- Pases: no se borran; la única modificación permitida es registrar la recepción una vez.
CREATE OR REPLACE FUNCTION pases_solo_recepcion() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND OLD.recibido_en IS NULL
     AND NEW.recibido_en IS NOT NULL
     AND NEW.expediente_id = OLD.expediente_id
     AND NEW.origen_id = OLD.origen_id
     AND NEW.destino_id = OLD.destino_id
     AND NEW.motivo = OLD.motivo
     AND NEW.enviado_por_id = OLD.enviado_por_id
     AND NEW.enviado_en = OLD.enviado_en THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'Los pases no se modifican ni se borran; solo se registra su recepción una vez (%)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pases_proteger BEFORE UPDATE OR DELETE ON "pases"
  FOR EACH ROW EXECUTE FUNCTION pases_solo_recepcion();
CREATE TRIGGER pases_sin_vaciar BEFORE TRUNCATE ON "pases"
  FOR EACH STATEMENT EXECUTE FUNCTION historial_solo_insercion();
