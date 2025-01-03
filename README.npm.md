# Simple SDK

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

```typescript
import "@paysimple/simple-dev";
```

### Using Types

For the CDN, the TypeScript types can be installed via:

```sh npm2yarn
npm install @paysimple/simple-dev-types
```

If you are using the npm package, the TypeScript types are included automatically.

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
amountInput.addEventListener("input", (e) =>
  window.applySimpleConfig({ amount: e.target.value }),
);
```

Calling `applySimpleConfig()` without arguments will clear all configurations and remove all Simple icons from the page.

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

> [!Note]
> For monthly installments:
>
> - The `amount` represents the monthly payment (not the total amount)
> - Set `intervalType: "month"` and `intervalCount: 1`
> - Set `totalPayments` to specify the number of installments
>
> Example: For a $1200 purchase paid over 12 months, use `amount: 100` and `totalPayments: 12`

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

The `onSuccess` callback receives a JWT (JSON Web Token) that contains an encoded payload with the following structure when decoded:

```typescript
interface PaymentResponse {
  id: string; // Transaction ID
  amount: number; // Amount in cents
  platformId: string; // Platform identifier
  organizationTaxId: string; // Organization tax ID
  name?: string; // Customer name
  phoneNumber: string; // Customer phone number
  email: string; // Customenr email
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

  iat: number; // (jwt issued at)
  exp: number; // (jwt expiration)
}
```

> [!Important]
> For secure payment processing, always verify:
>
> - JWT signature using [Simple's public key](https://docs.paysimple.io/jwt.key.pub)
> - platformId matches your platform ID
> - Confirm the transaction ID is not duplicate to prevent duplicate transactions.

> [!Note]
> The JWT expiration (exp) is set to 10 minutes.

### Verifying the JWT

To ensure the authenticity of the payment response, you should verify the JWT using Simple's public key:

1. Download the public key from [docs.paysimple.io/jwt.key.pub](https://docs.paysimple.io/jwt.key.pub)
2. Use a JWT library to verify the token. Here's an example using Node.js:

```javascript
import fs from "fs";
import jwt from "jsonwebtoken";

const publicKey = fs.readFileSync("jwt.key.pub");

function verifyPaymentResponse(token) {
  try {
    return jwt.verify(token, publicKey, { algorithms: ["RS256"] });
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}
```

## Debugging

To view debug logs:

1. Open your browser's developer tools (F12)
2. Go to Console settings
3. Enable "Verbose" log level
4. Look for logs prefixed with "Simple"

## Live Example

See example [here](https://github.com/pay-simple/simple/blob/master/example/index.html).

## Support

For support, please contact luzy@paysimple.io.
