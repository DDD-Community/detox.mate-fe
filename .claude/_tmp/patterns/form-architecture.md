# Form Architecture Pattern

> account-info feature 구현 기반 정리. 새 폼 feature 작성 시 이 문서를 참고한다.

## 핵심 원칙: Self-Contained Atomic Field

### 1. 의존성은 container가 아닌 사용하는 곳에 둔다

- Validation 스키마(Zod)는 각 Field 컴포넌트 파일 내부에 **private**으로 정의한다
- `schema.ts`에 Zod 스키마를 모아두고 Form이 주입하는 방식은 사용하지 않는다
- "내가 쓸 건 내가 갖고 있는다" — Field가 자기 검증 로직을 소유한다

### 2. 조립하는 쪽(Form)은 validation을 모른다

- Form은 `<NameInput>`, `<EmailInput>` 등을 배치만 한다
- 각 필드가 어떤 규칙으로 검증되는지는 Form의 관심사가 아니다
- `schema.ts`는 TypeScript interface(타입 계약)만 유지한다

---

## 폴더 구조

```
features/{feature-name}/
├── model/
│   ├── schema.ts              # FormData 인터페이스 (SSOT)
│   └── use{Feature}Form.ts    # useForm 훅 (defaultValues, 서버 데이터 매핑)
├── ui/
│   ├── {Feature}Form.tsx      # FormProvider + submit + 레이아웃 조합
│   ├── {Feature}Form.css.ts   # 반응형 레이아웃용 CSS (VStack으로 대체 불가한 것만)
│   ├── {FieldGroup}Fields.tsx  # 필드 그룹 컴포넌트 (atomic form unit)
│   └── {SingleField}.tsx       # 단일 필드 컴포넌트
├── api/
│   └── hooks/                  # mutation/query 훅
└── index.ts                    # public export
```

실제 예시 (account-info):

```
features/account-info/
├── model/
│   ├── schema.ts                  # AccountInfoFormData 인터페이스
│   └── useAccountInfoForm.ts      # useForm + 서버 데이터 기본값 매핑
├── ui/
│   ├── AccountInfoForm.tsx        # FormProvider + VStack 조합
│   ├── AccountInfoForm.css.ts     # 반응형 row/col 전환 CSS
│   ├── NameFields.tsx             # First/Last Name (zod 검증 포함)
│   ├── EmailField.tsx             # Email (검증 없음, disabled)
│   ├── PasswordFields.tsx         # Password 3종 (zod + 커스텀 검증)
│   └── ProfileFields.tsx          # AgeGroup, Birthday, Gender (select 기반)
├── api/
│   ├── hooks/useUpdateMyInfoMutation.ts
│   ├── withdrawMember.ts
│   └── index.ts
└── index.ts
```

---

## 핵심 패턴

### 1. FormData 인터페이스 — SSOT (model/schema.ts)

전체 폼의 타입을 한 곳에서 정의하고, 필드 컴포넌트들은 `Pick`으로 필요한 필드만 사용한다.

```ts
// model/schema.ts
export interface AccountInfoFormData {
  firstName: string;
  lastName: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
  ageGroup: string;
  birthMonth: string;
  birthDay: string;
  gender: string;
}
```

### 2. useForm 훅 — 서버 데이터 매핑 (model/use{Feature}Form.ts)

- `useSuspenseQuery`로 서버 데이터 fetch
- `useForm<FormData>`에 defaultValues 매핑
- 폼 훅은 `methods`만 반환, 로직은 필드 컴포넌트 내부에서 자율적으로 관리

```ts
// model/useAccountInfoForm.ts
import type { AccountInfoFormData } from './schema';

export const useAccountInfoForm = () => {
  const { data: myInfo } = useSuspenseQuery(myInfoQueries.forEdit());

  const methods = useForm<AccountInfoFormData>({
    defaultValues: {
      firstName: myInfo?.first_name ?? '',
      // ...서버 → 폼 필드 매핑
    },
  });

  return methods;
};
```

### 3. 필드 컴포넌트 타입 — Pick 패턴

각 필드 컴포넌트는 `useFormContext<Pick<FormData, ...>>()`으로 자신이 사용하는 필드만 타입을 지정한다.

