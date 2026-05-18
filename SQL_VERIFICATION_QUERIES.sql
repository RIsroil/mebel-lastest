-- ════════════════════════════════════════════════════════════════
-- SQL VERIFICATION QUERIES — Mebel MS Test Data
-- ════════════════════════════════════════════════════════════════
-- Use these queries to verify DataInitializer created all test data correctly

-- ────────────────────────────────────────────────────────────────
-- 1. VERIFY USERS CREATED
-- ────────────────────────────────────────────────────────────────
SELECT COUNT(*) as total_users FROM users WHERE deleted_at IS NULL;

SELECT role, COUNT(*) as count FROM users WHERE deleted_at IS NULL GROUP BY role;

SELECT
    username,
    full_name,
    role,
    workshop_id,
    pay_type,
    daily_salary,
    monthly_salary,
    commission_pct
FROM users
WHERE deleted_at IS NULL
ORDER BY role, username;

-- ────────────────────────────────────────────────────────────────
-- 2. VERIFY WORKSHOP CREATED
-- ────────────────────────────────────────────────────────────────
SELECT
    id,
    name,
    address,
    phone,
    description,
    owner_id,
    created_at
FROM workshops
WHERE deleted_at IS NULL;

-- ────────────────────────────────────────────────────────────────
-- 3. VERIFY WAREHOUSE MATERIALS
-- ────────────────────────────────────────────────────────────────
SELECT COUNT(*) as total_materials FROM warehouse_items WHERE deleted_at IS NULL;

SELECT
    name,
    unit_type,
    quantity,
    avg_unit_price,
    total_value,
    (quantity * avg_unit_price) as calculated_value,
    active
FROM warehouse_items
WHERE deleted_at IS NULL
ORDER BY name;

-- Total warehouse value
SELECT
    SUM(total_value) as total_warehouse_value,
    COUNT(*) as material_count
FROM warehouse_items
WHERE deleted_at IS NULL;

-- ────────────────────────────────────────────────────────────────
-- 4. VERIFY WAREHOUSE TRANSACTIONS
-- ────────────────────────────────────────────────────────────────
SELECT COUNT(*) as total_transactions FROM warehouse_transactions;

SELECT
    transaction_type,
    COUNT(*) as count,
    SUM(quantity) as total_qty,
    SUM(total_cost) as total_cost
FROM warehouse_transactions
GROUP BY transaction_type;

-- Transaction details (first 50)
SELECT
    wt.id,
    wi.name,
    wt.transaction_type,
    wt.quantity,
    wt.unit_price,
    wt.total_cost,
    wt.qty_before,
    wt.qty_after,
    wt.furniture_order_id,
    wt.created_at
FROM warehouse_transactions wt
JOIN warehouse_items wi ON wt.item_id = wi.id
ORDER BY wt.created_at DESC
LIMIT 50;

-- ────────────────────────────────────────────────────────────────
-- 5. VERIFY FURNITURE TEMPLATES
-- ────────────────────────────────────────────────────────────────
SELECT COUNT(*) as template_count FROM furniture_templates WHERE deleted_at IS NULL;

SELECT
    name,
    description,
    estimated_prod_days,
    active,
    created_at
FROM furniture_templates
WHERE deleted_at IS NULL;

-- ────────────────────────────────────────────────────────────────
-- 6. VERIFY FURNITURE ORDERS (COMPLETE WORKFLOW)
-- ────────────────────────────────────────────────────────────────
SELECT COUNT(*) as total_orders FROM furniture_orders WHERE deleted_at IS NULL;

SELECT
    status,
    COUNT(*) as count
FROM furniture_orders
WHERE deleted_at IS NULL
GROUP BY status;

-- Order details with summary
SELECT
    order_number,
    title,
    status,
    sale_price,
    estimated_cost,
    actual_material_cost,
    (sale_price - actual_material_cost) as gross_profit,
    client_name,
    started_at,
    completed_at,
    sold_at,
    created_at
FROM furniture_orders
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- ────────────────────────────────────────────────────────────────
-- 7. VERIFY MATERIAL USAGE (Materials used in orders)
-- ────────────────────────────────────────────────────────────────
SELECT COUNT(*) as total_usages FROM material_usages WHERE deleted_at IS NULL;

SELECT
    mu.id,
    fo.order_number,
    fo.title,
    wi.name as material,
    mu.quantity_used,
    mu.unit_price_at_time,
    mu.total_cost,
    mu.given_at
FROM material_usages mu
JOIN furniture_orders fo ON mu.furniture_order_id = fo.id
JOIN warehouse_items wi ON mu.warehouse_item_id = wi.id
WHERE mu.deleted_at IS NULL
ORDER BY mu.given_at DESC;

