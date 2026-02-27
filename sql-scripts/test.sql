-- Complex example: Top customers by order value with order counts
-- Uses JOINs, aggregations, subqueries, and window functions
-- Note: ::text casts ensure numeric values display correctly

WITH customer_totals AS (
  SELECT 
    c.id,
    c.name,
    c."accountNumber",
    COUNT(o.id)::bigint AS order_count,
    SUM(o."totalValue"::numeric)::text AS total_spent
  FROM customers c
  LEFT JOIN orders o ON o."customerId" = c.id
  GROUP BY c.id, c.name, c."accountNumber"
),
ranked AS (
  SELECT 
    *,
    RANK() OVER (ORDER BY total_spent::numeric DESC NULLS LAST) AS spend_rank,
    ROUND(100.0 * total_spent::numeric / NULLIF(SUM(total_spent::numeric) OVER (), 0), 2)::text AS pct_of_total
  FROM customer_totals
)
SELECT 
  name,
  "accountNumber",
  order_count,
  total_spent,
  spend_rank,
  pct_of_total || '%' AS share_of_revenue
FROM ranked
WHERE total_spent::numeric > 0
ORDER BY spend_rank
LIMIT 10;