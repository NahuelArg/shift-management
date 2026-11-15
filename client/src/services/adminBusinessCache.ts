import apiClient from './apiClient';

export interface AdminBusiness {
  id: string;
  name: string;
  [key: string]: unknown;
}

/**
 * Caché en memoria de los negocios del admin logueado (respuesta de /admin/me).
 *
 * Varias páginas (dashboard, empleados, calendario) necesitan el businessId antes de
 * pedir sus datos. Sin caché, cada navegación repetía este pedido y la página quedaba
 * esperando una ida y vuelta extra al servidor (request waterfall).
 *
 * Guardamos la *Promise* (no el resultado): si dos componentes piden a la vez,
 * comparten el mismo request en vuelo (request deduplication).
 */
let cache: { token: string; promise: Promise<AdminBusiness[]> } | null = null;

export function getAdminBusinesses<T = AdminBusiness>(): Promise<T[]> {
  const token = localStorage.getItem('token') ?? '';
  if (cache && cache.token === token) return cache.promise as Promise<T[]>;

  const promise = apiClient
    .get('/admin/me')
    .then((res) => (res.data.businesses ?? []) as AdminBusiness[])
    .catch((err) => {
      cache = null; // no cachear errores: el próximo intento vuelve a pedir
      throw err;
    });

  cache = { token, promise };
  return promise as Promise<T[]>;
}

/** Llamar cuando cambian los negocios (crear/editar/borrar) o al cerrar sesión. */
export function invalidateAdminBusinesses(): void {
  cache = null;
}
