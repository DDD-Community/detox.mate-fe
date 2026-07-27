import { Icon } from '../Icon';
import { Toast, ToastPosition, useToastVisibility } from '../Toast';
import { primitiveColors } from '@/lib/token';

const { green } = primitiveColors;
const DEFAULT_AUTO_HIDE_MS = 2000;

interface ClipboardCopyToastProps {
  visible: boolean;
  position?: ToastPosition;
  bottomOffset?: number;
  fullWidth?: boolean;
}

export function useClipboardCopyToast(autoHideMs = DEFAULT_AUTO_HIDE_MS) {
  const { visible, show } = useToastVisibility(autoHideMs);

  return { copyToastVisible: visible, showCopyToast: show };
}

export function ClipboardCopyToast({
  visible,
  position = 'aboveCta',
  bottomOffset,
  fullWidth,
}: ClipboardCopyToastProps) {
  return (
    <Toast
      visible={visible}
      message="초대코드가 클립보드에 복사되었어요!"
      icon={<Icon name="checkCircle" size={16} weight="fill" color={green[300]} />}
      position={position}
      bottomOffset={bottomOffset}
      fullWidth={fullWidth}
    />
  );
}