```ts
// NameFields.tsx — 자신의 필드만 Pick
const {
  control,
  formState: { errors },
} = useFormContext<Pick<AccountInfoFormData, 'firstName' | 'lastName'>>();

// PasswordFields.tsx — 다른 필드 값 참조 필요 시 Pick에 포함
const { control, getValues } =
  useFormContext<
    Pick<AccountInfoFormData, 'currentPassword' | 'newPassword' | 'confirmNewPassword' | 'email'>
  >();
// → email은 이메일 ID 포함 검증에 사용 (getValues('email'))
```

### 4. 검증 패턴 — Controller rules + zod safeParse

`FormTextField`는 `rules` prop을 지원하지 않으므로, 검증이 필요하면 `Controller`를 직접 사용한다.

#### 패턴 A: zod safeParse → Controller rules.validate (텍스트 필드)

zod 스키마로 검증 규칙을 선언하고, `safeParse`를 통해 에러 메시지를 반환한다.

```ts
// NameFields.tsx
const nameSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First Name is a required field.')
    .max(35, 'Please enter a maximum of 35 characters.')
    .refine(validateEnglishOnly, { message: 'Please enter English characters only.' }),
});

const validateFirst = (value: string) => {
  const result = nameSchema.shape.firstName.safeParse(value);
  return result.success || result.error.issues[0]?.message;
};

// JSX
<Controller
  name="firstName"
  control={control}
  rules={{ validate: validateFirst }}
  render={({ field }) => (
    <TextField
      error={errors.firstName?.message}
      // ...
    />
  )}
/>
```

#### 패턴 B: zod + 커스텀 로직 혼합 (패스워드 크로스필드 검증)

zod로 기본 규칙을 검사한 후, 다른 필드 값(`getValues`)을 참조하는 커스텀 검증을 추가한다.

```ts
// PasswordFields.tsx
const newPasswordSchema = z
  .string()
  .optional()
  .refine((val) => !val || (val.length >= 8 && val.length <= 16), {
    message: PASSWORD_ERROR_MESSAGES.length,
  })
  .refine((val) => !val || hasLetterAndNumber(val), {
    message: PASSWORD_ERROR_MESSAGES.letterAndNumber,
  })
  .refine((val) => !val || (!hasRepeatingChars(val) && !hasConsecutiveNumbers(val)), {
    message: PASSWORD_ERROR_MESSAGES.repeatingOrConsecutive,
  });

const validateNewPassword = (value: string) => {
  if (!value) return true;
  // 1단계: zod 스키마 검증
  const result = newPasswordSchema.safeParse(value);
  if (!result.success) return result.error.issues[0]?.message;

  // 2단계: 크로스필드 검증 (다른 필드 값 참조)
  const email = getValues('email');
  if (email && containsEmailId(value, email)) {
    return PASSWORD_ERROR_MESSAGES.containsEmailId;
  }
  return true;
};
```

#### 패턴 C: 검증 없음 → FormTextField 사용 (read-only 필드)

검증이 불필요한 필드(disabled, read-only)는 `FormTextField`를 그대로 사용한다.

```ts
// EmailField.tsx — 검증 없음, FormTextField 직접 사용
export const EmailField = () => {
  const { control } = useFormContext<Pick<AccountInfoFormData, 'email'>>();

  return (
    <FormTextField
      name="email"
      control={control}
      label="Email ID*"
      type="email"
      disabled
    />
  );
};
```

### 5. 필드 자율성 — useWatch 내재화

필드 컴포넌트가 필요로 하는 watch/effect 로직은 컴포넌트 내부에서 관리한다. 부모로부터 prop을 받지 않는다.

```ts
// ProfileFields.tsx — birthMonth watch + birthDay 리셋을 내부에서 처리
export const ProfileFields = () => {
  const { control, setValue } = useFormContext<Pick<AccountInfoFormData, ...>>();

  const selectedMonth = useWatch({ control, name: 'birthMonth' });

  useEffect(() => {
    setValue('birthDay', '');
  }, [selectedMonth, setValue]);

  // ...
};
```

---

## 레이아웃 패턴

### VStack/HStack 우선, 반응형은 CSS class 병행

- 고정 방향 레이아웃: `VStack`, `HStack` 사용
- **반응형 (mobile: column → desktop: row) 전환이 필요한 곳**: CSS class 사용

