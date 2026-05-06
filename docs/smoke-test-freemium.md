# Freemium Smoke Test Checklist

Short manual QA for the temporary freemium checker flow.

## Preconditions

- App runs locally.
- Browser DevTools Console is open (for analytics log checks).
- Test both an anonymous session (incognito) and a logged-in session.

## Checklist

1. **Anonymous first check works**
   - Enter a valid URL and click `Check website`.
   - Expected: request succeeds and results are shown.

2. **Full result is visible for anonymous first check**
   - Verify full `ResultCard` content is rendered (not partial/basic/paywalled).
   - Expected: full analysis details are visible.

3. **Refresh does not break the shown result**
   - With results visible, refresh the page.
   - Expected: app loads normally without broken UI/errors; checker remains usable.

4. **Anonymous second check is gated**
   - In the same anonymous session, submit another URL.
   - Expected: signup/login prompt appears **after** clicking `Check website`.

5. **Signup button behavior + event**
   - Click **Create free account** in the prompt.
   - Expected: signup modal/flow opens and `signup_started` is logged.

6. **Login button behavior + event**
   - Click **Log in** in the prompt.
   - Expected: login modal/flow opens and `login_started` is logged.

7. **Logged-in multiple checks**
   - Sign in, then run at least 2 different checks.
   - Expected: both checks complete successfully (no second-check gate).

8. **No payment/pricing language in checker flow**
   - Check homepage checker interactions, result area, and second-check prompt.
   - Expected: no payment/pricing wording in this flow.

9. **Analytics event order**
   - Anonymous first check expected order:
     - `anonymous_check_started`
     - `anonymous_check_completed`
   - Anonymous second attempt expected order:
     - `second_check_attempted`
     - `signup_prompt_shown`
   - Prompt button clicks:
     - signup button -> `signup_started`
     - login button -> `login_started`
   - Logged-in checks:
     - `registered_check_started`
     - `registered_check_completed`

10. **Lint passes**
    - Run: `npm run lint`
    - Expected: no ESLint errors.
