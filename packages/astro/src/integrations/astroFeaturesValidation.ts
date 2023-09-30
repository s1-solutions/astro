import type {
	AstroAssetsFeature,
	AstroConfig,
	AstroFeatureMap,
	SupportsKind,
} from '../@types/astro.js';
import type { Logger } from '../core/logger/core.js';

const STABLE = 'stable';
const DEPRECATED = 'deprecated';
const UNSUPPORTED = 'unsupported';
const EXPERIMENTAL = 'experimental';

const UNSUPPORTED_ASSETS_FEATURE: AstroAssetsFeature = {
	supportKind: UNSUPPORTED,
	isSquooshCompatible: false,
	isSharpCompatible: false,
};

// NOTE: remove for Astro 4.0
const ALL_UNSUPPORTED: Required<AstroFeatureMap> = {
	serverOutput: UNSUPPORTED,
	staticOutput: UNSUPPORTED,
	hybridOutput: UNSUPPORTED,
	assets: UNSUPPORTED_ASSETS_FEATURE,
	reroute: UNSUPPORTED
};

type ValidationResult = Required<{
	[Property in keyof AstroFeatureMap]: boolean;
}>;

/**
 * Checks whether an adapter supports certain features that are enabled via Astro configuration.
 *
 * If a configuration is enabled and "unlocks" a feature, but the adapter doesn't support, the function
 * will throw a runtime error.
 *
 */
export function validateSupportedFeatures(
	adapterName: string,
	featureMap: AstroFeatureMap = ALL_UNSUPPORTED,
	config: AstroConfig,
	logger: Logger
): ValidationResult {
	const {
		assets: assetsFeature = UNSUPPORTED_ASSETS_FEATURE,
		serverOutput: serverOutputSupportKind = UNSUPPORTED,
		staticOutput: staticOutputSupportKind = UNSUPPORTED,
		hybridOutput: hybridOutputSupportKind = UNSUPPORTED,
		reroute: rerouteSupportKind = UNSUPPORTED
	} = featureMap;

	const staticOutput = validateSupportKind(
		staticOutputSupportKind,
		adapterName,
		logger,
		'staticOutput',
		() => config?.output === 'static'
	);

	const hybridOutput = validateSupportKind(
		hybridOutputSupportKind,
		adapterName,
		logger,
		'hybridOutput',
		() => config?.output === 'hybrid'
	);

	const serverOutput = validateSupportKind(
		serverOutputSupportKind,
		adapterName,
		logger,
		'serverOutput',
		() => config?.output === 'server'
	);

	const assets = validateAssetsFeature(assetsFeature, adapterName, config, logger);

	const reroute = validateSupportKind(
		rerouteSupportKind,
		adapterName,
		logger,
		'reroute',
		// () => config?.experimental?.reroute
		() => true
	);

	return { staticOutput, hybridOutput, serverOutput, assets, reroute };
}

function validateSupportKind(
	supportKind: SupportsKind,
	adapterName: string,
	logger: Logger,
	featureName: string,
	hasCorrectConfig: () => boolean
): boolean {
	if (supportKind === STABLE) {
		return true;
	} else if (supportKind === DEPRECATED) {
		featureIsDeprecated(adapterName, logger);
	} else if (supportKind === EXPERIMENTAL) {
		featureIsExperimental(adapterName, logger);
	}

	if (hasCorrectConfig() && supportKind === UNSUPPORTED) {
		featureIsUnsupported(adapterName, logger, featureName);
		return false;
	} else {
		return true;
	}
}

function featureIsUnsupported(adapterName: string, logger: Logger, featureName: string) {
	logger.error(
		`${adapterName}`,
		`The feature ${featureName} is not supported by the adapter ${adapterName}.`
	);
}

function featureIsExperimental(adapterName: string, logger: Logger) {
	logger.warn(`${adapterName}`, 'The feature is experimental and subject to issues or changes.');
}

function featureIsDeprecated(adapterName: string, logger: Logger) {
	logger.warn(`${adapterName}`, 'The feature is deprecated and will be moved in the next release.');
}

const SHARP_SERVICE = 'astro/assets/services/sharp';
const SQUOOSH_SERVICE = 'astro/assets/services/squoosh';

function validateAssetsFeature(
	assets: AstroAssetsFeature,
	adapterName: string,
	config: AstroConfig,
	logger: Logger
): boolean {
	const {
		supportKind = UNSUPPORTED,
		isSharpCompatible = false,
		isSquooshCompatible = false,
	} = assets;
	if (config?.image?.service?.entrypoint === SHARP_SERVICE && !isSharpCompatible) {
		logger.warn(
			'astro',
			`The currently selected adapter \`${adapterName}\` is not compatible with the image service "Sharp".`
		);
		return false;
	}

	if (config?.image?.service?.entrypoint === SQUOOSH_SERVICE && !isSquooshCompatible) {
		logger.warn(
			'astro',
			`The currently selected adapter \`${adapterName}\` is not compatible with the image service "Squoosh".`
		);
		return false;
	}

	return validateSupportKind(supportKind, adapterName, logger, 'assets', () => true);
}
