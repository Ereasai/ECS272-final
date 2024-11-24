import Example from './components/GeographyMap'
import Notes from './components/Notes'
import { NotesWithReducer, CountProvider } from './components/NotesWithReducer';
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import { Box, Button, Card, CardActionArea, CardActions, CardContent, Container, CssBaseline, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { useState } from 'react';
import ExperimentViz from './components/ExperimentViz';
import GeographyMap from './components/GeographyMap';

const theme = createTheme({
  palette: {
    primary: {
      light: '#757ce8',
      main: '#3f50b5',
      dark: '#002884',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ff7961',
      main: '#f44336',
      dark: '#ba000d',
      contrastText: '#000',
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

function DivFilling({ color, children }) {
  const divStyle = {
    width: "100%",
    height: "100%",
    backgroundColor: color,
  };

  return <div style={divStyle}>{children}</div>;
};


// Slides
const Slide1 = () => (
  <Container>
    <GeographyMap/>
    <ExperimentViz/>
  </Container>
);

const Slide2 = () => (
  <Container>
    <Typography variant='h1'>Background</Typography>
    <Typography variant='body1'>This slide will container contains the background information about our story.</Typography>
  </Container>
);



const steps = [
  'Welcome', 
  'Background',
  'Experiment',
  'Conclusion',
];

// Main Layout
function Layout() {

  const [step, setStep] = useState<number>(1);

  const decrementStep = () => { setStep(prev => Math.max((prev - 1), 0)) };
  const incrementStep = () => { setStep(prev => Math.min((prev + 1), steps.length)) };

  const slides = [<Slide1 />, <Slide2 />, <Example />]

  return (
    <Container>
      <Grid container direction="column" spacing={0} style={{ height: "100vh" }}>

        {/* Main Content */}
        <Grid item xs={10}>
          {/* <Typography>{steps[step] || 'End of Steps'}</Typography> */}
          { slides[step] }
        </Grid>

        {/* Controls */}
        <Grid item xs={2} padding={1} style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
          <Card variant='outlined' style={{ width: '100%' }}>
            {/* Stepper */}
            <CardContent>
              <Stepper activeStep={step}>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </CardContent>

            {/* Buttons */}
            <CardActions>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Button size="small" onClick={decrementStep}>Prev</Button>
                <Button size="small" onClick={incrementStep}>Next</Button>
              </Box>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

    </Container>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout />
    </ThemeProvider>
  );
};

export default App;
