import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAccount, useConnect, useDisconnect, useNetwork, useSwitchNetwork } from 'wagmi';
import CampaignABI from '../contracts/CampaignContributions.json';

const CONTRACT_ADDRESSES = {
  1: process.env.VITE_CONTRACT_ADDRESS_MAINNET,
  11155111: process.env.VITE_CONTRACT_ADDRESS_SEPOLIA, // Sepolia
  8453: process.env.VITE_CONTRACT_ADDRESS_BASE,
  84532: process.env.VITE_CONTRACT_ADDRESS_BASE_SEPOLIA,
  31337: process.env.VITE_CONTRACT_ADDRESS_LOCAL || '0x5FbDB2315678afecb367f032d93F642f64180aa3'
};

const SUPPORTED_NETWORKS = [1, 11155111, 8453, 84532, 31337];

export function useWeb3() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, error: connectError, isLoading: isConnecting, pendingConnector } = useConnect();
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { switchNetwork, isLoading: isSwitching } = useSwitchNetwork();

  const [contract, setContract] = useState(null);
  const [contractAddress, setContractAddress] = useState(null);
  const [isContractLoading, setIsContractLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize contract when wallet is connected and network is supported
  useEffect(() => {
    const initializeContract = async () => {
      if (!isConnected || !address || !chain) {
        setContract(null);
        setContractAddress(null);
        return;
      }

      const chainId = chain.id;
      const supportedContractAddress = CONTRACT_ADDRESSES[chainId];

      if (!supportedContractAddress) {
        setError(`Network ${chain.name} is not supported. Please switch to a supported network.`);
        setContract(null);
        setContractAddress(null);
        return;
      }

      try {
        setIsContractLoading(true);
        setError(null);

        // Get the provider from wagmi
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // Initialize contract
        const contractInstance = new ethers.Contract(
          supportedContractAddress,
          CampaignABI.abi,
          signer
        );

        setContract(contractInstance);
        setContractAddress(supportedContractAddress);
      } catch (err) {
        console.error('Failed to initialize contract:', err);
        setError('Failed to initialize smart contract connection.');
        setContract(null);
        setContractAddress(null);
      } finally {
        setIsContractLoading(false);
      }
    };

    initializeContract();
  }, [isConnected, address, chain]);

  // Connect wallet
  const connectWallet = useCallback(async (connectorId) => {
    try {
      setError(null);
      const connector = connectors.find(c => c.id === connectorId);
      if (connector) {
        connect({ connector });
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError('Failed to connect wallet. Please try again.');
    }
  }, [connect, connectors]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    disconnect();
    setContract(null);
    setContractAddress(null);
    setError(null);
  }, [disconnect]);

  // Switch to supported network
  const switchToSupportedNetwork = useCallback(async (chainId = 11155111) => {
    try {
      if (switchNetwork && SUPPORTED_NETWORKS.includes(chainId)) {
        await switchNetwork(chainId);
      }
    } catch (err) {
      console.error('Failed to switch network:', err);
      setError('Failed to switch network. Please try manually.');
    }
  }, [switchNetwork]);

  // Contract interaction functions
  const getCampaignStats = useCallback(async () => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      const [totalReceived, uniqueContributors, maxContribution, currentEthPrice] = 
        await contract.getCampaignStats();

      return {
        totalReceived: ethers.formatEther(totalReceived),
        uniqueContributors: Number(uniqueContributors),
        maxContribution: ethers.formatEther(maxContribution),
        currentEthPrice: ethers.formatUnits(currentEthPrice, 18),
        maxContributionUSD: 3300
      };
    } catch (error) {
      console.error('Failed to get campaign stats:', error);
      throw error;
    }
  }, [contract]);

  const getContributorInfo = useCallback(async (contributorAddress) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      const [cumulativeAmount, remainingCapacity, isKYCVerified, hasContributedBefore] = 
        await contract.getContributorInfo(contributorAddress);

      return {
        cumulativeAmount: ethers.formatEther(cumulativeAmount),
        remainingCapacity: ethers.formatEther(remainingCapacity),
        isKYCVerified,
        hasContributedBefore,
        address: contributorAddress
      };
    } catch (error) {
      console.error('Failed to get contributor info:', error);
      throw error;
    }
  }, [contract]);

  const canContribute = useCallback(async (contributorAddress, amountETH) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      const amountWei = ethers.parseEther(amountETH.toString());
      const [canContrib, reason] = await contract.canContribute(contributorAddress, amountWei);

      return {
        canContribute: canContrib,
        reason,
        amountETH: amountETH.toString(),
        amountWei: amountWei.toString()
      };
    } catch (error) {
      console.error('Failed to check contribution eligibility:', error);
      throw error;
    }
  }, [contract]);

  const contribute = useCallback(async (amountETH) => {
    if (!contract) throw new Error('Contract not initialized');
    if (!address) throw new Error('Wallet not connected');
    
    try {
      const amountWei = ethers.parseEther(amountETH.toString());
      
      // Check if contribution is allowed first
      const eligibility = await canContribute(address, amountETH);
      if (!eligibility.canContribute) {
        throw new Error(eligibility.reason);
      }

      // Send transaction
      const tx = await contract.contribute({
        value: amountWei,
        gasLimit: 300000 // Set a reasonable gas limit
      });

      return {
        hash: tx.hash,
        wait: () => tx.wait()
      };
    } catch (error) {
      console.error('Failed to send contribution:', error);
      throw error;
    }
  }, [contract, address, canContribute]);

  const getMaxContribution = useCallback(async () => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      const maxWei = await contract.getMaxContributionWei();
      return {
        wei: maxWei.toString(),
        eth: ethers.formatEther(maxWei),
        usd: 3300
      };
    } catch (error) {
      console.error('Failed to get max contribution:', error);
      throw error;
    }
  }, [contract]);

  const isKYCVerified = useCallback(async (contributorAddress) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      return await contract.kycVerified(contributorAddress);
    } catch (error) {
      console.error('Failed to check KYC status:', error);
      throw error;
    }
  }, [contract]);

  // Event listening
  const listenToEvents = useCallback((callback) => {
    if (!contract) return () => {};

    const onContributionAccepted = (contributor, amount, cumulativeAmount, timestamp, transactionHash, event) => {
      callback({
        type: 'ContributionAccepted',
        contributor,
        amount: ethers.formatEther(amount),
        cumulativeAmount: ethers.formatEther(cumulativeAmount),
        timestamp: new Date(Number(timestamp) * 1000),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    };

    const onContributionRejected = (contributor, amount, reason, timestamp, event) => {
      callback({
        type: 'ContributionRejected',
        contributor,
        amount: ethers.formatEther(amount),
        reason,
        timestamp: new Date(Number(timestamp) * 1000),
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber
      });
    };

    contract.on('ContributionAccepted', onContributionAccepted);
    contract.on('ContributionRejected', onContributionRejected);

    // Return cleanup function
    return () => {
      contract.off('ContributionAccepted', onContributionAccepted);
      contract.off('ContributionRejected', onContributionRejected);
    };
  }, [contract]);

  const isNetworkSupported = chain && SUPPORTED_NETWORKS.includes(chain.id);
  const isLoading = isConnecting || isContractLoading || isSwitching;
  const walletError = connectError || error;

  return {
    // Wallet state
    address,
    isConnected,
    chain,
    isNetworkSupported,
    isLoading,
    error: walletError,

    // Contract state
    contract,
    contractAddress,
    isContractLoading,

    // Wallet functions
    connectWallet,
    disconnectWallet,
    switchToSupportedNetwork,
    connectors,
    pendingConnector,

    // Contract functions
    getCampaignStats,
    getContributorInfo,
    canContribute,
    contribute,
    getMaxContribution,
    isKYCVerified,
    listenToEvents,

    // Utility
    supportedNetworks: SUPPORTED_NETWORKS,
    contractAddresses: CONTRACT_ADDRESSES
  };
}