# 🔧 Admin Console Troubleshooting Guide

## 🚀 Quick Fix - Admin Console Not Opening

### **Step 1: Start the Backend Server**
```bash
cd server
npm install
npm start
```

### **Step 2: Start the Frontend**
```bash
cd frontend
npm install
npm run dev
```

### **Step 3: Access Admin Console**
- Go to: http://localhost:5173/admin/analytics
- Or: http://localhost:5173/admin/console

---

## 🔍 Common Issues & Solutions

### **Issue 1: 404 Errors on Admin Pages**
**Symptoms:**
- `GET http://localhost:4000/api/admin/analytics/users 404 (Not Found)`
- `GET http://localhost:4000/api/admin/logs/sessions 404 (Not Found)`

**Solution:**
1. **Restart the backend server** (most common fix):
   ```bash
   cd server
   npm start
   ```

2. **Check server logs** for any errors during startup

3. **Verify MongoDB is running**:
   ```bash
   mongod --version
   ```

### **Issue 2: Admin Pages Not Loading**
**Symptoms:**
- Blank pages or loading spinners that never finish
- Console errors about failed API calls

**Solution:**
1. **Clear browser cache** and refresh
2. **Check network tab** in browser dev tools
3. **Verify server is running** on port 4000:
   ```bash
   curl http://localhost:4000/api/health
   ```

### **Issue 3: MongoDB Connection Issues**
**Symptoms:**
- Server crashes on startup
- "MongoDB connection failed" errors

**Solution:**
1. **Install MongoDB**:
   - Download from: https://www.mongodb.com/try/download/community
   - Or use MongoDB Atlas (cloud)

2. **Start MongoDB**:
   ```bash
   mongod
   ```

3. **Or use cloud MongoDB**:
   - Create free account at https://cloud.mongodb.com
   - Update `MONGO_URI` in server/.env

### **Issue 4: Frontend Build Errors**
**Symptoms:**
- TypeScript errors
- Module not found errors

**Solution:**
1. **Reinstall dependencies**:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check TypeScript errors**:
   ```bash
   npm run build
   ```

---

## 🎯 Step-by-Step Setup

### **Complete Fresh Setup:**

1. **Backend Setup:**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access Admin Console:**
   - Open browser to http://localhost:5173
   - Navigate to admin section
   - Or directly: http://localhost:5173/admin/analytics

---

## 🔧 Advanced Troubleshooting

### **Check Server Status:**
```bash
# Test backend health
curl http://localhost:4000/api/health

# Test analytics endpoint
curl http://localhost:4000/api/admin/analytics/users

# Test logs endpoint
curl http://localhost:4000/api/admin/logs/sessions
```

### **Check Database Connection:**
```bash
# If using local MongoDB
mongo --eval "db.runCommand('ping')"

# Check if database was seeded
mongo voicera --eval "db.users.count()"
```

### **Check Frontend Build:**
```bash
cd frontend
npm run build
npm run preview
```

---

## 📊 What You Should See

### **Working Admin Console:**
- ✅ Analytics Dashboard with charts and metrics
- ✅ Log Management with session data
- ✅ Content Management with file statistics
- ✅ Email Alerts with notification settings
- ✅ Real-time data updates

### **Mock Data (Fallback):**
If the server is not running, you'll see:
- 📊 Realistic mock analytics data
- 📝 Sample session logs
- 📁 File upload statistics
- 🚨 Alert management interface

---

## 🆘 Still Having Issues?

### **Check These Files:**
1. `server/index.js` - Main server file
2. `frontend/src/services/analyticsService.ts` - API calls
3. `frontend/src/pages/admin/` - Admin pages
4. Browser console for errors

### **Common Fixes:**
1. **Restart everything** (server + frontend)
2. **Clear browser cache**
3. **Check port conflicts** (4000 for backend, 5173 for frontend)
4. **Verify MongoDB is running**
5. **Check firewall/antivirus** blocking connections

### **Emergency Fallback:**
If nothing works, the admin console will still show mock data so you can see the interface and functionality.

---

## 🎉 Success Indicators

When everything is working correctly, you should see:
- ✅ No 404 errors in browser console
- ✅ Real data from database (not mock data)
- ✅ Interactive charts and graphs
- ✅ Real-time updates
- ✅ All admin pages loading properly

**Admin Console URLs:**
- Main Console: http://localhost:5173/admin/console
- Analytics: http://localhost:5173/admin/analytics
- Logs: http://localhost:5173/admin/logs
- Content: http://localhost:5173/admin/content
- Alerts: http://localhost:5173/admin/alerts
