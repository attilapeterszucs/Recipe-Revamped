// Security monitoring and alerting system
// Tracks security events, detects threats, and sends alerts

interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'authentication_failure' | 'app_check_failure' | 'rate_limit_exceeded' | 'suspicious_activity' | 'api_abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: {
    ip: string;
    userAgent?: string;
    userId?: string;
    endpoint: string;
  };
  details: Record<string, any>;
  metadata: {
    sessionId?: string;
    requestId?: string;
    environment: string;
  };
}

interface ThreatAnalysis {
  threatLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  recommendedActions: string[];
  autoBlock: boolean;
}

class SecurityMonitor {
  private eventBuffer: SecurityEvent[] = [];
  private ipFailureCounts = new Map<string, number>();
  private userFailureCounts = new Map<string, number>();
  private suspiciousIPs = new Set<string>();
  
  // Rate limiting thresholds
  private readonly RATE_LIMITS = {
    AUTH_FAILURES_PER_IP: 10,    // per 15 minutes
    AUTH_FAILURES_PER_USER: 5,   // per 15 minutes
    APP_CHECK_FAILURES: 20,      // per hour
    API_CALLS_PER_MINUTE: 100,   // per IP
    SUSPICIOUS_USER_AGENTS: [
      'postman', 'curl', 'wget', 'python-requests', 'bot', 'crawler', 'scraper'
    ]
  };

  // Log security event with threat analysis
  logSecurityEvent(event: Partial<SecurityEvent>): void {
    const securityEvent: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      type: event.type || 'suspicious_activity',
      severity: event.severity || 'medium',
      source: {
        ip: event.source?.ip || 'unknown',
        userAgent: event.source?.userAgent,
        userId: event.source?.userId,
        endpoint: event.source?.endpoint || 'unknown'
      },
      details: event.details || {},
      metadata: {
        sessionId: event.metadata?.sessionId,
        requestId: event.metadata?.requestId,
        environment: process.env.NODE_ENV || 'unknown'
      }
    };

    // Add to buffer
    this.eventBuffer.push(securityEvent);
    
    // Perform threat analysis
    const threatAnalysis = this.analyzeThreat(securityEvent);
    
    // Log event with analysis
    this.logEvent(securityEvent, threatAnalysis);
    
    // Send alerts if needed
    if (threatAnalysis.threatLevel === 'high' || threatAnalysis.threatLevel === 'critical') {
      this.sendAlert(securityEvent, threatAnalysis);
    }
    
    // Auto-block if recommended
    if (threatAnalysis.autoBlock) {
      this.addToSuspiciousIPs(securityEvent.source.ip);
    }
    
