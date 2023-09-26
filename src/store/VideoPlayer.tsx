import { AspectRatio } from '@mantine/core';
import { useEffect, useRef } from 'react';

export default function VideoPlayer({stream, muted}: {stream:MediaStream, muted:boolean}) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream])

    return (
        <>
        <AspectRatio ratio={720 / 360}
         miw={{base:300, md:600, lg:720}}
         mah={{base:300, md:600, lg:1080}}
         mih={{base:169, md:338, lg:405}}
         maw={{base:169, md:338, lg:608}}
         mx="auto">
            <video ref={videoRef} autoPlay muted={muted}/>
        </AspectRatio>
        </>
    )
}
