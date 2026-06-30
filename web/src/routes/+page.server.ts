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
    const data   = await request.formData();
    const name   = (data.get('name') as string)?.trim();
    const limit  = (data.get('limit') as string)?.trim();
    const expiry = (data.get('expiry') as string)?.trim();
    if (!name) return fail(400, { error: 'Name is required' });
    // expiry is positional after limit in the CLI, so fill the limit slot with
    // 0 (= no limit) when an expiry is given without a limit.
    const limitArg = limit || (expiry ? '0' : '');
    try {
      runForge(`add ${name}${limitArg ? ' ' + limitArg : ''}${expiry ? ' ' + expiry : ''}`);
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
      if (act === 'extend')          runForge(`extend ${name} ${amount}`);
      else if (act === 'setexpiry')  runForge(`setexpiry ${name} ${amount}`);
      else if (act === 'regenerate') runForge(`regenerate ${name}`);
      else                           runForge(`${act} ${name}`);
    } catch (e) {
      return fail(500, { error: (e as Error).message });
    }
    throw redirect(303, '/');
  },

  bulk: async ({ request }) => {
    const data  = await request.formData();
    const act   = data.get('action') as string;
    const names = data.getAll('name') as string[];
    if (!names.length) return fail(400, { error: 'No clients selected' });
    try {
      for (const name of names) runForge(`${act} ${name}`);
    } catch (e) {
      return fail(500, { error: (e as Error).message });
    }
    throw redirect(303, '/');
  }
};
