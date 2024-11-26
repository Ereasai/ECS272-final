import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { isEmpty } from 'lodash';
import { ComponentSize, Margin } from '../types';
import { Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';

interface DataBar {
  product_name:string;
  value: number;
}

export default function Example() {
  const [Cdata, setCData] = useState<DataBar[]>([]);
  const [Sdata, setSData] = useState<DataBar[]>([]);
  const barRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 40, right: 50, bottom: 80, left: 250 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);

  useResizeObserver({ ref: barRef, onResize });

  useEffect(() => {
    const loadData = async () => {
      try {
        const caloriesData = await d3.csv('../../data/coca-cola-sugar-content.csv', (d) => ({
          product_name: d.Product_Name,
          value: +d.Calories,
        })) as DataBar[];
        setCData(caloriesData);
        const sugarData = await d3.csv('../../data/coca-cola-sugar-content.csv', (d) => ({
            product_name: d.Product_Name,
            value: +d.Total_Sugar,
          })) as DataBar[];
        console.log(sugarData);
        setSData(sugarData);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isEmpty(Cdata)&&isEmpty(Sdata)) return;
    if (size.width === 0 || size.height === 0) return;
    d3.select('#bar-svg').selectAll('*').remove();
    initChart();
  }, [Cdata,Sdata, size])

  function initChart() {
    const svg = d3.select('#bar-svg');
    const width = size.width - margin.left - margin.right;
    const height = size.height - margin.top - margin.bottom;
  
    // Updated Scales
    const yScale = d3
      .scaleBand()
      .domain(Cdata.map((d) => d.product_name))
      .range([0, height])
      .padding(0.2);
  
    const xScale = d3
      .scaleLinear()
      .domain([
        0,
        Math.max(
          d3.max(Cdata, (d) => d.value) ?? 0,
          d3.max(Sdata, (d) => d.value) ?? 0
        ),
      ])
      .range([0, width]);
  
    const barHeight = yScale.bandwidth() / 2;
  
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
  
    // Title
    svg
      .append('text')
      .attr('x', size.width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text('Calories and Sugar in different drinks');
  
    // Y-axis
    g.append('g')
      .call(d3.axisLeft(yScale).tickSizeOuter(0))
      .selectAll('text')
      .style('font-size', '14px');
  
    // X-axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickSizeOuter(0))
      .selectAll('text')
      .style('font-size', '14px');
  
    svg
      .append('text')
      .attr('x', size.width / 2)
      .attr('y', height + margin.top + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Value');
  
    svg
      .append('text')
      .attr('x', -(margin.top + height / 2))
      .attr('y', margin.left / 4)
      .attr('transform', 'rotate(-90)')
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Type of Drink');
  
    const minWidth = 5;
    g.selectAll('.bar-calories')
      .data(Cdata)
      .enter()
      .append('rect')
      .attr('class', 'bar-calories')
      .attr('y', (d) => (yScale(d.product_name) || 0))
      .attr('x', 0)
      .attr('width', 0)
      .attr('height', barHeight)
      .style('fill', '#69b3a2')
      .on('mouseover', function (event, d) {
        d3.select(this).style('fill', d3.rgb('#69b3a2').darker(1).toString());
        svg
          .append('text')
          .attr('id', 'tooltip')
          .attr('x', xScale(d.value) + margin.left + 10)
          .attr('y', (yScale(d.product_name) || 0) + barHeight / 2 + margin.top+5)
          .attr('text-anchor', 'start')
          .style('font-size', '14px')
          .style('font-weight', 'bold')
          .text(d.value);
      })
      .on('mouseout', function () {
        d3.select(this).style('fill', '#69b3a2');
        d3.select('#tooltip').remove();
      })
      .transition()
      .duration(1000)
      .delay((_, i) => i * 100)
      .attr('width', (d) => Math.max(xScale(d.value), minWidth));
  

    g.selectAll('.bar-sugar')
      .data(Sdata)
      .enter()
      .append('rect')
      .attr('class', 'bar-sugar')
      .attr('y', (d) => (yScale(d.product_name) || 0) + barHeight)
      .attr('x', 0)
      .attr('width', 0)
      .attr('height', barHeight)
      .style('fill', '#ff7f0e')
      .on('mouseover', function (event, d) {
        d3.select(this).style('fill', d3.rgb('#ff7f0e').darker(1).toString());
        svg
          .append('text')
          .attr('id', 'tooltip')
          .attr('x', xScale(d.value) + margin.left + 10)
          .attr('y', (yScale(d.product_name) || 0) + barHeight * 1.5 + margin.top+5)
          .attr('text-anchor', 'start')
          .style('font-size', '14px')
          .style('font-weight', 'bold')
          .text(d.value);
      })
      .on('mouseout', function () {
        d3.select(this).style('fill', '#ff7f0e');
        d3.select('#tooltip').remove();
      })
      .transition()
      .duration(1000)
      .delay((_, i) => i * 100)
      .attr('width', (d) => Math.max(xScale(d.value), minWidth));
  
    // Legend
    const legendData = [
      { label: 'Calories', color: '#69b3a2' },
      { label: 'Sugar(g)', color: '#ff7f0e' },
    ];
  
    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr(
        'transform',
        `translate(${size.width - margin.right - 150}, ${margin.top})`
      );
  
    legend
      .selectAll('g')
      .data(legendData)
      .enter()
      .append('g')
      .attr('transform', (_, i) => `translate(0,${i * 30})`)
      .each(function (d) {
        const g = d3.select(this);
  
        g.append('rect')
          .attr('width', 20)
          .attr('height', 20)
          .attr('fill', d.color);
  
        g.append('text')
          .attr('x', 30)
          .attr('y', 15)
          .style('font-size', '14px')
          .text(d.label);
      });
  }
  
  
  
  return (
    <>
      <div ref={barRef} className='chart-container' style={{marginLeft:'20px',marginRight:'20px',marginTop:'20px'}}>
        <svg id='bar-svg' width='100%' height='100%'></svg>
      </div>
    </>
  );
}
