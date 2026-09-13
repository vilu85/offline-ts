import { checks, checkXHR } from './checks';
import {
	getOption as getOptionValue,
	mergeOptions,
	type GetOption,
	type OfflineCheckOptions,
	type OfflineCheckOptionsInput,
	type OptionKey,
	type OptionValueMap
} from './options';
import { reconnect as createReconnect } from './reconnect';
import type {
	CheckRegistry,
	EventContext,
	EventHandler,
	MonitoredXMLHttpRequest,
	OfflineEvent,
	OfflineState,
	ReconnectController,
	XHROpenDetails
} from './types';

type HandlerRegistration = [EventContext, EventHandler];
type XHRInterceptor = (details: XHROpenDetails) => void;

export class OfflineCheck {
	public state: OfflineState = 'up';
	public options: OfflineCheckOptions;
	public checks: CheckRegistry;
	public reconnect!: ReconnectController;

	private readonly handlers: Partial<Record<OfflineEvent, HandlerRegistration[]>> = {};
	private initialized = false;
	private restoreXMLHttpRequest?: () => void;

	public constructor(options: OfflineCheckOptionsInput = {}) {
		this.options = mergeOptions(options);
		this.checks = checks(this.getOption, this.markUp, this.markDown);
		this.checks.down = this.markDown;
		this.checks.up = this.markUp;
		this.init();
	}

	public setOptions = (options: OfflineCheckOptionsInput): void => {
		this.options = mergeOptions(options);
	};

	public getOption: GetOption = <K extends OptionKey>(key: K): OptionValueMap[K] => {
		return getOptionValue(this.options, key);
	};

	public on = (event: OfflineEvent, handler: EventHandler, context?: EventContext): void => {
		for (const eventName of event.split(/\s+/) as OfflineEvent[]) {
			(this.handlers[eventName] ??= []).push([context, handler]);
		}
	};

	public off = (event: OfflineEvent, handler?: EventHandler): void => {
		for (const eventName of event.split(/\s+/) as OfflineEvent[]) {
			const registrations = this.handlers[eventName];
			if (!registrations) {
				continue;
			}
			this.handlers[eventName] = handler
				? registrations.filter(([, registeredHandler]) => registeredHandler !== handler)
				: [];
		}
	};

	public trigger = (event: OfflineEvent): unknown[] => {
		return (this.handlers[event] ?? []).slice().map(([context, handler]) => handler.call(context));
	};

	public markUp = (): void => {
		this.trigger('confirmed-up');
		if (this.state !== 'up') {
			this.state = 'up';
			this.trigger('up');
		}
	};

	public markDown = (): void => {
		this.trigger('confirmed-down');
		if (this.state !== 'down') {
			this.state = 'down';
			this.trigger('down');
		}
	};

	public check = (): unknown => {
		this.trigger('checking');
		const activeCheck = this.getOption('checks.active');
		const check = this.checks[activeCheck];
		if (!check) {
			throw new Error(`Unknown offline check: ${activeCheck}`);
		}
		return check();
	};

	public confirmUp = (): unknown => this.check();
	public confirmDown = (): unknown => this.check();

	public handleOnlineEvent = (): void => {
		setTimeout(this.confirmUp, 100);
	};

	public handleOfflineEvent = (): void => {
		this.confirmDown();
	};

	public onXHR = (callback: XHRInterceptor): (() => void) => {
		const NativeXMLHttpRequest = window.XMLHttpRequest;
		const monitor = (request: MonitoredXMLHttpRequest): void => {
			const open = request.open;
			request.open = function(
				method: string,
				url: string | URL,
				async: boolean = true,
				user?: string | null,
				password?: string | null
			): void {
				callback({ type: method, url, async, user, password, xhr: request });
				open.call(request, method, url, async, user, password);
			} as typeof request.open;
		};
		const WrappedXMLHttpRequest = function(): XMLHttpRequest {
			const request = new NativeXMLHttpRequest() as MonitoredXMLHttpRequest;
			monitor(request);
			return request;
		} as unknown as typeof XMLHttpRequest;

		Object.setPrototypeOf(WrappedXMLHttpRequest, NativeXMLHttpRequest);
		WrappedXMLHttpRequest.prototype = NativeXMLHttpRequest.prototype;
		window.XMLHttpRequest = WrappedXMLHttpRequest;

		return (): void => {
			if (window.XMLHttpRequest === WrappedXMLHttpRequest) {
				window.XMLHttpRequest = NativeXMLHttpRequest;
			}
		};
	};

	public init = (): void => {
		if (this.initialized) {
			return;
		}
		this.initialized = true;
		this.reconnect = createReconnect(this.trigger, this.getOption, this.check, this.on, this.off);
		window.addEventListener('online', this.handleOnlineEvent, false);
		window.addEventListener('offline', this.handleOfflineEvent, false);

		if (this.getOption('interceptRequests')) {
			this.restoreXMLHttpRequest = this.onXHR(({ xhr }) => {
				if (xhr.offline !== false) {
					checkXHR(xhr, this.markUp, this.confirmDown);
				}
			});
		}
		if (this.getOption('checkOnLoad')) {
			this.check();
		}
	};

	public destroy = (): void => {
		if (!this.initialized) {
			return;
		}
		window.removeEventListener('online', this.handleOnlineEvent, false);
		window.removeEventListener('offline', this.handleOfflineEvent, false);
		this.restoreXMLHttpRequest?.();
		this.restoreXMLHttpRequest = undefined;
		this.reconnect.destroy();
		this.initialized = false;
	};
}

export default OfflineCheck;
