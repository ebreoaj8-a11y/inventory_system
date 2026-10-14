
# Stockroom — Inventory and Supplier Test Cases

## 1. Purpose

This document outlines test cases for the Inventory and Supplier Management modules of the Stockroom system.

The objective is to verify product management, stock adjustments, supplier management, and validation behavior.

## 2. Test Environment

- Frontend: React and Vite
- Backend: Node.js and Express
- Database: MongoDB
- Browser: Google Chrome or another modern browser

## 3. Inventory Management Test Cases

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| INV-001 | Open the Inventory page | Product records are displayed |
| INV-002 | Add a product with valid details | Product is saved and appears in inventory |
| INV-003 | Add a product without a name | Validation prevents saving |
| INV-004 | Add a product with a duplicate SKU | Duplicate SKU is rejected |
| INV-005 | Edit an existing product | Updated details are saved |
| INV-006 | Adjust stock with a positive quantity | Stock quantity increases |
| INV-007 | Adjust stock with a negative quantity | Stock quantity decreases if sufficient stock exists |
| INV-008 | Remove more stock than available | Operation is rejected |
| INV-009 | Enter a negative product price | Validation rejects the value |
| INV-010 | Delete a product with no blocking dependencies | Product is deleted |
| INV-011 | Delete a product referenced by a pending order | Deletion is prevented |
| INV-012 | Refresh the Inventory page | Saved product records remain available |

## 4. Supplier Management Test Cases

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| SUP-001 | Open the Suppliers page | Supplier records are displayed |
| SUP-002 | Add a supplier with valid details | Supplier is saved |
| SUP-003 | Add a supplier without a name | Validation prevents saving |
| SUP-004 | Add a supplier with an invalid email | Validation rejects the email |
| SUP-005 | Add a supplier with a duplicate email | Duplicate email is rejected |
| SUP-006 | Edit supplier details | Updated information is saved |
| SUP-007 | Delete a supplier with no blocking dependencies | Supplier is deleted |
| SUP-008 | Delete a supplier referenced by dependent records | Deletion is handled according to backend rules |
| SUP-009 | Refresh the Suppliers page | Saved supplier records remain available |

## 5. Integration Test Cases

| Test ID | Test Scenario | Expected Result |
|---|---|---|
| INT-001 | Assign a valid supplier to a product | Product is linked to the selected supplier |
| INT-002 | Create a product using an invalid supplier ID | Backend rejects the invalid reference |
| INT-003 | Update product stock | Dashboard displays the updated stock after refresh |
| INT-004 | Modify product information | Relevant activity is recorded when logging succeeds |
| INT-005 | Stop the backend and refresh the frontend | Connection error is displayed rather than stale inventory |

## 6. Test Execution Record

Complete this section after performing the tests.

| Test ID | Actual Result | Status (Pass/Fail) | Tested By |
|---|---|---|---|
| INV-001 | Not yet recorded | Not Run | |
| INV-002 | Not yet recorded | Not Run | |
| INV-003 | Not yet recorded | Not Run | |
| SUP-001 | Not yet recorded | Not Run | |
| SUP-002 | Not yet recorded | Not Run | |
| INT-001 | Not yet recorded | Not Run | |

Additional test cases can be recorded using the same format.

## 7. Notes

- Perform tests using sample data.
- Record the actual result of each test.
- Mark a test as Pass only when the expected behavior is observed.
- Record any bugs and the steps required to reproduce them.
- Do not expose real database credentials in test documentation.

## 8. Conclusion

These test cases provide a checklist for evaluating Inventory and Supplier Management.

Final results should be based on actual testing, not assumed outcomes.
