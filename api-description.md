---

## Reaction

1. `DELETE` /challenge-records/{challengeRecordId}/reactions/{reactionId} : 본인이 단 리액션을 삭제한다

- Parameters
  - **challengeRecordId**
  - reactionId

1. `POST` /challenge-records/{challengeRecordId}/reactions : 인증 후 챌린지 기록에 리액션을 추가한다. 인증 전 챌린지 기록에는 리액션을 남길 수 없다.

- 보낼 때 형태 예시

```
{
  "reactionCode": "MUSCLE"
}
```

- Parameters
  - **challengeRecordId**
- 응답 예시

```
{
  "reactionId": 9001,
  "challengeRecordId": 1,
  "userId": 1,
  "reactionBody": "CLAP",
  "createdAt": "2026-05-01T10:30:00"
}
```

## Feed

1. `GET` /group-challenges/{groupChallengeId}/challenge-records/{challengeRecordId} : 피드 상세 조회, 챌린지 기록 피드 상세를 리스트 카드와 같은 인터페이스로 조회한다. 상세에서는 콕/리액션 상세 필드를 함께 제공한다.

- Parameters
  - groupChallengeId
  - challengeRecordId
  - Authorization : Bearer {accessToken} 형식의 서비스 access token
- 응답형태 (예시)

```
{
  "groupMemberId": 100,
  "groupChallengeParticipantId": 1000,
  "userId": 10,
  "displayName": "민준",
  "profileImageUrl": "https://example.com/profiles/minjun.png",
  "isUserWithdrawn": false,
  "isMe": false,
  "memberStatus": "ACTIVE",
  "participantStatus": "JOINED",
  "dailyStatus": "GOAL_ACHIEVED",
  "includedInGroupResult": true,
  "goals": [
    {
      "userUsageGoalTimeId": 900,
      "usageGoalType": "TOTAL_USAGE",
      "goalMinutes": 120,
      "effectiveDate": "2026-05-03"
    }
  ],
  "challengeRecordId": 10000,
  "activityRecord": {
    "submittedAt": "2026-05-03T13:00:00",
    "activityImageUrl": "https://example.com/activity-records/10000.png",
    "reflectionText": "오늘 인증 완료",
    "allAchieved": true,
    "details": [
      {
        "usageGoalType": "TOTAL_USAGE",
        "usedMinutes": 90,
        "goalMinutes": 120,
        "isAchieved": true
      }
    ]
  },
  "reactionCount": 4,
  "commentCount": 2,
  "pokeCount": 0,
  "isPoked": false,
  "pokeable": false,
  "pokedUsers": [],
  "reactions": {
    "totalCount": 1,
    "summary": [
      {
        "reactionBody": "CLAP",
        "userId": 11,
        "displayName": "서연",
        "profileImageUrl": "https://example.com/profiles/seoyeon.png",
        "isUserWithdrawn": false
      }
    ]
  }
}
```

1. `GET` /group-challenges/{groupChallengeId}/overview : 홈 화면의 피드 목록 외 챌린지/모임 개요 정보를 조회한다.

- Parameters
  - groupChallengeId
  - Authorization
- 응답 예시

```
{
  "groupChallengeId": 1,
  "groupId": 10,
  "groupName": "수능방",
  "challengeNo": 3,
  "status": "ACTIVE",
  "startAt": "2026-05-03T09:00:00",
  "endAt": null,
  "streakCount": 3
}
```

1. `GET` /group-challenges/{groupChallengeId}/challenge-records/today : 홈 화면에서 오늘 피드를 조회한다. 누락된 오늘 챌린지 기록을 생성하고 활성 멤버만 반환한다.

- Parameters
  - groupChallengeId
  - Authorization
- 응답 예시

