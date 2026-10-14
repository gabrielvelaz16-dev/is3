-- Se ejecuta automáticamente la primera vez que se crea el contenedor.
-- Crea una base separada para las pruebas automatizadas (DATABASE_URL_TEST),
-- así las pruebas nunca borran datos de la base de desarrollo.
CREATE DATABASE expediente_test;
