# Simple SDK

A lightweight JavaScript SDK that adds Simple payment functionality to your web applications. The SDK automatically detects email input fields and adds a payment button next to them.

## Usage

Get started with Simple SDK in just 3 steps:

```html
<!-- 1. Include the Simple script -->
<script src="https://cdn.jsdelivr.net/npm/@paysimple/simple"></script>

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

2. The SDK will automatically:
   - Detect all email input fields on your page
   - Add a Simple payment button next to each email field
   - Handle payment flows through a popup window

## 📚 Want to unlock Simple's full potential?

> **[Explore our comprehensive documentation →](https://docs.paysimple.io)**
>
> Discover advanced features, best practices, and integration examples to make the most of Simple SDK!

## Development

### Prerequisites

- [Bun](https://bun.sh) v1.1.27 or later

### Setup

1. Install dependencies:

```bash
bun i
```

2. Available scripts:

- Developing the SDK:

```bash
bun run dev
```

This serves the example page and watches for changes in the SDK with hot reloading.

- Build the SDK (with watch mode):

```bash
bun run build
```

- Start the development server:

```bash
bun serve
```

- Run tests:

```bash
bun test
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
3. Run tests (`bun test`)
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the GPL V3 License - see the [LICENSE](LICENCE) file for details.