```
{
  "groupId": 10,
  "date": "2026-05-03",
  "dailySummary": {
    "date": "2026-05-03",
    "dayStatus": "IN_PROGRESS",
    "result": null,
    "activeMemberCount": 2,
    "certifiedMemberCount": 1,
    "requiredCount": 1
  },
  "members": [
    {
      "groupMemberId": 100,
      "groupChallengeParticipantId": 1000,
      "userId": 10,
      "displayName": "민준",
      "profileImageUrl": "https://example.com/profiles/minjun.png",
      "isUserWithdrawn": false,
      "isMe": false,
      "memberStatus": "ACTIVE",
      "participantStatus": "JOINED",
      "dailyStatus": "GOAL_ACHIEVED",
      "includedInGroupResult": true,
      "goals": [
        {
          "userUsageGoalTimeId": 900,
          "usageGoalType": "TOTAL_USAGE",
          "goalMinutes": 120,
          "effectiveDate": "2026-05-03"
        }
      ],
      "challengeRecordId": 10000,
      "activityRecord": {
        "submittedAt": "2026-05-03T13:00:00",
        "activityImageUrl": "https://example.com/activity-records/10000.png",
        "reflectionText": "오늘 인증 완료",
        "allAchieved": true,
        "details": [
          {
            "usageGoalType": "TOTAL_USAGE",
            "usedMinutes": 90,
            "goalMinutes": 120,
            "isAchieved": true
          }
        ]
      },
      "reactionCount": 4,
      "commentCount": 2,
      "pokeCount": 0,
      "isPoked": false
    },
    {
      "groupMemberId": 101,
      "groupChallengeParticipantId": 1001,
      "userId": 11,
      "displayName": "서연",
      "profileImageUrl": "https://example.com/profiles/seoyeon.png",
      "isUserWithdrawn": false,
      "isMe": false,
      "memberStatus": "ACTIVE",
      "participantStatus": "JOINED",
      "dailyStatus": "NOT_CERTIFIED",
      "includedInGroupResult": true,
      "goals": [],
      "challengeRecordId": 10001,
      "activityRecord": null,
      "reactionCount": 0,
      "commentCount": 1,
      "pokeCount": 3,
      "isPoked": true
    }
  ]
}
```

1. `GET` /group-challenges/{groupChallengeId}/challenge-records : 캘린더 히스토리 화면에서 과거 날짜의 피드를 조회한다. 오늘 이전 날짜만 허용하고 기록을 생성하지 않는다.

- Parameters
  - groupChallengeId
  - date : query, (조회 날짜(yyyy-MM-dd, KST 기준). 오늘 이전 날짜만 허용)
  - Authorization
- 응답 예시

```
{
  "groupId": 10,
  "date": "2026-05-03",
  "dailySummary": {
    "date": "2026-05-03",
    "dayStatus": "IN_PROGRESS",
    "result": null,
    "activeMemberCount": 2,
    "certifiedMemberCount": 1,
    "requiredCount": 1
  },
  "members": [
    {
      "groupMemberId": 100,
      "groupChallengeParticipantId": 1000,
      "userId": 10,
      "displayName": "민준",
      "profileImageUrl": "https://example.com/profiles/minjun.png",
      "isUserWithdrawn": false,
      "isMe": false,
      "memberStatus": "ACTIVE",
      "participantStatus": "JOINED",
      "dailyStatus": "GOAL_ACHIEVED",
      "includedInGroupResult": true,
      "goals": [
        {
          "userUsageGoalTimeId": 900,
          "usageGoalType": "TOTAL_USAGE",
          "goalMinutes": 120,
          "effectiveDate": "2026-05-03"
        }
      ],
      "challengeRecordId": 10000,
      "activityRecord": {
        "submittedAt": "2026-05-03T13:00:00",
        "activityImageUrl": "https://example.com/activity-records/10000.png",
        "reflectionText": "오늘 인증 완료",
        "allAchieved": true,
        "details": [
          {
            "usageGoalType": "TOTAL_USAGE",
            "usedMinutes": 90,
            "goalMinutes": 120,
            "isAchieved": true
          }
        ]
      },
      "reactionCount": 4,
      "commentCount": 2,
      "pokeCount": 0,
      "isPoked": false
    },
    {
      "groupMemberId": 101,
      "groupChallengeParticipantId": 1001,
      "userId": 11,
      "displayName": "서연",
      "profileImageUrl": "https://example.com/profiles/seoyeon.png",
      "isUserWithdrawn": false,
      "isMe": false,
      "memberStatus": "ACTIVE",
      "participantStatus": "JOINED",
      "dailyStatus": "NOT_CERTIFIED",
      "includedInGroupResult": true,
      "goals": [],
      "challengeRecordId": 10001,
      "activityRecord": null,
      "reactionCount": 0,
      "commentCount": 1,
      "pokeCount": 3,
      "isPoked": true
    }
  ]
}
```

