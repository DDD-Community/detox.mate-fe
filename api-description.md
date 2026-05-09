1. `DELETE` /group-challenges/{groupChallengeId}/reactions/{reactionId} : 본인이 단 감정표현을 삭제한다

- Parameters
  - groupChallengeId
  - reactionId

2. `POST` /group-challenges/{groupChallengeId}/stamps/{stampId}/reactions : 감정 표현을 추가한다.

- 보낼 때 형태 예시

```
{
  "reactionCode": "MUSCLE"
}
```

- Parameters
  - groupChallengeId
  - stampId
- 응답 예시

```
{
  "reactionId": 9001,
  "groupChallengeId": 1,
  "stampId": 101,
  "userId": 1,
  "reactionBody": "MUSCLE",
  "createdAt": "2026-04-26T10:00:00Z"
}
```

3. `GET` /group-challenges/{groupChallengeId}/stamps/{stampId} : 해당 게시글의 상세 정보를 반환한다.

- Parameters
  - groupChallengeId
  - stampId
- 응답형태 (예시)

```
{
  "challenge": {
    "groupChallengeId": 1,
    "groupChallengeName": "수능 100일 전 모임",
    "startAt": "2026-04-20T00:00:00Z",
    "streakCount": 7
  },
  "members": [
    {
      "userId": 1,
      "groupMemberId": 11,
      "displayName": "강슬빈",
      "profileImageUrl": "https://cdn.detoxmate.co.kr/profile/1.png",
      "challengeStatus": "VERIFIED",
      "activityImageUrl": "https://cdn.detoxmate.co.kr/acting/1.png",
      "oneLineReview": "2시간 러닝 뛰고 옴",
      "totalUsedMinutes": 70,
      "goalMinutes": "8H 30M",
      "stampId": 101,
      "reactionCount": 3,
      "commentCount": 5,
      "pokeCount": 0,
      "isPoked": false
    },
    {
      "userId": 2,
      "groupMemberId": 12,
      "displayName": "김지호",
      "profileImageUrl": "https://cdn.detoxmate.co.kr/profile/2.png",
      "challengeStatus": "NOT_YET",
      "activityImageUrl": null,
      "oneLineReview": null,
      "totalUsedMinutes": null,
      "goalMinutes": "8H 30M",
      "stampId": null,
      "reactionCount": 0,
      "commentCount": 0,
      "pokeCount": 1,
      "isPoked": true
    }
  ]
}
```

4. `GET` /group-challenges/{groupChallengeId}/home : 진행 중인 그룹 챌린지의 홈 피드(챌린지 요약 + 멤버별 카드)를 반환한다.

- Parameters
  - groupChallengeId
- 응답 예시

```
{
  "challenge": {
    "groupChallengeId": 1,
    "groupChallengeName": "수능 100일 전 모임",
    "startAt": "2026-04-20T00:00:00Z",
    "streakCount": 7
  },
  "members": [
    {
      "userId": 1,
      "groupMemberId": 11,
      "displayName": "강슬빈",
      "profileImageUrl": "https://cdn.detoxmate.co.kr/profile/1.png",
      "challengeStatus": "VERIFIED",
      "activityImageUrl": "https://cdn.detoxmate.co.kr/acting/1.png",
      "oneLineReview": "2시간 러닝 뛰고 옴",
      "totalUsedMinutes": 70,
      "goalMinutes": "8H 30M",
      "stampId": 101,
      "reactionCount": 3,
      "commentCount": 5,
      "pokeCount": 0,
      "isPoked": false
    },
    {
      "userId": 2,
      "groupMemberId": 12,
      "displayName": "김지호",
      "profileImageUrl": "https://cdn.detoxmate.co.kr/profile/2.png",
      "challengeStatus": "NOT_YET",
      "activityImageUrl": null,
      "oneLineReview": null,
      "totalUsedMinutes": null,
      "goalMinutes": "8H 30M",
      "stampId": null,
      "reactionCount": 0,
      "commentCount": 0,
      "pokeCount": 1,
      "isPoked": true
    }
  ]
}
```

5. `GET` /group-challenges/{groupChallengeId}/stamps/{stampId}/comments : 게시물의 댓글 목록을 커서 기반으로 조회한다.

- Parameters
  - groupChallengeId
  - stampId
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
        "profileImageUrl": "https://cdn.detoxmate.co.kr/profile/3.png"
      },
      "body": "와 대박! 오늘도 성공하셨네 독하다 독해",
      "relatedComment": [
        {
          "commentId": 2,
          "author": {
            "userId": 4,
            "displayName": "지수",
            "profileImageUrl": "https://cdn.detoxmate.co.kr/profile/4.png"
          },
          "body": "ㄹㅇ 멋있어요",
          "createdAt": "2026-04-26T11:00:00Z"
        }
      ],
      "createdAt": "2026-04-26T10:00:00Z",
      "replyCount": 1
    }
  ],
  "nextCursor": "eyJpZCI6MX0="
}
```
