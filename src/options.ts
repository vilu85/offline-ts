export type OptionValue<T> = T | (() => T);

export type XHRCheckOptions = {
	url: OptionValue<string>;
	timeout: OptionValue<number>;
	type: OptionValue<string>;
};

export type ImageCheckOptions = {
	url: OptionValue<string>;
};

export type ReconnectOptions = {
	initialDelay?: OptionValue<number>;
	delay?: OptionValue<number>;
};

export type OfflineCheckOptions = {
	checks: {
		xhr: XHRCheckOptions;
		image: ImageCheckOptions;
		active: OptionValue<string>;
	};
	checkOnLoad: OptionValue<boolean>;
	interceptRequests: OptionValue<boolean>;
	reconnect: boolean | ReconnectOptions;
	deDupBody: OptionValue<boolean>;
};

export type OfflineCheckOptionsInput = {
	checks?: {
		xhr?: Partial<XHRCheckOptions>;
		image?: Partial<ImageCheckOptions>;
		active?: OptionValue<string>;
	};
	checkOnLoad?: OptionValue<boolean>;
	interceptRequests?: OptionValue<boolean>;
	reconnect?: boolean | ReconnectOptions;
	deDupBody?: OptionValue<boolean>;
};

export type OptionValueMap = {
	'checks.xhr.url': string;
	'checks.xhr.timeout': number;
	'checks.xhr.type': string;
	'checks.image.url': string;
	'checks.active': string;
	checkOnLoad: boolean;
	interceptRequests: boolean;
	reconnect: boolean | ReconnectOptions;
	'reconnect.initialDelay': number | undefined;
	'reconnect.delay': number | undefined;
	deDupBody: boolean;
};

export type OptionKey = keyof OptionValueMap;
export type GetOption = <K extends OptionKey>(key: K) => OptionValueMap[K];

export const defaultOptions: OfflineCheckOptions = {
	checks: {
		xhr: {
			url: function() {
				return '/favicon.ico?_=' + ((new Date()).getTime());
			},
			timeout: 5000,
			type: 'HEAD'
		},
		image: {
			url: function() {
				return '/favicon.ico?_=' + ((new Date()).getTime());
			}
		},
		active: 'xhr'
	},
	checkOnLoad: false,
	interceptRequests: true,
	reconnect: true,
	deDupBody: false
};

export function mergeOptions(options: OfflineCheckOptionsInput = {}): OfflineCheckOptions {
	return {
		...defaultOptions,
		...options,
		checks: {
			...defaultOptions.checks,
			...options.checks,
			xhr: { ...defaultOptions.checks.xhr, ...options.checks?.xhr },
			image: { ...defaultOptions.checks.image, ...options.checks?.image }
		}
	};
}

function resolve<T>(value: OptionValue<T>): T {
	return typeof value === 'function' ? (value as () => T)() : value;
}

/**
 * Get an option value from the current options or default options
 * @param currentOptions - The current options object
 * @param key - The key to look up
 * @returns The option value or undefined
 */
export function getOption<K extends OptionKey>(currentOptions: OfflineCheckOptions, key: K): OptionValueMap[K] {
	let value: OptionValueMap[OptionKey];

	switch (key) {
		case 'checks.xhr.url':
			value = resolve(currentOptions.checks.xhr.url);
			break;
		case 'checks.xhr.timeout':
			value = resolve(currentOptions.checks.xhr.timeout);
			break;
		case 'checks.xhr.type':
			value = resolve(currentOptions.checks.xhr.type);
			break;
		case 'checks.image.url':
			value = resolve(currentOptions.checks.image.url);
			break;
		case 'checks.active':
			value = resolve(currentOptions.checks.active);
			break;
		case 'checkOnLoad':
			value = resolve(currentOptions.checkOnLoad);
			break;
		case 'interceptRequests':
			value = resolve(currentOptions.interceptRequests);
			break;
		case 'reconnect':
			value = currentOptions.reconnect;
			break;
		case 'reconnect.initialDelay':
			value = typeof currentOptions.reconnect === 'object' && currentOptions.reconnect.initialDelay !== undefined
				? resolve(currentOptions.reconnect.initialDelay)
				: undefined;
			break;
		case 'reconnect.delay':
			value = typeof currentOptions.reconnect === 'object' && currentOptions.reconnect.delay !== undefined
				? resolve(currentOptions.reconnect.delay)
				: undefined;
			break;
		case 'deDupBody':
			value = resolve(currentOptions.deDupBody);
	}

	return value as OptionValueMap[K];
}
