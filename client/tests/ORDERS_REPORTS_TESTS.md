
# Stockroom — Orders and Reports Test Cases

## 1. Purpose

This document outlines test cases for the Order Management, Reports, Dashboard, and Recent Activity modules of the Stockroom Inventory Management System.

The objective is to verify order processing, inventory updates, reporting accuracy, and error handling.

## 2. Test Environment

- Frontend: React and Vite
- Backend: Node.js and Express
- Database: MongoDB
- Browser: Google Chrome or another modern browser

## 3. Order Management Test Cases

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| ORD-001 | Open the Orders page | Existing orders are displayed |
| ORD-002 | Create an order with valid details | Order is saved with Pending status |
| ORD-003 | Create an order without selecting a product | Validation prevents saving |
| ORD-004 | Create an order with zero quantity | Validation rejects the quantity |
| ORD-005 | Create an order with negative quantity | Validation rejects the quantity |
| ORD-006 | Edit the quantity of a pending order | Updated quantity and total amount are saved |
| ORD-007 | Receive a pending order | Status changes to Received |
| ORD-008 | Receive an order | Product stock increases by the ordered quantity |
| ORD-009 | Receive the same order twice | Second receiving attempt is rejected |
| ORD-010 | Cancel a pending order | Status changes to Cancelled |
| ORD-011 | Receive a cancelled order | Operation is rejected |
| ORD-012 | Delete a cancelled order | Order is deleted when permitted |
| ORD-013 | Delete a received order | Operation is rejected |
| ORD-014 | Refresh the Orders page | Saved order records remain available |

## 4. Reports Test Cases

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| REP-001 | Open the Reports page | Reports are displayed |
| REP-002 | Add a new product | Relevant product totals update after refresh |
| REP-003 | Increase product stock | Stock-related report values update |
| REP-004 | Decrease product stock | Stock-related report values update |
| REP-005 | Create a pending order | Order-related summaries reflect the new order |
| REP-006 | Receive an order | Inventory and order summaries reflect the changes |
| REP-007 | Cancel a pending order | Order summaries reflect the cancelled status |
| REP-008 | Refresh the Reports page | Reports remain consistent with saved data |

## 5. Dashboard Test Cases

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| DASH-001 | Open the Dashboard | Inventory summary is displayed |
| DASH-002 | Add a product | Product count updates after refresh |
| DASH-003 | Adjust product stock | Dashboard stock information updates |
| DASH-004 | Receive an order | Dashboard reflects updated inventory |
| DASH-005 | Stop the backend server | A connection error is displayed |
| DASH-006 | Restart the backend and retry | Dashboard loads current data |

## 6. Recent Activity Test Cases

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| ACT-001 | Add a product | Product creation activity is recorded |
| ACT-002 | Edit a product | Product update activity is recorded |
| ACT-003 | Adjust stock | Stock adjustment activity is recorded |
| ACT-004 | Create an order | Order creation activity is recorded |
| ACT-005 | Receive an order | Order receiving activity is recorded |
| ACT-006 | Refresh the page | Saved activity records remain available |

Note: Activity logging depends on successful database writes. A failure to record a non-critical activity should be documented separately.

## 7. Integration Test Cases

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| INT-ORD-001 | Create an order for an existing product | Order references the selected product |
| INT-ORD-002 | Receive an order | Product quantity increases exactly once |
| INT-ORD-003 | Cancel an order | Inventory quantity does not increase |
| INT-ORD-004 | Submit invalid order data | Invalid request does not change inventory |
| INT-ORD-005 | Refresh after an order operation | Frontend displays current MongoDB data |

## 8. Test Execution Record

Fill in the actual results after performing the tests.

| Test ID | Actual Result | Status (Pass/Fail) | Tested By |
|---|---|---|---|
| ORD-001 | Not yet recorded | Not Run | |
| ORD-002 | Not yet recorded | Not Run | |
| ORD-007 | Not yet recorded | Not Run | |
| ORD-008 | Not yet recorded | Not Run | |
| REP-001 | Not yet recorded | Not Run | |
| DASH-001 | Not yet recorded | Not Run | |
| ACT-001 | Not yet recorded | Not Run | |

Additional test results can be added using the same format.

## 9. Testing Guidelines

1. Start the backend and frontend servers.
2. Confirm that MongoDB is connected.
3. Use sample products, suppliers, and orders.
4. Perform each test scenario.
5. Compare the actual result with the expected result.
6. Record Pass or Fail based on observed behavior.
7. Document any errors and the steps needed to reproduce them.

## 10. Conclusion

These test cases provide a structured approach to evaluating the Orders, Reports, Dashboard, and Recent Activity modules.

Final testing results must be based on actual system behavior.
