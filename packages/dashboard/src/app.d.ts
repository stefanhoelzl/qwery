import type TabulatorTables from 'tabulator-tables';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

	interface Window {
		setTheme(theme: string): void;
		loadTheme(): string;
	}

	interface ObjectConstructor {
		entries<O extends AnyRecord, K extends keyof O, V extends O[K]>(obj: O): [K, V][];
		values<O extends AnyRecord, K extends keyof O, V extends O[K]>(obj: O): V[];
		keys<O extends AnyRecord, K extends keyof O>(obj: O): K[];
	}
}

declare module 'tabulator-tables' {
	interface OptionsRows extends TabulatorTables.OptionsRows {
		selectableRangeAutoFocus?: boolean;
		selectableRangeInitializeDefault?: boolean;
	}
}
