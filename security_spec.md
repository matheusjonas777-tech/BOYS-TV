# Security Specification - BL Zero TV

## Data Invariants
1. A series must have at least one episode defined.
2. A rating must be between 1 and 5.
3. Users cannot elevate their own role to 'admin'.
4. Ratings are tied to the authenticated user's UID.

## The Dirty Dozen (Payloads to Reject)
1. User profile update: `{ role: 'admin' }` (Privilege Escalation)
2. Rating creation: `{ value: 10 }` (Value Out of Bounds)
3. Rating creation: `{ userId: 'someone_else_uid' }` (Identity Spoofing)
4. Series update: `{ title: 'Hacked' }` (Unauthorized Write)
5. Series creation with massive ID string. (Resource Poisoning)
6. User profile read for a different user. (PII Leak)
7. Rating update for a different user's rating. (Integrity Breach)
8. Series deletion by non-admin. (Unauthorized Delete)
9. Rapid-fire rating creation. (Denial of Wallet - limited by rules logic)
10. Series episode update with invalid URL format. (Data Integrity)
11. Reading the entire users collection as a guest. (Unauthorized List)
12. Creating a rating for a non-existent series. (Relational Sync)

## Test Plan
- Verify `users` collection is private.
- Verify `series` is read-only for public, write-only for admins.
- Verify `ratings` is owner-only for write.