-- Material cost by order
SELECT
    fo.order_number,
    fo.title,
    SUM(mu.total_cost) as total_material_cost,
    COUNT(mu.id) as material_items_used
FROM material_usages mu
JOIN furniture_orders fo ON mu.furniture_order_id = fo.id
WHERE mu.deleted_at IS NULL
GROUP BY fo.id, fo.order_number, fo.title
ORDER BY fo.created_at DESC;

-- ────────────────────────────────────────────────────────────────
-- 8. VERIFY FURNITURE ASSIGNMENTS (Worker assignments to orders)
-- ────────────────────────────────────────────────────────────────
SELECT COUNT(*) as total_assignments FROM furniture_assignments WHERE deleted_at IS NULL;

SELECT
    u.full_name as worker_name,
    fo.order_number,
    fo.title,
    fa.commission_pct,
    fa.active,
    fa.assigned_at
FROM furniture_assignments fa
JOIN furniture_orders fo ON fa.furniture_order_id = fo.id
JOIN users u ON fa.worker_id = u.id
WHERE fa.deleted_at IS NULL
ORDER BY fo.created_at DESC, fa.assigned_at;

-- ────────────────────────────────────────────────────────────────
-- 9. VERIFY DAILY ATTENDANCE (30 days per worker)
-- ────────────────────────────────────────────────────────────────
SELECT
    u.full_name,
    COUNT(*) as working_days,
    SUM(da.hours_worked) as total_hours
FROM daily_attendance da
JOIN users u ON da.user_id = u.id
WHERE da.deleted_at IS NULL
GROUP BY u.id, u.full_name
ORDER BY u.full_name;

-- Recent attendance records
SELECT
    u.full_name,
    da.work_date,
    da.check_in_time,
    da.check_out_time,
    da.hours_worked,
    da.hours_locked
FROM daily_attendance da
JOIN users u ON da.user_id = u.id
WHERE da.deleted_at IS NULL
ORDER BY da.work_date DESC
LIMIT 20;

-- ────────────────────────────────────────────────────────────────
-- 10. VERIFY EARNINGS (Wages, Commissions, Bonuses)
-- ────────────────────────────────────────────────────────────────
SELECT COUNT(*) as total_earnings FROM earnings WHERE deleted_at IS NULL;

SELECT
    earn_type,
    COUNT(*) as count,
    SUM(total_amount) as total
FROM earnings
WHERE deleted_at IS NULL
GROUP BY earn_type;

-- Earnings by worker (current month)
SELECT
    u.full_name,
    u.pay_type,
    EXTRACT(YEAR FROM e.earn_date) as year,
    EXTRACT(MONTH FROM e.earn_date) as month,
    SUM(CASE WHEN e.earn_type = 'DAILY_WAGE' THEN e.total_amount ELSE 0 END) as daily_wages,
    SUM(CASE WHEN e.earn_type = 'MONTHLY_WAGE' THEN e.total_amount ELSE 0 END) as monthly_wages,
    SUM(CASE WHEN e.earn_type = 'COMMISSION' THEN e.total_amount ELSE 0 END) as commissions,
    SUM(CASE WHEN e.earn_type = 'BONUS' THEN e.total_amount ELSE 0 END) as bonuses,
    SUM(e.total_amount) as total_earnings
FROM earnings e
JOIN users u ON e.worker_id = u.id
WHERE e.deleted_at IS NULL
GROUP BY u.id, u.full_name, u.pay_type, year, month
ORDER BY year DESC, month DESC, u.full_name;

-- Detailed earnings records (last 50)
SELECT
    u.full_name,
    e.earn_date,
    e.earn_type,
    e.daily_rate,
    e.days_worked,
    e.commission_pct,
    e.commission_amount,
    e.base_amount,
    e.total_amount,
    e.description
FROM earnings e
JOIN users u ON e.worker_id = u.id
WHERE e.deleted_at IS NULL
ORDER BY e.earn_date DESC, e.created_at DESC
LIMIT 50;

-- ────────────────────────────────────────────────────────────────
-- 11. VERIFY BONUSES
-- ────────────────────────────────────────────────────────────────
SELECT COUNT(*) as total_bonuses FROM bonuses WHERE deleted_at IS NULL;

SELECT
    u.full_name,
    b.bonus_date,
    b.amount,
    b.reason,
    b.created_at
FROM bonuses b
JOIN users u ON b.worker_id = u.id
WHERE b.deleted_at IS NULL
ORDER BY b.bonus_date DESC;

-- ────────────────────────────────────────────────────────────────
-- 12. VERIFY FINANCIAL LOGS (Complete audit trail)
-- ────────────────────────────────────────────────────────────────
SELECT COUNT(*) as total_logs FROM financial_logs WHERE deleted_at IS NULL;

