import { useEffect, useMemo, useRef, useState } from 'react';
import Peer, { DataConnection } from 'peerjs';
import { Affix, Button, Center, Container, Drawer, Group, Input, SimpleGrid, Title, rem, Flex } from '@mantine/core';
import VideoPlayer from './store/VideoPlayer';
import { useDisclosure } from '@mantine/hooks';
import SideBar from './SideBar';
import { useLocation, useNavigate } from 'react-router-dom';
import getUuidByString from 'uuid-by-string';
import { useAtom } from 'jotai';
import { messagesAtom, remoteDataConnectionAtom, peerIdAtom } from './store/store';
import { Message } from './Types';

function App() {
    const navigate = useNavigate();
    const { state } = useLocation();
    if (state == null) {
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
    const [opened, { open, close }] = useDisclosure(false);
    const [messages, setMessages] = useAtom(messagesAtom);

    useEffect(() => {
        const peer = new Peer();
        console.log(peer);
        navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((mediaStream) => {
            setmyVideoStream(mediaStream);
        });

        peer.on('open', (id) => {
            setPeerId(id)
        });
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
            //Show in Nice Modal
            if (confirm("Answer Incomming Call") == true) {
                navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((mediaStream) => {
                    call.answer(mediaStream)
                    call.on('stream', (remoteStream) => {
                        console.log('stream tiggered line 32');
                        console.log(peer);
                        setRemoteStreams([remoteStream]);
                    });

                });
            }

        })
        peerInstance.current = peer;
    }, [])

    const call = (remotePeerId: string) => {
        const call = peerInstance.current!.call(remotePeerId, myVideoStream)
        const con = peerInstance.current!.connect(remotePeerId);


        con.on('open', () => {
            console.log('Connection opened on caller');
            setRemoteDataConnections(prev => [con, ...prev]);

        });
        con.on('data', function (data) {
            console.log(data);
            setMessages((prev) => [...prev, data as Message,]);
        });
        call.on('stream', (remoteStream) => {
            console.log('upcoming sream 40');
            setRemoteStreams([remoteStream]);
            console.log(remoteStream);
        });
    }

    const sendMessage = (message: string) => {
        if (remoteDataConnections.length == 0) {
            alert('No Connection Made');
            return;
        }
        const newMessage: Message = {
            dataType: 'Text',
            data: message,
            userId: peerId,
            timestamp: Date.now(),
        };
        remoteDataConnections[0].send(newMessage);
        setMessages((prev) => [...prev, newMessage]);
    }

    return (
        <Container fluid={true}>
            <Drawer position='right' opened={opened} onClose={close} title="Menu">
                <SideBar sendMessage={sendMessage} />
            </Drawer>

            <Title>Current user id is {peerId}</Title>
            <Input value={remotePeerIdValue} onChange={e => setRemotePeerIdValue(e.target.value)} />
            <Button mt={'sm'} variant="gradient" gradient={{ from: 'teal', to: 'blue', deg: 60 }} onClick={() => call(remotePeerIdValue)}>Call</Button>
            <Flex
                direction={{ base: 'column', sm: 'row' }}
                gap={{ base: 'lg', sm: 'lg' }}
                justify={{ sm: 'center' }}
                columnGap={'lg'}
            >
                <VideoPlayer stream={myVideoStream}></VideoPlayer>
                {remoteStreams.map((stream, i) => {
                    return <VideoPlayer stream={stream} key={i}></VideoPlayer>
                })}
            </Flex>
            <Affix position={{ bottom: rem(20), right: rem(20) }}>
                <Button variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }} onClick={open}>Open drawer</Button>
            </Affix>
        </Container>
    );
}

export default App;