import { AppShell, Header, Group, ActionIcon, Text, useMantineColorScheme, Grid, Container, Button, Title, SimpleGrid, Input, Image, Divider, Modal, TextInput, Switch, PasswordInput, Loader } from '@mantine/core';
import { Carousel } from '@mantine/carousel';
import useEmblaCarousel from 'embla-carousel-react'
import { FaSun, FaMoon, FaUser, FaEnvelope } from 'react-icons/fa';
import { useRef } from 'react';
import { notifications } from '@mantine/notifications';
import { useNavigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { userNameAtom } from './store/store';


function Home() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';
  const [emblaRef] = useEmblaCarousel({ loop: false });
  const uniqueIDRef = useRef<HTMLInputElement>(null!);
  const userNameRef = useRef<HTMLInputElement>(null!);
  const [userName, setUserName] = useAtom(userNameAtom);

  const navigate = useNavigate();

  const createMeeting = () => {
    console.log('Creating Meeting');
    const userFullName = userNameRef.current?.value;
    const userUniqueID = uniqueIDRef.current?.value

    //Name check
    if (userFullName.length < 4) {
      notifications.show({
        title: ' Name Error',
        message: 'Name is too short',
        color: 'red'
      });
      return;
    }

    //Name check
    if (userUniqueID.length < 4) {
      notifications.show({
        title: ' Email or Phone Number',
        message: 'Name is too short',
        color: 'red'
      });
      return;
    }
    setUserName(userFullName);
    navigate('call/', { state: { userName: userFullName, userUniqueID: userUniqueID } });
  }



  return (
    <AppShell
      header={
        <Header height={60} ml={4} fixed={true} bg={dark ? 'dark' : 'light'}  >
          <Group sx={{ height: '100%' }} px={20} position="apart">
            <Text size={'md'} >Let's Meet</Text>
            <ActionIcon variant="outline" color={dark ? 'yellow' : 'blue'} onClick={() => toggleColorScheme()} size={30}>
              {colorScheme === 'dark' ? <FaSun /> : <FaMoon size="1rem" />}
            </ActionIcon>
          </Group>
        </Header>
      }>
      <Container fluid p={0} mt={'lg'} size={'lg'}>
        <Grid>
          <Grid.Col xs={8} mt={'md'}>
            <Container size={400} ml={'sm'} mt={'lg'}>
              <Title align="start" fz={'lg'} ff={'fantasy'} fw={500} ><strong>Let's Meet</strong></Title>
              <Text align="start" fz="lg" color="dimmed">
                Unlock the Power of Communication: Chat and Broadcast App - Connecting People, Inspiring Communities
              </Text>
            </Container>
            <SimpleGrid mt={"md"} ml={'sm'} cols={4} spacing={15}>
              <Input ref={userNameRef} icon={<FaUser />} placeholder="Name " mt={'md'} />
              <Input ref={uniqueIDRef} icon={<FaEnvelope />} placeholder="Email or Phone" mt={'md'} onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  createMeeting();
                }
              }} />
              <Button variant="gradient" mt={'md'} gradient={{ from: 'teal', to: 'blue', deg: 60 }} onClick={createMeeting}>Join</Button>
            </SimpleGrid>
          </Grid.Col>
          <Divider orientation="vertical" />
          <Grid.Col xs={3} mt={'lg'} mr={'sm'}>
            <Carousel
              mx="auto"
              withIndicators
              height={'md'}
              ref={emblaRef}>
              <Carousel.Slide>
                <Image src={'../public/img/conference_call.png'}></Image>
              </Carousel.Slide>
              <Carousel.Slide>
                <Image src={'../public/img/group_call.png'}></Image>
              </Carousel.Slide>
              <Carousel.Slide>
                <Image src={'../public/img/realtime_colab.png'}></Image>
              </Carousel.Slide>
            </Carousel>
          </Grid.Col>
        </Grid>
      </Container>
    </AppShell>
  )
}

export default Home