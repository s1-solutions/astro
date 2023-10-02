import { trySerializeLocals } from 'astro/middleware';
import { ASTRO_LOCALS_HEADER } from './adapter.js';

export function rerouteImpl(path: string | URL, context: { request: Request, locals: Record<string, any> }) {
	const newUrl = new URL(path, context.request.url);
	const newHeaders = { ...context.request.headers, [ASTRO_LOCALS_HEADER]: trySerializeLocals(context.locals) };
	const newRequest = new Request(newUrl, { ...context.request, headers: newHeaders });
    // TODO: should not handle external requests
	return fetch(newRequest);
}
