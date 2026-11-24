# Security Specification — UPA Mobilidade Angola Admin & Partner Portal

## 1. Data Invariants
1. **Admin Authority**: Only verified administrators (`upacloud.config@gmail.com` or an existing UID in `/admins/{uid}`) can create, update, or delete `/drivers`, `/partners`, or `/admins`, or review `/credential_requests`.
2. **Driver PII Protection**: Driver records contain Bilhete de Identidade (`biNumber`), Carta de Condução (`licenseNumber`), phone, and vehicle plate. Only authenticated, email-verified admins can read or mutate `/drivers`.
3. **Applicant Identity Binding**: A `/credential_requests` creation must bind `applicantUid == request.auth.uid` and `applicantEmail == request.auth.token.email`, enforce `status == 'pendente'`, and forbid pre-populated `issuedCredentialCode` or `reviewedByUid`.
4. **Partner Isolation**: Partners can only read their own `/partners` document (`uid == request.auth.uid || email == request.auth.token.email`), never list or view other partners' data.
5. **Temporal Integrity & Strict Keys**: Every write enforces `request.time` for timestamps and strict `keys().hasAll` / `keys().hasOnly` / `affectedKeys().hasOnly` constraints.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated `get` or `list` on `/drivers`.
2. Non-admin authenticated user attempting `create` on `/drivers`.
3. Unverified-email user attempting `create` on `/credential_requests`.
4. Authenticated non-admin attempting to submit `/credential_requests` with `status: 'aprovado'`.
5. Authenticated non-admin attempting to submit `/credential_requests` with `applicantUid` belonging to another user.
6. Authenticated non-admin attempting to submit `/credential_requests` with a shadow field `isAdmin: true`.
7. Authenticated non-admin attempting to update their own `/credential_requests` to `status: 'aprovado'`.
8. Non-admin attempting `list` on `/credential_requests` without scoping to their own `applicantUid`.
9. Non-admin attempting `create` on `/admins/{theirUid}` to escalate privileges.
10. Non-admin attempting `get` on another partner's `/partners/{otherPartnerId}` document.
11. Malicious 5KB document ID injected into `/credential_requests/{1500_char_id}`.
12. Client attempting to spoof `createdAt` with a backdated timestamp instead of `request.time`.
