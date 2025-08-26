/**
 * Tests for Contribution Recorder Service
 * Tests various contribution recording scenarios including success and rejection cases
 */

const ContributionRecorderService = require('../../services/contributionRecorder');
const { ethers } = require('ethers');

describe('ContributionRecorderService', () => {
    let recorder;
    let mockSupabase;
    let mockWeb3Service;

    beforeEach(() => {
        // Mock Supabase client
        mockSupabase = {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis()
        };

        // Mock Web3 service
        mockWeb3Service = {
            checkKYCStatus: jest.fn()
        };

        recorder = new ContributionRecorderService();
        recorder.supabase = mockSupabase;
        recorder.web3Service = mockWeb3Service;
    });

    describe('Successful Contribution Recording', () => {
        it('should record a valid contribution successfully', async () => {
            const contributionData = {
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
                amountWei: '1000000000000000000', // 1 ETH
                amountUsd: 2000,
                campaignId: 'campaign-123',
                campaignName: 'Test Campaign',
                transactionHash: '0x' + '1'.repeat(64),
                blockNumber: 12345,
                network: 'ethereum'
            };

            // Mock successful KYC check
            mockWeb3Service.checkKYCStatus.mockResolvedValue(true);

            // Mock no blacklist
            mockSupabase.single.mockResolvedValueOnce({ data: null });

            // Mock KYC verified in database
            mockSupabase.single.mockResolvedValueOnce({
                data: { status: 'approved', id: 'kyc-123' }
            });

            // Mock campaign is active
            mockSupabase.single.mockResolvedValueOnce({
                data: { status: 'active', id: 'campaign-123' }
            });

            // Mock no duplicate transaction
            mockSupabase.single.mockResolvedValueOnce({ data: null });

            // Mock total contributions under limit
            mockSupabase.eq.mockReturnThis();
            mockSupabase.select.mockResolvedValueOnce({
                data: [{ amount_usd: '500' }]
            });

            // Mock successful insertion
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 'contribution-123', ...contributionData },
                error: null
            });

            const result = await recorder.recordContribution(contributionData);

            expect(result.success).toBe(true);
            expect(result.contributionId).toBe('contribution-123');
        });

        it('should handle contribution with full contributor details', async () => {
            const contributionData = {
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
                amountWei: '500000000000000000', // 0.5 ETH
                amountUsd: 1000,
                campaignId: 'campaign-123',
                campaignName: 'Test Campaign',
                contributorName: 'John Doe',
                contributorEmail: 'john@example.com',
                contributorPhone: '+1234567890',
                contributorAddress: '123 Main St',
                employer: 'Acme Corp',
                occupation: 'Engineer',
                isUsCitizen: true,
                transactionHash: '0x' + '2'.repeat(64),
                blockNumber: 12346,
                network: 'ethereum'
            };

            // Mock all validation checks pass
            mockWeb3Service.checkKYCStatus.mockResolvedValue(true);
            mockSupabase.single.mockResolvedValue({ data: null });

            // Mock successful insertion
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 'contribution-124', ...contributionData },
                error: null
            });

            const result = await recorder.recordContribution(contributionData);

            expect(result.success).toBe(true);
        });
    });

    describe('Rejected Contributions - KYC Issues', () => {
        it('should reject contribution when KYC not verified', async () => {
            const contributionData = {
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
                amountWei: '1000000000000000000',
                amountUsd: 2000,
                campaignId: 'campaign-123',
                campaignName: 'Test Campaign'
            };

            // Mock KYC not verified
            mockWeb3Service.checkKYCStatus.mockResolvedValue(false);
            mockSupabase.single.mockResolvedValueOnce({ data: null }); // No blacklist
            mockSupabase.single.mockResolvedValueOnce({ data: null }); // No KYC record

            // Mock rejection insertion
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 'rejection-123' },
                error: null
            });

            const result = await recorder.recordContribution(contributionData);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('KYC_NOT_VERIFIED');
        });
    });

    describe('Rejected Contributions - Amount Limits', () => {
        it('should reject contribution exceeding FEC limit', async () => {
            const contributionData = {
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
                amountWei: '2000000000000000000',
                amountUsd: 4000, // Exceeds $3300 FEC limit
                campaignId: 'campaign-123',
                campaignName: 'Test Campaign'
            };

            // Mock validations pass except amount
            mockWeb3Service.checkKYCStatus.mockResolvedValue(true);
            mockSupabase.single.mockResolvedValue({ data: null });

            // Mock rejection insertion
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 'rejection-124' },
                error: null
            });

            const result = await recorder.recordContribution(contributionData);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('EXCEEDS_TRANSACTION_LIMIT');
        });

        it('should reject contribution below minimum amount', async () => {
            const contributionData = {
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
                amountWei: '100000000000000', // Very small amount
                amountUsd: 0.5, // Below $1 minimum
                campaignId: 'campaign-123',
                campaignName: 'Test Campaign'
            };

            // Mock validations
            mockWeb3Service.checkKYCStatus.mockResolvedValue(true);
            mockSupabase.single.mockResolvedValue({ data: null });

            // Mock rejection insertion
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 'rejection-125' },
                error: null
            });

            const result = await recorder.recordContribution(contributionData);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('INVALID_AMOUNT');
        });

        it('should reject when cumulative contributions exceed limit', async () => {
            const contributionData = {
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
                amountWei: '1000000000000000000',
                amountUsd: 2000,
                campaignId: 'campaign-123',
                campaignName: 'Test Campaign'
            };

            // Mock validations pass
            mockWeb3Service.checkKYCStatus.mockResolvedValue(true);
            mockSupabase.single.mockResolvedValue({ data: null });

            // Mock existing contributions total $2000
            mockSupabase.select.mockResolvedValueOnce({
                data: [
                    { amount_usd: '1000' },
                    { amount_usd: '1000' }
                ]
            });

            // Mock rejection insertion
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 'rejection-126' },
                error: null
            });

            const result = await recorder.recordContribution(contributionData);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('EXCEEDS_CONTRIBUTION_LIMIT');
        });
    });

    describe('Rejected Contributions - Security Issues', () => {
        it('should reject blacklisted wallet address', async () => {
            const contributionData = {
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
                amountWei: '1000000000000000000',
                amountUsd: 2000,
                campaignId: 'campaign-123'
            };

            // Mock wallet is blacklisted
            mockSupabase.single.mockResolvedValueOnce({
                data: { 
                    wallet_address: contributionData.walletAddress,
                    reason: 'Suspicious activity',
                    created_at: '2024-01-01'
                }
            });

            // Mock rejection insertion
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 'rejection-127' },
                error: null
            });

            const result = await recorder.recordContribution(contributionData);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('BLACKLISTED_ADDRESS');
        });

        it('should reject invalid wallet address format', async () => {
            const contributionData = {
                walletAddress: 'invalid-address',
                amountWei: '1000000000000000000',
                amountUsd: 2000,
                campaignId: 'campaign-123'
            };

            // Mock rejection insertion
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 'rejection-128' },
                error: null
            });

            const result = await recorder.recordContribution(contributionData);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('INVALID_WALLET_ADDRESS');
        });

        it('should reject high-risk contributions', async () => {
            const contributionData = {
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
                amountWei: '1650000000000000000',
                amountUsd: 3300, // Exactly at FEC limit (suspicious)
                campaignId: 'campaign-123',
                ipAddress: '192.168.1.1'
            };

            // Mock validations
            mockWeb3Service.checkKYCStatus.mockResolvedValue(true);
            mockSupabase.single.mockResolvedValue({ data: null });

            // Mock wallet age check (new wallet)
            mockSupabase.single.mockResolvedValueOnce({ data: null });

            // Mock recent contributions (many rapid contributions)
            mockSupabase.select.mockResolvedValueOnce({
                data: Array(15).fill({ id: 'contrib' })
            });

            // Mock rejection insertion
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 'rejection-129' },
                error: null
            });

            const result = await recorder.recordContribution(contributionData);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('SUSPICIOUS_ACTIVITY');
        });
    });

    describe('Rejected Contributions - Campaign Issues', () => {
        it('should reject when campaign is inactive', async () => {
            const contributionData = {
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
                amountWei: '1000000000000000000',
                amountUsd: 2000,
                campaignId: 'campaign-123'
            };

            // Mock validations pass
            mockWeb3Service.checkKYCStatus.mockResolvedValue(true);
            mockSupabase.single.mockResolvedValueOnce({ data: null }); // No blacklist
            mockSupabase.single.mockResolvedValueOnce({ data: { status: 'approved' } }); // KYC OK

            // Mock campaign is paused
            mockSupabase.single.mockResolvedValueOnce({
                data: { status: 'paused', id: 'campaign-123' }
            });

            // Mock rejection insertion
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 'rejection-130' },
                error: null
            });

            const result = await recorder.recordContribution(contributionData);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('CAMPAIGN_INACTIVE');
        });

        it('should reject when campaign has ended', async () => {
            const contributionData = {
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
                amountWei: '1000000000000000000',
                amountUsd: 2000,
                campaignId: 'campaign-123'
            };

            // Mock validations pass
            mockWeb3Service.checkKYCStatus.mockResolvedValue(true);
            mockSupabase.single.mockResolvedValueOnce({ data: null });
            mockSupabase.single.mockResolvedValueOnce({ data: { status: 'approved' } });

            // Mock campaign has ended
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            mockSupabase.single.mockResolvedValueOnce({
                data: { 
                    status: 'active',
                    id: 'campaign-123',
                    end_date: pastDate.toISOString()
                }
            });

            // Mock rejection insertion
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 'rejection-131' },
                error: null
            });

            const result = await recorder.recordContribution(contributionData);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('CAMPAIGN_ENDED');
        });

        it('should reject when campaign not found', async () => {
            const contributionData = {
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
                amountWei: '1000000000000000000',
                amountUsd: 2000,
                campaignId: 'non-existent-campaign'
            };

            // Mock validations pass
            mockWeb3Service.checkKYCStatus.mockResolvedValue(true);
            mockSupabase.single.mockResolvedValueOnce({ data: null });
            mockSupabase.single.mockResolvedValueOnce({ data: { status: 'approved' } });

            // Mock campaign not found
            mockSupabase.single.mockResolvedValueOnce({ data: null });

            // Mock rejection insertion
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 'rejection-132' },
                error: null
            });

            const result = await recorder.recordContribution(contributionData);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('CAMPAIGN_INACTIVE');
        });
    });

    describe('Rejected Contributions - Transaction Issues', () => {
        it('should reject duplicate transaction', async () => {
            const contributionData = {
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
                amountWei: '1000000000000000000',
                amountUsd: 2000,
                campaignId: 'campaign-123',
                transactionHash: '0x' + '3'.repeat(64)
            };

            // Mock validations pass
            mockWeb3Service.checkKYCStatus.mockResolvedValue(true);
            mockSupabase.single.mockResolvedValueOnce({ data: null });
            mockSupabase.single.mockResolvedValueOnce({ data: { status: 'approved' } });
            mockSupabase.single.mockResolvedValueOnce({ data: { status: 'active' } });

            // Mock duplicate transaction exists
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 'existing-contribution' }
            });

            // Mock rejection insertion
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 'rejection-133' },
                error: null
            });

            const result = await recorder.recordContribution(contributionData);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('DUPLICATE_TRANSACTION');
        });
    });

    describe('System Error Handling', () => {
        it('should handle database errors gracefully', async () => {
            const contributionData = {
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
                amountWei: '1000000000000000000',
                amountUsd: 2000,
                campaignId: 'campaign-123'
            };

            // Mock database error
            mockSupabase.single.mockRejectedValueOnce(new Error('Database connection failed'));

            // Mock rejection insertion
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 'rejection-134' },
                error: null
            });

            const result = await recorder.recordContribution(contributionData);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('SYSTEM_ERROR');
        });

        it('should handle unexpected errors', async () => {
            const contributionData = {
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
                amountWei: '1000000000000000000',
                amountUsd: 2000,
                campaignId: 'campaign-123'
            };

            // Mock unexpected error
            recorder.validateContribution = jest.fn().mockRejectedValue(
                new Error('Unexpected error')
            );

            // Mock rejection insertion
            mockSupabase.single.mockResolvedValueOnce({
                data: { id: 'rejection-135' },
                error: null
            });

            const result = await recorder.recordContribution(contributionData);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('SYSTEM_ERROR');
        });
    });

    describe('Retry Logic', () => {
        it('should allow retry for network errors', () => {
            const isAllowed = recorder.isRetryAllowed('NETWORK_ERROR');
            expect(isAllowed).toBe(true);
        });

        it('should allow retry for system errors', () => {
            const isAllowed = recorder.isRetryAllowed('SYSTEM_ERROR');
            expect(isAllowed).toBe(true);
        });

        it('should not allow retry for blacklisted addresses', () => {
            const isAllowed = recorder.isRetryAllowed('BLACKLISTED_ADDRESS');
            expect(isAllowed).toBe(false);
        });

        it('should not allow retry for duplicate transactions', () => {
            const isAllowed = recorder.isRetryAllowed('DUPLICATE_TRANSACTION');
            expect(isAllowed).toBe(false);
        });

        it('should not allow retry for compliance violations', () => {
            const isAllowed = recorder.isRetryAllowed('COMPLIANCE_VIOLATION');
            expect(isAllowed).toBe(false);
        });

        it('should not allow retry when campaign has ended', () => {
            const isAllowed = recorder.isRetryAllowed('CAMPAIGN_ENDED');
            expect(isAllowed).toBe(false);
        });
    });

    describe('Risk Assessment', () => {
        it('should assess risk for large amounts', async () => {
            const risk = await recorder.assessRisk({
                amountUsd: 2500,
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8'
            });

            expect(risk.score).toBeGreaterThan(0);
            expect(risk.factors).toContain('large_amount');
        });

        it('should assess risk for round amounts', async () => {
            const risk = await recorder.assessRisk({
                amountUsd: 1000,
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8'
            });

            expect(risk.factors).toContain('round_amount');
        });

        it('should assess risk for exact FEC limit', async () => {
            const risk = await recorder.assessRisk({
                amountUsd: 3300,
                walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8'
            });

            expect(risk.factors).toContain('round_amount');
        });
    });
});