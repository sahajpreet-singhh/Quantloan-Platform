# Security Specification for QuantBank

## Data Invariants
1. A Loan can only be created by a user with the 'Borrower' role.
2. An Investment can only be created by a user with the 'Investor' role.
3. Users can only update their own profile data.
4. Users cannot change their 'role' after it is set.
5. All timestamps must be server-generated.
6. Loan grades and scores must be within valid ranges (0-100).
7. Investment amounts must be greater than 0.

## The Dirty Dozen (Attack Vectors)
1. **Self-Promotion**: Borrower trying to change their role to 'Investor' to access investment features.
2. **Grade Manipulation**: Borrower trying to update their loan grade to 'A' manually.
3. **Ghost Loan**: Unauthorized user trying to create a loan for another borrower.
4. **Principal Hijack**: Investor trying to delete or modify another investor's investment.
5. **Score Injection**: Borrower sending a 1MB string in the 'score' field.
6. **Relational Sync Failure**: Creating an investment for a non-existent loan.
7. **Identity Spoof**: User trying to read another user's PII (if any).
8. **Negative Funding**: Submitting an investment with a negative amount.
9. **Status Locking Bypass**: Trying to update a loan status after it is 'Closed'.
10. **Timestamp Fraud**: Sending a future date as `createdAt`.
11. **Shadow Field Injection**: Adding an `isVerified: true` field to a loan document.
12. **Orphaned Writes**: Creating an investment without an `investorId` matching the current user.

## Terminal State
- Loans with `status: 'Closed'` are immutable.
