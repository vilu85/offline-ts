import { checks, checkXHR } from '../src/checks';
import type { GetOption, OptionKey, OptionValueMap } from '../src/options';

function createGetOption(overrides: Partial<OptionValueMap> = {}): GetOption {
	const values: OptionValueMap = {
		'checks.xhr.url': '/status',
		'checks.xhr.timeout': 1500,
		'checks.xhr.type': 'HEAD',
		'checks.image.url': '/status.png',
		'checks.active': 'xhr',
		checkOnLoad: false,
		interceptRequests: false,
		reconnect: false,
		'reconnect.initialDelay': undefined,
		'reconnect.delay': undefined,
		deDupBody: false,
		...overrides
	};

	return ((key: OptionKey) => values[key]) as GetOption;
}

function createXHR(status: number, onProgress: XMLHttpRequest['onprogress'] = null): XMLHttpRequest {
	return {
		status,
		readyState: XMLHttpRequest.UNSENT,
		onprogress: onProgress,
		onerror: null,
		ontimeout: null,
		onload: null,
		onreadystatechange: null
	} as unknown as XMLHttpRequest;
}

describe('checkXHR', () => {
	it('marks successful loads as up and preserves the existing load handler', () => {
		const xhr = createXHR(204);
		const previousLoad = jest.fn();
		const onUp = jest.fn();
		const onDown = jest.fn();
		xhr.onload = previousLoad;

		checkXHR(xhr, onUp, onDown);
		xhr.onload?.call(xhr, new ProgressEvent('load'));

		expect(onUp).toHaveBeenCalledTimes(1);
		expect(onDown).not.toHaveBeenCalled();
		expect(previousLoad).toHaveBeenCalledTimes(1);
	});

	it('marks errors, timeouts, and unsuccessful responses as down', () => {
		const xhr = createXHR(0);
		const onDown = jest.fn();

		checkXHR(xhr, jest.fn(), onDown);
		xhr.onerror?.call(xhr, new ProgressEvent('error'));
		xhr.ontimeout?.call(xhr, new ProgressEvent('timeout'));
		xhr.onload?.call(xhr, new ProgressEvent('load'));

		expect(onDown).toHaveBeenCalledTimes(3);
	});

	it('supports ready-state based XMLHttpRequest implementations', () => {
		const xhr = createXHR(200, jest.fn());
		const onUp = jest.fn();
		const onDown = jest.fn();

		checkXHR(xhr, onUp, onDown);
		Object.defineProperty(xhr, 'readyState', { configurable: true, value: XMLHttpRequest.DONE });
		xhr.onreadystatechange?.call(xhr, new Event('readystatechange'));

		expect(onUp).toHaveBeenCalledTimes(1);
		expect(onDown).not.toHaveBeenCalled();
	});
});

describe('checks', () => {
	const NativeXMLHttpRequest = window.XMLHttpRequest;

	afterEach(() => {
		window.XMLHttpRequest = NativeXMLHttpRequest;
		jest.restoreAllMocks();
	});

	it('configures and sends an XHR connectivity check', () => {
		const request = {
			open: jest.fn(),
			send: jest.fn(),
			timeout: 0,
			onprogress: null,
			onerror: null,
			ontimeout: null,
			onload: null,
			onreadystatechange: null
		} as unknown as XMLHttpRequest;
		window.XMLHttpRequest = jest.fn(() => request) as unknown as typeof XMLHttpRequest;

		const registry = checks(createGetOption(), jest.fn(), jest.fn());
		const result = registry.xhr();

		expect(request.open).toHaveBeenCalledWith('HEAD', '/status', true);
		expect(request.timeout).toBe(1500);
		expect(request.send).toHaveBeenCalledTimes(1);
		expect(result).toBe(request);
		expect(request).toHaveProperty('offline', false);
	});

	it('marks the connection down when sending throws', () => {
		const request = {
			open: jest.fn(),
			send: jest.fn(() => {
				throw new Error('Network unavailable');
			}),
			timeout: 0,
			onprogress: null,
			onerror: null,
			ontimeout: null,
			onload: null,
			onreadystatechange: null
		} as unknown as XMLHttpRequest;
		window.XMLHttpRequest = jest.fn(() => request) as unknown as typeof XMLHttpRequest;
		const markDown = jest.fn();

		checks(createGetOption(), jest.fn(), markDown).xhr();

		expect(markDown).toHaveBeenCalledTimes(1);
	});

	it('configures an image connectivity check', () => {
		const image = document.createElement('img');
		jest.spyOn(document, 'createElement').mockReturnValueOnce(image);
		const markUp = jest.fn();
		const markDown = jest.fn();

		checks(createGetOption(), markUp, markDown).image();

		expect(image.src).toContain('/status.png');
		expect(image.onload).toBe(markUp);
		expect(image.onerror).toBe(markDown);
	});
});
