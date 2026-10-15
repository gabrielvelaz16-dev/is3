-- Sprint 4: Documentos y actuaciones (S4-01 a S4-05)
-- Tablas: documentos, actuaciones, cambios_estado. Enum: TipoActuacion.
-- Las tres son de solo inserción: el historial del expediente no se reescribe.

CREATE TYPE "TipoActuacion" AS ENUM ('ACTUACION', 'OBSERVACION');

CREATE TABLE "documentos" (
    "id" SERIAL NOT NULL,
    "expediente_id" INTEGER NOT NULL,
    "nombre_original" VARCHAR(255) NOT NULL,
    "nombre_almacenado" VARCHAR(80) NOT NULL,
    "tipo_mime" VARCHAR(120) NOT NULL,
    "tamano_bytes" INTEGER NOT NULL,
    "hash_sha256" CHAR(64) NOT NULL,
    "descripcion" VARCHAR(500),
    "subido_por_id" INTEGER NOT NULL,
    "subido_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "documentos_tamano_positivo" CHECK ("tamano_bytes" > 0)
);

CREATE TABLE "actuaciones" (
    "id" SERIAL NOT NULL,
    "expediente_id" INTEGER NOT NULL,
    "tipo" "TipoActuacion" NOT NULL,
    "texto" TEXT NOT NULL,
    "autor_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "actuaciones_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "actuaciones_texto_no_vacio" CHECK (length(trim("texto")) > 0)
);

CREATE TABLE "cambios_estado" (
    "id" SERIAL NOT NULL,
    "expediente_id" INTEGER NOT NULL,
    "estado_anterior" "EstadoExpediente",
    "estado_nuevo" "EstadoExpediente" NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cambios_estado_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "documentos_nombre_almacenado_key" ON "documentos"("nombre_almacenado");
CREATE INDEX "documentos_expediente_id_idx" ON "documentos"("expediente_id");
CREATE INDEX "actuaciones_expediente_id_idx" ON "actuaciones"("expediente_id");
CREATE INDEX "cambios_estado_expediente_id_idx" ON "cambios_estado"("expediente_id");

ALTER TABLE "documentos" ADD CONSTRAINT "documentos_expediente_id_fkey"
    FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_subido_por_id_fkey"
    FOREIGN KEY ("subido_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "actuaciones" ADD CONSTRAINT "actuaciones_expediente_id_fkey"
    FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "actuaciones" ADD CONSTRAINT "actuaciones_autor_id_fkey"
    FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cambios_estado" ADD CONSTRAINT "cambios_estado_expediente_id_fkey"
    FOREIGN KEY ("expediente_id") REFERENCES "expedientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "cambios_estado" ADD CONSTRAINT "cambios_estado_usuario_id_fkey"
    FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Solo inserción (mismo criterio que la auditoría, ADR-07).
CREATE OR REPLACE FUNCTION historial_solo_insercion() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'La tabla % es de solo inserción: no se permite % (historial del expediente)', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documentos_sin_modificar BEFORE UPDATE OR DELETE ON "documentos"
  FOR EACH ROW EXECUTE FUNCTION historial_solo_insercion();
CREATE TRIGGER documentos_sin_vaciar BEFORE TRUNCATE ON "documentos"
  FOR EACH STATEMENT EXECUTE FUNCTION historial_solo_insercion();
CREATE TRIGGER actuaciones_sin_modificar BEFORE UPDATE OR DELETE ON "actuaciones"
  FOR EACH ROW EXECUTE FUNCTION historial_solo_insercion();
CREATE TRIGGER actuaciones_sin_vaciar BEFORE TRUNCATE ON "actuaciones"
  FOR EACH STATEMENT EXECUTE FUNCTION historial_solo_insercion();
CREATE TRIGGER cambios_estado_sin_modificar BEFORE UPDATE OR DELETE ON "cambios_estado"
  FOR EACH ROW EXECUTE FUNCTION historial_solo_insercion();
CREATE TRIGGER cambios_estado_sin_vaciar BEFORE TRUNCATE ON "cambios_estado"
  FOR EACH STATEMENT EXECUTE FUNCTION historial_solo_insercion();
