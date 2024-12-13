# Simple SDK

The Simple SDK is a lightweight JavaScript library designed to simplify payment integration for web applications. It provides a seamless way to handle payment configurations and interactions through a simple API.

## Features

- 🚀 **Easy Integration**: Drop-in solution with CDN support
- ✨ **Simple Configuration**: Quick setup with minimal configuration
- 🔒 **Built-in Validation**: Automatic validation of payment parameters
- 🎨 **Visual Integration**: Automatic payment icon injection for better UX
- 📅 **Subscription Support**: Handle one-time and recurring payments
- 🌐 **Cross-browser Compatible**: Works in all modern browsers

## Quick Start

Add the Simple SDK to your HTML file:

```html
<script src="https://cdn.jsdelivr.net/npm/@paysimple/simple-dev"></script>
```

## Usage

### 1. Add Simple Input Class

Add the `simple-input` class to your input field:

```html
<input type="email" class="simple-input" placeholder="Enter email" />
```

### 2. Configure Simple

```javascript
window.applySimpleConfig({
  platformId: "your_platform_id",
  organizationId: "your_organization_id",
  amount: 100, // Amount in USD
  onSuccess: (data) => {
    console.log("Payment successful!", data);
  },
  onError: (error) => {
    console.error("Payment failed:", error);
  },
});
```

### Configuration Options

| Option         | Type     | Required | Description                      |
| -------------- | -------- | -------- | -------------------------------- |
| platformId     | string   | Yes      | Your Simple platform ID          |
| organizationId | string   | Yes      | Your organization ID             |
| amount         | number   | Yes      | Payment amount in cents          |
| email          | string   | No       | Pre-fill customer email          |
| onSuccess      | function | No       | Callback for successful payments |
| onError        | function | No       | Callback for failed payments     |

### Subscription Configuration

For recurring payments, add a schedule object:

```javascript
window.applySimpleConfig({
  // ... basic config
  schedule: {
    intervalType: "month", // "day" | "week" | "month" | "year"
    intervalCount: 1,
    startDate: "2024-01-01", // Optional
    endDate: "2024-12-31", // Optional
    totalPayments: 12, // Optional
  },
});
```

### Schedule Options

| Option        | Type   | Description                                        |
| ------------- | ------ | -------------------------------------------------- |
| intervalType  | string | Payment frequency ("day", "week", "month", "year") |
| intervalCount | number | Number of intervals between payments               |
| startDate     | string | Start date for recurring payments (YYYY-MM-DD)     |
| endDate       | string | End date for recurring payments (YYYY-MM-DD)       |
| totalPayments | number | Total number of payments to process                |

## Events

The SDK provides two main callback events:

```javascript
{
  onSuccess: (data) => {
    // Handle successful payment
    // data contains transaction details
  },
  onError: (error) => {
    // Handle payment errors
    // error contains error details
  },
}
```

## Security

The Simple SDK automatically validates all configurations and ensures secure communication with our payment servers. All transactions are processed over HTTPS.

## Support

For support, please contact support@simple.com or visit our [documentation](http://app.paysimple.io/api/docs).
