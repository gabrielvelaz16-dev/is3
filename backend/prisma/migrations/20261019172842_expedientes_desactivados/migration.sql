-- AlterTable
ALTER TABLE "expedientes" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "desactivado_en" TIMESTAMP(3),
ADD COLUMN     "desactivado_por_id" INTEGER,
ADD COLUMN     "motivo_desactivacion" VARCHAR(500);

-- CreateIndex
CREATE INDEX "expedientes_activo_idx" ON "expedientes"("activo");

-- AddForeignKey
ALTER TABLE "expedientes" ADD CONSTRAINT "expedientes_desactivado_por_id_fkey" FOREIGN KEY ("desactivado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
