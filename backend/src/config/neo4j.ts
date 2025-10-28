import neo4j, { Session } from 'neo4j-driver';

const uri = process.env.NEO4J_URI || "";
const user = process.env.NEO4J_USERNAME || "";
const password = process.env.NEO4J_PASSWORD || "";

// Enhanced configuration for production
const isProduction = process.env.NODE_ENV === 'production';

// Create driver instance with optimized settings for production
const driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
  maxConnectionLifetime: 60 * 60 * 1000, // 1 hour
  maxConnectionPoolSize: isProduction ? 10 : 5, // Increased for production
  connectionAcquisitionTimeout: isProduction ? 30000 : 10000, // 30s for production
  connectionTimeout: isProduction ? 30000 : 10000, // 30s for production
  disableLosslessIntegers: true,
  useBigInt: true,
  // Additional production optimizations
  maxTransactionRetryTime: isProduction ? 15000 : 5000, // 15s retry for production
});

// Connection state tracking with enhanced error handling
let connectionStatus: 'unknown' | 'connected' | 'failed' = 'unknown';
let lastConnectionCheck = 0;
let consecutiveFailures = 0;
const CONNECTION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_CONSECUTIVE_FAILURES = 3;

// Enhanced connection verification with retry logic
export const verifyConnection = async (): Promise<boolean> => {
  const now = Date.now();
  
  // Skip verification if recently checked and successful
  if (connectionStatus === 'connected' && (now - lastConnectionCheck) < CONNECTION_CHECK_INTERVAL) {
    return true;
  }

  // Implement exponential backoff for repeated failures
  if (consecutiveFailures > 0) {
    const backoffDelay = Math.min(1000 * Math.pow(2, consecutiveFailures - 1), 10000);
    console.log(`⏳ Neo4j connection backoff: ${backoffDelay}ms (failures: ${consecutiveFailures})`);
    await new Promise(resolve => setTimeout(resolve, backoffDelay));
  }

  try {
    await driver.verifyConnectivity();
    connectionStatus = 'connected';
    lastConnectionCheck = now;
    consecutiveFailures = 0;
    console.log('✅ Neo4j connection verified');
    return true;
  } catch (error) {
    connectionStatus = 'failed';
    lastConnectionCheck = now;
    consecutiveFailures++;
    console.error(`❌ Neo4j connection failed (attempt ${consecutiveFailures}):`, error instanceof Error ? error.message : error);
    
    // Reset after max failures to allow retry
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      console.log('🔄 Resetting Neo4j connection failure counter');
      consecutiveFailures = 0;
    }
    
    return false;
  }
};

// Safe driver getter with enhanced error handling
export const getDriver = async () => {
  const isConnected = await verifyConnection();
  if (!isConnected) {
    throw new Error(`Neo4j connection unavailable after ${consecutiveFailures} attempts`);
  }
  return driver;
};

// Enhanced session management with proper cleanup
export const createSession = async () => {
  try {
    const isConnected = await verifyConnection();
    if (!isConnected) {
      throw new Error('Neo4j connection unavailable');
    }
    return driver.session();
  } catch (error) {
    console.error('❌ Failed to create Neo4j session:', error);
    throw error;
  }
};

// Safe session execution with automatic cleanup
export const executeWithSession = async <T>(
  operation: (session: Session) => Promise<T>
): Promise<T> => {
  const session = await createSession();
  try {
    const result = await operation(session);
    return result;
  } finally {
    await session.close();
  }
};

// Graceful shutdown helper
export const closeConnection = async () => {
  try {
    await driver.close();
    console.log('✅ Neo4j connection closed');
  } catch (error) {
    console.error('❌ Error closing Neo4j connection:', error);
  }
};

// Health check for monitoring
export const getConnectionHealth = () => ({
  status: connectionStatus,
  lastCheck: lastConnectionCheck,
  consecutiveFailures,
  poolSize: 'unknown', // Neo4j driver doesn't expose pool size directly
  availableConnections: 'unknown',
});

// Export driver for direct use (use getDriver() or createSession() for safety)
export { driver };

if(driver) {
    console.log('Neo4j driver initialized successfully.');
    (async () => {
        const serverInfo = await driver.getServerInfo();
        console.log('Connection established');
        console.log(serverInfo);
    })();
}

else {
    console.error('Failed to initialize Neo4j driver.');
}

export default driver;