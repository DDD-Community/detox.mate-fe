import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { ArrowUpIcon } from 'phosphor-react-native/src/icons/ArrowUp';
import { BellIcon } from 'phosphor-react-native/src/icons/Bell';
import { BellRingingIcon } from 'phosphor-react-native/src/icons/BellRinging';
import { CameraIcon } from 'phosphor-react-native/src/icons/Camera';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { CaretUpIcon } from 'phosphor-react-native/src/icons/CaretUp';
import { ChatIcon } from 'phosphor-react-native/src/icons/Chat';
import { ChatTeardropIcon } from 'phosphor-react-native/src/icons/ChatTeardrop';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { CopyIcon } from 'phosphor-react-native/src/icons/Copy';
import { GearSixIcon } from 'phosphor-react-native/src/icons/GearSix';
import { HouseIcon } from 'phosphor-react-native/src/icons/House';
import { ImageSquareIcon } from 'phosphor-react-native/src/icons/ImageSquare';
import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { MinusIcon } from 'phosphor-react-native/src/icons/Minus';
import { MinusCircleIcon } from 'phosphor-react-native/src/icons/MinusCircle';
import { PaperPlaneRightIcon } from 'phosphor-react-native/src/icons/PaperPlaneRight';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { PlusCircleIcon } from 'phosphor-react-native/src/icons/PlusCircle';
import { QuestionIcon } from 'phosphor-react-native/src/icons/Question';
import { ShareFatIcon } from 'phosphor-react-native/src/icons/ShareFat';
import { SignOutIcon } from 'phosphor-react-native/src/icons/SignOut';
import { SmileyStickerIcon } from 'phosphor-react-native/src/icons/SmileySticker';
import { SquaresFourIcon } from 'phosphor-react-native/src/icons/SquaresFour';
import { TargetIcon } from 'phosphor-react-native/src/icons/Target';
import { UploadSimpleIcon } from 'phosphor-react-native/src/icons/UploadSimple';
import { UserIcon } from 'phosphor-react-native/src/icons/User';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { XIcon } from 'phosphor-react-native/src/icons/X';

export const iconComponents = {
  arrowUp: ArrowUpIcon,
  bell: BellIcon,
  bellRinging: BellRingingIcon,
  camera: CameraIcon,
  calendarBlank: CalendarBlankIcon,
  caretDown: CaretDownIcon,
  caretLeft: CaretLeftIcon,
  caretRight: CaretRightIcon,
  caretUp: CaretUpIcon,
  chat: ChatIcon,
  chatTeardrop: ChatTeardropIcon,
  check: CheckIcon,
  checkCircle: CheckCircleIcon,
  copy: CopyIcon,
  gearSix: GearSixIcon,
  house: HouseIcon,
  imageSquare: ImageSquareIcon,
  info: InfoIcon,
  minus: MinusIcon,
  minusCircle: MinusCircleIcon,
  paperPlaneRight: PaperPlaneRightIcon,
  pencilSimple: PencilSimpleIcon,
  plus: PlusIcon,
  plusCircle: PlusCircleIcon,
  question: QuestionIcon,
  shareFat: ShareFatIcon,
  signOut: SignOutIcon,
  smileySticker: SmileyStickerIcon,
  squaresFour: SquaresFourIcon,
  target: TargetIcon,
  uploadSimple: UploadSimpleIcon,
  user: UserIcon,
  warningCircle: WarningCircleIcon,
  x: XIcon,
} as const satisfies Record<string, PhosphorIcon>;

export const iconNames = Object.keys(iconComponents) as IconName[];

export type IconName = keyof typeof iconComponents;
