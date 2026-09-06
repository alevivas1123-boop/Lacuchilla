/**
 * Estado que devuelven los formularios del panel.
 *
 * Vive fuera de `actions.ts` porque un archivo "use server" solo puede
 * exportar funciones async: cualquier constante o tipo tiene que estar aparte.
 */
export interface EstadoFormulario {
  ok: boolean;
  mensaje?: string;
  errores?: Record<string, string>;
  /**
   * Lo que la persona había escrito.
   *
   * React 19 vacía el formulario cuando termina la acción, así que si la
   * validación falla hay que devolver los valores para volver a pintarlos.
   * Sin esto, un error en un campo obliga a recargar los otros trece.
   */
  valores?: Record<string, string>;
}

export const ESTADO_INICIAL: EstadoFormulario = { ok: false };
