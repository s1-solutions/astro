import { IncomingMessage, ServerResponse } from 'node:http';

export interface UserOptions {
	/**
	 * Specifies the mode that the adapter builds to.
	 *
	 * - 'middleware' - Build to middleware, to be used within another Node.js server, such as Express.
	 * - 'standalone' - Build to a standalone server. The server starts up just by running the built script.
	 */
	mode: 'middleware' | 'standalone';
	maxRerouteDepth?: number;
}

export interface Options extends UserOptions {
	maxRerouteDepth: number
	host: string | boolean;
	port: number;
	server: string;
	client: string;
}

export type RequestHandlerParams = [
	req: IncomingMessage,
	res: ServerResponse,
	next?: (err?: unknown) => void,
	locals?: object,
];

export type ErrorHandlerParams = [unknown, ...RequestHandlerParams];
