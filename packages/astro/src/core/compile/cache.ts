import type { AstroConfig } from '../../@types/astro';
import { compile, type CompileProps, type CompileResult } from './compile.js';

type CompilationCache = Map<string, CompileResult>;

const configCache = new WeakMap<AstroConfig, CompilationCache>();

export function isCached(config: AstroConfig, filename: string) {
	return configCache.has(config) && configCache.get(config)!.has(filename);
}

export function getCachedCompileResult(
	config: AstroConfig,
	filename: string
): CompileResult | null {
	if (!isCached(config, filename)) return null;
	return configCache.get(config)!.get(filename)!;
}

export function invalidateCompilation(config: AstroConfig, filename: string) {
	if (configCache.has(config)) {
		const cache = configCache.get(config)!;
		cache.delete(filename);
	}
}

const webCache = await caches?.open?.('astro-compiler-cache');

export async function cachedCompilation(props: CompileProps): Promise<CompileResult> {
	const { astroConfig, filename, source } = props;


	let cache: CompilationCache;
	if (!configCache.has(astroConfig)) {
		cache = new Map();
		configCache.set(astroConfig, cache);
	} else {
		cache = configCache.get(astroConfig)!;
	}
	
	// try in-memory cache
	if (cache.has(filename)) {
		return cache.get(filename)!;
	}

	const start = performance.now();
	// try persistent cache
	const key = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(astroConfig) + source))
	const hash = new TextDecoder().decode(key)
	const match = await webCache?.match?.('https://astro.cache/' + hash);
	if (match) {
		const compileResult = await match.json();
		compileResult.cssDeps = new Set(compileResult.cssDeps);
		cache.set(filename, compileResult);
		console.log(`[incremental-astro] cache hit for ${filename} in ${performance.now() - start}ms`);
		return compileResult;
	}

	const compileResult = await compile(props);
	console.log(`[incremental-astro] cache miss for ${filename} in ${performance.now() - start}ms`);
	cache.set(filename, compileResult);
	webCache?.put?.('https://astro.cache/' + hash, new Response(JSON.stringify({ ...compileResult, cssDeps: [...compileResult.cssDeps] }))).catch(() => {});
	return compileResult;
}
