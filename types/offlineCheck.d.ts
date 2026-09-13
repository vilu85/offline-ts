import { type GetOption, type OfflineCheckOptions, type OfflineCheckOptionsInput } from './options';
import type { CheckRegistry, EventContext, EventHandler, OfflineEvent, OfflineState, ReconnectController, XHROpenDetails } from './types';
type XHRInterceptor = (details: XHROpenDetails) => void;
export declare class OfflineCheck {
    state: OfflineState;
    options: OfflineCheckOptions;
    checks: CheckRegistry;
    reconnect: ReconnectController;
    private readonly handlers;
    private initialized;
    private restoreXMLHttpRequest?;
    constructor(options?: OfflineCheckOptionsInput);
    setOptions: (options: OfflineCheckOptionsInput) => void;
    getOption: GetOption;
    on: (event: OfflineEvent, handler: EventHandler, context?: EventContext) => void;
    off: (event: OfflineEvent, handler?: EventHandler) => void;
    trigger: (event: OfflineEvent) => unknown[];
    markUp: () => void;
    markDown: () => void;
    check: () => unknown;
    confirmUp: () => unknown;
    confirmDown: () => unknown;
    handleOnlineEvent: () => void;
    handleOfflineEvent: () => void;
    onXHR: (callback: XHRInterceptor) => (() => void);
    init: () => void;
    destroy: () => void;
}
export default OfflineCheck;
