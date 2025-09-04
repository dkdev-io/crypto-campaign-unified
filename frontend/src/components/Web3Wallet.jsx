import React, { useState, useEffect } from 'react';
import web3Service from '../lib/web3';

const Web3Wallet = ({ onWalletChange, showBalance = true }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [network, setNetwork] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [contributorInfo, setContributorInfo] = useState(null);

  useEffect(() => {
    initializeWeb3();
    setupEventListeners();

    return () => {
      web3Service.removeEventListeners();
    };
  }, []);

  useEffect(() => {
    if (onWalletChange) {
      onWalletChange({
        isConnected,
        account,
        balance,
        network,
        contributorInfo,
      });
    }
  }, [isConnected, account, balance, network, contributorInfo]);

  const initializeWeb3 = async () => {
    try {
      const initialized = await web3Service.init();
      if (!initialized) {
        setError('MetaMask not found. Please install MetaMask to make crypto contributions.');
      }
    } catch (error) {
      setError('Failed to initialize Web3');
    }
  };

  const setupEventListeners = () => {
    web3Service.setupEventListeners(
      (newAccount) => {
        if (newAccount) {
          setAccount(newAccount);
          loadAccountData(newAccount);
        } else {
          handleDisconnect();
        }
      },
      (chainId) => {
        console.log('Network changed:', chainId);
        loadNetworkInfo();
      }
    );
  };

  const connectWallet = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await web3Service.connectWallet();

      if (result.success) {
        setIsConnected(true);
        setAccount(result.account);
        setNetwork(result.network);
        await loadAccountData(result.account);
      } else {
        setError(result.error || 'Failed to connect wallet');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = async () => {
    await web3Service.disconnectWallet();
    handleDisconnect();
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAccount('');
    setBalance('0');
    setNetwork(null);
    setContributorInfo(null);
    setError('');
  };

  const loadAccountData = async (accountAddress) => {
    try {
      // Load balance
      const accountBalance = await web3Service.getBalance();
      setBalance(accountBalance);

      // Load contributor info if contract is available
      try {
        const info = await web3Service.getContributorInfo(accountAddress);
        setContributorInfo(info);
      } catch (error) {
        console.log(
          'Contract not available yet - contributor info will load when contract is deployed'
        );
      }
    } catch (error) {
      console.error('Failed to load account data:', error);
    }
  };

  const loadNetworkInfo = async () => {
    try {
      const networkInfo = await web3Service.getNetworkInfo();
      setNetwork(networkInfo);
    } catch (error) {
      console.error('Failed to load network info:', error);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.001) return '< 0.001';
    return num.toFixed(4);
  };

  if (error && error.includes('MetaMask not found')) {
    return (
      <div
        style={{
          padding: '1rem',
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          margin: '1rem 0',
        }}
      >
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#856404' }}>🦊 MetaMask Required</h4>
        <p style={{ margin: '0 0 1rem 0', color: '#856404' }}>
          To make crypto contributions, you need MetaMask wallet installed.
        </p>
        <a
          href="https://metamask.io/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#007bff',
            textDecoration: 'none',
            fontWeight: 'bold',
          }}
        >
          📥 Install MetaMask →
        </a>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div style={{ margin: '1rem 0' }}>
        <button
          onClick={connectWallet}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '1rem',
            background: isLoading ? '#ccc' : '#f6851b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          {isLoading ? '⏳ Connecting...' : '🦊 Connect MetaMask Wallet'}
        </button>
        {error && (
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: '#f8d7da',
              color: '#721c24',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            ⚠️ {error}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        margin: '1rem 0',
        padding: '1rem',
        background: '#e7f3ff',
        borderRadius: '8px',
        border: '1px solid #b8daff',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.5rem',
        }}
      >
        <h4 style={{ margin: 0, color: '#004085' }}>🦊 Wallet Connected</h4>
        <button
          onClick={disconnectWallet}
          style={{
            padding: '0.25rem 0.5rem',
            background: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Disconnect
        </button>
      </div>

      <div style={{ fontSize: '14px', color: '#004085' }}>
        <div style={{ marginBottom: '0.25rem' }}>
          <strong>Address:</strong> {formatAddress(account)}
        </div>

        {showBalance && (
          <div style={{ marginBottom: '0.25rem' }}>
            <strong>Balance:</strong> {formatBalance(balance)} ETH
          </div>
        )}

        {network && (
          <div style={{ marginBottom: '0.25rem' }}>
            <strong>Network:</strong> {network.name} ({network.chainId})
          </div>
        )}

        {contributorInfo && (
          <div
            style={{
              marginTop: '0.5rem',
              padding: '0.5rem',
              background: '#d1ecf1',
              borderRadius: '4px',
            }}
          >
            <div>
              <strong>KYC Status:</strong>{' '}
              {contributorInfo.isKYCVerified ? '✅ Verified' : '❌ Not Verified'}
            </div>
            <div>
              <strong>Previous Contributions:</strong> {contributorInfo.cumulativeAmount} ETH
            </div>
            <div>
              <strong>Remaining Capacity:</strong> {contributorInfo.remainingCapacity} ETH
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Web3Wallet;
