# Emma x402 Tools

A small API-first project designed to become a collection of paid, machine-readable utilities for AI agents using the x402 payment protocol.

## First utility

`GET /v1/uk-postcode?postcode=TQ5%209AA`

Returns normalized UK postcode formatting and a format-validity result as JSON.

The first endpoint is intentionally free while deployment is tested. Next we will add an x402 payment gate on Base Sepolia testnet, verify the complete HTTP 402 payment flow, and only then consider production.

## Run locally

```bash
npm install
npm start
```

## Security

Never commit a seed phrase, private key, API secret, or wallet credential to this repository. Production secrets belong in encrypted environment settings.
