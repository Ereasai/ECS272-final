import React, { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { useResizeObserver, useDebounceCallback } from 'usehooks-ts';
import { isEmpty } from 'lodash';
import { ComponentSize, Margin } from '../types';
import { Select, MenuItem, FormControl, InputLabel, Box } from '@mui/material';

interface DataBar {
  year: number;
  age_Group: string;
  category: string;
  type:string;
  value: number;
}

export default function Example() {
  const [data, setData] = useState<DataBar[]>([]);
  const [filteredData, setFilteredData] = useState<DataBar[]>([]);
  const [age_Groups, setAge_Groups] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedAge_Group, setSelectedAge_Group] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const barRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<ComponentSize>({ width: 0, height: 0 });
  const margin: Margin = { top: 40, right: 20, bottom: 80, left: 60 };
  const onResize = useDebounceCallback((size: ComponentSize) => setSize(size), 200);

  useResizeObserver({ ref: barRef, onResize });

  useEffect(() => {
    const loadData = async () => {
      try {
        const rawData = await d3.csv('../../data/suagr_california.csv', (d) => ({
          year: +d.Year,
          age_Group: d.Age_Group,
          category: d.Category,
          type:d.Type,
          value: +d.Consumed,
        })) as DataBar[];
        setData(rawData);
        const uniqueYear = Array.from(new Set(rawData.map((d) => d.year)));
        setYears(uniqueYear);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedYear) {
      setFilteredData([]);
      return;
    }
    const filteredAge_group = Array.from(
      new Set(data.filter((d) => d.year === selectedYear).map((d) => d.age_Group))
    );
    setAge_Groups(filteredAge_group);
    setSelectedAge_Group(null); 
    
    setCategories([]);
    setSelectedCategory(null);
  }, [selectedYear, data]);

  useEffect(() => {
    if (!selectedAge_Group) {
      setFilteredData([]);
      return;
    }

    const filteredCategories = Array.from(
      new Set(data.filter((d) => d.age_Group === selectedAge_Group).map((d) => d.category))
    );
    setCategories(filteredCategories);
    setSelectedCategory(null);
    setFilteredData([]);
  }, [selectedAge_Group, data]);

  useEffect(() => {
    if (!selectedCategory || !selectedAge_Group || !selectedYear) {
      setFilteredData([]);
      return;
    }

    const filtered = data.filter(
      (d) =>
        d.category === selectedCategory &&
        d.age_Group === selectedAge_Group &&
        d.year === selectedYear
    );
    setFilteredData(filtered);
  }, [selectedCategory, selectedAge_Group, selectedYear, data]);

  useEffect(() => {
    if (isEmpty(filteredData)) {
      d3.select('#bar-svg').selectAll('*').remove(); 
      return;
    }
    if (size.width === 0 || size.height === 0) return;
    d3.select('#bar-svg').selectAll('*').remove();
    initChart();
  }, [filteredData, size]);

  function initChart() {
 
    const svg = d3.select('#bar-svg');
    const width = size.width - margin.left - margin.right;
    const height = size.height - margin.top - margin.bottom;
    const barWidth = 120; 

    const xScale = d3
      .scaleBand()
      .domain(filteredData.map((d) => d.type))
      .range([0, width])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(filteredData, (d) => d.value) || 0])
      .range([height, 0]);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);
    
    svg.append('text')
      .attr('x', size.width / 2)
      .attr('y', margin.top / 2 )
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text('Sugar-Sweetened Beverage Consumption in California Residents');

    g.append('g')
      .call(d3.axisLeft(yScale).tickSizeOuter(0))
      .selectAll('text')
      .style('font-size', '14px'); 

    svg.append('text')
      .attr('x', -(margin.top + height / 2)) 
      .attr('y', margin.left/4) 
      .attr('transform', 'rotate(-90)') 
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Mean Servings/Times Sugar-Sweetened Beverages Consumed Daily');

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(xScale).tickSizeOuter(0))
      .selectAll('text')
      .style('font-size', '14px') 
    
    svg.append('text')
      .attr('x', margin.left + width / 2) 
      .attr('y', height + margin.top + 40) 
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text('Type of People');

    const bars = g.selectAll<SVGRectElement, DataBar>('.bar')
      .data(filteredData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => (xScale(d.type) || 0)+ xScale.bandwidth() / 2 - barWidth / 2)
      .attr('y', height)
      .attr('width', barWidth)
      .attr('height', 0)
      .style('fill', '#69b3a2')
      .on('mouseover', function (event, d) {
        d3.select(this)
          .style('fill', '#ff7f0e') 

        svg.append('text')
          .attr('id', 'tooltip')
          .attr('x', (xScale(d.type) || 0) + xScale.bandwidth() / 2 + barWidth / 2)
          .attr('y', yScale(d.value) +35)
          .attr('text-anchor', 'middle')
          .style('font-size', '14px')
          .style('font-weight', 'bold')
          .style('fill', '#000')
          .text(d.value);

      })
      .on('mouseout', function () {
        d3.select(this).style('fill', '#69b3a2'); // Reset color
        d3.select('#tooltip').remove(); // Remove tooltip
      });

    bars
      .transition()
      .duration(1000) 
      .delay((_, i) => i * 100) 
      .attr('y', (d) => yScale(d.value)) 
      .attr('height', (d) => height - yScale(d.value));
  }

  return (
    <>
      <div 
        style={{
          display: 'flex',
          height: '100%',
          flexDirection: 'row',
          gap: '20px',
        }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            marginTop:'20px',
            marginLeft:'20px',
            width: '225px', // Set a fixed width for the dropdowns
          }}
        >
          <FormControl fullWidth size="small">
            <InputLabel id="year-select-label">Select Year</InputLabel>
            <Select
              labelId="year-select-label"
              value={selectedYear || ''}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              <MenuItem value="" disabled>
                Select Year
              </MenuItem>
              {years.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {selectedYear && (
            <FormControl fullWidth size="small">
              <InputLabel id="age-group-select-label">Select Age Group</InputLabel>
              <Select
                labelId="age-group-select-label"
                value={selectedAge_Group || ''}
                onChange={(e) => setSelectedAge_Group(e.target.value)}
              >
                <MenuItem value="" disabled>
                  Select Age Group
                </MenuItem>
                {age_Groups.map((age_Group) => (
                  <MenuItem key={age_Group} value={age_Group}>
                    {age_Group}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {selectedAge_Group && (
            <FormControl fullWidth size="small">
              <InputLabel id="category-select-label">Select Category</InputLabel>
              <Select
                labelId="category-select-label"
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <MenuItem value="" disabled>
                  Select Category
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        <div
          ref={barRef}
          className="chart-container"
          style={{
            flexGrow: 1, // Take the remaining space
            margin: '20px',
            position: 'relative',
          }}
        >
          <svg id="bar-svg" width="100%" height="100%"></svg>
        </div>
      </div>
    </>
  );
}
