# offline-ts

[![npm version](https://img.shields.io/npm/v/offline-ts.svg)](https://www.npmjs.com/package/offline-ts)
[![CI](https://github.com/vilu85/offline-ts/actions/workflows/nodejs.yml/badge.svg?branch=master)](https://github.com/vilu85/offline-ts/actions/workflows/nodejs.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-yellow.svg)](LICENSE)

A small, dependency-free TypeScript utility for checking browser connectivity.

`offline-ts` verifies connectivity with an HTTP request or image load instead of relying only on `navigator.onLine`. It tracks connection state, emits lifecycle events, and can retry checks automatically while the browser is offline.

## Demo

Try the [interactive offline-ts demo](https://vilu85.github.io/offline-ts/) to run connectivity checks, simulate state changes, and observe reconnect events.

## Features

- Written in TypeScript with generated type declarations
- XHR and image-based connectivity checks
- Browser `online` and `offline` event handling
- Optional interception of application XHR requests
- Configurable reconnect attempts with backoff
- Extensible check registry
- ESM and UMD builds

## Installation

```bash
npm install offline-ts
```

This is a browser library and requires the DOM and `XMLHttpRequest` APIs.

## Quick start

```ts
import Offline from 'offline-ts';

const offline = new Offline({
	checkOnLoad: true,
	checks: {
		xhr: {
			url: '/health',
			timeout: 3000,
			type: 'HEAD',
		},
	},
	reconnect: {
		initialDelay: 3,
	},
});

offline.on('down', () => {
	console.log('Connection lost');
});

offline.on('up', () => {
	console.log('Connection restored');
});
```

The constructor initializes the instance immediately. Call `destroy()` when the instance is no longer needed:

```ts
offline.destroy();
```

This removes browser event listeners, stops reconnect timers, and restores the native `XMLHttpRequest` constructor if request interception was enabled.

## React

Create the checker in an effect, copy its connection state into React state, and destroy it when the component unmounts:

```tsx
import { useEffect, useState } from 'react';
import Offline, { type OfflineState } from 'offline-ts';

export function ConnectionStatus() {
	const [connection, setConnection] = useState<OfflineState>('up');

	useEffect(() => {
		const offline = new Offline({
			checkOnLoad: true,
			interceptRequests: false,
			reconnect: {
				initialDelay: 5,
				delay: 5,
			},
		});
		const handleUp = () => setConnection('up');
		const handleDown = () => setConnection('down');

		offline.on('up', handleUp);
		offline.on('down', handleDown);

		return () => {
			offline.off('up', handleUp);
			offline.off('down', handleDown);
			offline.destroy();
		};
	}, []);

	return <output aria-live="polite">Connection: {connection}</output>;
}
```

Creating the instance inside `useEffect` avoids adding browser listeners during rendering and ensures React development-mode remounts are cleaned up correctly.

## Configuration

Options are optional and nested options are merged with the defaults.

```ts
const offline = new Offline({
	checks: {
		active: 'xhr',
		xhr: {
			url: () => `/favicon.ico?_=${Date.now()}`,
			timeout: 5000,
			type: 'HEAD',
		},
		image: {
			url: () => `/favicon.ico?_=${Date.now()}`,
		},
	},
	checkOnLoad: false,
	interceptRequests: true,
	reconnect: {
		initialDelay: 3,
	},
	deDupBody: false,
});
```

| Option                   | Type                          | Default                     | Description                                              |
| ------------------------ | ----------------------------- | --------------------------- | -------------------------------------------------------- |
| `checks.active`          | `string \| () => string`      | `'xhr'`                     | Name of the check executed by `check()`                  |
| `checks.xhr.url`         | `string \| () => string`      | Cache-busted `/favicon.ico` | URL used by the XHR check                                |
| `checks.xhr.timeout`     | `number \| () => number`      | `5000`                      | XHR timeout in milliseconds                              |
| `checks.xhr.type`        | `string \| () => string`      | `'HEAD'`                    | HTTP method used by the XHR check                        |
| `checks.image.url`       | `string \| () => string`      | Cache-busted `/favicon.ico` | URL used by the image check                              |
| `checkOnLoad`            | `boolean \| () => boolean`    | `false`                     | Run a check during initialization                        |
| `interceptRequests`      | `boolean \| () => boolean`    | `true`                      | Monitor opened XHR requests for connectivity failures    |
| `reconnect`              | `boolean \| ReconnectOptions` | `true`                      | Enable reconnect attempts or configure their timing      |
| `reconnect.initialDelay` | `number \| () => number`      | `3`                         | Seconds before the first reconnect check                 |
| `reconnect.delay`        | `number \| () => number`      | Exponential backoff         | Seconds between reconnect attempts                       |
| `deDupBody`              | `boolean \| () => boolean`    | `false`                     | Compatibility option; currently does not modify requests |

When `reconnect.delay` is omitted, each failed reconnect increases the previous delay by 1.5, rounded up and capped at one hour.

### Changing options

```ts
offline.setOptions({
	checks: {
		active: 'image',
		image: {
			url: '/connection-test.png',
		},
	},
	reconnect: false,
});
```

`setOptions()` merges the supplied values with the defaults. Settings read during initialization, such as `checkOnLoad` and installation of XHR interception, should normally be passed to the constructor.

## Checks

### Run a check manually

```ts
offline.check();
```

The default XHR check considers a non-zero HTTP status below `12000` successful. Network errors, timeouts, status `0`, and synchronous send failures mark the connection as down.

The image check marks the connection as up when the configured image loads and down when loading fails:

```ts
const offline = new Offline({
	checks: {
		active: 'image',
		image: {
			url: '/connection-test.png',
		},
	},
});
```

### Custom checks

Checks are stored in the public `checks` registry. A custom check should eventually call `markUp()` or `markDown()`.

```ts
const offline = new Offline({
	checks: {
		active: 'api',
	},
});

offline.checks.api = async () => {
	try {
		const response = await fetch('/health', { cache: 'no-store' });
		response.ok ? offline.markUp() : offline.markDown();
	} catch {
		offline.markDown();
	}
};

offline.check();
```

The built-in registry also contains `up` and `down` checks, which immediately call `markUp()` and `markDown()` respectively.

## State and events

The current state is available as `offline.state`:

```ts
if (offline.state === 'down') {
	console.log('The connection is currently down');
}
```

Possible values are `'up'` and `'down'`. The initial state is `'up'` until a check fails.

Register a listener with `on()` and remove it with `off()`:

```ts
const handleDown = () => {
	console.log('Offline');
};

offline.on('down', handleDown);
offline.off('down', handleDown);

// Remove every listener for this event.
offline.off('down');
```

Available events:

| Event                  | Emitted when                                       |
| ---------------------- | -------------------------------------------------- |
| `checking`             | A connectivity check starts                        |
| `confirmed-up`         | A check succeeds, even if the state was already up |
| `confirmed-down`       | A check fails, even if the state was already down  |
| `up`                   | State changes from down to up                      |
| `down`                 | State changes from up to down                      |
| `reconnect:started`    | Automatic reconnect attempts begin                 |
| `reconnect:tick`       | The reconnect countdown decreases                  |
| `reconnect:connecting` | A reconnect check starts                           |
| `reconnect:failure`    | A reconnect check fails                            |
| `reconnect:stopped`    | Reconnect attempts stop or reset                   |

Handlers may also receive an optional `this` context through the third argument to `on()`.

## Reconnecting

When reconnecting is enabled, transitioning to the down state starts a countdown. You can inspect the reconnect controller or request an immediate retry:

```ts
console.log(offline.reconnect.state);
console.log(offline.reconnect.remaining);

offline.reconnect.tryNow();
```

Reconnect states are:

- `inactive`
- `waiting`
- `connecting`

A successful check stops reconnecting. A failed reconnect schedules another attempt using the configured delay or default backoff.

## Browser events

A browser `offline` event triggers an immediate connectivity check. A browser `online` event triggers a check after 100 milliseconds. These events are treated as signals to verify connectivity rather than definitive connection status.

## XHR interception

XHR interception is enabled by default. Existing application requests can therefore contribute to connection state detection. Requests created by the built-in XHR check are marked so they are not intercepted twice.

You can also install an interceptor manually:

```ts
const restore = offline.onXHR(({ type, url, xhr }) => {
	console.log(type, url, xhr);
});

restore();
```

## API

### `new Offline(options?)`

Creates and initializes an offline checker.

The package also exports the base `OfflineCheck` class as a named export:

```ts
import Offline, { OfflineCheck } from 'offline-ts';
```

### Properties

- `state` — current `'up'` or `'down'` state
- `options` — resolved configuration object
- `checks` — registry of available connectivity checks
- `reconnect` — reconnect state and controls

### Methods

- `check()` — execute the active check
- `confirmUp()` / `confirmDown()` — aliases that verify connectivity with the active check
- `markUp()` / `markDown()` — directly update the confirmed state
- `on(event, handler, context?)` — register an event listener
- `off(event, handler?)` — remove one or all listeners for an event
- `trigger(event)` — manually emit an event
- `getOption(key)` — read and resolve an option
- `setOptions(options)` — replace the current overrides merged with defaults
- `init()` — initialize a previously destroyed instance
- `destroy()` — remove listeners, timers, and interception
- `onXHR(callback)` — intercept XHR `open()` calls and return a restore function

## TypeScript types

The package exports its public option, event, state, reconnect, and XHR detail types:

```ts
import type {
	OfflineCheckOptions,
	OfflineCheckOptionsInput,
	OfflineEvent,
	OfflineState,
	ReconnectController,
	ReconnectOptions,
	XHROpenDetails,
} from 'offline-ts';
```

## Script-tag usage

The UMD bundle exports the constructor as `offline`:

```html
<script src="dist/offline.umd.js"></script>
<script>
	const connection = new offline({ checkOnLoad: true });
	connection.on('down', function () {
		console.log('Offline');
	});
</script>
```

## Development

Install dependencies:

```bash
npm install
```

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

The HTML coverage report is written to `coverage/lcov-report/index.html`.

Run TypeScript and lint checks:

```bash
npx tsc --noEmit
npm run lint
```

Build development bundles:

```bash
npm run build
```

Build minified production bundles:

```bash
npm run build:production
```

The build produces:

- `dist/offline.js` — ESM bundle
- `dist/offline.umd.js` — UMD bundle
- `types/` — generated declarations

## Releasing

Publishing is handled by `.github/workflows/npm.yml` using npm trusted publishing. A pushed `vX.Y.Z` tag must match the version in `package.json`. The workflow verifies the package, builds it, publishes the generated tarball to npm with provenance, and attaches the same tarball to a GitHub Release.

For a release:

1. Update the package version in a pull request and merge it.
2. Pull the resulting `master` commit locally.
3. Create and push the matching tag.

```bash
git tag v1.0.1
git push origin v1.0.1
```

The npm package must trust the `vilu85/offline-ts` repository, the `npm.yml` workflow, and the `production` environment. The workflow does not use a long-lived npm token.

## License

[MIT](LICENSE)
