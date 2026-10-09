import type { MyPageResponse } from '@/api';

// GET /users/me 응답에서 id, pushNotificationEnabled가 제거되었다(MyPageResponse).
// 라우팅이 해제된 기존 마이페이지와 설정 화면이 계속 컴파일되도록 예전 필드를 선택 필드로 남겨둔다.
// 서버가 값을 주지 않으므로 이 필드들은 항상 undefined다.
export type LegacyMyProfile = MyPageResponse & {
  id?: number;
  pushNotificationEnabled?: boolean;
};
