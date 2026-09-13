export type OfflineState = 'up' | 'down';
export type OfflineEvent = 'up' | 'down' | 'confirmed-up' | 'confirmed-down' | 'checking' | 'reconnect:started' | 'reconnect:stopped' | 'reconnect:tick' | 'reconnect:connecting' | 'reconnect:failure';
export type EventHandler = (this: unknown) => unknown;
export type EventContext = unknown;
export type CheckHandler = () => unknown;
export type CheckRegistry = Record<string, CheckHandler>;
export interface MonitoredXMLHttpRequest extends XMLHttpRequest {
    offline?: boolean;
}
export interface XHROpenDetails {
    type: string;
    url: string | URL;
    async: boolean;
    user?: string | null;
    password?: string | null;
    xhr: MonitoredXMLHttpRequest;
}
export type ReconnectStateName = 'inactive' | 'waiting' | 'connecting';
export interface ReconnectController {
    state: ReconnectStateName;
    remaining: number;
    delay: number;
    tryNow: () => void;
    destroy: () => void;
}