    // Clean old events (keep last 1000)
    if (this.eventBuffer.length > 1000) {
      this.eventBuffer = this.eventBuffer.slice(-1000);
    }
  }

  // Analyze threat level based on patterns
  private analyzeThreat(event: SecurityEvent): ThreatAnalysis {
    const reasons: string[] = [];
    let threatLevel: ThreatAnalysis['threatLevel'] = 'none';
    const recommendedActions: string[] = [];
    let autoBlock = false;

    // Check IP reputation
    if (this.suspiciousIPs.has(event.source.ip)) {
      reasons.push('IP already marked as suspicious');
      threatLevel = 'high';
      autoBlock = true;
    }

    // Check authentication failure patterns
    if (event.type === 'authentication_failure') {
      const ipFailures = this.ipFailureCounts.get(event.source.ip) || 0;
      const userFailures = event.source.userId ? this.userFailureCounts.get(event.source.userId) || 0 : 0;

      if (ipFailures > this.RATE_LIMITS.AUTH_FAILURES_PER_IP) {
        reasons.push(`Excessive auth failures from IP (${ipFailures})`);
        threatLevel = 'critical';
        autoBlock = true;
        recommendedActions.push('Block IP address');
      }

      if (userFailures > this.RATE_LIMITS.AUTH_FAILURES_PER_USER) {
        reasons.push(`Excessive auth failures for user (${userFailures})`);
        threatLevel = 'high';
        recommendedActions.push('Lock user account');
      }
    }

    // Check User-Agent patterns
    if (event.source.userAgent) {
      const userAgent = event.source.userAgent.toLowerCase();
      const isSuspiciousUA = this.RATE_LIMITS.SUSPICIOUS_USER_AGENTS.some(pattern => 
        userAgent.includes(pattern)
      );
      
      if (isSuspiciousUA) {
        reasons.push('Suspicious User-Agent detected');
        threatLevel = threatLevel === 'none' ? 'medium' : threatLevel;
        recommendedActions.push('Monitor requests from this client');
      }
    }

    // Check App Check failures
    if (event.type === 'app_check_failure') {
      const recentFailures = this.getRecentAppCheckFailures(event.source.ip);
      if (recentFailures > this.RATE_LIMITS.APP_CHECK_FAILURES) {
        reasons.push(`Excessive App Check failures (${recentFailures})`);
        threatLevel = 'high';
        recommendedActions.push('Investigate client authenticity');
      }
    }

    // Check for API abuse patterns
    if (event.type === 'api_abuse') {
      reasons.push('API abuse pattern detected');
      threatLevel = 'high';
      recommendedActions.push('Review API usage patterns');
    }

    return {
      threatLevel,
      reasons,
      recommendedActions,
      autoBlock
    };
  }

  // Send security alert
  private sendAlert(event: SecurityEvent, analysis: ThreatAnalysis): void {
    const alert = {
      title: `🚨 Security Alert: ${event.type}`,
      severity: analysis.threatLevel,
      timestamp: event.timestamp,
      source: event.source,
      analysis: {
        reasons: analysis.reasons,
        actions: analysis.recommendedActions
      },
      event: event
    };

    // Log high-priority alert
    console.error('SECURITY ALERT:', JSON.stringify(alert, null, 2));
    
    // In production, send to monitoring service
    // Examples:
    // - Send to Slack/Discord webhook
    // - Send to PagerDuty
    // - Send to email alert system
    // - Send to Firebase Analytics as custom event
    
    this.sendToSlackWebhook(alert);
  }

  // Send alert to Slack webhook (example)
  private async sendToSlackWebhook(alert: any): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL;
    if (!webhookUrl) return;

    try {
      const slackMessage = {
        text: `🚨 Security Alert: ${alert.title}`,
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: alert.title }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Severity:* ${alert.severity}` },
              { type: 'mrkdwn', text: `*IP:* ${alert.source.ip}` },
              { type: 'mrkdwn', text: `*Endpoint:* ${alert.source.endpoint}` },
              { type: 'mrkdwn', text: `*Time:* ${alert.timestamp}` }
            ]
          },
          {
            type: 'section',
            text: { 
              type: 'mrkdwn', 
              text: `*Reasons:*\n${alert.analysis.reasons.map((r: string) => `• ${r}`).join('\n')}` 
            }
          },
          {
            type: 'section',
            text: { 
              type: 'mrkdwn', 
              text: `*Recommended Actions:*\n${alert.analysis.actions.map((a: string) => `• ${a}`).join('\n')}` 
            }
          }
        ]
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage)
      });

    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  // Utility methods
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logEvent(event: SecurityEvent, analysis: ThreatAnalysis): void {
    const logLevel = this.getLogLevel(analysis.threatLevel);
    const logMessage = `Security Event: ${event.type} from ${event.source.ip}`;
    
    const logData = {
      event: event.type,
      severity: event.severity,
      threatLevel: analysis.threatLevel,
      ip: event.source.ip,
      endpoint: event.source.endpoint,
      reasons: analysis.reasons,
      timestamp: event.timestamp
    };

    switch (logLevel) {
      case 'error':
        console.error(logMessage, logData);
        break;
      case 'warn':
        console.warn(logMessage, logData);
        break;
      default:
        console.log(logMessage, logData);
    }
  }

  private getLogLevel(threatLevel: string): 'log' | 'warn' | 'error' {
    switch (threatLevel) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      default:
        return 'log';
    }
  }

  private getRecentAppCheckFailures(ip: string): number {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    return this.eventBuffer.filter(event => 
      event.type === 'app_check_failure' &&
      event.source.ip === ip &&
      event.timestamp > oneHourAgo
    ).length;
  }

  private addToSuspiciousIPs(ip: string): void {
    this.suspiciousIPs.add(ip);
    console.warn(`IP ${ip} added to suspicious list`);
  }

  // Update failure counts
  updateFailureCount(type: 'ip' | 'user', identifier: string): void {
    const map = type === 'ip' ? this.ipFailureCounts : this.userFailureCounts;
    const current = map.get(identifier) || 0;
    map.set(identifier, current + 1);
    
    // Clean old counts (simplified - in production, use proper time-based cleanup)
    if (map.size > 10000) {
      const entries = Array.from(map.entries());
      const keep = entries.slice(-5000);
      map.clear();
      keep.forEach(([key, value]) => map.set(key, value));
    }
  }

  // Get security summary
  getSecuritySummary(): any {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentEvents = this.eventBuffer.filter(e => e.timestamp > last24Hours);
    
    return {
      totalEvents: recentEvents.length,
      eventsByType: this.groupEventsByType(recentEvents),
      threatLevels: this.groupEventsByThreat(recentEvents),
      topSuspiciousIPs: this.getTopSuspiciousIPs(recentEvents),
      suspiciousIPCount: this.suspiciousIPs.size,
      lastUpdated: new Date().toISOString()
    };
  }

  private groupEventsByType(events: SecurityEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupEventsByThreat(events: SecurityEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getTopSuspiciousIPs(events: SecurityEvent[]): Array<{ip: string, count: number}> {
    const ipCounts = events.reduce((acc, event) => {
      acc[event.source.ip] = (acc[event.source.ip] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(ipCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();

// Export helper functions
export const logSecurityEvent = (event: Partial<SecurityEvent>) => 
  securityMonitor.logSecurityEvent(event);

export const updateFailureCount = (type: 'ip' | 'user', identifier: string) => 
  securityMonitor.updateFailureCount(type, identifier);

export const getSecuritySummary = () => 
  securityMonitor.getSecuritySummary();