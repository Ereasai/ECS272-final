import React from 'react'
import { useEffect, useState, useRef } from 'react';

export default function ExperimentViz() {

  useEffect(() => {
    // For reading json file
    /*if (isEmpty(dataFromJson)) return;
    setBars(dataFromJson.data);*/
    
    // For reading csv file
    const dataFromCSV = async () => {
      try {
        const csvData = await d3.csv('../../data/sugar_california.csv', d => {
          // This callback allows you to rename the keys, format values, and drop columns you don't need
          console.log(d)
          return {category: d.category, value: +d.value};
        });
        setBars(csvData);
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    } 
    dataFromCSV();
  }, []);


  return (<div></div>)

}