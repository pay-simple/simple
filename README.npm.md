# [Simple SDK](https://github.com/pay-simple/simple)

[Simple SDK](https://github.com/pay-simple/simple) is a lightweight JavaScript library designed to simplify payment integration for web applications. It provides a seamless way to handle payment configurations and interactions through a simple API.

## Quick Start Example

Get started with Simple SDK in just 3 steps:

```html
<!-- 1. Include the Simple script -->
<script src="https://cdn.jsdelivr.net/npm/@paysimple/simple-dev"></script>

<!-- 2. Add an email input -->
<input type="email" placeholder="Enter email" />

<!-- 3. Configure Simple -->
<script>
  window.applySimpleConfig({
    platformId: "your_platform_id",
    organizationTaxId: "your_organization_tax_id",
    amount: 10.99,
    onSuccess: (response) => console.log("Payment successful!", response),
  });
</script>
```

That's it! Simple will automatically detect the email input and handle the payment flow.

## Features

- 🚀 **Zero Setup**: Just include the script and you're ready
- ✨ **Simple Configuration**: Quick setup with minimal configuration
- 🔒 **Built-in Validation**: Automatic validation of payment parameters
- 🎨 **Visual Integration**: Automatic payment icon injection for better UX
- 📅 **Subscription Support**: Handle one-time and recurring payments
- 🌐 **Cross-browser Compatible**: Works in all modern browsers
- ✉️ **Smart Email Detection**: Automatically detects and validates registered emails

## Setup Guide

### Option 1: CDN (Recommended)

Add Simple directly to your HTML using our CDN:

```html
<script src="https://cdn.jsdelivr.net/npm/@paysimple/simple-dev"></script>
```

### Option 2: NPM

If you're using a build system, you can install via npm:

```sh npm2yarn
npm install @paysimple/simple-dev
```

Then import it in your application:

```javascript
import "@paysimple/simple-dev";
```

## Usage

### 1. Email Input Setup

By default, Simple automatically detects and enhances `type="email"` input fields on your page. However, if you experience any of these scenarios:

- Simple detects unintended email fields
- You have multiple email fields but only want Simple on specific ones
- You want more control over which inputs trigger the Simple payment flow

You can disable the automatic detection and explicitly specify which inputs to enhance using the `simple-email` class:

```html
<!-- Automatic detection (Default behavior) -->
<input type="email" placeholder="Enter email" />

<!-- Manual control: Use simple-email class -->
<input class="simple-email" placeholder="Enter email" />
```

Using the `simple-email` class will:

1. Disable automatic detection of email inputs on your page
2. Only enhance inputs that explicitly have the `simple-email` class
3. Give you full control over which inputs trigger the Simple payment flow

Choose this approach if you need more precise control over Simple's behavior on your page.

### 2. Configure Simple

```typescript
window.applySimpleConfig({
  platformId: "your_platform_id",
  organizationTaxId: "your_organization_tax_id",
  amount: 100, // Amount in dollars (e.g., 10.99)
  schedule: { ... }, // Optional subscription config
  onSuccess: (response) => {
    console.log("Payment successful!", response);
  },
});
```

### Dynamic Updates

You can update any configuration field dynamically by calling `applySimpleConfig` with the new values:

```typescript
// Example: Update amount based on user selection
const amountInput = document.querySelector("#amount");
amountInput.addEventListener("change", (e) =>
  window.applySimpleConfig({ amount: e.target.value }),
);
```

### Configuration Options

| Option            | Type     | Required | Description                             |
| ----------------- | -------- | -------- | --------------------------------------- |
| platformId        | string   | Yes      | Your Simple platform ID                 |
| organizationTaxId | string   | Yes      | Your organization tax ID                |
| amount            | number   | Yes      | Payment amount in dollars (e.g., 10.99) |
| email             | string   | No       | Pre-fill customer email                 |
| schedule          | object   | No       | Payment schedule                        |
| onSuccess         | function | No       | Callback for successful payments        |

> [!Note]
> The `organizationTaxId` can be any valid tax ID. The SDK will automatically verify if the organization is registered with Simple and only display the payment icon for registered organizations.

### Subscription Configuration

For recurring payments, add a schedule object.

```typescript {7-8,10-11}
window.applySimpleConfig({
  // ... basic config
  schedule: {
    intervalType: "month", // "day" | "week" | "month" | "year"
    intervalCount: 1,
    startDate?: "2024-01-01", // Optional: When to start the subscription
    // Optional: Set total number of payments
    totalPayments?: 12,
    // --OR--
    // Optional: Set an end date
    endDate?: "2024-12-31",
  },
});
```

### Schedule Options

| Option        | Type   | Required | Description                                        |
| ------------- | ------ | -------- | -------------------------------------------------- |
| intervalType  | string | Yes      | Payment frequency ("day", "week", "month", "year") |
| intervalCount | number | Yes      | Number of intervals between payments               |
| totalPayments | number | No\*     | Total number of payments to process                |
| startDate     | string | No       | Start date for recurring payments (YYYY-MM-DD)     |
| endDate       | string | No\*     | End date for recurring payments (YYYY-MM-DD)       |

> [!Note]
> You may specify either `endDate` OR `totalPayments`, but not both.

## Validation & Simple Icon

The Simple icon appears on your page when:

- All required configuration fields are valid
- The organization is registered with Simple

The icon will automatically:

- Hide if any validation errors occur
- Reappear once all errors are resolved

## Response Schema

The `onSuccess` callback receives a response object with the following structure:

```typescript
interface PaymentResponse {
  id: string; // Transaction ID
  amount: number; // Amount in cents
  platformId: string; // Platform identifier
  organizationTaxId: string; // Organization tax ID
  name: string; // Customer name
  gatewayTransactionId: string; // Payment gateway transaction ID
  createdAt: string; // Transaction timestamp

  // Optional subscription details
  schedule?: {
    IntervalType: "day" | "week" | "month" | "year";
    TotalPayments?: number;
    IntervalCount: number;
    StartDate?: string;
    EndDate?: string;
  };

  // Customer address information
  address?: {
    name: string;
    street: string;
    streetLine2?: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };

  gatewayResponse: Record<string, any>; // Raw gateway response
}
```

## Debugging

To view debug logs:

1. Open your browser's developer tools (F12)
2. Go to Console settings
3. Enable "Verbose" log level
4. Look for logs prefixed with "Simple"

## Support

For support, please contact support@paysimple.io or visit our [documentation](http://app.paysimple.io/api/docs).
