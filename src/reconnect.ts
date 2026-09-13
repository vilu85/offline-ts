import type { GetOption } from './options';
import type { EventHandler, OfflineEvent, ReconnectController } from './types';

type Trigger = (event: OfflineEvent) => unknown[];
type On = (event: OfflineEvent, handler: EventHandler) => void;
type Off = (event: OfflineEvent, handler?: EventHandler) => void;

export function reconnect(trigger: Trigger, getOption: GetOption, check: () => unknown, on: On, off: Off): ReconnectController {
	let retryInterval: ReturnType<typeof setInterval> | undefined;

	const controller: ReconnectController = {
		state: 'inactive',
		remaining: 3,
		delay: 3,
		tryNow: (): void => undefined,
		destroy: (): void => undefined
	};

	const reset = (): void => {
		if (controller.state !== 'inactive') {
			trigger('reconnect:stopped');
		}
		controller.state = 'inactive';
		controller.remaining = getOption('reconnect.initialDelay') ?? 3;
		controller.delay = controller.remaining;
	};

	const next = (): void => {
		const delay = getOption('reconnect.delay') ?? Math.min(Math.ceil(controller.delay * 1.5), 3600);
		controller.remaining = delay;
		controller.delay = delay;
	};

	const tryNow = (): void => {
		if (controller.state !== 'waiting') {
			return;
		}
		trigger('reconnect:connecting');
		controller.state = 'connecting';
		check();
	};

	const tick = (): void => {
		if (controller.state === 'connecting') {
			return;
		}
		controller.remaining -= 1;
		trigger('reconnect:tick');
		if (controller.remaining <= 0) {
			tryNow();
		}
	};

	const down = (): void => {
		if (getOption('reconnect') === false) {
			return;
		}
		reset();
		controller.state = 'waiting';
		trigger('reconnect:started');
		retryInterval = setInterval(tick, 1000);
	};

	const up = (): void => {
		if (retryInterval !== undefined) {
			clearInterval(retryInterval);
			retryInterval = undefined;
		}
		reset();
	};

	const failed = (): void => {
		if (getOption('reconnect') === false || controller.state !== 'connecting') {
			return;
		}
		trigger('reconnect:failure');
		controller.state = 'waiting';
		next();
	};

	controller.tryNow = tryNow;
	controller.destroy = (): void => {
		if (retryInterval !== undefined) {
			clearInterval(retryInterval);
			retryInterval = undefined;
		}
		off('down', down);
		off('confirmed-down', failed);
		off('up', up);
		reset();
	};

	reset();
	on('down', down);
	on('confirmed-down', failed);
	on('up', up);

	return controller;
}
