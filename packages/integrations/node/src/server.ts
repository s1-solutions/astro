import type { SSRManifest } from 'astro';
import { NodeApp, applyPolyfills } from 'astro/app/node';
import middleware from './nodeMiddleware.js';
import startServer from './standalone.js';
import { WebSocketServer } from 'ws'
import type { Options } from './types';

applyPolyfills();
export function createExports(manifest: SSRManifest, options: Options) {
	const app = new NodeApp(manifest);
	app.setUpgradeWebSocket(upgradeWebSocket);
	return {
		handler: middleware(app, options.mode),
		startServer: () => startServer(app, options),
	};
}

export function start(manifest: SSRManifest, options: Options) {
	if (options.mode !== 'standalone' || process.env.ASTRO_NODE_AUTOSTART === 'disabled') {
		return;
	}

	const app = new NodeApp(manifest);
	app.setUpgradeWebSocket(upgradeWebSocket);
	startServer(app, options);
}

function upgradeWebSocket(request: Request) {

	const innerRequest = Reflect.get(request, Symbol.for('astro.innerRequest'));
	const nodeSocket = innerRequest.socket;
	const head : Buffer = Reflect.get(innerRequest, Symbol.for('http.incomingRequest.head'));
	
	let socket : WebSocket
	// gets ignored by listener
	const response = new Response(null, { status: 202, headers: { "X-Upgraded-WebSocket": "yes" } })
	
	new WebSocketServer({ noServer: true }).handleUpgrade(innerRequest, nodeSocket, head, ws => {
		// @ts-expect-error .dispatchEvent() is missing from ws
		socket = ws
	})
    
	// @ts-expect-error socket is assigned by handleUpgrade which executes synchronously
	return { socket, response }
}
