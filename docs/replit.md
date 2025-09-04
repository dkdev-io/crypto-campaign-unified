# Campaign Crypto Contributions Platform

## Overview

This is a blockchain-based political campaign contribution platform that enables U.S. federal political campaigns to accept FEC-compliant cryptocurrency donations. The system combines smart contract functionality with comprehensive compliance features including KYC verification, contribution limits enforcement, and real-time reporting capabilities.

The platform consists of a Web3 frontend for contributors, an administrative dashboard for campaign managers, and a backend API that handles compliance checks and external integrations. All contributions must pass strict validation including per-transaction limits ($3,300), cumulative wallet limits, KYC verification, and contributor information requirements before being processed on-chain.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The platform uses a dual-frontend approach with vanilla JavaScript and Web3.js integration:

- **Contributor Interface**: Built with Bootstrap 5 and vanilla JS, handles wallet connections via MetaMask/WalletConnect, form validation for required contributor information (name, address, employer, occupation), and real-time ETH price updates
- **Admin Dashboard**: Comprehensive management interface with Chart.js visualizations, real-time contribution monitoring, compliance reporting, and data export capabilities
- **Web3 Integration**: Direct smart contract interaction using Web3.js library for contribution processing and wallet management

### Backend Architecture

Express.js server providing REST API endpoints with the following components:

- **Compliance Engine**: Validates contribution limits, performs KYC checks, and integrates with external CRM systems to track multi-channel donations
- **Mock KYC Provider**: Simulates third-party identity verification services with risk assessment capabilities
- **Data Management**: In-memory storage for development (designed for database integration in production)
- **Campaign Statistics**: Real-time tracking of total funds raised, contributor counts, and transaction history

### Smart Contract Design

Ethereum-based smart contract using OpenZeppelin standards:

- **Contribution Limits**: Enforces $3,300 per-transaction and cumulative per-wallet limits at the contract level
- **KYC Gating**: Only allows contributions from wallets with verified KYC status (NFT/badge or external verification flag)
- **Event Logging**: Comprehensive on-chain audit trail with wallet addresses, amounts, timestamps, and KYC references
- **Hard Rejection**: Automatic rejection of non-compliant contributions to ensure regulatory compliance

### Security and Compliance Framework

Multi-layered compliance system addressing FEC requirements:

- **Pre-Transaction Validation**: Off-chain checks against CRM data and KYC status before blockchain interaction
- **Contributor Verification**: Required completion of personal information fields and legal affirmations
- **Multi-Source Tracking**: Integration with external systems to track total contributions across all payment methods (crypto, credit cards, checks)
- **Audit Trail**: Complete transaction history with export capabilities for regulatory reporting

## External Dependencies

### Blockchain Infrastructure

- **Web3.js**: Ethereum blockchain interaction and wallet management
- **OpenZeppelin Contracts**: Secure smart contract standards and utilities
- **MetaMask/WalletConnect**: Wallet connection and transaction signing

### Development Framework

- **Express.js**: Backend API server and middleware
- **Bootstrap 5**: Frontend UI framework and responsive design
- **Chart.js**: Data visualization for admin dashboard analytics
- **Font Awesome**: Icon library for user interface elements

### Compliance and Integration Services

- **KYC Provider APIs**: Third-party identity verification services (currently mocked)
- **CRM Integration**: External customer relationship management systems for multi-channel contribution tracking
- **Price Feeds**: Real-time cryptocurrency price data for USD conversion
- **FEC Reporting**: Export capabilities for federal election commission compliance reporting

The architecture supports future integration with production KYC providers, database systems, and additional blockchain networks while maintaining strict regulatory compliance throughout the contribution process.
