declare global {
  // See https://svelte.dev/docs/kit/types#app.d.ts
  // for information about these interfaces
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }

  interface ObjectConstructor {
    entries<O extends object, K extends keyof O, V extends O[K]>(obj: O): [K, V][];

    values<O extends object, K extends keyof O, V extends O[K]>(obj: O): V[];

    keys<O extends object, K extends keyof O>(obj: O): K[];
  }
}

export * from "tabulator-tables";
declare module "tabulator-tables" {
  export interface OptionsRows {
    selectableRangeAutoFocus?: boolean;
    selectableRangeInitializeDefault?: boolean;
  }
}
