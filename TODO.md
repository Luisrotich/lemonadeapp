# PostgreSQL Migration Plan

## Steps to Complete Migration

- [ ] Install PostgreSQL dependencies (pg package)
- [ ] Create database connection module (db.js)
- [ ] Create database schema (init.sql or migration script)
- [ ] Update server.js to use PostgreSQL instead of JSON files
- [ ] Update package.json with new dependencies
- [ ] Provide environment variables needed for Railway PostgreSQL connection
- [ ] Test the migration (optional, if user requests)

## Environment Variables Needed
- DATABASE_URL: PostgreSQL connection string from Railway
- NODE_ENV: Set to 'production' for Railway deployment
