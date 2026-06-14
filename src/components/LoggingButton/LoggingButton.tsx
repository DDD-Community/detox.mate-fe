import { cloneElement, isValidElement, type ReactElement } from 'react';
import type { GestureResponderEvent } from 'react-native';

import {
  trackButtonClick,
  type AnalyticsEventName,
  type AnalyticsProperties,
} from '../../lib/analytics';

type LoggingButtonChildProps = {
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => unknown;
};

type LoggingButtonProperties = AnalyticsProperties & {
  pageName: string;
  buttonName: string;
};

interface LoggingButtonProps {
  eventName: AnalyticsEventName;
  properties: LoggingButtonProperties;
  children: ReactElement<LoggingButtonChildProps>;
}

export function LoggingButton({ eventName, properties, children }: LoggingButtonProps) {
  if (!isValidElement<LoggingButtonChildProps>(children)) {
    return children;
  }

  const isDisabled = children.props.disabled === true;
  const childOnPress = children.props.onPress;

  const handlePress = (event: GestureResponderEvent) => {
    if (isDisabled) return;

    const { pageName, buttonName, ...eventProperties } = properties;

    trackButtonClick(eventName, pageName, buttonName, eventProperties);
    return childOnPress?.(event);
  };

  return cloneElement(children, {
    onPress: handlePress,
  });
}
