import React from 'react'
import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { isEmpty } from 'lodash';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { Bar, ComponentSize, Margin } from '../types';
// A "extends" B means A inherits the properties and methods from B.
interface DataBar{
  year: number;
  value: number;
}


export default function Example() {
  const [Ndata,setNData] = useState<DataBar[]>([]);
  const [Odata,setOData] = useState<DataBar[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 40, right: 20, bottom: 80, left: 60 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200)

  useResizeObserver({ ref: barRef, onResize });
  
  useEffect(() => {

    const dataFromCSV = async () => {
      try {
        const Ndata = await d3.csv('../../data/Coca-Cola_Financial_Data.csv', d => {
          return {year: +d.Year, value: +d.Net_Operating_Revenue};
        });
        setNData(Ndata);

        const Odata = await d3.csv('../../data/Coca-Cola_Financial_Data.csv', d => {
          return {year: +d.Year, value: +d.Operating_Income};
        });
        setOData(Odata);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    } 
    dataFromCSV();
  }, [])

  useEffect(() => {
    if (isEmpty(Ndata)&&isEmpty(Odata)) return;
    if (size.width === 0 || size.height === 0) return;
    d3.select('#bar-svg').selectAll('*').remove();
    initChart();
  }, [Odata,Ndata, size])

  function initChart() {
    let chartContainer = d3.select('#bar-svg')

    const x = d3
        .scaleLinear()
        .domain(d3.extent(Ndata, d => d.year) as [number, number])
        .range([margin.left, size.width - margin.right]);

    const y = d3
        .scaleLinear()
        .domain([
        0,
        Math.max(
            d3.max(Ndata, d => d.value) ?? 0,
            d3.max(Odata, d => d.value) ?? 0
          ),
        ])
        .range([size.height - margin.bottom, margin.top+30]);
    
    const lineRevenue = d3
        .line<DataBar>()
        .x(d => x(d.year))
        .y(d => y(d.value));
    
    const lineIncome = d3
        .line<DataBar>()
        .x(d => x(d.year))
        .y(d => y(d.value));
 
    const tooltip = d3
        .select("body")
        .append("div")
        .style("position", "absolute")
        .style("background", "lightgray")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("visibility", "hidden");

    
    chartContainer.append("text")
        .attr("x", size.width / 2) 
        .attr("y", 20) 
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Global revenue and financial results of the Coca-Cola Company(in million U.S. dollars)"); 

    chartContainer
        .append("g")
        .attr("transform", `translate(0,${size.height - margin.bottom})`)
        .call(d3.axisBottom(x).tickFormat(d3.format("d")))
        .selectAll('text')
        .style('font-size', '11px'); 
    
    chartContainer.append('text')
        .attr('x', margin.left + size.width / 2) 
        .attr('y', size.height-40) 
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Year');
    
    chartContainer
        .append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y))
        .selectAll('text')
        .style('font-size', '11px'); 
    
    chartContainer.append('text')
        .attr('x', -(margin.top + size.height / 2 -50)) 
        .attr('y', margin.left/4-5) 
        .attr('transform', 'rotate(-90)') 
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Benefit(in million U.S. dollars)');
    
    const revenuePath = chartContainer
        .append("path")
        .datum(Ndata)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 1.5)
        .attr("d", lineRevenue);

    const revenuePathNode = revenuePath.node();
    if (revenuePathNode) {
        const totalLengthRevenue = revenuePathNode.getTotalLength();
        revenuePath
          .attr("stroke-dasharray", `${totalLengthRevenue} ${totalLengthRevenue}`)
          .attr("stroke-dashoffset", totalLengthRevenue)
          .transition()
          .duration(2000)
          .ease(d3.easeLinear)
          .attr("stroke-dashoffset", 0);
      } else {
        console.error("revenuePath.node() is null");
    }
    
    chartContainer
        .selectAll(".revenue-point")
        .data(Ndata)
        .join("circle")
        .attr("class", "revenue-point")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.value))
        .attr("r", 4)
        .attr("fill", "steelblue")
        .on("mouseover", (event, d) => {
            tooltip
            .style("visibility", "visible")
            .text(`Year: ${d.year}, Revenue: $${d.value}`);
        })
        .on("mousemove", event => {
            tooltip
            .style("top", `${event.pageY - 10}px`)
            .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"));
    
    const incomePath = chartContainer
        .append("path")
        .datum(Odata)
        .attr("fill", "none")
        .attr("stroke", "orange")
        .attr("stroke-width", 1.5)
        .attr("d", lineIncome);

    const totalLengthIncomeNode = incomePath.node();
    if(totalLengthIncomeNode){
        const totalLengthIncome = totalLengthIncomeNode.getTotalLength();
        incomePath
        .attr("stroke-dasharray", totalLengthIncome + " " + totalLengthIncome)
        .attr("stroke-dashoffset", totalLengthIncome)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
    }else{
        console.error("incomePath.node() is null");
    }
    

    chartContainer
        .selectAll(".income-point")
        .data(Odata)
        .join("circle")
        .attr("class", "income-point")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.value))
        .attr("r", 4)
        .attr("fill", "orange")
        .on("mouseover", (event, d) => {
        tooltip
            .style("visibility", "visible")
            .text(`Year: ${d.year}, Income: $${d.value}`);
        })
        .on("mousemove", event => {
        tooltip
            .style("top", `${event.pageY - 10}px`)
            .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"));
    
    const legendHeight=240;
    
    chartContainer
        .append("rect")
        .attr("x", size.width - margin.right - 170)
        .attr("y", margin.top + legendHeight)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", "steelblue");
    chartContainer
        .append("text")
        .attr("x", size.width - margin.right - 150)
        .attr("y", margin.top +legendHeight+12)
        .attr("fill", "steelblue")
        .text("Net Operating Revenue");
    
    chartContainer
        .append("rect")
        .attr("x", size.width - margin.right - 170)
        .attr("y", margin.top + legendHeight+25)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", "orange");
    
    chartContainer
        .append("text")
        .attr("x", size.width - margin.right - 150)
        .attr("y", margin.top + legendHeight+37)
        .attr("fill", "orange")
        .text("Operating Income");
    }

  return (
    <>
      <div ref={barRef} className='chart-container' style={{marginLeft:'20px',marginRight:'20px',marginTop:'20px'}}>
        <svg id='bar-svg' width='100%' height='100%'></svg>
      </div>
    </>
  )
}
