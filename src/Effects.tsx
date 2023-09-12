import { Box} from '@mantine/core'
import { useAtom } from 'jotai'
import React from 'react'
import { videoLayersAtom } from './store/store'

export default function Effects() {
    const [videoLayers, setVideoLayers]= useAtom(videoLayersAtom);
    
    return (
    <div>
    <Box
      sx={(theme) => ({
        backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.colors.gray[0],
        textAlign: 'center',
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        cursor: 'pointer',

        '&:hover': {
          backgroundColor:
            theme.colorScheme === 'dark' ? theme.colors.dark[5] : theme.colors.gray[1],
        },
      })}
    >
      This is GaussianBlur
    </Box>
    </div>
  )
}
