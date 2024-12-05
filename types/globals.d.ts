declare global {
  type SimpleConfig = {
    platformId: string;
    organizationId: string;
    amount: string;
    schedule?: {
      intervalType: "day" | "week" | "month" | "year";
      intervalCount: number;
      /** @pattern /^\d{4}-\d{2}-\d{2}$/ */
      startDate?: string;
      /** @pattern /^\d{4}-\d{2}-\d{2}$/ */
      endDate?: string;
      totalPayments?: number;
    };
  };

  interface Window {
    setupSimple: (
      args: SimpleConfig,
      onTxnSuccess: (txn: unknown) => void,
      onTxnError: (error: unknown) => void,
    ) => void;
  }
}

export {};
