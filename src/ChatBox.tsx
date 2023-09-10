import React from 'react'
import { Box } from '@mantine/core';
import { Message } from './Types'

interface Props {
    message:Message,
    isMyMessage: string,
}
export default function ChatBox({message , isMyMessage}: Props) {
  return (
    <Box
    bg={isMyMessage ? 'green.2' : 'blue.2'}
    mb={3}
    c="#fff"
    ta={isMyMessage ? 'right' : 'left'}
  >
    {message.data}
  </Box>
  )
}
