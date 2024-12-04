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
import ResidentsChart from './components/ResidentsChart';
import RevenueChart from './components/RevenueChart';
import ContentChart from './components/ContentChart';

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
// @ts-ignore
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

const Slide1 = () => (
  <Grid container direction='row' style={{width: '100%', height: '100%' }}>
     <Grid item xs={10} padding={1} style={{width: '100%', height: '100%' }}>
        <GeographyMap />
     </Grid>
     <Grid item xs={2} padding={6} style={{width: '100%'}}>
        <Typography variant='h5'>
          The map shows that <span style={{color:'red',fontSize:'56px'}}><b>MANY</b></span> adults consume sugary beverage at once everyday
        </Typography>
     </Grid>
  </Grid>
)
const Slide2 = () => (
  <Grid container direction='row' style={{width: '100%', height: '100%' }}>
    <Grid item xs={10} padding={1} style={{width: '100%', height: '100%' }}>
      <ResidentsChart />
    </Grid>
    <Grid item xs={2} padding={6} style={{width: '100%'}}>
      <Typography variant='h5'>
        The situation of California residents consume Sugar-Sweetened Beverage for different groups. <b>From 0.4 to 3.1</b>.
      </Typography>
    </Grid>
  </Grid>
)
const Slide3 = () => (
  <Grid container direction='row' style={{width: '100%', height: '100%' }}>
    <Grid item xs={10} padding={1} style={{width: '100%', height: '100%' }}>
      <RevenueChart/>
    </Grid>
    <Grid item xs={2} padding={5} style={{width: '100%'}}>
      <Typography variant='h5'>
        From the growing Net Operating Revenue and Operating Income, We can assume that <b style={{color:'red'}}>sales</b> of sugar-sweetened beverages, such as Coca-Cola, are also <b style={{color:'red'}}>on the rise</b>
      </Typography>
    </Grid>
  </Grid>
)
const Slide4 = () => (
  <Grid container direction='row' style={{width: '100%', height: '100%' }}>
    <Grid item xs={10} padding={1} style={{width: '100%', height: '100%' }}>
      <ContentChart/>
    </Grid>
    <Grid item xs={2} padding={5} style={{width: '100%'}}>
      <Typography variant='h5'>
        About the calories and sugar content of Coca-Cola's common sugar-sweetened beverage products
      </Typography>
    </Grid>
  </Grid>
)
const Slide5 = ({slide} : {slide: number}) => (
  <Container>
    <ExperimentViz slide={slide} />
  </Container>
);

const Slide7 = () => (
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

  const [step, setStep] = useState<number>(0);

  const decrementStep = () => { setStep(prev => Math.max((prev - 1), 0)) };
  const incrementStep = () => { setStep(prev => Math.min((prev + 1), steps.length)) };

  const slides = [
    <Slide1 />, 
    <Slide2 />, 
    <Slide3 />,
    <Slide4 />,
    <Slide5 slide={step - 4}/>,
  ]

  const stepLogic = (step: number) : number => {
    if (step > 3) return 4;
    return step;
  };

  return (

      <Grid container direction="column" spacing={0} style={{ height: "100vh" }}>

        {/* Main Content */}
        <Grid item xs={9}>
          {/* <Typography>{steps[step] || 'End of Steps'}</Typography> */}
          { slides[stepLogic(step)] }
        </Grid>

        {/* Controls */}
        <Grid item xs={3} padding={1} style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>
          <Card variant='outlined' style={{ width: '100%' }}>
            {/* Stepper */}
            <CardContent>
              <Stepper activeStep={step} alternativeLabel>
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
