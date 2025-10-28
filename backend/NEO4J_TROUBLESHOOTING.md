# 🔧 Neo4j Connection Troubleshooting Guide

## 🚨 **Current Issue: Connection Pool Exhaustion**

Your application is experiencing **Neo4j connection timeout errors** in production:
```
Neo4jError: Connection acquisition timed out in 10000 ms. Pool status: Active conn count = 0, Idle conn count = 0.
```

## ✅ **Solutions Implemented**

### 1. **Enhanced Connection Pool Configuration**
- **Increased pool size**: From 2 to 10 connections (production)
- **Extended timeouts**: From 10s to 30s for production
- **Added retry logic**: Exponential backoff for failed connections
- **Connection health monitoring**: Real-time status tracking

### 2. **Safe Session Management**
- **Automatic cleanup**: Sessions are properly closed after use
- **Error handling**: Graceful fallbacks instead of crashes
- **Connection verification**: Pre-flight checks before queries

### 3. **Production Optimizations**
- **Environment detection**: Different settings for dev/prod
- **Connection pooling**: Optimized for high-concurrency
- **Health monitoring**: Endpoint to check connection status

## 🛠️ **Deployment Steps**

### 1. **Update Environment Variables**
Make sure your Render environment has these variables:
```bash
NEO4J_URI=your_neo4j_connection_string
NEO4J_USERNAME=your_username
NEO4J_PASSWORD=your_password
NODE_ENV=production
```

### 2. **Test Connection Locally**
```bash
cd backend
node test-neo4j-connection.js
```

### 3. **Monitor Health in Production**
```bash
# Check Neo4j health
curl https://your-app.onrender.com/api/chat/neo4j-health
```

## 🔍 **Troubleshooting Steps**

### **Step 1: Check Connection Status**
```bash
curl https://your-app.onrender.com/api/chat/neo4j-health
```

Expected response:
```json
{
  "success": true,
  "neo4j": {
    "status": "connected",
    "lastCheck": 1234567890,
    "consecutiveFailures": 0
  }
}
```

### **Step 2: Verify Neo4j Database**
1. **Check if Neo4j is running**: Ensure your Neo4j instance is active
2. **Verify credentials**: Double-check username/password
3. **Test connection string**: Try connecting via Neo4j Browser

### **Step 3: Monitor Application Logs**
Look for these patterns in your Render logs:
- ✅ `✅ Neo4j connection verified`
- ❌ `❌ Neo4j connection failed`
- ⏳ `⏳ Neo4j connection backoff`

### **Step 4: Check Resource Usage**
- **Memory**: Ensure sufficient RAM for connection pool
- **CPU**: Monitor for high usage during queries
- **Network**: Check for latency issues

## 🚀 **Performance Optimizations**

### **For High Traffic**
1. **Increase pool size** (if needed):
   ```javascript
   maxConnectionPoolSize: 15, // For very high traffic
   ```

2. **Add connection pooling at database level**:
   - Use Neo4j Enterprise (if available)
   - Configure connection pooling in Neo4j

3. **Implement caching**:
   - Cache frequently accessed data
   - Use Redis for session storage

### **For Low Resources**
1. **Reduce pool size**:
   ```javascript
   maxConnectionPoolSize: 5, // For limited resources
   ```

2. **Increase timeouts**:
   ```javascript
   connectionAcquisitionTimeout: 60000, // 60 seconds
   ```

## 📊 **Monitoring & Alerts**

### **Health Check Endpoint**
- **URL**: `/api/chat/neo4j-health`
- **Frequency**: Check every 5 minutes
- **Alert**: If `consecutiveFailures > 3`

### **Log Monitoring**
Watch for these patterns:
- `Connection acquisition timed out` → Pool exhaustion
- `Neo4j connection failed` → Network/credential issues
- `Session closed` → Normal operation

## 🔧 **Advanced Debugging**

### **Enable Debug Logging**
Add to your environment:
```bash
DEBUG=neo4j:*
```

### **Test Individual Queries**
```javascript
// Test specific query
const result = await session.run('MATCH (n) RETURN count(n)');
console.log('Node count:', result.records[0].get('count'));
```

### **Connection Pool Analysis**
```javascript
// Check pool status
const health = getConnectionHealth();
console.log('Pool status:', health);
```

## 🆘 **Emergency Procedures**

### **If Connection Fails Completely**
1. **Restart the application**:
   ```bash
   # On Render dashboard
   # Click "Manual Deploy" → "Clear build cache & deploy"
   ```

2. **Check Neo4j database**:
   - Verify database is running
   - Check disk space
   - Review error logs

3. **Fallback mode**:
   - Application will continue with empty graph data
   - Chat functionality remains available
   - Graph generation will be minimal

### **If Performance is Poor**
1. **Reduce concurrent requests**:
   - Implement request queuing
   - Add rate limiting

2. **Optimize queries**:
   - Add database indexes
   - Simplify complex queries
   - Use query caching

## 📈 **Performance Metrics**

### **Key Metrics to Monitor**
- **Connection success rate**: Should be > 95%
- **Query response time**: Should be < 5 seconds
- **Pool utilization**: Should be < 80%
- **Error rate**: Should be < 1%

### **Alert Thresholds**
- **High error rate**: > 5% failed connections
- **Slow queries**: > 10 seconds response time
- **Pool exhaustion**: > 90% pool utilization

## 🎯 **Expected Results**

After implementing these fixes:
- ✅ **No more connection timeouts**
- ✅ **Stable graph generation**
- ✅ **Better error handling**
- ✅ **Improved monitoring**
- ✅ **Graceful degradation**

## 📞 **Support**

If issues persist:
1. **Check Render logs** for detailed error messages
2. **Test connection locally** using the test script
3. **Monitor health endpoint** for real-time status
4. **Review Neo4j database** logs for server-side issues

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Status**: Production Ready ✅ 