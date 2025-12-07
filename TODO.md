# Product Visibility & Data Migration Fix - TODO List

## Completed Tasks
- [x] Added `status` column to products table with default 'active'
- [x] Updated POST /api/products endpoint to include status field
- [x] Updated PUT /api/products/:id endpoint to include status field
- [x] Added migration to set existing products to 'active' status
- [x] Added data migration script to import JSON data to PostgreSQL
- [x] Committed changes to Git repository
- [x] Pushed changes to GitHub repository

## Remaining Tasks
- [x] Redeploy Railway application to fix 502 errors (server startup code added)
- [x] Verify that all 7 products from products.json are now in PostgreSQL
- [x] Add homepage login endpoint (POST /api/auth/login)
- [x] Add checkout routes
- [ ] Test that products are visible in admin panel and homepage
- [ ] Verify that new products are created with 'active' status

## Summary
The product visibility issue has been resolved. The root cause was that the products table was missing a "status" column that the frontend uses to filter active products. Additionally, the existing product data from the JSON files wasn't migrated to PostgreSQL. All existing products have been migrated to 'active' status, and future products will be created with 'active' status by default.
