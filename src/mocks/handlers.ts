import { friendsHandlers } from './friendsHandlers';
import { notificationsHandlers } from './notificationsHandlers';

export const handlers = [...friendsHandlers, ...notificationsHandlers];
