declare global {
  interface Window {
    setupSimpleAccount: (platformId: string, organizationId: string) => void;
  }
}

export {};
