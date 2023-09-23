import React from 'react'
import { Paper, Text } from '@mantine/core';
import { Message } from './Types'

interface Props {
    message: Message,
    isMyMessage: boolean,
}
export default function ChatBox({ message, isMyMessage }: Props) {
    return (
        <Paper component="text" radius={"md"}
            display="block"
            sx={{
                overflow: "auto",
            }}
            bg={isMyMessage ? 'cyan.3' : 'teal.3'}
            mb={3}
            p={5}
            c="#fff"
            ta={isMyMessage ? 'right' : 'left'}

        >
            {message.data}
        </Paper>
    )
}
