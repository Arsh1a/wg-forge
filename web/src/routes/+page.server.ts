import type { Actions, PageServerLoad } from './$types';
import { getClients, getConfig, runForge } from '$lib/wgforge.js';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = () => {
  const clients  = getClients();
  const config   = getConfig();
  return { clients, endpoint: config['VPS_ENDPOINT'] ?? '' };
};

export const actions: Actions = {
  add: async ({ request }) => {
    const data  = await request.formData();
    const name  = (data.get('name') as string)?.trim();
    const limit = (data.get('limit') as string)?.trim();
    if (!name) return fail(400, { error: 'Name is required' });
    try {
      runForge(`add ${name}${limit ? ' ' + limit : ''}`);
    } catch (e) {
      return fail(500, { error: (e as Error).message });
    }
    throw redirect(303, '/');
  },

  action: async ({ request }) => {
    const data   = await request.formData();
    const name   = data.get('name') as string;
    const act    = data.get('action') as string;
    const amount = (data.get('amount') as string)?.trim();
    try {
      if (act === 'extend')     runForge(`extend ${name} ${amount}`);
      else if (act === 'regenerate') runForge(`regenerate ${name}`);
      else                           runForge(`${act} ${name}`);
    } catch (e) {
      return fail(500, { error: (e as Error).message });
    }
    throw redirect(303, '/');
  }
};
