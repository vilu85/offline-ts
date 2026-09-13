import OfflineCheck from './offlineCheck';
import type { OfflineCheckOptionsInput } from './options';

/**
 * Main Offline class that orchestrates offline checks
 */
class Offline extends OfflineCheck {
	public constructor(options: OfflineCheckOptionsInput = {}) {
		super(options);
	}
}

export type {
	OfflineCheckOptions,
	OfflineCheckOptionsInput,
	ImageCheckOptions,
	ReconnectOptions,
	XHRCheckOptions
} from './options';
export type {
	OfflineEvent,
	OfflineState,
	ReconnectController,
	ReconnectStateName,
	XHROpenDetails
} from './types';
export { Offline, OfflineCheck };
export default Offline;
