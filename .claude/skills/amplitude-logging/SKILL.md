---
name: amplitude-logging
description: Use when adding, modifying, reviewing, or verifying DetoxMate FE Amplitude analytics logs. Applies to React Native/Expo files that use LoggingPage, LoggingButton, src/lib/analytics.ts, docs/amplitude-event-schema.md, product success events, user properties, or questions about whether an interaction should be logged.
---

# Amplitude Logging

## Core Workflow

When working on DetoxMate FE Amplitude logs:

1. Read `docs/amplitude-logging-convention.md` first.
2. Read `docs/amplitude-event-schema.md` when adding, removing, or renaming events.
3. Update `src/lib/analytics.ts` so `ANALYTICS_EVENT_NAMES` matches the schema.
4. Add logs in code using the smallest suitable mechanism.
5. Run the verification commands before reporting completion.

If the repo docs are unavailable, read `references/amplitude-logging-convention.md` as the fallback convention.

## Logging Rules

- Use unique event names, not generic names like `Button Clicked`.
- Use `{Page Name} Viewed` for screen views.
- Use `{Page Name} {Action} Clicked` for UI interactions without separate success events.
- Use product success events after confirmed success, such as `Group Created`, `Goal Time Set`, or `Verification Completed`.
- Do not log both a click/attempt event and a success event for the same API/state-changing action.
- Do not put PII or sensitive values in properties: names, nicknames, invite code raw values, comment text, retro text, image URLs, or tokens.
- Do not add `environment` or `build_channel`; dev/prod separation is handled by API key/project.

## Implementation Patterns

Use `LoggingPage` for screen views:

```tsx
<LoggingPage eventName="Goal Setup Viewed" properties={{ pageName: 'GoalSetup', mode }}>
  <View>{/* screen */}</View>
</LoggingPage>
```

Use `LoggingButton` only when the child receives `onPress` directly:

```tsx
<LoggingButton
  eventName="Settings Privacy Open Clicked"
  properties={{ pageName: 'Settings', buttonName: '개인정보 처리방침' }}
>
  <Pressable onPress={handlePrivacy}>
    <Text>개인정보 처리방침</Text>
  </Pressable>
</LoggingButton>
```

Do not use `LoggingButton` for `Checkbox`, `Switch`, `ReactionPicker`, `TextInput onSubmitEditing`, or wheel picker interactions. Log inside the handler only when the interaction is intentionally tracked.

```tsx
const handleToggleChange = (next: boolean) => {
  trackButtonClick(
    'Terms Agreement Privacy Agree Toggle Clicked',
    'TermsAgreement',
    '개인정보처리 방침 동의 토글'
  );
  setPrivacyAgreed(next);
};
```

For API/state-changing actions, log only after success:

```ts
const handleSave = async () => {
  await saveGoalTime();
  trackEvent('Goal Time Set', { mode });
};
```

## Verification

Always run:

```bash
pnpm exec tsc --noEmit
```

Check schema/type/usage consistency using the command in `docs/amplitude-logging-convention.md`.

Also search for stale or likely-duplicated events after cleanup:

```bash
rg "Started|Complete Clicked|Save Clicked|Toggle Clicked" src docs
```

Treat results as review candidates, not automatic failures. The key question is whether a success event already covers the same user action.
