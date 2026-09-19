# User Flow

## Driver journey

```
Welcome → Sign up (phone, email?, password) → OTP sent → OTP verified (JWT issued)
   → Dashboard → Personal → Contact → Identity → Vehicle
   → Driver Documents (ID, licence) → Vehicle Documents (registration, insurance)
   → Review → Submit → "Application Submitted" → Dashboard shows status
```

Every onboarding step loads the driver's current saved data on mount and
writes on "Continue", so the driver can navigate backward (via the step
indicator or Back button) and edit any earlier step without losing later
ones — nothing is held only in local component state across steps.

## Application outcomes

- **Approved** → dashboard shows a green "Approved" badge; no further action.
- **Rejected** → dashboard shows the rejection note; terminal state.
- **Correction Required** → dashboard surfaces the admin's note and a
  "Fix and resubmit" button that returns the driver to the first onboarding
  step; the application itself flips back to `DRAFT` on the next submit.

## Admin journey

```
Admin sign-in → Dashboard (counts by status) → Applications (search/filter)
   → Application Details (personal/contact/identity/vehicle/documents/history)
   → Approve | Reject (notes required) | Request Correction (notes required)
```

Approving/rejecting/requesting correction all write an `application_reviews`
row (who, when, decision, notes) in addition to moving the application's
status — so the review history shown on both the driver dashboard and the
admin detail page is a real audit trail, not just the current state.
