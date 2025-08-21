/**
 * Campaign Contributions Frontend Application
 * Handles wallet connection, form validation, KYC verification, and smart contract interaction
 */

class CampaignContributionsApp {
    constructor() {
        this.web3 = null;
        this.contract = null;
        this.userAccount = null;
        this.ethPrice = 3000; // Default ETH price in USD
        
        // Contract configuration (update with actual deployed contract details)
        this.contractAddress = '0x...'; // Replace with actual contract address
        this.contractABI = [
            // Add the actual contract ABI here when deployed
            // This is a simplified version for demonstration
            {
                "inputs": [],
                "name": "contribute",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [{"name": "_contributor", "type": "address"}],
                "name": "getContributorInfo",
                "outputs": [
                    {"name": "cumulativeAmount", "type": "uint256"},
                    {"name": "remainingCapacity", "type": "uint256"},
                    {"name": "isKYCVerified", "type": "bool"},
                    {"name": "hasContributedBefore", "type": "bool"}
                ],
                "stateMutability": "view",
                "type": "function"
            }
        ];
        
        this.init();
    }

    async init() {
        this.bindEventListeners();
        await this.checkWalletConnection();
        this.updateEthPrice();
        this.loadCampaignStats();
        
        // Update ETH price every 30 seconds
        setInterval(() => this.updateEthPrice(), 30000);
    }

    bindEventListeners() {
        // Wallet connection
        document.getElementById('connectWallet').addEventListener('click', () => this.connectWallet());
        
        // Form submission
        document.getElementById('contributionForm').addEventListener('submit', (e) => this.handleContribution(e));
        
        // KYC verification
        document.getElementById('kycVerifyBtn').addEventListener('click', () => this.initiateKYC());
        
        // Amount input changes
        document.getElementById('contributionAmount').addEventListener('input', (e) => this.updateAmountInfo(e));
        
        // Form validation
        const form = document.getElementById('contributionForm');
        const inputs = form.querySelectorAll('input[required], select[required]');
        inputs.forEach(input => {
            input.addEventListener('input', () => this.validateForm());
            input.addEventListener('change', () => this.validateForm());
        });
    }