## Comment (댓글)

1. `GET` /challenge-records/{challengeRecordId}/comments : 챌린지 기록의 현재 상태에 맞는 댓글 목록을 조회한다. 인증 전 기록이면 인증 전 댓글, 인증 후 기록이면 인증 후 댓글만 반환한다.

- Parameters
  - **challengeRecordId**
- 응답 형태 예시

```
{
  "totalCount": 123,
  "items": [
    {
      "commentId": 1,
      "author": {
        "userId": 3,
        "displayName": "민준",
        "profileImageUrl": "https://cdn.detoxmate.co.kr/profile/3.png",
        "isUserWithdrawn": false
      },
      "commentBody": "와 대박! 오늘도 성공하셨네 독하다 독해",
      "createdAt": "2026-04-26T10:00:00"
    }
  ],
  "nextCursor": "eyJpZCI6MX0="
}
```

1. `POST` /challenge-records/{challengeRecordId}/comments : 챌린지 기록에 댓글을 작성한다. 챌린지 기록 상태에 따라 인증 전 댓글 또는 인증 후 댓글로 저장된다.

- Parameters
  - **challengeRecordId**
- Request body

```json
{
  "commentBody": "오늘도 화이팅!"
}
```

- 응답 형태 예시

```
{
  "commentId": 10,
  "challengeRecordId": 1,
  "userId": 1,
  "commentBody": "오늘도 화이팅!",
  "createdAt": "2026-05-01T10:30:00"
}
```

## Group Activity Calendar

1. `GET` /group-challenges/{groupChallengeId}/activity-calendar : 첫 인증 시작일 이후의 그룹 인증 누적 요약과 오늘을 제외한 그룹 스트릭을 조회한다.

- Parameters
  - groupChallengeId
  - Authorization
- 응답 형태 예시

```
{
  "groupId": 1,
  "streakDays": 4,
  "summary": {
    "startDate": "2026-04-10",
    "endDate": "2026-05-07",
    "allCount": 0,
    "halfCount": 7,
    "resetCount": 3
  }
```

## Poke

1. `POST` /challenge-records/{challengeRecordId}/pokes/{receiverUserId} : 오늘 인증 전 챌린지 기록에서 대상 유저를 콕 찌른다. 같은 대상에게는 한 번만 콕 찌르기 가능하다.

- Parameters
  - ChallengeRecordId
  - receiverUserId
- 응답 형태 예시 (204)

## Group Member

1. `POST` /groups/{groupId}/members/{groupMemberId} : 같은 그룹의 활성 멤버 프로필, 현재 목표, D-day, 달성 통계를 조회한다.

- Parameters
  - groupId
  - groupMemberId
  - Authorization
- 응답 형태 예시

```
{
  "groupMemberId": 100,
  "userId": 1,
  "groupId": 1,
  "displayName": "의진",
  "profileImageUrl": "https://example.com/profile.png",
  "role": "MEMBER",
  "memberStatus": "ACTIVE",
  "joinedAt": "2026-05-01T23:50:00",
  "goalStatus": "SET",
  "isUserWithdrawn": false,
  "currentGoals": [
    {
      "id": 101,
      "usageGoalType": "TOTAL_USAGE",
      "goalMinutes": 120,
      "createdAt": "2026-05-01T10:00:00"
    },
    {
      "id": 102,
      "usageGoalType": "INSTAGRAM",
      "goalMinutes": 30,
      "createdAt": "2026-05-01T10:00:00"
    }
  ],
  "goalChangeAvailability": {
    "canChange": false,
    "nextChangeAvailableDate": "2026-05-15",
    "remainingDays": 1
  },
  "activitySummary": {
    "firstCertifiedDate": "2026-05-05",
    "dayCount": 8,
    "achievementRate": 75
  },
  "weeklySummary": {
    "startDate": "2026-05-06",
    "endDate": "2026-05-12",
    "totalDays": 7,
    "averageUsedMinutes": 90,
    "goalMinutes": 120,
    "differenceMinutes": 30,
    "certifiedDays": 5,
    "achievedDays": 3
  }
}
```

```
{
  "code": "FORBIDDEN",
  "message": "Forbidden",
  "status": 403
}
```
