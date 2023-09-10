import {atom} from 'jotai';
import { DataConnection } from 'peerjs';
import { Message } from '../Types';

export const colorSchemeAtom = atom('dark');
export const peerIdAtom = atom('');
export const meetingIdAtom = atom('');
export const userFullNameAtom = atom('');
export const messagesAtom = atom<Message[]>([]);
export const remoteDataConnectionAtom = atom<DataConnection[]>([]);