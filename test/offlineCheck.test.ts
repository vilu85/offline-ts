import Offline from '../src';
import { OfflineCheck } from '../src/offlineCheck';

function createOffline(options: ConstructorParameters<typeof OfflineCheck>[0] = {}): OfflineCheck {
	return new OfflineCheck({ interceptRequests: false, reconnect: false, ...options });
}

describe('OfflineCheck', () => {
	let offline: OfflineCheck | undefined;

	afterEach(() => {
		offline?.destroy();
		offline = undefined;
		jest.useRealTimers();
		jest.restoreAllMocks();
	});

	it('is exported through the package entry point', () => {
		offline = new Offline({ interceptRequests: false, reconnect: false });

		expect(offline).toBeInstanceOf(OfflineCheck);
		expect(offline.state).toBe('up');
	});

	it('emits confirmed events every time and transition events once', () => {
		offline = createOffline();
		const confirmedDown = jest.fn();
		const down = jest.fn();
		const confirmedUp = jest.fn();
		const up = jest.fn();
		offline.on('confirmed-down', confirmedDown);
		offline.on('down', down);
		offline.on('confirmed-up', confirmedUp);
		offline.on('up', up);

		offline.markDown();
		offline.markDown();
		offline.markUp();
		offline.markUp();

		expect(confirmedDown).toHaveBeenCalledTimes(2);
		expect(down).toHaveBeenCalledTimes(1);
		expect(confirmedUp).toHaveBeenCalledTimes(2);
		expect(up).toHaveBeenCalledTimes(1);
		expect(offline.state).toBe('up');
	});

	it('removes individual handlers or every handler for an event', () => {
		offline = createOffline();
		const first = jest.fn();
		const second = jest.fn();
		offline.on('down', first);
		offline.on('down', second);

		offline.off('down', first);
		offline.markDown();
		offline.off('down');
		offline.markUp();
		offline.markDown();

		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
	});

	it('runs the configured check and reports unknown checks', () => {
		offline = createOffline({ checks: { active: 'custom' } });
		const customCheck = jest.fn(() => 'checked');
		const checking = jest.fn();
		offline.checks.custom = customCheck;
		offline.on('checking', checking);

		expect(offline.check()).toBe('checked');
		expect(customCheck).toHaveBeenCalledTimes(1);
		expect(checking).toHaveBeenCalledTimes(1);

		offline.setOptions({ checks: { active: 'missing' }, interceptRequests: false, reconnect: false });
		expect(() => offline?.check()).toThrow('Unknown offline check: missing');
	});

	it('checks after browser online and offline events', () => {
		jest.useFakeTimers();
		offline = createOffline();
		const check = jest.fn();
		offline.checks.xhr = check;

		window.dispatchEvent(new Event('online'));
		expect(check).not.toHaveBeenCalled();
		jest.advanceTimersByTime(100);
		expect(check).toHaveBeenCalledTimes(1);

		window.dispatchEvent(new Event('offline'));
		expect(check).toHaveBeenCalledTimes(2);
	});

	it('intercepts XHR open calls and can restore the native constructor', () => {
		offline = createOffline();
		const NativeXMLHttpRequest = window.XMLHttpRequest;
		const interceptor = jest.fn();
		const restore = offline.onXHR(interceptor);
		const request = new XMLHttpRequest();

		request.open('GET', '/status');

		expect(interceptor).toHaveBeenCalledWith(expect.objectContaining({
			type: 'GET',
			url: '/status',
			async: true,
			xhr: request
		}));
		restore();
		expect(window.XMLHttpRequest).toBe(NativeXMLHttpRequest);
	});

	it('retries failed checks and stops reconnecting once back up', () => {
		jest.useFakeTimers();
		offline = createOffline({ reconnect: { initialDelay: 2 } });
		const check = jest.fn();
		offline.checks.xhr = check;

		offline.markDown();
		expect(offline.reconnect.state).toBe('waiting');
		expect(offline.reconnect.remaining).toBe(2);

		jest.advanceTimersByTime(1000);
		expect(offline.reconnect.remaining).toBe(1);
		offline.reconnect.tryNow();
		expect(offline.reconnect.state).toBe('connecting');
		expect(check).toHaveBeenCalledTimes(1);

		offline.markDown();
		expect(offline.reconnect.state).toBe('waiting');
		expect(offline.reconnect.delay).toBe(3);

		offline.markUp();
		expect(offline.reconnect.state).toBe('inactive');
	});
});
