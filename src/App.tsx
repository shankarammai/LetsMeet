import { ColorScheme, ColorSchemeProvider, MantineProvider } from "@mantine/core";
import { useHotkeys, useLocalStorage } from '@mantine/hooks';
import { Notifications } from '@mantine/notifications';
import { Route, Routes } from "react-router-dom";
import Room from "./Room";
import NotFound from "./NotFound";
import Home from "./Home";

function App() {

  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: 'mantine-color-scheme',
    defaultValue: 'light'
  })

  const toggleColorScheme = (value?: ColorScheme) =>
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  useHotkeys([['mod+J', () => toggleColorScheme()]]);

  return (
    <>
      <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
        <MantineProvider
          theme={{
            globalStyles: (theme) => ({
              body: {
                ...theme.fn.fontStyles(),
                backgroundColor: colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
                color: colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
                lineHeight: theme.lineHeight,
              },
            }),
            // Override any other properties from default theme
            components: {
              Title: {
                defaultProps: (theme) => ({
                  backgroundColor: colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
                  color: colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
                }),
              },

              Button: {
                variants: {
                  danger: (theme) => ({
                    root: {
                      backgroundColor: theme.colors.red[9],
                      color: theme.colors.red[0],
                      ...theme.fn.hover({ backgroundColor: theme.colors.red[8] })
                    }
                  }),
                  success: (theme) => ({
                    root: {
                      backgroundImage: theme.fn.linearGradient(
                        45,
                        theme.colors.cyan[theme.fn.primaryShade()],
                        theme.colors.teal[theme.fn.primaryShade()],
                        theme.colors.green[theme.fn.primaryShade()]
                      ),
                      color: theme.white,
                    },
                  }),
                },
              }
            },
            colorScheme: 'light',
            colors: {
              // override dark colors to change them for all components
              dark: ['#d5d7e0', '#acaebf', '#8c8fa3', '#666980', '#4d4f66', '#34354a', '#2b2c3d', '#1d1e30', '#0c0d21', '#01010a',],
            },
            breakpoints: { xs: '30em', sm: '48em', md: '64em', lg: '74em', xl: '90em', },
            fontFamily: 'Verdana, sans-serif',
            fontFamilyMonospace: 'Monaco, Courier, monospace',
            headings: { fontFamily: 'Greycliff CF, sans-serif' },
            spacing: { xs: '1rem', sm: '1.2rem', md: '1.8rem', lg: '2.2rem', xl: '2.8rem' },
            defaultGradient: { from: 'blue', to: 'teal', deg: 20 },
            loader: 'bars'
          }}
          withGlobalStyles withNormalizeCSS
        >
          <Notifications />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/call" element={<Room />} />
            <Route path='*' element={<NotFound />} />
          </Routes>
        </MantineProvider>
      </ColorSchemeProvider>
    </>
  )
}

export default App
