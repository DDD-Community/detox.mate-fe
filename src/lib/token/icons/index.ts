import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { ArrowUpIcon } from 'phosphor-react-native/src/icons/ArrowUp';
import { CameraIcon } from 'phosphor-react-native/src/icons/Camera';
import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { CaretUpIcon } from 'phosphor-react-native/src/icons/CaretUp';
import { ChatIcon } from 'phosphor-react-native/src/icons/Chat';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { GearSixIcon } from 'phosphor-react-native/src/icons/GearSix';
import { ImageSquareIcon } from 'phosphor-react-native/src/icons/ImageSquare';
import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { MinusIcon } from 'phosphor-react-native/src/icons/Minus';
import { MinusCircleIcon } from 'phosphor-react-native/src/icons/MinusCircle';
import { PaperPlaneRightIcon } from 'phosphor-react-native/src/icons/PaperPlaneRight';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { PlusCircleIcon } from 'phosphor-react-native/src/icons/PlusCircle';
import { ShareFatIcon } from 'phosphor-react-native/src/icons/ShareFat';
import { SignOutIcon } from 'phosphor-react-native/src/icons/SignOut';
import { TargetIcon } from 'phosphor-react-native/src/icons/Target';
import { UploadSimpleIcon } from 'phosphor-react-native/src/icons/UploadSimple';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';

export const iconComponents = {
  arrowUp: ArrowUpIcon,
  camera: CameraIcon,
  caretDown: CaretDownIcon,
  caretLeft: CaretLeftIcon,
  caretRight: CaretRightIcon,
  caretUp: CaretUpIcon,
  chat: ChatIcon,
  check: CheckIcon,
  checkCircle: CheckCircleIcon,
  gearSix: GearSixIcon,
  imageSquare: ImageSquareIcon,
  info: InfoIcon,
  minus: MinusIcon,
  minusCircle: MinusCircleIcon,
  paperPlaneRight: PaperPlaneRightIcon,
  pencilSimple: PencilSimpleIcon,
  plus: PlusIcon,
  plusCircle: PlusCircleIcon,
  shareFat: ShareFatIcon,
  signOut: SignOutIcon,
  target: TargetIcon,
  uploadSimple: UploadSimpleIcon,
  warningCircle: WarningCircleIcon,
} as const satisfies Record<string, PhosphorIcon>;

export const iconNames = Object.keys(iconComponents) as IconName[];

export type IconName = keyof typeof iconComponents;
