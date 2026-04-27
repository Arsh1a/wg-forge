import type { Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/sessions.js';
import { redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('session');
  event.locals.authenticated = validateSession(token);

  if (!event.locals.authenticated && !event.url.pathname.startsWith('/login')) {
    throw redirect(303, '/login');
  }

  if (event.locals.authenticated && event.url.pathname === '/login') {
    throw redirect(303, '/');
  }

  return resolve(event);
};
