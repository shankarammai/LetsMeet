import { useEffect, useMemo, useRef, useState } from 'react';
import Peer, { DataConnection, MediaConnection } from 'peerjs';
import { Affix, Button, Container, Drawer, Group, Input, Text, rem, Flex, ActionIcon, TextInput, CopyButton, } from '@mantine/core';
import VideoPlayer from './store/VideoPlayer';
import { useDisclosure } from '@mantine/hooks';
import SideBar from './SideBar';
import { useLocation, useNavigate } from 'react-router-dom';
import getUuidByString from 'uuid-by-string';
import { useAtom } from 'jotai';
import { messagesAtom, remoteDataConnectionAtom, peerIdAtom, videoLayersAtom, connectionUserNamesAtom, mediaConnectionsAtom } from './store/store';
import { Message } from './Types';
import { BsMicMuteFill, BsFillCameraVideoOffFill, BsCameraVideoFill, BsFillClipboardFill, BsFillClipboardCheckFill } from 'react-icons/bs';
import { FaMicrophone, FaUserAlt } from 'react-icons/fa';
import { AiOutlineFundProjectionScreen } from 'react-icons/ai';
import { BiPhoneCall } from 'react-icons/bi';
import { notifications } from '@mantine/notifications';
import etro from 'etro';



function App() {
    const navigate = useNavigate();
    const { state } = useLocation() ?? false;
    if (!state) {
        navigate('/');
    }
    const userName = state.userName;
    const userUniqueID = state.userUniqueID;
    const myPeerID = useMemo(() => getUuidByString(userUniqueID), [userUniqueID])

    const [peerId, setPeerId] = useAtom(peerIdAtom);
    const [remotePeerIdValue, setRemotePeerIdValue] = useState('');
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const currentUserVideoRef = useRef<HTMLVideoElement>(null);
    const [myVideoStream, setMyVideoStream] = useState<MediaStream>(new MediaStream());
    const peerInstance = useRef<Peer | null>(null);
    const [remoteMediaStreams, setRemoteMediaStreams] = useState<MediaStream[]>([]);
    const [mediaConnections, setMediaConnections] = useAtom(mediaConnectionsAtom);
    const [remoteDataConnections, setRemoteDataConnections] = useAtom(remoteDataConnectionAtom);
    const [connectionUserNames, setConnectionUserNames] = useAtom(connectionUserNamesAtom);
    const [opened, { open, close }] = useDisclosure(false);
    const [messages, setMessages] = useAtom(messagesAtom);
    const [isMuted, setIsMuted] = useState<boolean>(true);
    const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
    const [isShareScreen, setIsShareScreen] = useState<boolean>(true);
    const [videoLayers, setVideoLayers] = useAtom(videoLayersAtom);
    const canvasRef = useRef(null);

    useEffect(() => {
        const peer = new Peer();
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((mediaStream) => {
            setMyVideoStream(mediaStream);
        });

        peer.on('open', (id) => {
            setPeerId(id)
        });

        peer.on('close', () => {
            console.log('Data ended from another');
            closeCall();
        });

        //Setting the data Connection for Messages
        peer.on('connection', (connection) => {
            console.log('connecton established');
            setRemoteDataConnections((previous) => [connection, ...previous]);
            connection.on('data', (data) => {
                console.log('data received');
                console.log(data);
                setMessages((prev) => [...prev, data as Message]);
            })
        });

        peer.on('call', (call) => {
            console.log('call event tigerred');
            const metaData = call.metadata;
            notifications.show({
                id: 'incomingCallNotification',
                title: 'Ringing',
                message:
                    <>
                        <Group position="apart">
                            <Text>Call from {metaData.userName}</Text>
                            <ActionIcon size={'lg'} variant="filled" color='green' onClick={() => answerCall(call)}>
                                <BiPhoneCall />
                            </ActionIcon>
                            <ActionIcon size={'lg'} variant="filled" color='red' onClick={() => {
                                notifications.hide('incomingCallNotification');
                                call?.close();
                                setRemoteDataConnections([]);
                            }}>
                                <BiPhoneCall />
                            </ActionIcon>
                        </Group>
                    </>,
                color: 'blue',
                autoClose: false
            });

            //When the connection is closed
            call.on('close', () => {
                console.log('Call Ended from remote person');
                closeCall();
            })
        });

        peer.on('close', () => {
            notifications.hide('incomingCallNotification');
            notifications.hide('callingNotification');
            closeCall();
        });

        peerInstance.current = peer;
    }, [])

    const call = (remotePeerId: string) => {
        const options = {
            metadata: {
                userName: userName,
            }
        }
        const call = peerInstance.current!.call(remotePeerId, myVideoStream, options)

        notifications.show({
            id: 'callingNotification',
            title: 'Calling',
            message: 'Connecting with the given user',
            color: 'blue',
            autoClose: false
        });

        call.on('stream', (remoteStream) => {
            //Setting the Data Connection only after media connection is established, here remote user already accepted the call
            const con = peerInstance.current!.connect(remotePeerId, options);

            con.on('open', () => {
                console.log('Connection opened on caller');
                setRemoteDataConnections(prev => [con, ...prev]);
            });
            con.on('close', () => {
                notifications.hide('callingNotification');
                closeCall();
            });

            con.on('data', function (data) {
                console.log('Connection data received line 151');
                console.log(data);
                if ((data as Message).dataType == 'InitialConfig') {
                    console.log(data);
                    setConnectionUserNames([(data as Message).data]);
                }
                else {
                    setMessages((prev) => [...prev, data as Message]);
                }
            });
            notifications.hide('callingNotification');
            setRemoteMediaStreams([remoteStream]);
            setMediaConnections([call]);
        });

        call.on('close', () => {
            closeCall();
            notifications.hide('callingNotification')
        })
    }

    const answerCall = (call: MediaConnection) => {
        notifications.hide('incomingCallNotification');
        setMediaConnections((previous) => [call, ...previous]);
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((mediaStream) => {
            call.answer(mediaStream);
            call.on('stream', (remoteStream) => {
                console.log('stream tiggered line 32');
                setRemoteMediaStreams([remoteStream]);
            });
        });
    }

    const showVideoOffScreen = (): MediaStream => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        // Define the background color and text color
        const backgroundColor = '#3498db'; // Background color (blue)
        const textColor = '#FFFFFF'; // Text color (white)
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '40px Arial'; // Font size and family
        ctx.fillStyle = textColor;
        const initials = userName
            .split(' ')
            .map(word => word.charAt(0))
            .join('');

        const textX = canvas.width / 2 - ctx.measureText(initials).width / 2;
        const textY = canvas.height / 2 + 40 / 3; // Adjust for baseline
        ctx.fillText(initials, textX, textY);
        return canvas.captureStream();
    };

    const closeCall = () => {
        //Todo: disconnect, messages resst, connections,video reset
        console.log('Call Ended trigerred');
        remoteDataConnections[0]?.close();
        mediaConnections[0]?.close();
        setMessages([]);
        setRemoteDataConnections([]);
        setRemoteMediaStreams([]);
        setMediaConnections([])
        setConnectionUserNames([]);
    }

    const sendMessage = (message: string, config = false) => {
        if (remoteDataConnections.length == 0) {
            alert('No Connection Made');
            return;
        }
        const newMessage: Message = {
            dataType: config ? 'InitialConfig' : 'Text',
            data: message,
            userId: peerId,
            timestamp: Date.now(),
        };
        remoteDataConnections[0].send(newMessage);
        setMessages((prev) => [...prev, newMessage]);
    }

    const handleVoiceToggle = () => {
        setIsMuted(!isMuted);
        if (mediaConnections.length > 0) {
            mediaConnections[0].localStream.getAudioTracks()[0].enabled = isMuted ? false : true;
        }
    }

    const handleVideoToggle = async () => {
        setIsVideoOn(!isVideoOn);

        myVideoStream.getVideoTracks()[0].enabled = !isVideoOn;

        if (isVideoOn) {
            const whiteVideoTrack = showVideoOffScreen().getVideoTracks()[0];
            const videoSender = mediaConnections[0]?.peerConnection.getSenders().find(sender => sender?.track?.kind === 'video');
            videoSender?.replaceTrack(whiteVideoTrack);
            setMyVideoStream(showVideoOffScreen);
        } else {
            const videoSender = mediaConnections[0]?.peerConnection.getSenders().find(sender => sender?.track?.kind === 'video');
            const webcam = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            videoSender?.replaceTrack(webcam.getVideoTracks()[0]);
            setMyVideoStream(webcam);
        }
    };

    const handleVideoSourceToggle = async () => {
        try {
            const stream = isShareScreen
                ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                : await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            const videoSender = mediaConnections[0].peerConnection.getSenders().find(sender => sender!.track.kind === 'video');

            if (videoSender) {
                videoSender.replaceTrack(stream.getVideoTracks()[0]);
            }
            setMyVideoStream(stream);
            setIsShareScreen(!isShareScreen);
        } catch (error) {
            console.error('Error accessing media devices:', error);
        }
    };

    return (
        <Container fluid={true}>
            <Drawer position='right' opened={opened} onClose={close} title="Menu">
                <SideBar sendMessage={sendMessage} />
            </Drawer>
            <Flex mt={"sm"}
                mih={50}
                gap="md"
                justify="flex-start"
                align="flex-start"
                direction="row"
            >
                <TextInput
                    icon={<FaUserAlt size="1.1rem" stroke={1.5} />}
                    radius="lg"
                    size="sm"
                    rightSection={
                        <CopyButton value={peerId}>
                            {({ copied, copy }) => (
                                <Button color={copied ? 'teal' : 'blue'} onClick={copy}>
                                    {copied ? <BsFillClipboardCheckFill /> : <BsFillClipboardFill />}
                                </Button>
                            )}
                        </CopyButton>

                    }
                    placeholder="My Peer Id"
                    value={peerId}
                    rightSectionWidth={40}
                />
                <Input value={remotePeerIdValue} onChange={e => setRemotePeerIdValue(e.target.value)} placeholder='Enter Friends PeerID' />
                <Button variant="gradient" gradient={{ from: 'teal', to: 'blue', deg: 60 }} onClick={() => call(remotePeerIdValue)}>Call</Button>
            </Flex>
            <Flex
                direction={{ base: 'column', sm: 'row' }}
                gap={{ base: 'lg', sm: 'lg' }}
                justify={{ sm: 'center' }}
                columnGap={'lg'}
            >
                <VideoPlayer stream={myVideoStream}></VideoPlayer>
                {remoteMediaStreams.map((stream, i) => {
                    return <><VideoPlayer stream={stream} key={i}></VideoPlayer> <p key={i}>{connectionUserNames[0]} </p></>

                })}
            </Flex>
            {!opened &&
                <Affix position={{ bottom: rem(20), right: rem(20) }}>
                    <Button variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }} onClick={open}>Open Chat</Button>
                </Affix>
            }
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <Group position='center' mt={'lg'}>
                <Button color="indigo" onClick={handleVoiceToggle}>{isMuted ? (<FaMicrophone />) : (<BsMicMuteFill />)}</Button>
                <Button color="grape" onClick={handleVideoToggle}>{isVideoOn ? <BsCameraVideoFill /> : <BsFillCameraVideoOffFill />}</Button>
                <Button color="lime" onClick={handleVideoSourceToggle}> {isShareScreen ? <FaUserAlt /> : <AiOutlineFundProjectionScreen />}</Button>
                <Button color="lime" > Record Locally</Button>
                <Button color="red" onClick={closeCall} > End</Button>
            </Group>
        </Container>
    );
}

export default App;