SELECT
    log_type,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM financial_logs
WHERE deleted_at IS NULL
GROUP BY log_type
ORDER BY log_type;

-- Financial logs summary (grouped by date)
SELECT
    log_date,
    log_type,
    COUNT(*) as entries,
    SUM(amount) as daily_amount,
    STRING_AGG(description, ' | ') as descriptions
FROM financial_logs
WHERE deleted_at IS NULL
GROUP BY log_date, log_type
ORDER BY log_date DESC
LIMIT 30;

-- Detailed logs (last 50)
SELECT
    log_date,
    log_type,
    amount,
    description,
    created_at
FROM financial_logs
WHERE deleted_at IS NULL
ORDER BY log_date DESC, created_at DESC
LIMIT 50;

-- ────────────────────────────────────────────────────────────────
-- 13. FINANCIAL SUMMARY (Dashboard metrics)
-- ────────────────────────────────────────────────────────────────
-- Total warehouse value
SELECT SUM(total_value) as warehouse_value FROM warehouse_items WHERE deleted_at IS NULL;

-- Revenue from sold orders
SELECT SUM(sale_price) as revenue_from_sales FROM furniture_orders
WHERE deleted_at IS NULL AND status = 'SOLD';

-- Total material cost used
SELECT SUM(total_cost) as total_material_used FROM material_usages
WHERE deleted_at IS NULL;

-- Total wages paid
SELECT SUM(amount) as total_wages_paid FROM financial_logs
WHERE deleted_at IS NULL AND log_type IN ('WAGE_PAID', 'COMMISSION_PAID');

-- Total bonuses paid
SELECT SUM(amount) as total_bonuses_paid FROM financial_logs
WHERE deleted_at IS NULL AND log_type = 'BONUS_PAID';

-- Complete financial summary
SELECT
    (SELECT SUM(total_value) FROM warehouse_items WHERE deleted_at IS NULL) as warehouse_value,
    (SELECT SUM(sale_price) FROM furniture_orders WHERE deleted_at IS NULL AND status = 'SOLD') as revenue,
    (SELECT SUM(total_cost) FROM material_usages WHERE deleted_at IS NULL) as cogs,
    (SELECT SUM(amount) FROM financial_logs WHERE deleted_at IS NULL AND log_type IN ('WAGE_PAID', 'COMMISSION_PAID')) as wages,
    (SELECT SUM(amount) FROM financial_logs WHERE deleted_at IS NULL AND log_type = 'BONUS_PAID') as bonuses;

-- ────────────────────────────────────────────────────────────────
-- 14. DATA INTEGRITY CHECKS
-- ────────────────────────────────────────────────────────────────
-- Check for orphaned records (material usages for non-existent orders)
SELECT COUNT(*) as orphaned_usages FROM material_usages mu
WHERE mu.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM furniture_orders fo WHERE fo.id = mu.furniture_order_id);

-- Check for orphaned assignments
SELECT COUNT(*) as orphaned_assignments FROM furniture_assignments fa
WHERE fa.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM furniture_orders fo WHERE fo.id = fa.furniture_order_id);

-- Check for orphaned earnings
SELECT COUNT(*) as orphaned_earnings FROM earnings e
WHERE e.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = e.worker_id);

-- All active records count
SELECT
    'Users' as entity, COUNT(*) as count FROM users WHERE deleted_at IS NULL
UNION ALL
SELECT 'Workshops', COUNT(*) FROM workshops WHERE deleted_at IS NULL
UNION ALL
SELECT 'Warehouse Items', COUNT(*) FROM warehouse_items WHERE deleted_at IS NULL
UNION ALL
SELECT 'Furniture Orders', COUNT(*) FROM furniture_orders WHERE deleted_at IS NULL
UNION ALL
SELECT 'Material Usages', COUNT(*) FROM material_usages WHERE deleted_at IS NULL
UNION ALL
SELECT 'Assignments', COUNT(*) FROM furniture_assignments WHERE deleted_at IS NULL
UNION ALL
SELECT 'Attendance', COUNT(*) FROM daily_attendance WHERE deleted_at IS NULL
UNION ALL
SELECT 'Earnings', COUNT(*) FROM earnings WHERE deleted_at IS NULL
UNION ALL
SELECT 'Bonuses', COUNT(*) FROM bonuses WHERE deleted_at IS NULL
UNION ALL
SELECT 'Financial Logs', COUNT(*) FROM financial_logs WHERE deleted_at IS NULL
ORDER BY count DESC;

-- ════════════════════════════════════════════════════════════════
-- END OF VERIFICATION QUERIES
-- ════════════════════════════════════════════════════════════════
