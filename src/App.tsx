import Example from './components/Example'
import Notes from './components/Notes'
import { NotesWithReducer, CountProvider } from './components/NotesWithReducer';
import Grid from '@mui/material/Grid';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { grey } from '@mui/material/colors';
import { Box, Button, Card, CardActionArea, CardActions, CardContent, Container, CssBaseline, Step, StepLabel, Stepper, Typography } from '@mui/material';
import { useState } from 'react';
import ExperimentViz from './components/ExperimentViz';

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
const EmptySlide = () => (
  <div>Empty Slide</div>
)

const Slide1 = ({slide} : {slide: number}) => (
  <Container>
    <ExperimentViz slide={slide} />
  </Container>
);

const Slide2 = () => (
  <Container>
    <Typography variant='h1'>Background</Typography>
    <Typography variant='body1'>This slide will container contains the background information about our story.</Typography>
  </Container>
);



const steps = [
  'Sugar-Sweetened Beverage Consumption',
  'Sugar-Sweetened Beverage Consumption in California Residents',
  'Revenue of Coca-Cola Company',
  'Sugar Content',
  'Experiment: Background',
  'Experiment: Result',
  'Experiment: Histogram',
  // 'Conclusion'
];

// Main Layout
function Layout() {

  const [step, setStep] = useState<number>(1);

  const decrementStep = () => { setStep(prev => Math.max((prev - 1), 0)) };
  const incrementStep = () => { setStep(prev => Math.min((prev + 1), steps.length)) };

  const slides = [
    <EmptySlide />, 
    <EmptySlide />, 
    <EmptySlide />, 
    <EmptySlide />,
    <Slide1 slide={step - 4}/>,
  ]

  const stepLogic = (step: number) : number => {
    if (step > 3) return 4;
    return step;
  };

  return (

      <Grid container direction="column" spacing={0} style={{ height: "100vh" }}>

        {/* Main Content */}
        <Grid item xs={10}>
          {/* <Typography>{steps[step] || 'End of Steps'}</Typography> */}
          { slides[stepLogic(step)] }
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
