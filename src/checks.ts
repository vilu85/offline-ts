import type { GetOption } from './options';
import type { CheckHandler, CheckRegistry, MonitoredXMLHttpRequest } from './types';

export function checkXHR(xhr: XMLHttpRequest, onUp: CheckHandler, onDown: CheckHandler): void {
	const checkStatus = (): void => {
		if (xhr.status > 0 && xhr.status < 12000) {
			onUp();
		} else {
			onDown();
		}
	};

	if (xhr.onprogress === null) {
		const onError = xhr.onerror;
		const onTimeout = xhr.ontimeout;
		const onLoad = xhr.onload;

		xhr.onerror = function(event): void {
			onDown();
			onError?.call(xhr, event);
		};
		xhr.ontimeout = function(event): void {
			onDown();
			onTimeout?.call(xhr, event);
		};
		xhr.onload = function(event): void {
			checkStatus();
			onLoad?.call(xhr, event);
		};
		return;
	}

	const onReadyStateChange = xhr.onreadystatechange;
	xhr.onreadystatechange = function(event): void {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			checkStatus();
		} else if (xhr.readyState === XMLHttpRequest.UNSENT) {
			onDown();
		}
		onReadyStateChange?.call(xhr, event);
	};
}

export function checks(getOption: GetOption, markUp: CheckHandler, markDown: CheckHandler): CheckRegistry {
	const xhr = (): XMLHttpRequest => {
		const request = new XMLHttpRequest() as MonitoredXMLHttpRequest;
		request.offline = false;
		request.open(getOption('checks.xhr.type'), getOption('checks.xhr.url'), true);
		request.timeout = getOption('checks.xhr.timeout');
		checkXHR(request, markUp, markDown);

		try {
			request.send();
		} catch {
			markDown();
		}

		return request;
	};

	const image = (): void => {
		const img = document.createElement('img');
		img.onerror = markDown;
		img.onload = markUp;
		img.src = getOption('checks.image.url');
	};

	return { xhr, image };
}
