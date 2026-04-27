import type { Actions } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';
import { verifyPassword, createSession } from '$lib/sessions.js';

export const actions: Actions = {
  default: async ({ request, cookies }) => {
    const data     = await request.formData();
    const username = data.get('username') as string;
    const password = data.get('password') as string;

    if (!verifyPassword(username, password)) {
      return fail(401, { error: 'Invalid username or password' });
    }

    const token = createSession();
    cookies.set('session', token, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24
    });

    throw redirect(303, '/');
  }
};
