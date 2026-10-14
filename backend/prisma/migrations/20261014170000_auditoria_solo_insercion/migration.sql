-- S2-07 · ADR-07: la auditoría es de solo inserción.
-- La base rechaza UPDATE, DELETE y TRUNCATE sobre la tabla "auditoria" por
-- operaciones ordinarias (de la aplicación o de un usuario de la base).
-- Corregir un registro exige agregar uno nuevo compensatorio.

CREATE OR REPLACE FUNCTION auditoria_solo_insercion() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'La auditoría es de solo inserción: no se permite % (ADR-07)', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auditoria_sin_modificar
  BEFORE UPDATE OR DELETE ON "auditoria"
  FOR EACH ROW EXECUTE FUNCTION auditoria_solo_insercion();

CREATE TRIGGER auditoria_sin_vaciar
  BEFORE TRUNCATE ON "auditoria"
  FOR EACH STATEMENT EXECUTE FUNCTION auditoria_solo_insercion();
