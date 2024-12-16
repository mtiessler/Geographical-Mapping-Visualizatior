import React, { useEffect } from 'react';
import * as d3 from 'd3';

const View4: React.FC = () => {
    useEffect(() => {
        const data = [10, 20, 30, 40, 50];

        const svg = d3.select('#graph-view4')
            .append('svg')
            .attr('width', 600)
            .attr('height', 400);

        // Bar graph placeholder
        svg.selectAll('rect')
            .data(data)
            .enter()
            .append('rect')
            .attr('x', (_, i) => i * 60)
            .attr('y', (d) => 400 - d * 5)
            .attr('width', 50)
            .attr('height', (d) => d * 5)
            .attr('fill', 'teal');

        svg.selectAll('text')
            .data(data)
            .enter()
            .append('text')
            .attr('x', (_, i) => i * 60 + 15)
            .attr('y', (d) => 400 - d * 5 - 10)
            .text((d) => d)
            .style('fill', 'black');
    }, []);

    return (
        <div>
            <h2>Graph View 4</h2>
            <div id="graph-view4"></div>
        </div>
    );
};

export default View4;
