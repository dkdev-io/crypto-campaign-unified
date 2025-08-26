/**
 * Contribution Monitor Service
 * Monitors contribution patterns, detects anomalies, and sends alerts
 */

const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

class ContributionMonitor {
    constructor() {
        this.supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY
        );
        
        // Alert thresholds
        this.thresholds = {
            rejectionRate: 0.3,           // Alert if >30% rejections
            highRiskScore: 75,            // Alert for risk scores >75
            rapidContributions: 10,        // Alert if >10 contributions in 1 hour
            largeAmount: 2500,            // Alert for contributions >$2500
            failedRetries: 3,             // Alert after 3 failed retries
            stuckTransactions: 5          // Alert if >5 stuck transactions
        };

        // Alert cooldowns to prevent spam
        this.alertCooldowns = new Map();
        this.cooldownPeriod = 3600000; // 1 hour

        // Metrics cache
        this.metricsCache = new Map();
        this.metricsCacheTTL = 300000; // 5 minutes

        // Initialize email transporter if configured
        if (process.env.SMTP_HOST) {
            this.emailTransporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        }
    }

    /**
     * Start monitoring
     */
    async start() {
        console.log('📊 Contribution monitor started');

        // Run monitoring checks every 5 minutes
        this.monitorInterval = setInterval(() => {
            this.runMonitoringChecks();
        }, 300000); // 5 minutes

        // Run immediate check
        await this.runMonitoringChecks();

        // Set up real-time subscriptions
        this.setupRealtimeMonitoring();
    }

    /**
     * Stop monitoring
     */
    stop() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }
        console.log('📊 Contribution monitor stopped');
    }

    /**
     * Run all monitoring checks
     */
    async runMonitoringChecks() {
        try {
            console.log('Running monitoring checks...');

            // Run all checks in parallel
            const checks = await Promise.allSettled([
                this.checkRejectionRate(),
                this.checkHighRiskContributions(),
                this.checkRapidContributions(),
                this.checkLargeAmounts(),
                this.checkFailedRetries(),
                this.checkStuckTransactions(),
                this.checkSystemHealth(),
                this.checkComplianceViolations()
            ]);

            // Log any check failures
            checks.forEach((result, index) => {
                if (result.status === 'rejected') {
                    console.error(`Check ${index} failed:`, result.reason);
                }
            });

            // Generate summary report
            await this.generateMonitoringReport();
        } catch (error) {
            console.error('Error running monitoring checks:', error);
        }
    }

    /**
     * Check rejection rate
     */
    async checkRejectionRate() {
        try {
            const oneHourAgo = new Date();
            oneHourAgo.setHours(oneHourAgo.getHours() - 1);

            // Get recent contributions and rejections
            const [contributions, rejections] = await Promise.all([
                this.supabase
                    .from('contributions')
                    .select('id', { count: 'exact' })
                    .gte('created_at', oneHourAgo.toISOString()),
                this.supabase
                    .from('rejected_contributions')
                    .select('id', { count: 'exact' })
                    .gte('attempted_at', oneHourAgo.toISOString())
            ]);

            const totalAttempts = (contributions.count || 0) + (rejections.count || 0);
            const rejectionRate = totalAttempts > 0 ? (rejections.count || 0) / totalAttempts : 0;

            if (rejectionRate > this.thresholds.rejectionRate && totalAttempts > 10) {
                await this.sendAlert('HIGH_REJECTION_RATE', {
                    rate: (rejectionRate * 100).toFixed(2),
                    rejected: rejections.count,
                    successful: contributions.count,
                    threshold: (this.thresholds.rejectionRate * 100)
                });
            }

            // Cache metrics
            this.updateMetrics('rejectionRate', {
                rate: rejectionRate,
                rejected: rejections.count,
                successful: contributions.count,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error checking rejection rate:', error);
        }
    }

    /**
     * Check for high-risk contributions
     */
    async checkHighRiskContributions() {
        try {
            const { data: highRiskRejections } = await this.supabase
                .from('rejected_contributions')
                .select('*')
                .gte('risk_score', this.thresholds.highRiskScore)
                .gte('created_at', new Date(Date.now() - 3600000).toISOString())
                .order('risk_score', { ascending: false })
                .limit(10);

            if (highRiskRejections && highRiskRejections.length > 0) {
                await this.sendAlert('HIGH_RISK_CONTRIBUTIONS', {
                    count: highRiskRejections.length,
                    contributions: highRiskRejections.map(r => ({
                        id: r.id,
                        wallet: r.wallet_address,
                        amount: r.amount_usd,
                        riskScore: r.risk_score,
                        riskFactors: r.risk_factors,
                        reason: r.rejection_reason
                    }))
                });
            }
        } catch (error) {
            console.error('Error checking high-risk contributions:', error);
        }
    }

    /**
     * Check for rapid contributions from same wallet
     */
    async checkRapidContributions() {
        try {
            const oneHourAgo = new Date();
            oneHourAgo.setHours(oneHourAgo.getHours() - 1);

            // Query for wallets with multiple contributions
            const { data: rapidContributors } = await this.supabase
                .rpc('get_rapid_contributors', {
                    time_window: oneHourAgo.toISOString(),
                    min_count: this.thresholds.rapidContributions
                });

            if (rapidContributors && rapidContributors.length > 0) {
                for (const contributor of rapidContributors) {
                    await this.sendAlert('RAPID_CONTRIBUTIONS', {
                        wallet: contributor.wallet_address,
                        count: contributor.contribution_count,
                        totalAmount: contributor.total_amount,
                        timeWindow: '1 hour'
                    });
                }
            }
        } catch (error) {
            console.error('Error checking rapid contributions:', error);
        }
    }

    /**
     * Check for large contribution amounts
     */
    async checkLargeAmounts() {
        try {
            const { data: largeContributions } = await this.supabase
                .from('contributions')
                .select('*')
                .gte('amount_usd', this.thresholds.largeAmount)
                .gte('created_at', new Date(Date.now() - 3600000).toISOString())
                .order('amount_usd', { ascending: false });

            if (largeContributions && largeContributions.length > 0) {
                await this.sendAlert('LARGE_CONTRIBUTIONS', {
                    count: largeContributions.length,
                    contributions: largeContributions.map(c => ({
                        id: c.id,
                        wallet: c.wallet_address,
                        amount: c.amount_usd,
                        campaign: c.campaign_name,
                        timestamp: c.created_at
                    }))
                });
            }
        } catch (error) {
            console.error('Error checking large amounts:', error);
        }
    }

    /**
     * Check for failed retries
     */
    async checkFailedRetries() {
        try {
            const { data: failedRetries } = await this.supabase
                .from('rejected_contributions')
                .select('*')
                .gte('retry_count', this.thresholds.failedRetries)
                .eq('retry_allowed', true);

            if (failedRetries && failedRetries.length > 0) {
                await this.sendAlert('FAILED_RETRIES', {
                    count: failedRetries.length,
                    contributions: failedRetries.map(r => ({
                        id: r.id,
                        wallet: r.wallet_address,
                        amount: r.amount_usd,
                        retryCount: r.retry_count,
                        reason: r.rejection_reason,
                        lastAttempt: r.last_retry_at
                    }))
                });
            }
        } catch (error) {
            console.error('Error checking failed retries:', error);
        }
    }

    /**
     * Check for stuck transactions
     */
    async checkStuckTransactions() {
        try {
            const tenMinutesAgo = new Date();
            tenMinutesAgo.setMinutes(tenMinutesAgo.getMinutes() - 10);

            const { data: pendingTransactions } = await this.supabase
                .from('contributions')
                .select('*')
                .eq('status', 'pending')
                .lt('created_at', tenMinutesAgo.toISOString());

            if (pendingTransactions && pendingTransactions.length >= this.thresholds.stuckTransactions) {
                await this.sendAlert('STUCK_TRANSACTIONS', {
                    count: pendingTransactions.length,
                    transactions: pendingTransactions.map(t => ({
                        id: t.id,
                        hash: t.transaction_hash,
                        amount: t.amount_usd,
                        createdAt: t.created_at
                    }))
                });
            }
        } catch (error) {
            console.error('Error checking stuck transactions:', error);
        }
    }

    /**
     * Check system health
     */
    async checkSystemHealth() {
        try {
            // Check database connectivity
            const dbHealthy = await this.checkDatabaseHealth();
            
            // Check blockchain connectivity
            const blockchainHealthy = await this.checkBlockchainHealth();
            
            // Check API responsiveness
            const apiHealthy = await this.checkAPIHealth();

            if (!dbHealthy || !blockchainHealthy || !apiHealthy) {
                await this.sendAlert('SYSTEM_HEALTH', {
                    database: dbHealthy ? 'healthy' : 'unhealthy',
                    blockchain: blockchainHealthy ? 'healthy' : 'unhealthy',
                    api: apiHealthy ? 'healthy' : 'unhealthy',
                    timestamp: new Date().toISOString()
                }, 'critical');
            }
        } catch (error) {
            console.error('Error checking system health:', error);
            await this.sendAlert('SYSTEM_HEALTH_CHECK_FAILED', {
                error: error.message
            }, 'critical');
        }
    }

    /**
     * Check for compliance violations
     */
    async checkComplianceViolations() {
        try {
            // Check for contributions exceeding FEC limits
            const { data: violations } = await this.supabase
                .rpc('check_fec_violations', {
                    limit_amount: 3300
                });

            if (violations && violations.length > 0) {
                await this.sendAlert('COMPLIANCE_VIOLATION', {
                    type: 'FEC_LIMIT_EXCEEDED',
                    violations: violations.map(v => ({
                        wallet: v.wallet_address,
                        campaign: v.campaign_id,
                        totalAmount: v.total_amount,
                        limit: 3300
                    }))
                }, 'critical');
            }
        } catch (error) {
            console.error('Error checking compliance violations:', error);
        }
    }

    /**
     * Set up real-time monitoring subscriptions
     */
    setupRealtimeMonitoring() {
        // Monitor high-risk rejections in real-time
        this.supabase
            .channel('high-risk-rejections')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'rejected_contributions',
                filter: `risk_score=gte.${this.thresholds.highRiskScore}`
            }, (payload) => {
                this.handleRealtimeHighRisk(payload.new);
            })
            .subscribe();

        // Monitor large contributions in real-time
        this.supabase
            .channel('large-contributions')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'contributions',
                filter: `amount_usd=gte.${this.thresholds.largeAmount}`
            }, (payload) => {
                this.handleRealtimeLargeContribution(payload.new);
            })
            .subscribe();
    }

    /**
     * Handle real-time high-risk rejection
     * @param {Object} rejection - Rejection data
     */
    async handleRealtimeHighRisk(rejection) {
        console.log(`🚨 Real-time high-risk rejection detected: ${rejection.id}`);
        
        await this.sendAlert('REALTIME_HIGH_RISK', {
            id: rejection.id,
            wallet: rejection.wallet_address,
            amount: rejection.amount_usd,
            riskScore: rejection.risk_score,
            riskFactors: rejection.risk_factors,
            reason: rejection.rejection_reason
        }, 'immediate');
    }

    /**
     * Handle real-time large contribution
     * @param {Object} contribution - Contribution data
     */
    async handleRealtimeLargeContribution(contribution) {
        console.log(`💰 Real-time large contribution detected: ${contribution.id}`);
        
        await this.sendAlert('REALTIME_LARGE_CONTRIBUTION', {
            id: contribution.id,
            wallet: contribution.wallet_address,
            amount: contribution.amount_usd,
            campaign: contribution.campaign_name,
            transactionHash: contribution.transaction_hash
        }, 'immediate');
    }

    /**
     * Send alert
     * @param {string} type - Alert type
     * @param {Object} data - Alert data
     * @param {string} priority - Alert priority
     */
    async sendAlert(type, data, priority = 'normal') {
        // Check cooldown
        const cooldownKey = `${type}_${JSON.stringify(data.wallet || data.id || '')}`;
        if (this.isInCooldown(cooldownKey) && priority !== 'critical' && priority !== 'immediate') {
            return;
        }

        console.log(`📢 Alert: ${type}`, data);

        // Record alert
        try {
            await this.supabase
                .from('monitoring_alerts')
                .insert({
                    type,
                    priority,
                    data,
                    created_at: new Date().toISOString()
                });
        } catch (error) {
            console.error('Error recording alert:', error);
        }

        // Send notifications based on priority
        switch (priority) {
            case 'critical':
            case 'immediate':
                await this.sendImmediateNotifications(type, data);
                break;
            case 'high':
                await this.sendHighPriorityNotifications(type, data);
                break;
            default:
                await this.sendNormalNotifications(type, data);
        }

        // Set cooldown
        this.setCooldown(cooldownKey);
    }

    /**
     * Send immediate notifications
     * @param {string} type - Alert type
     * @param {Object} data - Alert data
     */
    async sendImmediateNotifications(type, data) {
        // Send email if configured
        if (this.emailTransporter) {
            await this.sendEmailAlert(type, data, 'CRITICAL');
        }

        // Send to webhook if configured
        if (process.env.ALERT_WEBHOOK_URL) {
            await this.sendWebhookAlert(type, data, 'critical');
        }

        // Log to console with emphasis
        console.error(`🚨🚨🚨 CRITICAL ALERT: ${type}`, data);
    }

    /**
     * Send high priority notifications
     * @param {string} type - Alert type
     * @param {Object} data - Alert data
     */
    async sendHighPriorityNotifications(type, data) {
        // Send email if configured
        if (this.emailTransporter) {
            await this.sendEmailAlert(type, data, 'HIGH');
        }

        // Log to console
        console.warn(`⚠️ HIGH PRIORITY ALERT: ${type}`, data);
    }

    /**
     * Send normal notifications
     * @param {string} type - Alert type
     * @param {Object} data - Alert data
     */
    async sendNormalNotifications(type, data) {
        // Log to console
        console.log(`ℹ️ Alert: ${type}`, data);
    }

    /**
     * Send email alert
     * @param {string} type - Alert type
     * @param {Object} data - Alert data
     * @param {string} priority - Priority level
     */
    async sendEmailAlert(type, data, priority) {
        try {
            const subject = `[${priority}] Contribution Monitor Alert: ${type}`;
            const html = this.formatEmailContent(type, data, priority);

            await this.emailTransporter.sendMail({
                from: process.env.SMTP_FROM || 'alerts@campaign.com',
                to: process.env.ALERT_EMAIL_TO,
                subject,
                html
            });
        } catch (error) {
            console.error('Error sending email alert:', error);
        }
    }

    /**
     * Send webhook alert
     * @param {string} type - Alert type
     * @param {Object} data - Alert data
     * @param {string} priority - Priority level
     */
    async sendWebhookAlert(type, data, priority) {
        try {
            const response = await fetch(process.env.ALERT_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type,
                    priority,
                    data,
                    timestamp: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error(`Webhook responded with ${response.status}`);
            }
        } catch (error) {
            console.error('Error sending webhook alert:', error);
        }
    }

    /**
     * Format email content
     * @param {string} type - Alert type
     * @param {Object} data - Alert data
     * @param {string} priority - Priority level
     * @returns {string} HTML content
     */
    formatEmailContent(type, data, priority) {
        return `
            <h2>Contribution Monitor Alert</h2>
            <p><strong>Type:</strong> ${type}</p>
            <p><strong>Priority:</strong> ${priority}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <h3>Details:</h3>
            <pre>${JSON.stringify(data, null, 2)}</pre>
        `;
    }

    /**
     * Check if alert is in cooldown
     * @param {string} key - Cooldown key
     * @returns {boolean} Is in cooldown
     */
    isInCooldown(key) {
        const lastAlert = this.alertCooldowns.get(key);
        if (!lastAlert) return false;
        return Date.now() - lastAlert < this.cooldownPeriod;
    }

    /**
     * Set alert cooldown
     * @param {string} key - Cooldown key
     */
    setCooldown(key) {
        this.alertCooldowns.set(key, Date.now());
    }

    /**
     * Update metrics cache
     * @param {string} key - Metric key
     * @param {Object} value - Metric value
     */
    updateMetrics(key, value) {
        this.metricsCache.set(key, {
            value,
            timestamp: Date.now()
        });
    }

    /**
     * Get cached metrics
     * @param {string} key - Metric key
     * @returns {Object} Metric value
     */
    getMetrics(key) {
        const cached = this.metricsCache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.metricsCacheTTL) {
            this.metricsCache.delete(key);
            return null;
        }
        
        return cached.value;
    }

    /**
     * Generate monitoring report
     */
    async generateMonitoringReport() {
        try {
            const report = {
                timestamp: new Date().toISOString(),
                metrics: {},
                alerts: [],
                health: {}
            };

            // Collect all metrics
            for (const [key, value] of this.metricsCache.entries()) {
                if (Date.now() - value.timestamp < this.metricsCacheTTL) {
                    report.metrics[key] = value.value;
                }
            }

            // Get recent alerts
            const { data: recentAlerts } = await this.supabase
                .from('monitoring_alerts')
                .select('*')
                .gte('created_at', new Date(Date.now() - 3600000).toISOString())
                .order('created_at', { ascending: false })
                .limit(20);

            report.alerts = recentAlerts || [];

            // Add health status
            report.health = {
                database: await this.checkDatabaseHealth(),
                blockchain: await this.checkBlockchainHealth(),
                api: await this.checkAPIHealth()
            };

            // Store report
            await this.supabase
                .from('monitoring_reports')
                .insert({
                    report,
                    created_at: new Date().toISOString()
                });

            console.log('📊 Monitoring report generated');
        } catch (error) {
            console.error('Error generating monitoring report:', error);
        }
    }

    /**
     * Check database health
     * @returns {boolean} Is healthy
     */
    async checkDatabaseHealth() {
        try {
            const { error } = await this.supabase
                .from('contributions')
                .select('id')
                .limit(1);
            return !error;
        } catch {
            return false;
        }
    }

    /**
     * Check blockchain health
     * @returns {boolean} Is healthy
     */
    async checkBlockchainHealth() {
        // Implement blockchain health check
        return true;
    }

    /**
     * Check API health
     * @returns {boolean} Is healthy
     */
    async checkAPIHealth() {
        // Implement API health check
        return true;
    }

    /**
     * Get monitoring dashboard data
     * @returns {Object} Dashboard data
     */
    async getDashboardData() {
        const [
            totalContributions,
            totalRejections,
            recentAlerts,
            systemHealth
        ] = await Promise.all([
            this.getTotalContributions(),
            this.getTotalRejections(),
            this.getRecentAlerts(),
            this.getSystemHealth()
        ]);

        return {
            summary: {
                totalContributions,
                totalRejections,
                successRate: totalContributions / (totalContributions + totalRejections),
                timestamp: new Date().toISOString()
            },
            alerts: recentAlerts,
            health: systemHealth,
            metrics: Object.fromEntries(this.metricsCache)
        };
    }

    /**
     * Get total contributions count
     * @returns {number} Total count
     */
    async getTotalContributions() {
        const { count } = await this.supabase
            .from('contributions')
            .select('id', { count: 'exact' });
        return count || 0;
    }

    /**
     * Get total rejections count
     * @returns {number} Total count
     */
    async getTotalRejections() {
        const { count } = await this.supabase
            .from('rejected_contributions')
            .select('id', { count: 'exact' });
        return count || 0;
    }

    /**
     * Get recent alerts
     * @returns {Array} Recent alerts
     */
    async getRecentAlerts() {
        const { data } = await this.supabase
            .from('monitoring_alerts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);
        return data || [];
    }

    /**
     * Get system health status
     * @returns {Object} Health status
     */
    async getSystemHealth() {
        return {
            database: await this.checkDatabaseHealth(),
            blockchain: await this.checkBlockchainHealth(),
            api: await this.checkAPIHealth(),
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = ContributionMonitor;