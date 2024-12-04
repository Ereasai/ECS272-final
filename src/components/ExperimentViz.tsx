import React from 'react';
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';

import { ComponentSize, Margin } from '../types';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { isEmpty, update } from 'lodash';

export default function ExperimentViz({ slide }: { slide: number }) {

  const chartRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 100, right: 20, bottom: 100, left: 100 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 0)

  useResizeObserver({ ref: chartRef, onResize });

  const [data, setData] = useState<any[]>([]);

  const [drawn, setDrawn] = useState(false);

  // initial hook for loading data
  useEffect(() => {
    const loadData = async () => {
      try {
        const csvData = await d3.csv('../../../data/sugary-drinks.csv', d => {
          const ethnicityMap = new Map([
            [1, 'African American'],
            [2, 'American Indian or Alaskan Native'],
            [3, 'Asian'],
            [4, 'Caucasian'],
            [5, 'Hispanic/Latino'],
            [6, 'Pacific Islander'],
            [7, 'Other or mixed']
          ]);

          if (!d.IV_condition) console.log('no condition')
          if (!d.age) console.log('no age')

          return {
            id: +d.id,
            age: +d.age,
            sex: (+d.sex) == 1 ? 'male' : 'female',
            ethnicity: ethnicityMap.get(+d.ethnicity),
            condition: +d.IV_condition,
            calories: +d.DV_calories_consumed,
            failed_comprehension_check: (+d.failed_comprehension_check) == 0 ? false : true,
          };
        });
        console.log('data loaded.')
        setData(csvData);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    }
    loadData();
  }, []);

  // hook for redrawing the chart
  useEffect(() => {
    if (isEmpty(data)) return;
    if (size.width === 0 || size.height === 0) return;
    d3.select('#chart-svg').selectAll('*').remove();
    initChart();
    initChartLabels();
    updateChartLabels();
    setDrawn(true);
  }, [data, size]);

  useEffect(() => {
    if (!drawn) return;
    initChart();
    updateChartLabels();
  }, [slide]);

  const initChart = () => {
    console.log('init chart called')

    const rows = 25;
    const svg = d3.select('#chart-svg');
    const cols = Math.ceil(data.length / rows);

    const xDemographic = d3.scaleLinear()
      .domain([0, cols - 1])
      .range([margin.left, size.width / 2 - margin.right]);

    const yDemographic = d3.scaleLinear()
      .domain([0, rows - 1])
      .range([margin.top, size.height - margin.bottom]);

    // these scales map each type into four quadrants
    const gap = 20
    const xSetup = (() => {
      const quadrantWidth = (size.width - margin.left - margin.right - gap) / 4;
      return {
        1: d3.scaleLinear().domain([0, cols]).range([margin.left, margin.left + quadrantWidth]),
        2: d3.scaleLinear().domain([0, cols]).range([margin.left + quadrantWidth + gap, margin.left + gap + quadrantWidth * 2]),
        3: d3.scaleLinear().domain([0, cols]).range([margin.left, margin.left + quadrantWidth]),
        4: d3.scaleLinear().domain([0, cols]).range([margin.left + quadrantWidth + gap, margin.left + gap + quadrantWidth * 2]),
      }
    })();

    const ySetup = (() => {
      const quadrantHeight = (size.height - margin.top - margin.bottom - gap) / 2;
      return {
        1: d3.scaleLinear().domain([0, cols]).range([margin.top, margin.top + quadrantHeight]),
        2: d3.scaleLinear().domain([0, cols]).range([margin.top, margin.top + quadrantHeight]),
        3: d3.scaleLinear().domain([0, cols]).range([margin.top + quadrantHeight + gap, margin.top + gap + quadrantHeight * 2]),
        4: d3.scaleLinear().domain([0, cols]).range([margin.top + quadrantHeight + gap, margin.top + gap + quadrantHeight * 2]),
      }
    })();
    
    

    const ageToR = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.age)])
      .range([3, 10]);

    // get local index for each condition group
    // randomzie order
    const processedData = (() => {
      const grouped = d3.group(data, d => d.condition);
      const flattenedData: any[] = [];
      for (const [_, group] of grouped.entries()) {
        group.forEach((d, i) => {
          flattenedData.push({ ...d, conditionIndex: i });
          // flattenedData.push({ ...d, localIndex: i, groupSize: group.length });
        });
      }

      const finalData: any[] = []

      const xHistogram = d3.scaleLinear()
        .domain([d3.min(data, d => d.calories), d3.max(data, d => d.calories)])
        .range([margin.left, size.width - margin.right]);

      const groupedAgain = d3.group(flattenedData, d => d.condition);
      for (const [_, group] of groupedAgain.entries()) {
        const binnedGroup = d3.histogram()
          .value(d => d.calories)
          .domain(xHistogram.domain())
          .thresholds(xHistogram.ticks(20))(group);

        binnedGroup.forEach((bin, binNumber) => {
          bin!.forEach((d, i) => {
            finalData.push({ ...d, bin: binNumber, binIndex: i })
          })
        });
      }



      return finalData;
    })();

    // const xHistogram = d3.scaleLinear()
    //     .domain([d3.min(data, d => d.calories), d3.max(data, d => d.calories)])
    //     .range([margin.left, size.width / 2 - margin.right]);

    const xHistogram = (() => {
      const dom = [d3.min(data, d => d.calories), d3.max(data, d => d.calories)];
      const gap = 40;
      const quadrantWidth = (size.width - margin.left - margin.right - gap) / 2;
      return {
        1: d3.scaleLinear().domain(dom).range([margin.left, margin.left + quadrantWidth]),
        2: d3.scaleLinear().domain(dom).range([margin.left + quadrantWidth + gap, size.width - margin.right]),
        3: d3.scaleLinear().domain(dom).range([margin.left, margin.left + quadrantWidth]),
        4: d3.scaleLinear().domain(dom).range([margin.left + quadrantWidth + gap, size.width - margin.right]),
        // 3: d3.scaleLinear().domain(dom).range([margin.left, size.width / 2 - margin.right]),
        // 4: d3.scaleLinear().domain(dom).range([size.width / 2 + margin.right, size.width - margin.right]),
      }
    })();

    // 2: d3.scaleLinear().domain([0, cols]).range([margin.top, margin.top + quadrantHeight]),
    // 3: d3.scaleLinear().domain([0, cols]).range([margin.top + quadrantHeight + gap, margin.top + gap + quadrantHeight * 2]),

    const yHistogram = (() => {
      const dom = [0, d3.max(processedData, d => d.binIndex)]
      const gap = 40;
      const quadrantHeight = (size.height - margin.top - margin.bottom - gap) / 2;
      return {
        1: d3.scaleLinear().domain(dom).range([margin.top + quadrantHeight, margin.top]),
        2: d3.scaleLinear().domain(dom).range([margin.top + quadrantHeight, margin.top]),
        // 2: d3.scaleLinear().domain(dom).range([size.height / 2, margin.top]),
        3: d3.scaleLinear().domain(dom).range([margin.top + gap + quadrantHeight * 2, margin.top + quadrantHeight + gap]),
        4: d3.scaleLinear().domain(dom).range([margin.top + gap + quadrantHeight * 2, margin.top + quadrantHeight + gap]),
        // 4: d3.scaleLinear().domain(dom).range([size.height - margin.bottom, size.height / 2 + margin.top]),
      }
    })();

    if (!drawn) {
      console.log('drawing axis labels')
      for (let i = 1; i < 5; i++) {
        const xScale = xHistogram[i];
        const yScale = yHistogram[i];
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);
        svg.append('g')
          .attr('id', `histogram-x-axis-${i}`)
          .attr("transform", `translate(0, ${yScale.range()[0]})`)
          .style('opacity', 0)
          .call(xAxis)

        svg.append('g')
          .attr('id', `histogram-y-axis-${i}`)
          .attr("transform", `translate(${xScale.range()[0]}, 0)`)
          .style('opacity', 0)
          .call(yAxis)
      }
    }





    // Bind data and update circles
    const circles = svg.selectAll('circle')
      .data(processedData, d => d.id);

    // console.log('slide', slide)

    // circles
    //   .join(
    //     enter => enter.append('circle')
    //       .attr('cx', (d, i) => xDemographic(i % cols)) // Initial position
    //       .attr('cy', (d, i) => yDemographic(Math.floor(i / cols))) // Initial position
    //       .attr('r', 0) // Start with radius 0
    //       .style('fill', d => d.sex === 'male' ? '#486E9E' : '#D84B59')
    //       .on('click', (e, d) => { console.log(d); })
    //       .call(enter => enter.transition().duration(750)
    //         .attr('r', d => ageToR(d.age))
    //       ),
    //     update => update.call(update => update.transition().duration(3000)
    //       .attr('cx', (d, i) => {
    //         if (slide === 0) return xDemographic(i % cols);
    //         if (slide === 1) return xSetup[d.condition](d.conditionIndex % (cols));
    //         if (slide === 2) return xHistogram[d.condition](d.calories);
    //       })
    //       .attr('cy', (d, i) => {
    //         if (slide === 0) return yDemographic(Math.floor(i / cols));
    //         if (slide === 1) return ySetup[d.condition](Math.floor(d.conditionIndex / cols));
    //         if (slide === 2) return yHistogram[d.condition](d.binIndex);
    //       })
    //       .attr('r', d => {
    //         if (slide === 0) return ageToR(d.age);
    //         if (slide === 1) return ageToR(0);
    //         if (slide === 2) return ageToR(0);
    //       })
    //     ),
    //     exit => exit.call(exit => exit.transition().duration(750)
    //       .attr('r', 0)
    //       .remove()
    //     )
    //   );

    const combined = circles
      .join(
        enter => enter.append('circle')
          .attr('cx', (d, i) => xDemographic(i % cols)) // Initial position
          .attr('cy', (d, i) => yDemographic(Math.floor(i / cols))) // Initial position
          .attr('r', 0) // Start with radius 0
          .style('fill', d => d.sex === 'male' ? '#486E9E' : '#D84B59')
          .on('click', (e, d) => { console.log(d); })
          .call(enter => enter.transition().duration(750)
            .attr('r', d => ageToR(d.age))
          ),
        update => update,
        exit => exit.call(exit => exit.transition().duration(750)
          .attr('r', 0)
          .remove()
        )
      );

    combined.transition().duration(3000)
      .attr('cx', (d, i) => {
        if (slide === 0) return xDemographic(i % cols);
        if (slide === 1) return xSetup[d.condition](d.conditionIndex % (cols));
        if (slide === 2) return xHistogram[d.condition](d.calories);
      })
      .attr('cy', (d, i) => {
        if (slide === 0) return yDemographic(Math.floor(i / cols));
        if (slide === 1) return ySetup[d.condition](Math.floor(d.conditionIndex / cols));
        if (slide === 2) return yHistogram[d.condition](d.binIndex);
      })
      .attr('r', d => {
        if (slide === 0) return ageToR(d.age);
        if (slide === 1) return ageToR(0);
        if (slide === 2) return ageToR(0);
      })



  };

  const initChartLabels = () => {
    console.log('init chart labels called')
    // add labels & titles
    const svg = d3.select('#chart-svg');
    if (!d3.select('#demographic-title').current) {
      svg.append('text')
        .attr('x', margin.left)
        .attr('y', 30)
        .attr('id', 'demographic-title')
        .style('opacity', 0)
        .style('font-size', 30)
        .text('Participant Information')
    }

    if (!d3.select('#result-title').current) {
      svg.append('text')
        .attr('x', margin.left)
        .attr('y', 30)
        .attr('id', 'result-title')
        .style('opacity', 0)
        .style('font-size', 30)
        .text('Experiment Setup')
    }

    if (!d3.select('#condition1-title').current) {
      svg.append('text')
        .attr('x', margin.left)
        .attr('y', margin.top)
        .attr("text-anchor", "start")
        .attr("dy", "-1em")
        .attr('id', 'condition1-title')
        .style('opacity', 0)
        .style('font-size', 20)
        .text('Condition I')
    }

    if (!d3.select('#condition2-title').current) {
      svg.append('text')
        .attr('x', margin.left + 20 + (size.width - margin.left - margin.right - 20) / 4)
        .attr('y', margin.top)
        .attr("text-anchor", "start")
        .attr("dy", "-1em")
        .attr('id', 'condition2-title')
        .style('opacity', 0)
        .style('font-size', 20)
        .text('Condition II')
    }

    if (!d3.select('#condition3-title').current) {
      svg.append('text')
        .attr('x', margin.left)
        .attr('y', margin.top + ((size.height - margin.top - margin.bottom - 20) / 2) + 20)
        .attr("text-anchor", "start")
        .attr("dy", "-1em")
        .attr('id', 'condition3-title')
        .style('opacity', 0)
        .style('font-size', 20)
        .text('Condition III')
    }

    if (!d3.select('#condition4-title').current) {
      svg.append('text')
        .attr('x', margin.left + 20 + (size.width - margin.left - margin.right - 20) / 4)
        .attr('y', margin.top + ((size.height - margin.top - margin.bottom - 20) / 2) + 20)
        .attr("text-anchor", "start")
        .attr("dy", "-1em")
        .attr('id', 'condition4-title')
        .style('opacity', 0)
        .style('font-size', 20)
        .text('Condition IV')
    }

    if (!d3.select('#histogram-x-axis-label').current) {
      svg.append('text')
        .attr('x', size.width / 2)
        .attr('y', size.height - margin.bottom / 2)
        .attr("text-anchor", "middle")
        .attr("dy", "1em")
        .attr('id', 'histogram-x-axis-label')
        .style('opacity', 0)
        .style('font-size', 15)
        .text('calories')
    }

    if (!d3.select('#histogram-y-axis-label').current) {
      svg.append('text')
        .attr("text-anchor", "middle")
        // .attr("dy", "-1em")
        .attr('transform', `translate(${margin.left / 2}, ${size.height / 2}) rotate(-90)`)
        .attr('id', 'histogram-y-axis-label')
        .style('opacity', 0)
        .style('font-size', 15)
        .text('# of people')
    }

    if (!d3.select('#histogram-title').current) {
      svg.append('text')
        .attr('x', margin.left)
        .attr('y', 30)
        .attr("text-anchor", "start")
        .attr('id', 'histogram-title')
        .style('opacity', 0)
        .style('font-size', 30)
        .text('Results')
    }
  }

  const updateChartLabels = () => {
    const demographicTitle = d3.select('#demographic-title');
    const resultTitle = d3.select('#result-title');
    const condition1Title = d3.select('#condition1-title');
    const condition2Title = d3.select('#condition2-title');
    const condition3Title = d3.select('#condition3-title');
    const condition4Title = d3.select('#condition4-title');
    let axisLabels = [];
    for (let i = 1; i < 5; i++) {
      axisLabels.push(d3.select(`#histogram-x-axis-${i}`));
      axisLabels.push(d3.select(`#histogram-y-axis-${i}`));
    }
    const historgramXLabel = d3.select('#histogram-x-axis-label');
    const historgramYLabel = d3.select('#histogram-y-axis-label');
    const histogramTitle = d3.select('#histogram-title');

    if (slide == 0) {
      demographicTitle.transition().duration(1000).style('opacity', 1);
      resultTitle.transition().duration(1000).style('opacity', 0);
      condition1Title.transition().duration(1000).style('opacity', 0);
      condition2Title.transition().duration(1000).style('opacity', 0);
      condition3Title.transition().duration(1000).style('opacity', 0);
      condition4Title.transition().duration(1000).style('opacity', 0);
      for (let axisLabel of axisLabels) {
        axisLabel.transition().duration(1000).style('opacity', 0);
      }
      historgramXLabel.transition().duration(1000).style('opacity', 0);
      historgramYLabel.transition().duration(1000).style('opacity', 0);
      histogramTitle.transition().duration(1000).style('opacity', 0);
    } else if (slide == 1) {
      demographicTitle.transition().duration(1000).style('opacity', 0);
      resultTitle.transition().duration(1000).style('opacity', 1);
      condition1Title.transition().duration(1000).style('opacity', 1);
      condition2Title.transition().duration(1000).style('opacity', 1);
      condition3Title.transition().duration(1000).style('opacity', 1);
      condition4Title.transition().duration(1000).style('opacity', 1);
      for (let axisLabel of axisLabels) {
        axisLabel.transition().duration(1000).style('opacity', 0);
      }
      historgramXLabel.transition().duration(1000).style('opacity', 0);
      historgramYLabel.transition().duration(1000).style('opacity', 0);
      histogramTitle.transition().duration(1000).style('opacity', 0);
    } else if (slide == 2) {
      demographicTitle.transition().duration(1000).style('opacity', 0);
      resultTitle.transition().duration(1000).style('opacity', 0);
      condition1Title.transition().duration(1000).style('opacity', 0);
      condition2Title.transition().duration(1000).style('opacity', 0);
      condition3Title.transition().duration(1000).style('opacity', 0);
      condition4Title.transition().duration(1000).style('opacity', 0);
      for (let axisLabel of axisLabels) {
        axisLabel.transition().duration(1000).style('opacity', 1);
      }
      historgramXLabel.transition().duration(1000).style('opacity', 1);
      historgramYLabel.transition().duration(1000).style('opacity', 1);
      histogramTitle.transition().duration(1000).style('opacity', 1);
    }
  };

  return (
    <div ref={chartRef} style={{ height: '100%' }}>
      <div id='tooltip'></div>
      <svg id='chart-svg' width='100%' height='100%'></svg>
    </div>
  )

}