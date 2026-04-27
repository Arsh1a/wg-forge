import type { Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/sessions.js';
import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const handle: Handle = async ({ event, resolve }) => {
  const secretPath = env.SECRET_PATH;

  if (secretPath) {
    const pathname = event.url.pathname.replace(/\/$/, '') || '/';
    const isGateway = pathname === `/${secretPath}`;
    const hasAccess = event.cookies.get('path_token') === secretPath;

    if (isGateway) {
      // Visiting the secret URL — grant access cookie and redirect to app
      event.cookies.set('path_token', secretPath, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: event.url.protocol === 'https:',
        maxAge: 60 * 60 * 24 * 30,
      });
      throw redirect(303, '/');
    }

    if (!hasAccess) {
      throw error(404, 'Not found');
    }
  }

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
