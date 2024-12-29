type NoZero<T extends number> = T extends 0 ? never : T;
type D1 = 0 | 1;
type D3 = D1 | 2 | 3;
type D5 = D3 | 4 | 5;
type D9 = D5 | 6 | 7 | 8 | 9;

type Year = `${20}${D9}${D9}`;
type Month = `0${NoZero<D9>}` | `1${D1 | 2}`;
type Day = `0${NoZero<D9>}` | `1${D9}` | `2${D9}` | `3${D1}`;

type DateString = `${Year}-${Month}-${Day}`;

declare global {
  type SimpleConfig = {
    /** Platform ID [Required] */
    platformId: string;
    /** Organization Tax ID [Required] */
    organizationTaxId: string;
    /** Amount [Required] */
    amount: string;
    /** Email [Optional] */
    email?: string;
    /** Schedule [Optional] */
    schedule?: {
      /** Interval Type [Required] */
      intervalType: "day" | "week" | "month" | "year";
      /** Interval Count [Required] */
      intervalCount: number;
      /** Start Date [Optional]
       * @pattern ```/^\d{4}-\d{2}-\d{2}$/```
       * @example 2024-01-01
       *
       */
      startDate?: DateString;
      /** End Date [Optional]
       * @description Either `endDate` or `totalPayments` may be provided
       * @pattern ```/^\d{4}-\d{2}-\d{2}$/```
       * @example 2024-01-01
       */
      endDate?: DateString;
      /** Total Payments [Optional]
       * @description Either `endDate` or `totalPayments` may be provided
       */
      totalPayments?: number;
    };
    /** On Success Callback  */
    onSuccess?: (merchantResponse: unknown) => void;
  };

  /**
   * Applies a simple configuration to the system.
   *
   * @param {Partial<SimpleConfig>} [args] - The configuration object to apply.
   * ```ts
   * type SimpleConfig = {
   *   platformId: string;
   *   organizationTaxId: string;
   *   amount: string;
   *   email?: string;
   *   schedule?: {
   *     intervalType: "day" | "week" | "month" | "year";
   *     intervalCount: number;
   *     // pattern - /^\d{4}-\d{2}-\d{2}$/ example - 2024-01-01
   *     startDate?: string;
   *     // pattern - /^\d{4}-\d{2}-\d{2}$/ example - 2024-01-01
   *     endDate?: string;
   *     totalPayments?: number;
   *   };
   *   onSuccess?: (merchantResponse: unknown) => void;
   * };
   * ```
   *
   * @example
   * ```ts
   * applySimpleConfig({
   *   platformId: "123",
   *   organizationTaxId: "456",
   *   amount: "100",
   * });
   * ```
   */
  function applySimpleConfig(args?: Partial<SimpleConfig>): void;
}

export {};
