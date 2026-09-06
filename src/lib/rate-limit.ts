/**
 * Freno básico a los intentos repetidos de login.
 *
 * Es un contador en memoria del proceso. En Vercel cada instancia tiene el
 * suyo, así que no es una defensa fuerte contra un ataque distribuido: alcanza
 * para frenar a alguien probando contraseñas a mano, que es el riesgo real de
 * esta etapa. Cuando haya usuarios de verdad conviene moverlo a la base o a un
 * almacén compartido (ver docs/admin-productos.md).
 */

const INTENTOS_MAXIMOS = 5;
const VENTANA_MS = 10 * 60 * 1000;
const BLOQUEO_MS = 15 * 60 * 1000;

interface Registro {
  intentos: number;
  primerIntento: number;
  bloqueadoHasta?: number;
}

const registros = new Map<string, Registro>();

function limpiar(ahora: number) {
  for (const [clave, registro] of registros) {
    const vencido = ahora - registro.primerIntento > VENTANA_MS;
    const desbloqueado = !registro.bloqueadoHasta || registro.bloqueadoHasta <= ahora;
    if (vencido && desbloqueado) registros.delete(clave);
  }
}

export interface EstadoLimite {
  permitido: boolean;
  /** Segundos que faltan para poder reintentar, si está bloqueado. */
  esperaSegundos: number;
}

export function revisarIntentos(clave: string, ahora = Date.now()): EstadoLimite {
  limpiar(ahora);
  const registro = registros.get(clave);
  if (registro?.bloqueadoHasta && registro.bloqueadoHasta > ahora) {
    return { permitido: false, esperaSegundos: Math.ceil((registro.bloqueadoHasta - ahora) / 1000) };
  }
  return { permitido: true, esperaSegundos: 0 };
}

export function registrarFallo(clave: string, ahora = Date.now()): EstadoLimite {
  const registro = registros.get(clave);

  if (!registro || ahora - registro.primerIntento > VENTANA_MS) {
    registros.set(clave, { intentos: 1, primerIntento: ahora });
    return { permitido: true, esperaSegundos: 0 };
  }

  registro.intentos += 1;
  if (registro.intentos >= INTENTOS_MAXIMOS) {
    registro.bloqueadoHasta = ahora + BLOQUEO_MS;
    return { permitido: false, esperaSegundos: Math.ceil(BLOQUEO_MS / 1000) };
  }
  return { permitido: true, esperaSegundos: 0 };
}

export function limpiarIntentos(clave: string): void {
  registros.delete(clave);
}

/** Solo para las pruebas. */
export function reiniciarLimites(): void {
  registros.clear();
}
