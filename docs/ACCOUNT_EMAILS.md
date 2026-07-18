# Account Emails — Majetio.cz

Templates: `src/lib/email/templates.ts`

| Template | Trigger | Contents |
| --- | --- | --- |
| `passwordResetEmail` | Forgot password | Reset link only |
| `emailChangeConfirmEmail` | E-mail change request | Confirm link only |
| `welcomeEmail` | Registration | Link to onboarding/account |

## Rules

- Responsive table layout, Czech copy, vykání  
- **No** financial amounts, LTV, income, or passwords in body  
- Production sender not connected yet — `logEmailInDev` in non-production