    async checkWalletConnection() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                this.web3 = new Web3(window.ethereum);
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                
                if (accounts.length > 0) {
                    await this.onWalletConnected(accounts[0]);
                } else {
                    this.showWalletStatus();
                }
            } catch (error) {
                console.error('Error checking wallet connection:', error);
                this.showError('Failed to check wallet connection');
            }
        } else {
            this.showError('MetaMask is not installed. Please install MetaMask to continue.');
        }
    }

    async connectWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.web3 = new Web3(window.ethereum);
                await this.onWalletConnected(accounts[0]);
            } catch (error) {
                console.error('Error connecting wallet:', error);
                this.showError('Failed to connect wallet. Please try again.');
            }
        } else {
            this.showError('MetaMask is not installed. Please install MetaMask to continue.');
        }
    }

    async onWalletConnected(account) {
        this.userAccount = account;
        
        // Update UI
        document.getElementById('connectWallet').innerHTML = 
            `<i class="fas fa-check-circle me-2"></i>Connected`;
        document.getElementById('connectWallet').classList.replace('btn-outline-light', 'btn-success');
        
        // Show wallet info
        document.getElementById('walletAddress').textContent = 
            `${account.substring(0, 8)}...${account.substring(account.length - 6)}`;
        document.getElementById('walletInfo').style.display = 'block';
        
        // Hide wallet status warning and show form
        document.getElementById('walletStatus').style.display = 'none';
        document.getElementById('contributionForm').style.display = 'block';
        
        // Load wallet balance and capacity
        await this.loadWalletInfo();
        await this.checkKYCStatus();
        
        // Initialize contract
        if (this.contractAddress !== '0x...') {
            this.contract = new this.web3.eth.Contract(this.contractABI, this.contractAddress);
        }
        
        this.validateForm();
    }

    showWalletStatus() {
        document.getElementById('walletStatus').style.display = 'block';
        document.getElementById('contributionForm').style.display = 'none';
        document.getElementById('walletInfo').style.display = 'none';
    }

    async loadWalletInfo() {
        try {
            // Get wallet balance
            const balanceWei = await this.web3.eth.getBalance(this.userAccount);
            const balanceEth = this.web3.utils.fromWei(balanceWei, 'ether');
            document.getElementById('walletBalance').textContent = `${parseFloat(balanceEth).toFixed(4)} ETH`;
            
            // Get contribution capacity from backend
            const response = await fetch(`/api/contributor-capacity/${this.userAccount}`);
            if (response.ok) {
                const data = await response.json();
                const remainingUSD = data.remainingCapacity;
                document.getElementById('walletCapacity').textContent = `$${remainingUSD}`;
                document.getElementById('remainingCapacity').textContent = `$${remainingUSD}`;
                
                // Update progress bar
                const usedCapacity = 3300 - remainingUSD;
                const progressPercentage = (usedCapacity / 3300) * 100;
                document.getElementById('capacityProgress').style.width = `${progressPercentage}%`;
                document.getElementById('capacityProgress').textContent = `${progressPercentage.toFixed(1)}%`;
                
                // Update max contribution amount
                const maxEth = Math.min(1.1, remainingUSD / this.ethPrice);
                document.getElementById('contributionAmount').max = maxEth.toFixed(3);
                document.getElementById('maxAmount').textContent = `${maxEth.toFixed(3)} ETH`;
            }
        } catch (error) {
            console.error('Error loading wallet info:', error);
        }
    }

    async checkKYCStatus() {
        try {
            const response = await fetch(`/api/kyc-status/${this.userAccount}`);
            if (response.ok) {
                const data = await response.json();
                this.updateKYCStatus(data.verified, data.message);
            } else {
                this.updateKYCStatus(false, 'KYC verification required');
            }
        } catch (error) {
            console.error('Error checking KYC status:', error);
            this.updateKYCStatus(false, 'Unable to verify KYC status');
        }
    }

    updateKYCStatus(verified, message) {
        const kycStatus = document.getElementById('kycStatus');
        const kycMessage = document.getElementById('kycMessage');
        const kycButton = document.getElementById('kycVerifyBtn');
        
        if (verified) {
            kycStatus.className = 'alert alert-success';
            kycStatus.innerHTML = `
                <i class="fas fa-check-circle me-2"></i>
                <strong>KYC Verified:</strong> 
                <span id="kycMessage">${message}</span>
            `;
            kycButton.style.display = 'none';
        } else {
            kycStatus.className = 'alert alert-warning';
            kycMessage.textContent = message;
            kycButton.style.display = 'inline-block';
        }
        
        this.validateForm();
    }

    async initiateKYC() {
        try {
            // In a real implementation, this would redirect to KYC provider
            this.showInfo('Redirecting to KYC verification...');
            
            // Simulate KYC verification
            const response = await fetch('/api/initiate-kyc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    walletAddress: this.userAccount,
                    contributorData: this.getFormData()
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                window.open(data.verificationUrl, '_blank');
                
                // Poll for KYC completion
                setTimeout(() => this.checkKYCStatus(), 5000);
            }
        } catch (error) {
            console.error('Error initiating KYC:', error);
            this.showError('Failed to initiate KYC verification');
        }
    }

    updateAmountInfo(event) {
        const amount = parseFloat(event.target.value) || 0;
        const usdAmount = amount * this.ethPrice;
        document.getElementById('usdAmount').textContent = usdAmount.toFixed(2);
        
        this.validateForm();
    }

    async updateEthPrice() {
        try {
            // In a real implementation, fetch from price API
            // For demo, use mock price fluctuation
            this.ethPrice = 3000 + (Math.random() - 0.5) * 200;
            
            // Update USD amount if contribution amount is entered
            const contributionAmount = document.getElementById('contributionAmount').value;
            if (contributionAmount) {
                const usdAmount = parseFloat(contributionAmount) * this.ethPrice;
                document.getElementById('usdAmount').textContent = usdAmount.toFixed(2);
            }
        } catch (error) {
            console.error('Error updating ETH price:', error);
        }
    }

    async loadCampaignStats() {
        try {
            const response = await fetch('/api/campaign-stats');
            if (response.ok) {
                const data = await response.json();
                document.getElementById('totalRaised').textContent = `$${data.totalRaised.toLocaleString()}`;
                document.getElementById('contributorCount').textContent = data.contributorCount;
                document.getElementById('avgContribution').textContent = `$${data.avgContribution}`;
            }
        } catch (error) {
            console.error('Error loading campaign stats:', error);
        }
    }

    validateForm() {
        const form = document.getElementById('contributionForm');
        const submitBtn = document.getElementById('submitBtn');
        
        // Check all required fields
        const requiredFields = form.querySelectorAll('input[required], select[required]');
        let allValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                allValid = false;
            }
        });
        
        // Check checkboxes
        const checkboxes = form.querySelectorAll('input[type="checkbox"][required]');
        checkboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                allValid = false;
            }
        });
        
        // Check KYC status
        const kycVerified = document.getElementById('kycStatus').classList.contains('alert-success');
        if (!kycVerified) {
            allValid = false;
        }
        
        // Check contribution amount
        const amount = parseFloat(document.getElementById('contributionAmount').value) || 0;
        if (amount <= 0 || amount > 1.1) {
            allValid = false;
        }
        
        // Check wallet connection
        if (!this.userAccount) {
            allValid = false;
        }
        
        submitBtn.disabled = !allValid;
        
        if (allValid) {
            submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Submit Contribution';
        } else {
            submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>Complete All Requirements';
        }
    }

    getFormData() {
        return {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            address: document.getElementById('address').value,
            zipCode: document.getElementById('zipCode').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            employer: document.getElementById('employer').value,
            occupation: document.getElementById('occupation').value,
            contributionAmount: document.getElementById('contributionAmount').value,
            walletAddress: this.userAccount
        };
    }

    async handleContribution(event) {
        event.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';
            
            const formData = this.getFormData();
            const contributionAmountWei = this.web3.utils.toWei(formData.contributionAmount, 'ether');
            
            // Step 1: Validate contribution with backend
            const validationResponse = await fetch('/api/validate-contribution', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    contributionAmountWei
                })
            });
            
            if (!validationResponse.ok) {
                const errorData = await validationResponse.json();
                throw new Error(errorData.message || 'Contribution validation failed');
            }
            
            // Step 2: Send transaction to smart contract
            if (this.contract) {
                const gasEstimate = await this.contract.methods.contribute().estimateGas({
                    from: this.userAccount,
                    value: contributionAmountWei
                });
                
                const tx = await this.contract.methods.contribute().send({
                    from: this.userAccount,
                    value: contributionAmountWei,
                    gas: Math.floor(gasEstimate * 1.2) // Add 20% buffer
                });
                
                // Step 3: Record contribution in backend
                await fetch('/api/record-contribution', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        transactionHash: tx.transactionHash,
                        contributionAmountWei
                    })
                });
                
                this.showSuccess(`Contribution successful! Transaction: ${tx.transactionHash}`);
                
                // Reset form and reload data
                document.getElementById('contributionForm').reset();
                await this.loadWalletInfo();
                await this.loadCampaignStats();
                
            } else {
                throw new Error('Smart contract not initialized');
            }
            
        } catch (error) {
            console.error('Contribution error:', error);
            this.showError(`Contribution failed: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            this.validateForm();
        }
    }

    showSuccess(message) {
        document.getElementById('successMessage').textContent = message;
        const toast = new bootstrap.Toast(document.getElementById('successToast'));
        toast.show();
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        const toast = new bootstrap.Toast(document.getElementById('errorToast'));
        toast.show();
    }

    showInfo(message) {
        // Create info toast or use existing error toast with different styling
        document.getElementById('errorMessage').textContent = message;
        document.querySelector('#errorToast .toast-header').className = 'toast-header bg-info text-white';
        document.querySelector('#errorToast .toast-header strong').textContent = 'Information';
        const toast = new bootstrap.Toast(document.getElementById('errorToast'));
        toast.show();
        
        // Reset styling after toast is hidden
        setTimeout(() => {
            document.querySelector('#errorToast .toast-header').className = 'toast-header bg-danger text-white';
            document.querySelector('#errorToast .toast-header strong').textContent = 'Error';
        }, 4000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CampaignContributionsApp();
});

// Handle account changes
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            location.reload(); // Reload page if wallet disconnected
        } else {
            location.reload(); // Reload page if account changed
        }
    });
    
    window.ethereum.on('chainChanged', () => {
        location.reload(); // Reload page if network changed
    });
}
