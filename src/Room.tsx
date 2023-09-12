import { useEffect, useMemo, useRef, useState } from 'react';
import Peer, { DataConnection, MediaConnection } from 'peerjs';
import { Affix, Button, Container, Drawer, Group, Input, Text, rem, Flex, ActionIcon, TextInput, CopyButton, } from '@mantine/core';
import VideoPlayer from './store/VideoPlayer';
import { useDisclosure } from '@mantine/hooks';
import SideBar from './SideBar';
import { useLocation, useNavigate } from 'react-router-dom';
import getUuidByString from 'uuid-by-string';
import { useAtom } from 'jotai';
import { messagesAtom, remoteDataConnectionAtom, peerIdAtom, videoLayersAtom, connectionUserNamesAtom } from './store/store';
import { Message } from './Types';
import { BsMicMuteFill, BsFillCameraVideoOffFill, BsCameraVideoFill, BsFillClipboardFill, BsFillClipboardCheckFill } from 'react-icons/bs';
import { FaMicrophone, FaUserAlt } from 'react-icons/fa';
import { AiOutlineFundProjectionScreen } from 'react-icons/ai';
import { BiPhoneCall } from 'react-icons/bi';
import { notifications } from '@mantine/notifications';



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
    const [myVideoStream, setmyVideoStream] = useState<MediaStream>(new MediaStream());
    const peerInstance = useRef<Peer | null>(null);
    const [remoteStreams, setRemoteStreams] = useState<MediaStream[]>([]);
    const [remoteDataConnections, setRemoteDataConnections] = useAtom(remoteDataConnectionAtom);
    const [connectionUserNames, setConnectionUserNames] = useAtom(connectionUserNamesAtom);
    const [opened, { open, close }] = useDisclosure(false);
    const [messages, setMessages] = useAtom(messagesAtom);
    const [isMuted, setIsMuted] = useState<boolean>(true);
    const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
    const [isShareScreen, setIsShareScreen] = useState<boolean>(true);
    const [videoLayers, setVideoLayers] = useAtom(videoLayersAtom);

    useEffect(() => {
        const peer = new Peer();
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((mediaStream) => {
            setmyVideoStream(mediaStream);
        });

        peer.on('open', (id) => {
            setPeerId(id)
        });
        peer.on('connection', (connection) => {
            console.log('connecton established');
            setRemoteDataConnections((previous) => [connection, ...previous]);
            connection.send({
                dataType:'InitialConfig',
                data: userName,
                userId: peerId,
                timestamp: Date.now(),
            });
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
                id: 'incommingCallNotification',
                title: 'Ringing',
                message:
                    <>
                        <Group position="apart">
                            <Text>Call from {metaData.userName}</Text>
                            <ActionIcon size={'lg'} variant="filled" color='green' onClick={() => answerCall(call)}>
                                <BiPhoneCall />
                            </ActionIcon>
                            <ActionIcon size={'lg'} variant="filled" color='red' onClick={() => {
                                notifications.hide('incommingCallNotification');
                                call.close();
                                remoteDataConnections[0].close();
                            }}>
                                <BiPhoneCall />
                            </ActionIcon>
                        </Group>
                    </>,
                color: 'blue',
                autoClose: false
            });
            console.log(metaData);
        })

        peer.on('close', () => {
            notifications.hide('incommingCallNotification');
            notifications.hide('callingNotification');
        })

        peerInstance.current = peer;
    }, [])

    const call = (remotePeerId: string) => {
        const options = {
            metadata: {
                userName: userName,
            }
        }
        const call = peerInstance.current!.call(remotePeerId, myVideoStream, options)
        const con = peerInstance.current!.connect(remotePeerId, options);
        notifications.show({
            id: 'callingNotification',
            title: 'Calling',
            message: 'Connecting with the given user',
            color: 'blue',
            autoClose: false
        });


        con.on('open', () => {
            console.log('Connection opened on caller');
            setRemoteDataConnections(prev => [con, ...prev]);
        });
        con.on('close',()=>{
            notifications.hide('callingNotification');
        })

        con.on('data', function (data) {
            console.log(data);
            if((data as Message).dataType== 'InitialConfig' ){
                setConnectionUserNames([(data as Message).data]);
                return;
            }
            setMessages((prev) => [...prev, data as Message,]);
        });
        call.on('stream', (remoteStream) => {
            console.log('upcoming sream 40');
            notifications.hide('callingNotification');
            setRemoteStreams([remoteStream]);
            console.log(remoteStream);
        });
    }

    const answerCall = (call: MediaConnection) => {
        notifications.hide('incommingCallNotification');
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((mediaStream) => {
            call.answer(mediaStream)
            call.on('stream', (remoteStream) => {
                console.log('stream tiggered line 32');
                setRemoteStreams([remoteStream]);
            });

        });
    }

    const closeCall = () =>{
        //Todo: disconnect, messages resst, connections,video reset
        peerInstance.current?.disconnect();
        remoteDataConnections[0].close();
        setRemoteStreams([]);
        setRemoteDataConnections([]);
        setConnectionUserNames([]);
    }

    const sendMessage = (message: string, config=false) => {
        if (remoteDataConnections.length == 0) {
            alert('No Connection Made');
            return;
        }
        const newMessage: Message = {
            dataType: config ? 'InitialConfig' :'Text',
            data: message,
            userId: peerId,
            timestamp: Date.now(),
        };
        remoteDataConnections[0].send(newMessage);
        setMessages((prev) => [...prev, newMessage]);
    }

    const handleVoiceToggle = () => {
        setIsMuted(!isMuted);
    }

    const handleVideoToggle = () => {
        setIsVideoOn(!isVideoOn);
    }
    const handleVideoSourceToggle = () => {
        console.log('change source');
        console.log(isShareScreen);
        setIsShareScreen(!isShareScreen);
        if (isShareScreen) {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((screenStream) => {
                setmyVideoStream(screenStream);
            });
        }
        else {
            navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((mediaStream) => {
                setmyVideoStream(mediaStream);
            });
        }
    }

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
                {remoteStreams.map((stream, i) => {
                    return <><VideoPlayer stream={stream} key={i}></VideoPlayer> <p key={i}>{connectionUserNames[0]} </p></>

                })}
            </Flex>
            {!opened &&
                <Affix position={{ bottom: rem(20), right: rem(20) }}>
                    <Button variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }} onClick={open}>Open Chat</Button>
                </Affix>
            }

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