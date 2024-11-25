import React from 'react';
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';

import { ComponentSize, Margin } from '../types';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { isEmpty } from 'lodash';

export default function ExperimentViz({ slide } : { slide: number }) {

  const chartRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 40, right: 20, bottom: 80, left: 60 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)

  useResizeObserver({ ref: chartRef, onResize });

  const [data, setData] = useState<any[]>([]);

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
  }, [data, size]);

  useEffect(() => {
    initChart();
  }, [slide])

  const initChart = () => {
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
    const xSetup = {
      1: d3.scaleLinear().domain([0, cols]).range([margin.left, size.width / 2 - margin.right]),
      2: d3.scaleLinear().domain([0, cols]).range([size.width / 2 + margin.right, size.width - margin.right]),
      3: d3.scaleLinear().domain([0, cols]).range([margin.left, size.width / 2 - margin.right]),
      4: d3.scaleLinear().domain([0, cols]).range([size.width / 2 + margin.right, size.width - margin.right]),
    }

    const ySetup = {
      1: d3.scaleLinear().domain([0, cols]).range([margin.top, size.height / 2 - margin.top]),
      2: d3.scaleLinear().domain([0, cols]).range([margin.top, size.height / 2 - margin.top]),
      3: d3.scaleLinear().domain([0, cols]).range([size.height / 2 + margin.top, size.height - margin.bottom]),
      4: d3.scaleLinear().domain([0, cols]).range([size.height / 2 + margin.top, size.height - margin.bottom]),
    }

    const xHistogram = d3.scaleLinear()
      .domain([d3.min(data, d => d.calories), d3.max(data, d => d.calories)])
      .range([margin.left, size.width - margin.right]);


    const ageToR = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.age)])
      .range([3, 10]);

    // const bins = d3.histogram()
    //   .value(d => d.DV_calories_consumed)
    //   .domain(xHistogram.domain())
    //   .thresholds(xHistogram.ticks(20))(data);

    // console.log('bins', bins)
    // get local index for each condition group
    // randomzie order
    const processedData = (() => {
      const grouped = d3.group(data, d => d.condition);
      const flattenedData: any[] = [];
      for (const [condition, group] of grouped.entries()) {
        group.forEach((d, i) => {
          flattenedData.push({ ...d, conditionIndex: i });
          // flattenedData.push({ ...d, localIndex: i, groupSize: group.length });
        });
      }

      const binnedData = d3.histogram()
        .value(d => d.calories)
        .domain(xHistogram.domain())
        .thresholds(xHistogram.ticks(20))(flattenedData);

      const finalData: any[] = []
      binnedData.forEach((bin, binNumber) => {
        bin.forEach((d, i) => {
          finalData.push({ ...d, bin: binNumber, binIndex: i })
        })
      })

      return finalData;
    })();
    
    console.log('processed data', processedData)

    const yHistogram = d3.scaleLinear()
      .domain([0, d3.max(processedData, d => d.binIndex)])
      .range([size.height - margin.bottom, margin.top]);

    // Bind data and update circles
    const circles = svg.selectAll('circle')
      .data(processedData, d => d.id); // Use a key function if the data has unique IDs

    // console.log('slide', slide)

    circles
      .join(
        enter => enter.append('circle')
          .attr('cx', (d, i) => xDemographic(i % cols)) // Initial position
          .attr('cy', (d, i) => yDemographic(Math.floor(i / cols))) // Initial position
          .attr('r', 0) // Start with radius 0
          .style('fill', d => d.sex === 'male' ? '#486E9E' : '#D84B59')
          .on('click', (e, d) => { console.log(d); })
          .call(enter => enter.transition().duration(750)
            .attr('r', d => ageToR(d.age)) // Transition to final radius
          ),
        update => update.call(update => update.transition().duration(3000)
          .attr('cx', (d, i) => {
            if (slide === 0) return xDemographic(i % cols);
            if (slide === 1) return xSetup[d.condition](d.conditionIndex % (cols));
            if (slide === 2) return xHistogram(d.DV_calories_consumed);
          })
          .attr('cy', (d, i) => {
            if (slide === 0) return yDemographic(Math.floor(i / cols));
            if (slide === 1) return ySetup[d.condition](Math.floor(d.conditionIndex / cols));
            if (slide === 2) return yHistogram(d.binIndex);
          })
          .attr('r', d => {
            if (slide === 0) return ageToR(d.age);
            if (slide === 1) return ageToR(0);
            if (slide === 2) return ageToR(0);
          })
        ),
        exit => exit.call(exit => exit.transition().duration(750)
          .attr('r', 0)
          .remove()
        )
      );
  };

  const updateChart = () => {
    
  };

  return (
    <div ref={chartRef}>
      <p>{slide}</p>
      <svg id='chart-svg' width='100%' height='500px'></svg>
    </div>
  )

}