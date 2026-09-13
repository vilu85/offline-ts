import { defaultOptions, getOption, mergeOptions } from '../src/options';

describe('options', () => {
	it('merges nested check options without replacing their defaults', () => {
		const options = mergeOptions({
			checks: {
				xhr: { timeout: 1250 },
				image: { url: '/health.png' }
			}
		});

		expect(options.checks.xhr.timeout).toBe(1250);
		expect(options.checks.xhr.type).toBe(defaultOptions.checks.xhr.type);
		expect(options.checks.image.url).toBe('/health.png');
		expect(options.checks.active).toBe('xhr');
	});

	it('resolves function options and reconnect values', () => {
		const options = mergeOptions({
			checks: {
				xhr: {
					url: () => '/status',
					timeout: () => 2500,
					type: () => 'GET'
				},
				image: { url: () => '/status.png' },
				active: () => 'image'
			},
			checkOnLoad: () => true,
			interceptRequests: () => false,
			reconnect: {
				initialDelay: () => 2,
				delay: () => 4
			},
			deDupBody: () => true
		});

		expect(getOption(options, 'checks.xhr.url')).toBe('/status');
		expect(getOption(options, 'checks.xhr.timeout')).toBe(2500);
		expect(getOption(options, 'checks.xhr.type')).toBe('GET');
		expect(getOption(options, 'checks.image.url')).toBe('/status.png');
		expect(getOption(options, 'checks.active')).toBe('image');
		expect(getOption(options, 'checkOnLoad')).toBe(true);
		expect(getOption(options, 'interceptRequests')).toBe(false);
		expect(getOption(options, 'reconnect')).toEqual(options.reconnect);
		expect(getOption(options, 'reconnect.initialDelay')).toBe(2);
		expect(getOption(options, 'reconnect.delay')).toBe(4);
		expect(getOption(options, 'deDupBody')).toBe(true);
	});

	it('returns undefined for nested reconnect settings when reconnect is boolean', () => {
		const options = mergeOptions({ reconnect: false });

		expect(getOption(options, 'reconnect.initialDelay')).toBeUndefined();
		expect(getOption(options, 'reconnect.delay')).toBeUndefined();
	});
});
