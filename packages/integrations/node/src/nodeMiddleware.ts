import type { NodeApp } from 'astro/app/node';
import type { ServerResponse } from 'node:http';
import type { Readable } from 'stream';
import { createOutgoingHttpHeaders } from './createOutgoingHttpHeaders.js';
import { responseIterator } from './response-iterator.js';
import type { ErrorHandlerParams, Options, RequestHandlerParams } from './types.js';

// Disable no-unused-vars to avoid breaking signature change
export default function (app: NodeApp, options: Options) {
	const seen = new WeakMap<object, number>
	// this should handle files as well but that might be a refactor
	app.setReroute((path, context) => {
		const seenCount = seen.get(context.locals) ?? seen.set(context.locals, 1).get(context.locals)!;
		
		if (seen.get(context.locals)! > options.maxRerouteDepth) {
			throw new Error(`Exceeded max reroute depth of ${options.maxRerouteDepth}`);
		}
		else {
			seen.set(context.locals, seenCount + 1);
		}

		const newRequest = new Request(new URL(path, context.request.url), context.request);

		return app.render(newRequest, undefined, context.locals as object, false);
	})
	
	return async function (...args: RequestHandlerParams | ErrorHandlerParams) {
		let error = null;
		let locals;
		let [req, res, next] = args as RequestHandlerParams;
		if (options.mode === 'middleware') {
			let { [3]: _locals } = args;
			locals = _locals;
		}

		if (args[0] instanceof Error) {
			[error, req, res, next] = args as ErrorHandlerParams;
			if (options.mode === 'middleware') {
				let { [4]: _locals } = args as ErrorHandlerParams;
				locals = _locals;
			}
			if (error) {
				if (next) {
					return next(error);
				} else {
					throw error;
				}
			}
		}

		try {
			const route = app.match(req);
			if (route) {
				try {
					const response = await app.render(req, route, locals);
					await writeWebResponse(app, res, response);
				} catch (err: unknown) {
					if (next) {
						next(err);
					} else {
						throw err;
					}
				}
			} else if (next) {
				return next();
			} else {
				const response = await app.render(req);
				await writeWebResponse(app, res, response);
			}
		} catch (err: unknown) {
			const logger = app.getAdapterLogger();
			logger.error(`Could not render ${req.url}`);
			console.error(err);
			if (!res.headersSent) {
				res.writeHead(500, `Server error`);
				res.end();
			}
		}
	};
}

async function writeWebResponse(app: NodeApp, res: ServerResponse, webResponse: Response) {
	const { status, headers } = webResponse;

	if (app.setCookieHeaders) {
		const setCookieHeaders: Array<string> = Array.from(app.setCookieHeaders(webResponse));

		if (setCookieHeaders.length) {
			for (const setCookieHeader of setCookieHeaders) {
				webResponse.headers.append('set-cookie', setCookieHeader);
			}
		}
	}

	const nodeHeaders = createOutgoingHttpHeaders(headers);
	res.writeHead(status, nodeHeaders);
	if (webResponse.body) {
		try {
			for await (const chunk of responseIterator(webResponse) as unknown as Readable) {
				res.write(chunk);
			}
		} catch (err: any) {
			console.error(err?.stack || err?.message || String(err));
			res.write('Internal server error');
		}
	}
	res.end();
}
