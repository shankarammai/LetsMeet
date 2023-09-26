import { useEffect, useRef, useState } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { Affix, Button, Container, Drawer, Group, Input, Text, rem, Flex, ActionIcon, TextInput, CopyButton, } from '@mantine/core';
import VideoPlayer from './store/VideoPlayer';
import { useDisclosure } from '@mantine/hooks';
import SideBar from './SideBar';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAtom } from 'jotai';
import { messagesAtom, remoteDataConnectionAtom, peerIdAtom, connectionUserNamesAtom, mediaConnectionsAtom } from './store/store';
import { Message } from './Types';
import { BsMicMuteFill, BsFillCameraVideoOffFill, BsCameraVideoFill, BsFillClipboardFill, BsFillClipboardCheckFill } from 'react-icons/bs';
import { FaMicrophone, FaUserAlt } from 'react-icons/fa';
import { AiOutlineFundProjectionScreen } from 'react-icons/ai';
import { BiPhoneCall } from 'react-icons/bi';
import { notifications } from '@mantine/notifications';
import { nanoid } from 'nanoid';

function App() {
    const navigate = useNavigate();
    const { state } = useLocation() ?? {};
    const { friendID } = useParams() ?? {};
    let userName: string;
    if (!friendID) {
        if (state) {
            userName = state.userName;
        } else {
            navigate('/');
        }
    }
    const [peerId, setPeerId] = useAtom(peerIdAtom);
    const [remotePeerIdValue, setRemotePeerIdValue] = useState('');
    const [myVideoStream, setMyVideoStream] = useState<MediaStream>(new MediaStream());
    const peerInstance = useRef<Peer | null>(null);
    const [remoteMediaStreams, setRemoteMediaStreams] = useState<MediaStream[]>([]);
    const [mediaConnections, setMediaConnections] = useAtom(mediaConnectionsAtom);
    const [remoteDataConnections, setRemoteDataConnections] = useAtom(remoteDataConnectionAtom);
    const [_connectionUserNames, setConnectionUserNames] = useAtom(connectionUserNamesAtom);
    const [opened, { open, close }] = useDisclosure(false);
    const [_messages, setMessages] = useAtom(messagesAtom);
    const [isAudioOn, setIsAudioOn] = useState<boolean>(true);
    const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
    const [isShareScreen, setIsShareScreen] = useState<boolean>(false);
    const canvasRef = useRef<HTMLCanvasElement>(null!);

    useEffect(() => {
        const nanoId = nanoid(7);
        const peer = new Peer(nanoId);
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((mediaStream) => {
            setMyVideoStream(mediaStream);
        });

        peer.on('open', (id) => {
            setPeerId(id)
        });

        peer.on('close', () => {
            closeCall();
        });

        //Setting the data Connection for Messages
        peer.on('connection', (connection) => {
            setRemoteDataConnections((previous) => [connection, ...previous]);
            connection.on('data', (data) => {
                setMessages((prev) => [...prev, data as Message]);
            })
        });

        peer.on('call', (call) => {
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
                closeCall();
            })
        });

        peer.on('close', () => {
            notifications.hide('incomingCallNotification');
            notifications.hide('callingNotification');
            closeCall();
        });

        peerInstance.current = peer;

        if (friendID) {
            setRemotePeerIdValue(friendID);
        }
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
                setRemoteDataConnections(prev => [con, ...prev]);
            });
            con.on('close', () => {
                notifications.hide('callingNotification');
                closeCall();
            });

            con.on('data', function (data) {
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
                setRemoteMediaStreams([remoteStream]);
            });
        });
    }

    const showVideoOffScreen = (): MediaStream => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        // Define the background color and text color
        const backgroundColor = '#000000'; // Background color (blue)
        const textColor = '#FFFFFF'; // Text color (white)
        if (!canvas || !ctx) {
            throw new Error('Canvas or context is not available.');
        }
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = '40px Arial'; // Font size and family
        ctx.fillStyle = textColor;
        const initials = userName
            .split(' ')
            .map(word => word.charAt(0))
            .join('');
        console.log(userName);

        const textX = canvas.width / 2 - ctx.measureText(initials).width / 2;
        const textY = canvas.height / 2 + 40 / 3; // Adjust for baseline
        ctx.fillText(initials, textX, textY);
        return canvas.captureStream();
    };

    const closeCall = () => {
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
        setIsAudioOn(!isAudioOn);
        if (mediaConnections.length > 0) {
            mediaConnections[0].localStream.getAudioTracks()[0].enabled = isAudioOn ? false : true;
        }
    }

    const handleVideoToggle = async () => {
        setIsVideoOn(!isVideoOn);
        myVideoStream.getVideoTracks()[0].enabled = !isVideoOn;
        const videoSender = mediaConnections[0]?.peerConnection.getSenders().find(sender => sender?.track?.kind === 'video');
        if (videoSender) {
            const videoStream = isVideoOn
                ? showVideoOffScreen()
                : await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const videoTrack = videoStream.getVideoTracks()[0];
            videoSender?.replaceTrack(videoTrack);
            setMyVideoStream(videoStream);
        }
    };

    const handleVideoSourceToggle = async () => {
        try {
            const stream = isShareScreen
                ? await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                : await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            const videoSender = mediaConnections[0].peerConnection.getSenders().find(sender => sender?.track?.kind === 'video');
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
                    defaultValue={peerId}
                    rightSectionWidth={40}
                />
                <Input value={remotePeerIdValue} onChange={e => setRemotePeerIdValue(e.target.value)} placeholder='Enter Friends PeerID' />
                <Button variant="gradient" gradient={{ from: 'teal', to: 'blue', deg: 60 }} onClick={() => call(remotePeerIdValue)}>Call</Button>
                <CopyButton value={window.location.origin + '/call/' + peerId}>
                    {({ copied, copy }) => (
                        <Button color={copied ? 'teal' : 'blue'} onClick={copy}>
                            {copied ? 'Link copied' : 'Send Link'}
                        </Button>
                    )}
                </CopyButton>
            </Flex>

            <Flex
                direction={{ base: 'column', sm: 'row' }}
                gap={{ base: 'lg', sm: 'lg' }}
                justify={{ sm: 'center' }}
                columnGap={'lg'}
            >
                <VideoPlayer stream={myVideoStream} key={'myVideo'} muted={true}></VideoPlayer>
                {remoteMediaStreams.map((stream, i) => {
                    return <><VideoPlayer stream={stream} key={'remoteVideo' + i} muted={false}></VideoPlayer></>
                })}
            </Flex>
            {!opened &&
                <Affix position={{ bottom: rem(20), right: rem(20) }}>
                    <Button variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }} onClick={open}>Open Chat</Button>
                </Affix>
            }
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <Group position='center' mt={'lg'}>
                <Button color="indigo" onClick={handleVoiceToggle}>{isAudioOn ? (<FaMicrophone />) : (<BsMicMuteFill />)}</Button>
                <Button color="grape" onClick={handleVideoToggle}>{isVideoOn ? <BsCameraVideoFill /> : <BsFillCameraVideoOffFill />}</Button>
                <Button color="lime" onClick={handleVideoSourceToggle}> {isShareScreen ? <FaUserAlt /> : <AiOutlineFundProjectionScreen />}</Button>
                <Button color="red" onClick={closeCall} > End</Button>
            </Group>
        </Container>
    );
}

export default App;