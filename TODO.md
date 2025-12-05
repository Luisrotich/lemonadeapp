# Product Visibility Fix - TODO List

## Completed Tasks
- [x] Added `status` column to products table with default 'active'
- [x] Updated POST /api/products endpoint to include status field
- [x] Updated PUT /api/products/:id endpoint to include status field
- [x] Added migration to set existing products to 'active' status
- [x] Committed changes to Git repository

## Remaining Tasks
- [ ] Push changes to GitHub repository
- [ ] Redeploy Railway application to apply database schema changes
- [ ] Test that products are now visible in admin panel and homepage
- [ ] Verify that new products are created with 'active' status
