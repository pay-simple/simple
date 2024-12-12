declare global {
  type SimpleConfig = {
    platformId: string;
    organizationId: string;
    amount: string;
    email?: string;
    schedule?: {
      intervalType: "day" | "week" | "month" | "year";
      intervalCount: number;
      /** @pattern /^\d{4}-\d{2}-\d{2}$/ */
      startDate?: string;
      /** @pattern /^\d{4}-\d{2}-\d{2}$/ */
      endDate?: string;
      totalPayments?: number;
    };
    onSuccess?: (merchantResponse: unknown) => void;
    onError?: (error: unknown) => void;
  };

  interface Window {
    applySimpleConfig: (args?: Partial<SimpleConfig>) => void;
  }
}

export {};
