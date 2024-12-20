import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import usStates from '../../data/us_states.json';
import * as topojson from 'topojson-client';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { FeatureCollection } from 'geojson';
import { Bar, ComponentSize, Margin } from '../types';
// A "extends" B means A inherits the properties and methods from B.
interface DataBar{
  state: string;
  value: number;
}


export default function Example() {
  const [data,setData] = useState<DataBar[]>([]);
  const [lookup, setLookup] = useState<Map<string, number>>(new Map());
  const [states,setStates]=useState<FeatureCollection | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 40, right: 20, bottom: 80, left:150 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)

  useResizeObserver({ ref: barRef, onResize });
  
  useEffect(() => {

    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/Daliy_sugar_beverage.csv', d => {
          return {state: d.State, value: +d.Prevalence};
        });
        setData(csvData);
        const lookup = new Map(csvData.map(d => [d.state, d.value]));
        setLookup(lookup);
        // @ts-ignore
        const states = topojson.feature(usStates, usStates.objects.states);
        // @ts-ignore
        setStates(states);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    } 
    dataFromCSV();
  }, [])

  useEffect(() => {
    if (isEmpty(data)) return;
    if (size.width === 0 || size.height === 0) return;
    d3.select('#bar-svg').selectAll('*').remove();
    initChart();
  }, [data, size])

  function initChart() {
    let chartContainer = d3.select('#bar-svg')

    const title= chartContainer.append('g')
      .append("text")
      .attr("x", size.width / 2-120) 
      .attr("y", 20) 
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .text("The percentage of adults comsuming daily sugary beverage at once in the US"); 

    const subtitle= chartContainer.append('g')
      .append("text")
      .attr("x", size.width / 2-120) 
      .attr("y", 45) 
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .text("between 2010 and 2015"); 

    const color = d3.scaleThreshold<number, string>()
      .domain([30, 40, 50, 60, 70, 80])
      .range(d3.schemeBlues[6]);
    
    const path = d3.geoPath();   
    if (!states || !states.features) return;

    const tooltip = d3
      .select("body")
      .append("div")
      .style("position", "absolute")
      .style("background", "lightgray")
      .style("padding", "5px")
      .style("border-radius", "5px")
      .style("visibility", "hidden");
    const GeographyMap= chartContainer.append("g")
      .selectAll("path")
      .data(states.features) 
      .join("path")
      .attr("d", path)
      .attr("fill", d =>{
        const stateName = d.properties?.name;
        const value = lookup.get(stateName) || 0; 
        return color(value);
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .on("mouseover", (event, d) => {
        const stateName = d.properties?.name;
        const value = lookup.get(stateName) || "No data";
        tooltip.style("visibility", "visible")
          .text(`${stateName}: ${value}`);
      })
      .on("mousemove", event => {
        tooltip
          .style("top", `${event.pageY + 10}px`)
          .style("left", `${event.pageX + 10}px`);
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });
      // .append("title")
      // .text(d =>{
      //   const stateName = d.properties?.name;
      //   const value = lookup.get(stateName) || "No data";
      //   return `${stateName}: ${value}`;
      // });
    

    const legend = chartContainer.append("g")
      .attr("transform", `translate(20,${size.height - 40})`); 

    const legendScale = d3.scaleLinear()
      .domain(color.domain())
      .range([0, 200]); 

    const legendAxis = d3.axisBottom(legendScale)
      .tickSize(13)
      .tickValues(color.domain())
      .tickFormat(d3.format(".2f")); 

    legend.selectAll("rect")
      .data(color.range().map((d, i) => {
        return {
          color: d,
          range: [color.domain()[i], color.domain()[i + 1] || d3.max(color.domain())]
        };
      }))
      .join("rect")
      .attr("x", d => legendScale(d.range[0] ?? 0))
      .attr("y", -10)
      .attr("width", d => legendScale(d.range[1] ?? 0) - legendScale(d.range[0] ?? 0))
      .attr("height", 10)
      .attr("fill", d => d.color);

    legend.append("g")
      .call(legendAxis)
      .select(".domain").remove(); 
  }

  return (
    <>
      <div ref={barRef} className='chart-container' style={{marginLeft:'200px',marginTop:'15px'}}>
        <svg id='bar-svg' width='100%' height='100%'></svg>
      </div>
    </>
  )
}
