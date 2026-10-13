import { queryOptions } from '@tanstack/react-query';
import type { AppError } from './errors/types';
import { getUser } from './generated/user/user';
import type { MyPageResponse } from './generated/model/myPageResponse';

// 사용자 태그는 Orval query 출력에 포함되어 있지 않아 기존 Axios factory를 조합한다.
export const getMyProfileQueryOptions = () =>
  queryOptions<MyPageResponse, AppError>({
    queryKey: ['users', 'me'],
    queryFn: () => getUser().getMe(),
    refetchOnMount: 'always',
  });
