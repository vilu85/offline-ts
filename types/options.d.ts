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
export declare const defaultOptions: OfflineCheckOptions;
export declare function mergeOptions(options?: OfflineCheckOptionsInput): OfflineCheckOptions;
/**
 * Get an option value from the current options or default options
 * @param currentOptions - The current options object
 * @param key - The key to look up
 * @returns The option value or undefined
 */
export declare function getOption<K extends OptionKey>(currentOptions: OfflineCheckOptions, key: K): OptionValueMap[K];
