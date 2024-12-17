# Simple SDK

A lightweight JavaScript SDK that adds Simple payment functionality to your web applications. The SDK automatically detects email input fields and adds a payment button next to them.

## Usage

1. Initialize the SDK with your `Platform ID` and `Organization Tax ID`:

```ts
setupSimpleAccount("your-platform-id", "your-organization-tax-id");
```

2. The SDK will automatically:
   - Detect all email input fields on your page
   - Add a Simple payment button next to each email field
   - Handle payment flows through a popup window

## Development

### Prerequisites

- [Bun](https://bun.sh) v1.1.27 or later

### Setup

1. Install dependencies:

```bash
bun i
```

2. Available scripts:

- Build the SDK (with watch mode):

```bash
bun run build
```

- Start the development server:

```bash
bun serve
```

## Configuration

The SDK accepts the following configuration parameters:

| Parameter         | Type   | Description                     |
| ----------------- | ------ | ------------------------------- |
| platformId        | string | Your Simple platform ID         |
| organizationTaxId | string | Your Simple organization tax ID |

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[To be determined]
