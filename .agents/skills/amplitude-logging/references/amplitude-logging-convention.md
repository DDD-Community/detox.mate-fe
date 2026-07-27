# DetoxMate Amplitude Logging Convention

Use this file only when the repository docs are unavailable. In the repo, prefer:

- `docs/amplitude-logging-convention.md`
- `docs/amplitude-event-schema.md`
- `src/lib/analytics.ts`

## Rules

- Add or modify the schema first in `docs/amplitude-event-schema.md`.
- Keep `src/lib/analytics.ts` `ANALYTICS_EVENT_NAMES` in sync with the schema.
- Use unique event names. Do not use generic event names like `Screen Viewed` or `Button Clicked`.
- Use `{Page Name} Viewed` for screen views.
- Use `{Page Name} {Action} Clicked` for UI interactions without a separate success event.
- Use product success events after confirmed success.
- Do not log both a click/attempt event and a success event for the same API or state-changing action.
- Do not send PII or sensitive values: names, nicknames, invite code raw values, comment text, retro text, image URLs, or tokens.
- Do not add `environment` or `build_channel`; Amplitude project/API key separates dev and prod.

## Product Success Events

Prefer success events for funnel/cohort analysis:

| eventName                           | Record after                           |
| ----------------------------------- | -------------------------------------- |
| `Login Completed`                   | Login succeeds and `setUserId` can run |
| `Group Created`                     | `POST /groups` succeeds                |
| `Group Joined`                      | `POST /groups/join` succeeds           |
| `Goal Time Set`                     | Goal time save API succeeds            |
| `Verification Completed`            | Activity record submission succeeds    |
| `Push Notification Setting Updated` | Notification setting PATCH succeeds    |

## Components

Use `LoggingPage` for screen views.

```tsx
<LoggingPage eventName="Goal Setup Viewed" properties={{ pageName: 'GoalSetup', mode }}>
  <View>{/* screen */}</View>
</LoggingPage>
```

Use `LoggingButton` only when the child receives `onPress` directly.

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

Do not use `LoggingButton` for:

- `Checkbox` with `onChange`
- `Switch` with `onValueChange`
- `ReactionPicker` with `onSelect`
- `TextInput` with `onSubmitEditing`
- wheel picker value changes

For those, log in the handler only when the interaction should be tracked.

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

## Verification

Run:

```bash
pnpm exec tsc --noEmit
```

Check stale or likely duplicated event candidates:

```bash
rg "Started|Complete Clicked|Save Clicked|Toggle Clicked" src docs
```

Treat search results as review candidates. The key question is whether a success event already covers the same action.
