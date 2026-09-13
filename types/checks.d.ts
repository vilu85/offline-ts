import type { GetOption } from './options';
import type { CheckHandler, CheckRegistry } from './types';
export declare function checkXHR(xhr: XMLHttpRequest, onUp: CheckHandler, onDown: CheckHandler): void;
export declare function checks(getOption: GetOption, markUp: CheckHandler, markDown: CheckHandler): CheckRegistry;
