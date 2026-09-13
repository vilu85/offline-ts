import type { GetOption } from './options';
import type { EventHandler, OfflineEvent, ReconnectController } from './types';
type Trigger = (event: OfflineEvent) => unknown[];
type On = (event: OfflineEvent, handler: EventHandler) => void;
type Off = (event: OfflineEvent, handler?: EventHandler) => void;
export declare function reconnect(trigger: Trigger, getOption: GetOption, check: () => unknown, on: On, off: Off): ReconnectController;
export {};
