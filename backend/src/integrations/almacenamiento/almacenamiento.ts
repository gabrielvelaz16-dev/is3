import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

/**
 * Almacenamiento de documentos (S4-02, RNF-04, ADR-08).
 * El resto del sistema solo conoce esta interfaz: hoy es una carpeta local,
 * mañana podría ser un servicio institucional sin tocar los módulos de negocio.
 */
export interface AlmacenamientoDocumentos {
  /** Guarda el contenido con un nombre aleatorio y devuelve ese nombre y su hash SHA-256. */
  guardar(contenido: Buffer): Promise<{ nombreAlmacenado: string; hashSha256: string }>;
  /** Devuelve el contenido, o null si el archivo no existe. */
  leer(nombreAlmacenado: string): Promise<Buffer | null>;
  /** Restauración (S7-04): escribe un archivo con su nombre interno original (un UUID). */
  escribir(nombreAlmacenado: string, contenido: Buffer): Promise<void>;
}

export function sha256(contenido: Buffer): string {
  return createHash('sha256').update(contenido).digest('hex');
}

/** El nombre interno es siempre un UUID: nunca se arma una ruta con datos del usuario. */
export const NOMBRE_VALIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Carpeta local fuera de la carpeta pública y fuera de Git (STORAGE_PATH). */
export class AlmacenamientoLocal implements AlmacenamientoDocumentos {
  private readonly carpeta: string;

  constructor(carpeta: string) {
    this.carpeta = resolve(carpeta);
  }

  async guardar(contenido: Buffer) {
    await mkdir(this.carpeta, { recursive: true });
    const nombreAlmacenado = randomUUID();
    const destino = join(this.carpeta, nombreAlmacenado);
    // Se escribe a un temporal y se renombra: nunca queda un archivo a medio escribir.
    const temporal = `${destino}.tmp`;
    await writeFile(temporal, contenido, { flag: 'wx' });
    await rename(temporal, destino);
    return { nombreAlmacenado, hashSha256: sha256(contenido) };
  }

  async escribir(nombreAlmacenado: string, contenido: Buffer) {
    if (!NOMBRE_VALIDO.test(nombreAlmacenado)) throw new Error('Nombre interno de documento inválido');
    await mkdir(this.carpeta, { recursive: true });
    const destino = join(this.carpeta, nombreAlmacenado);
    const temporal = `${destino}.tmp`;
    await writeFile(temporal, contenido);
    await rename(temporal, destino);
  }

  async leer(nombreAlmacenado: string) {
    if (!NOMBRE_VALIDO.test(nombreAlmacenado)) return null;
    try {
      return await readFile(join(this.carpeta, nombreAlmacenado));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw err;
    }
  }
}

/** Implementación en memoria para pruebas. */
export class AlmacenamientoEnMemoria implements AlmacenamientoDocumentos {
  readonly archivos = new Map<string, Buffer>();

  async guardar(contenido: Buffer) {
    const nombreAlmacenado = randomUUID();
    this.archivos.set(nombreAlmacenado, Buffer.from(contenido));
    return { nombreAlmacenado, hashSha256: sha256(contenido) };
  }

  async leer(nombreAlmacenado: string) {
    return this.archivos.get(nombreAlmacenado) ?? null;
  }

  async escribir(nombreAlmacenado: string, contenido: Buffer) {
    this.archivos.set(nombreAlmacenado, Buffer.from(contenido));
  }
}
