import type { AppError, RequestErrorPolicy } from './types';

const DEFAULT_ERROR_MESSAGE = '요청을 처리하지 못했어요. 잠시 후 다시 시도해주세요';

const DEFAULT_MESSAGES_BY_TYPE: Record<AppError['type'], string> = {
  network: '네트워크 연결 상태를 확인한 뒤 다시 시도해주세요',
  timeout: '요청 시간이 초과됐어요. 잠시 후 다시 시도해주세요',
  auth: '다시 로그인해 주세요.',
  forbidden: '접근 권한이 없어요.',
  notFound: '요청한 정보를 찾을 수 없어요.',
  conflict: '요청을 완료할 수 없어요.',
  validation: '입력한 내용을 다시 확인해주세요.',
  server: DEFAULT_ERROR_MESSAGE,
  upload: '이미지 업로드에 실패했어요. 다시 시도해 주세요.',
  permission: '권한을 허용한 뒤 다시 시도해 주세요.',
  unknown: DEFAULT_ERROR_MESSAGE,
};

export function getUserErrorMessage(error: AppError, policy?: RequestErrorPolicy): string {
  if (policy?.userMessage) return policy.userMessage;
  if (error.code && policy?.messagesByCode?.[error.code]) return policy.messagesByCode[error.code];
  if (error.status && policy?.messagesByStatus?.[error.status]) {
    return policy.messagesByStatus[error.status]!;
  }

  return DEFAULT_MESSAGES_BY_TYPE[error.type] ?? DEFAULT_ERROR_MESSAGE;
}
