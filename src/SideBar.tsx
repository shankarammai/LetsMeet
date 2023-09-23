import { ActionIcon, Tabs, TextInput } from '@mantine/core';
import { useAtom } from 'jotai';
import { FaUser, FaArrowCircleRight } from 'react-icons/fa';
import { messagesAtom, peerIdAtom } from './store/store';
import { useRef } from 'react';
import ChatBox from './ChatBox';
export default function SideBar({ sendMessage }: {sendMessage:any}) {
  const [messages, _setMessages] = useAtom(messagesAtom);
  const [peerId, _setPeerId] = useAtom(peerIdAtom);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const content = messages
    .map((message, index) => 
    <ChatBox message={message} isMyMessage={message.userId === peerId} key={'message'+index}></ChatBox>
    );
  const handleSendMesage = () => {
    sendMessage(messageInputRef.current?.value);
    messageInputRef.current!.value = '';
    messageInputRef.current?.focus();
  }

  return (
    <Tabs color="indigo" variant="pills" radius="xs" defaultValue="Chat">
      <Tabs.List grow>
        <Tabs.Tab value="Chat" icon={<FaUser size="0.8rem" />}>Chat</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="Chat" pt="xs">
        {content}
        <TextInput
          ref={messageInputRef}
          radius="xl"
          size="md"
          rightSection={
            <ActionIcon size={32} radius="xl" variant="filled" color='primary' onClick={handleSendMesage}>
              <FaArrowCircleRight size="1.1rem" stroke={1.5} />
            </ActionIcon>
          }
          placeholder="Write a Message"
          rightSectionWidth={42}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              handleSendMesage();
            }
          }}
        />
      </Tabs.Panel>
    </Tabs>
  )
}
