import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';

/**
 * Web3 Service for blockchain interactions
 */
class Web3Service {
  constructor() {
    this.provider = null;
    this.initialized = false;
  }

  /**
   * Initialize Web3 service with provider
   */
  async initialize() {
    try {
      // Use environment variable for RPC URL or default to mainnet
      const rpcUrl = process.env.WEB3_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Test connection
      await this.provider.getBlockNumber();
      this.initialized = true;

      logger.info('Web3Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Web3Service:', error);
      throw error;
    }
  }

  /**
   * Validate Ethereum address format
   */
  isValidAddress(address) {
    try {
      return ethers.isAddress(address);
    } catch {
      return false;
    }
  }

  /**
   * Validate transaction hash format
   */
  isValidTransactionHash(hash) {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  }

  /**
   * Get transaction details
   */
  async getTransaction(hash) {
    if (!this.initialized) {
      throw new Error('Web3Service not initialized');
    }

    if (!this.isValidTransactionHash(hash)) {
      throw new Error('Invalid transaction hash format');
    }

    try {
      const transaction = await this.provider.getTransaction(hash);
      return transaction;
    } catch (error) {
      logger.error(`Failed to get transaction ${hash}:`, error);
      throw error;
    }
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(hash) {
    if (!this.initialized) {
      throw new Error('Web3Service not initialized');
    }

    if (!this.isValidTransactionHash(hash)) {
      throw new Error('Invalid transaction hash format');
    }

    try {
      const receipt = await this.provider.getTransactionReceipt(hash);
      return receipt;
    } catch (error) {
      logger.error(`Failed to get transaction receipt ${hash}:`, error);
      throw error;
    }
  }

  /**
   * Verify transaction contains expected data
   */
  async verifyContribution(hash, expectedAddress, expectedAmount) {
    const transaction = await this.getTransaction(hash);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Verify sender address
    if (transaction.from.toLowerCase() !== expectedAddress.toLowerCase()) {
      throw new Error('Transaction sender does not match expected address');
    }

    // Verify amount (convert to string for comparison)
    const transactionAmount = ethers.formatEther(transaction.value);
    if (Math.abs(parseFloat(transactionAmount) - parseFloat(expectedAmount)) > 0.0001) {
      throw new Error('Transaction amount does not match expected amount');
    }

    return {
      valid: true,
      transaction,
      amount: transactionAmount,
    };
  }

  /**
   * Convert Wei to Ether
   */
  weiToEther(wei) {
    return ethers.formatEther(wei);
  }

  /**
   * Convert Ether to Wei
   */
  etherToWei(ether) {
    return ethers.parseEther(ether.toString());
  }
}

// Export singleton instance
const web3Service = new Web3Service();
export default web3Service;
