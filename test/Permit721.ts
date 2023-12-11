import hre from 'hardhat';
import { ethers } from 'hardhat';
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers';
import { expect } from 'chai';
import { ISignatureTransfer as ISignatureTransferNs } from '../typechain-ethers6/contracts/Permit721'

import { ptfAdapter, tddAdapter, toDeadline } from '../utils'
import { PermitTransferFrom, SignatureTransfer } from '@arianee/permit721-sdk'

const CHAIN_ID = hre.network.config.chainId!;

describe('Permit721', async () => {
  async function deployContracts() {
    const [deployer, user, serviceProvider] = await ethers.getSigners();

    const Permit721Factory = await ethers.getContractFactory('Permit721');
    const permit721 = await Permit721Factory.deploy()
    await permit721.waitForDeployment();

    const MockERC721Factory = await ethers.getContractFactory('MockERC721');
    const erc721 = await MockERC721Factory.deploy();
    await erc721.waitForDeployment();

    return { deployer, user, serviceProvider, permit721, erc721 };
  }

  it('should be able to transfer the token with a valid signature', async () => {
    const { user, serviceProvider, permit721, erc721 } = await loadFixture(deployContracts);
    const permit721Address = await permit721.getAddress();
    const erc721Address = await erc721.getAddress();

    // Mint a token
    await erc721.mint(user.address, 1);

    // Approve the permit contract to transfer the token
    await erc721.connect(user).approve(permit721Address, 1);

    const nonce = Math.floor(Math.random() * 1000000);

    // Construct a `PermitTransferFrom`
    const permitTransferFrom: PermitTransferFrom = {
      permitted: {
        token: erc721Address,
        tokenId: 1,
      },
      spender: serviceProvider.address,
      nonce,
      deadline: toDeadline(/* 30 days= */ 1000 * 60 * 60 * 24 * 30)
    }

    // Sign the `PermitTransferFrom`
    const { domain, types, values } = SignatureTransfer.getPermitData(permitTransferFrom, permit721Address, CHAIN_ID);
    const signature = await user.signTypedData(tddAdapter(domain), types, values);

    // Construct a `SignatureTransferDetails`
    const signatureTransferDetails: ISignatureTransferNs.SignatureTransferDetailsStruct = {
      to: serviceProvider.address,
      requestedTokenId: 1,
    }

    // Transfer the token using the signature
    const permitTransferFromTx = permit721.connect(serviceProvider)['permitTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes)'](
      ptfAdapter(permitTransferFrom),
      signatureTransferDetails,
      user.address,
      signature
    );

    await expect(permitTransferFromTx).to.emit(erc721, 'Transfer').withArgs(user.address, serviceProvider.address, 1);
    expect(await erc721.ownerOf(1)).to.equal(serviceProvider.address);
  });

  it('should not be able to transfer the token with an invalid signature (aka non-owner signature)', async () => {
    const { user, serviceProvider, permit721, erc721 } = await loadFixture(deployContracts);
    const permit721Address = await permit721.getAddress();
    const erc721Address = await erc721.getAddress();

    // Mint a token
    await erc721.mint(user.address, 1);

    // Approve the permit contract to transfer the token
    await erc721.connect(user).approve(permit721Address, 1);

    // Construct a `PermitTransferFrom`
    const permitTransferFrom: PermitTransferFrom = {
      permitted: {
        token: erc721Address,
        tokenId: 1,
      },
      spender: serviceProvider.address,
      nonce: Math.floor(Math.random() * 1000000),
      deadline: toDeadline(/* 30 days= */ 1000 * 60 * 60 * 24 * 30)
    }

    // Sign the `PermitTransferFrom` with an unauthorized signer
    const { domain, types, values } = SignatureTransfer.getPermitData(permitTransferFrom, permit721Address, CHAIN_ID);
    const signature = await serviceProvider.signTypedData(tddAdapter(domain), types, values);

    // Construct a `SignatureTransferDetails`
    const signatureTransferDetails: ISignatureTransferNs.SignatureTransferDetailsStruct = {
      to: serviceProvider.address,
      requestedTokenId: 1,
    }

    // Transfer the token using the signature
    const permitTransferFromTx = permit721.connect(serviceProvider)['permitTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes)'](
      ptfAdapter(permitTransferFrom),
      signatureTransferDetails,
      user.address,
      signature
    );

    await expect(permitTransferFromTx).to.be.revertedWithCustomError(permit721, 'InvalidSigner')
    expect(await erc721.ownerOf(1)).to.equal(user.address);
  });

  it('should not be able to transfer the token with an expired permit', async () => {
    const { user, serviceProvider, permit721, erc721 } = await loadFixture(deployContracts);
    const permit721Address = await permit721.getAddress();
    const erc721Address = await erc721.getAddress();

    // Mint a token
    await erc721.mint(user.address, 1);

    // Approve the permit contract to transfer the token
    await erc721.connect(user).approve(permit721Address, 1);

    // Construct a `PermitTransferFrom`
    const permitTransferFrom: PermitTransferFrom = {
      permitted: {
        token: erc721Address,
        tokenId: 1,
      },
      spender: serviceProvider.address,
      nonce: Math.floor(Math.random() * 1000000),
      deadline: toDeadline(0) // Expired deadline
    }

    // Sign the `PermitTransferFrom`
    const { domain, types, values } = SignatureTransfer.getPermitData(permitTransferFrom, permit721Address, CHAIN_ID);
    const signature = await user.signTypedData(tddAdapter(domain), types, values);

    // Construct a `SignatureTransferDetails`
    const signatureTransferDetails: ISignatureTransferNs.SignatureTransferDetailsStruct = {
      to: serviceProvider.address,
      requestedTokenId: 1,
    }

    // Transfer the token using the signature
    const permitTransferFromTx = permit721.connect(serviceProvider)['permitTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes)'](
      ptfAdapter(permitTransferFrom),
      signatureTransferDetails,
      user.address,
      signature
    );

    await expect(permitTransferFromTx).to.be.revertedWithCustomError(permit721, 'SignatureExpired')
    expect(await erc721.ownerOf(1)).to.equal(user.address);
  });

  it('should not be able to transfer the token with an invalid permit nonce', async () => {
    const { user, serviceProvider, permit721, erc721 } = await loadFixture(deployContracts);
    const permit721Address = await permit721.getAddress();
    const erc721Address = await erc721.getAddress();

    // Mint a token
    await erc721.mint(user.address, 1);

    // Approve the permit contract to transfer the token
    await erc721.connect(user).approve(permit721Address, 1);

    const nonce = Math.floor(Math.random() * 1000000);

    // Construct a `PermitTransferFrom`
    const permitTransferFrom: PermitTransferFrom = {
      permitted: {
        token: erc721Address,
        tokenId: 1,
      },
      spender: serviceProvider.address,
      nonce,
      deadline: toDeadline(/* 30 days= */ 1000 * 60 * 60 * 24 * 30)
    }

    // Sign the `PermitTransferFrom`
    const permitData = SignatureTransfer.getPermitData(permitTransferFrom, permit721Address, CHAIN_ID);
    const signature = await user.signTypedData(tddAdapter(permitData.domain), permitData.types, permitData.values);

    // Construct a `SignatureTransferDetails`
    const signatureTransferDetails: ISignatureTransferNs.SignatureTransferDetailsStruct = {
      to: serviceProvider.address,
      requestedTokenId: 1,
    }

    // Transfer the token using the signature
    const permitTransferFromTx = permit721.connect(serviceProvider)['permitTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes)'](
      ptfAdapter(permitTransferFrom),
      signatureTransferDetails,
      user.address,
      signature
    );

    await expect(permitTransferFromTx).to.emit(erc721, 'Transfer').withArgs(user.address, serviceProvider.address, 1);
    expect(await erc721.ownerOf(1)).to.equal(serviceProvider.address);

    // Transfer back the token to the user
    await erc721.connect(serviceProvider).transferFrom(serviceProvider.address, user.address, 1);

    // Re-approve the permit contract to transfer the token
    await erc721.connect(user).approve(permit721Address, 1);

    // Transfer the token using the signature
    const permitTransferFromTx2 = permit721.connect(serviceProvider)['permitTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes)'](
      ptfAdapter(permitTransferFrom),
      signatureTransferDetails,
      user.address,
      signature
    );

    await expect(permitTransferFromTx2).to.be.revertedWithCustomError(permit721, 'InvalidNonce')
    expect(await erc721.ownerOf(1)).to.equal(user.address);
  });

  it('should not be able to transfer the token without being the permit spender', async () => {
    const { user, serviceProvider, permit721, erc721 } = await loadFixture(deployContracts);
    const permit721Address = await permit721.getAddress();
    const erc721Address = await erc721.getAddress();

    // Mint a token
    await erc721.mint(user.address, 1);

    // Approve the permit contract to transfer the token
    await erc721.connect(user).approve(permit721Address, 1);

    const spender = ethers.Wallet.createRandom(); // A random address as spender

    // Construct a `PermitTransferFrom`
    const permitTransferFrom: PermitTransferFrom = {
      permitted: {
        token: erc721Address,
        tokenId: 1,
      },
      spender: spender.address,
      nonce: Math.floor(Math.random() * 1000000),
      deadline: toDeadline(/* 30 days= */ 1000 * 60 * 60 * 24 * 30)
    }

    // Sign the `PermitTransferFrom`
    const { domain, types, values } = SignatureTransfer.getPermitData(permitTransferFrom, permit721Address, CHAIN_ID);
    const signature = await user.signTypedData(tddAdapter(domain), types, values);

    // Construct a `SignatureTransferDetails`
    const signatureTransferDetails: ISignatureTransferNs.SignatureTransferDetailsStruct = {
      to: spender.address,
      requestedTokenId: 1,
    }

    // Transfer the token using the signature
    const permitTransferFromTx = permit721.connect(serviceProvider)['permitTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes)'](
      ptfAdapter(permitTransferFrom),
      signatureTransferDetails,
      user.address,
      signature
    );

    await expect(permitTransferFromTx).to.be.revertedWithCustomError(permit721, 'InvalidSigner')
    expect(await erc721.ownerOf(1)).to.equal(user.address);
  });
});