```tsx
// AccountInfoForm.tsx — 고정 세로 배치
<VStack gap={36}>
  <NameFields />
  <EmailField />
  {isEmailUser && <PasswordFields />}
  <ProfileFields />
</VStack>

// 버튼 — 고정 가로 배치
<HStack gap={12} className={styles.buttonGroup}>
  <div className={styles.buttonFlex}>
    <Button text="Cancel" type="line" />
  </div>
  <div className={styles.buttonFlex}>
    <Button text="Update" type="solid" buttonType="submit" />
  </div>
</HStack>
```

```tsx
// NameFields.tsx — 반응형 col→row 전환은 CSS
<VStack gap={8}>
  <div className={styles.nameRow}>
    {' '}
    {/* mobile: column, desktop: row */}
    <div className={styles.flexGrow}>{/* firstName */}</div>
    <div className={styles.flexGrow}>{/* lastName */}</div>
  </div>
</VStack>
```

### 반응형 row 스타일 패턴 (Vanilla Extract)

```ts
// AccountInfoForm.css.ts
export const nameRow = style({
  display: 'flex',
  flexDirection: 'column', // mobile: 세로
  gap: '8px',
  '@media': {
    [tokens.mediaQuery.desktop]: {
      flexDirection: 'row', // desktop: 가로
      gap: '12px',
    },
  },
});

export const flexGrow = style({ flex: 1 });
```

---

## FormProvider 조합 패턴 (ui/{Feature}Form.tsx)

```tsx
export const AccountInfoForm = () => {
  const methods = useAccountInfoForm();
  const {
    handleSubmit,
    formState: { isValid },
  } = methods;
  const { mutate: updateMyInfo, isPending } = useUpdateMyInfoMutation();

  const submitHandler = (data: AccountInfoFormData) => {
    updateMyInfo(
      {
        /* 폼 → API 필드 매핑 */
      },
      {
        onSuccess: () => {
          /* toast + navigate */
        },
        onError: () => {
          /* error toast */
        },
      }
    );
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(submitHandler)}>
        {/* atomic field 컴포넌트 조합 */}
        <NameFields />
        <EmailField />
        <PasswordFields />
        <ProfileFields />
        {/* submit/cancel 버튼 */}
      </form>
    </FormProvider>
  );
};
```

---

## 공유 유틸리티

### 비밀번호 검증 유틸 (~/shared/lib/password-validation.ts)

| 함수                               | 설명                              |
| ---------------------------------- | --------------------------------- |
| `hasLetterAndNumber(password)`     | 문자 + 숫자 모두 포함             |
| `hasRepeatingChars(password)`      | 동일 문자 4회 이상 반복           |
| `hasConsecutiveNumbers(password)`  | 연속 숫자 4개 이상 (1234 등)      |
| `containsEmailId(password, email)` | 이메일 @ 앞부분이 비밀번호에 포함 |
| `PASSWORD_ERROR_MESSAGES`          | 에러 메시지 상수 객체             |

### 도메인 공유 컴포넌트 (~/domains/user/shared/ui/)

| 컴포넌트                | 용도                        | 제한                                                    |
| ----------------------- | --------------------------- | ------------------------------------------------------- |
| `FormTextField`         | Controller + TextField 래퍼 | `rules` prop 미지원 → 검증 필요 시 Controller 직접 사용 |
| `FormSelectField`       | Controller + SelectBox 래퍼 | placeholder 자동 추가                                   |
| `PasswordPolicyTooltip` | 비밀번호 정책 툴팁          | —                                                       |

---

## 판단 기준 요약

| 상황                                  | 패턴                                             |
| ------------------------------------- | ------------------------------------------------ |
| 검증 없는 필드 (disabled, read-only)  | `FormTextField` 직접 사용                        |
| 단일 필드 검증 (required, max, regex) | zod schema + `Controller rules={{ validate }}`   |
| 크로스필드 검증 (다른 필드 값 참조)   | zod + `getValues()` 커스텀 로직                  |
| 고정 방향 레이아웃                    | `VStack` / `HStack`                              |
| 반응형 방향 전환 (col↔row)            | CSS class (`@media` desktop)                     |
| 필드 간 연동 (watch + side effect)    | 해당 필드 컴포넌트 내부 `useWatch` + `useEffect` |
| 폼 전체 타입                          | `model/schema.ts`에서 `interface` export (SSOT)  |
| 필드 컴포넌트 타입                    | `useFormContext<Pick<FormData, ...>>()`          |
