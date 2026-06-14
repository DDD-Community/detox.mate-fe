# Analytics Schema

Amplitude is used for product behavior analysis: funnel drop-off, cohort retention, and interaction patterns. Server and DB data remain the source of truth for screen-time reduction and goal-achievement metrics.

## Common Properties

Every event should go through `src/lib/analytics.ts` so these properties are attached consistently.

| Property        | Description                                               |
| --------------- | --------------------------------------------------------- |
| `app_env`       | `development` or `production`                             |
| `app_version`   | App version from Expo config                              |
| `build_channel` | `local`, `testflight`, or `production`                    |
| `git_sha`       | Build git SHA when available                              |
| `platform`      | React Native platform                                     |
| `route`         | Current route for screen events or route-specific actions |

## Environment Variables

The SDK is disabled when no Amplitude key is configured.

Use one shared key:

- `AMPLITUDE_API_KEY`

Or use environment-specific keys:

- `AMPLITUDE_DEV_API_KEY`
- `AMPLITUDE_PROD_API_KEY`

## Privacy Rules

Do not send names, nicknames, emails, raw invite codes, auth tokens, screenshot images, OCR text, or free-form user input.

Use server IDs only when needed for funnel or segmentation, such as `group_id`, `group_challenge_id`, `challenge_record_id`, or `member_id`.

## Initial Events

| Event             | When                                  | Required properties             |
| ----------------- | ------------------------------------- | ------------------------------- |
| `App Opened`      | Analytics is initialized on app start | Common properties               |
| `Login Completed` | Social or test login succeeds         | `login_provider`, `is_new_user` |
| `Screen Viewed`   | A screen becomes visible              | `route`                         |

## Core Funnel Events

### Group Creation Funnel

1. `Onboarding Viewed`
2. `Group Create Started`
3. `Group Created`
4. `Invite Share Clicked`

### Invite Join Funnel

1. `Invite Code Opened`
2. `Group Join Started`
3. `Group Joined`
4. `Goal Setup Started`
5. `Goal Set`
6. `Verification Started`
7. `Verification Completed`

## Retention And Interaction Events

| Event                 | Purpose                             |
| --------------------- | ----------------------------------- |
| `Feed Viewed`         | Retention and daily return behavior |
| `Comment Created`     | Group interaction                   |
| `Reaction Added`      | Group interaction                   |
| `Poke Sent`           | Group interaction                   |
| `Notification Opened` | Push/open-loop behavior             |

## Failure Events

Success and failure events should be split when a step can fail.

| Event                 | Required properties |
| --------------------- | ------------------- |
| `Group Join Failed`   | `failure_reason`    |
| `Goal Set Failed`     | `failure_reason`    |
| `Verification Failed` | `failure_reason`    |
