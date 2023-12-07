# permit721

Permit721 introduces a low-overhead, next-generation token approval/meta-tx system to make token approvals easier, more secure, and more consistent across applications.

## Features

- **Signature Based Approvals**: Any ERC721 token, even those that do not support, can now use permit style approvals. This allows applications to have a single transaction flow by sending a permit signature along with the transaction data when using `Permit721` integrated contracts.
- **Batched Token Approvals**: Set permissions on different tokens to different spenders with one signature.
- **Signature Based Token Transfers**: Owners can sign messages to transfer tokens directly to signed spenders, bypassing setting any allowance. This means that approvals aren't necessary for applications to receive tokens and that there will never be hanging approvals when using this method. The signature is valid only for the duration of the transaction in which it is spent.
- **Batched Token Transfers**: Transfer different tokens to different recipients with one signature.
- **Safe Arbitrary Data Verification**: Verify any extra data by passing through a witness hash and witness type. The type string must follow the [EIP-712](https://eips.ethereum.org/EIPS/eip-712) standard.
- **Signature Verification for Contracts**: All signature verification supports [EIP-1271](https://eips.ethereum.org/EIPS/eip-1271) so contracts can approve tokens and transfer tokens through signatures.
- **Non-monotonic Replay Protection**: Signature based transfers use unordered, non-monotonic nonces so that signed permits do not need to be transacted in any particular order.
- **Expiring Approvals**: Approvals can be time-bound, removing security concerns around hanging approvals on a wallet’s entire token balance. This also means that revoking approvals do not necessarily have to be a new transaction since an approval that expires will no longer be valid.
- **Batch Revoke Allowances**: Remove allowances on any number of tokens and spenders in one transaction.

### Setup

```sh
git clone https://github.com/Arianee/permit721
cd permit721
npm install
```

### Lint

```sh
npm run lint
```

### Run Tests

```sh
npm run test
```

### Deploy

```sh
npx hardhat run scripts/deploy-permit721.ts
```

### Publish

```sh
npm run build
cd build
npm publish --access public
```

## Acknowledgments

Forked from Uniswap Labs's [permit2](https://github.com/Uniswap/permit2)