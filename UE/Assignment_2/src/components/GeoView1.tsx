import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { FeatureCollection, Geometry } from 'geojson';

// Mapping from GeoJSON `name` to `iso_a3` for missing `iso_a3` values
const nameToIsoA3Map: Record<string, string> = {
    Germany: 'DEU',
    Austria: 'AUT',
    Belgium: 'BEL',
    'Czech Republic': 'CZE',
    Switzerland: 'CHE',
    // Add more mappings as needed
};

const GeoView1 = () => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const [year, setYear] = useState<number>(1905);
    const [worldMap, setWorldMap] = useState<any>(null);
    const [data, setData] = useState<Record<string, any> | null>(null);

    // Fetch world map data
    const fetchWorldMap = async () => {
        try {
            const response = await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json');
            if (!response.ok) throw new Error('Failed to fetch world map');
            const mapData = await response.json();
            return mapData;
        } catch (error) {
            console.error('Error fetching world map:', error);
            return null;
        }
    };

    // Fetch exhibition data
    const fetchData = async () => {
        try {
            const response = await fetch('/data/data.json'); // Ensure this path is correct
            if (!response.ok) throw new Error('Failed to fetch 1_geographic_timeline.json');
            const exhibitionData = await response.json();
            return exhibitionData;
        } catch (error) {
            console.error('Error fetching 1_geographic_timeline.json:', error);
            return null;
        }
    };

    useEffect(() => {
        const loadData = async () => {
            const mapData = await fetchWorldMap();
            const exhibitionData = await fetchData();
            setWorldMap(mapData);
            setData(exhibitionData);
        };
        loadData();
    }, []);

    useEffect(() => {
        if (!worldMap || !data) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous elements

        const width = 900;
        const height = 500;

        const geoJSON: FeatureCollection<Geometry> = topojson.feature(
            worldMap,
            worldMap.objects.countries
        ) as unknown as FeatureCollection<Geometry>;

        console.log('GeoJSON:', geoJSON);

        const projection = d3.geoMercator().fitSize([width, height], geoJSON);
        const pathGenerator = d3.geoPath().projection(projection);

        // Heatmap color scale
        const colorScale = d3.scaleSequentialLog(d3.interpolateReds)
            .domain([1, 5000]); // Adjust domain based on data range

        // Add paths for countries
        svg.append('g')
            .selectAll('path')
            .data(geoJSON.features)
            .enter()
            .append('path')
            .attr('d', pathGenerator as any)
            .attr('fill', (d: any) => {
                // Use iso_a3 if available, otherwise map `name` to iso_a3
                const countryCode =
                    d.properties?.iso_a3 || nameToIsoA3Map[d.properties?.name];
                if (!countryCode) {
                    console.warn('No suitable property for feature:', d);
                    return '#ccc'; // Default color for missing data
                }
                const countryData = data[countryCode];
                if (!countryData) {
                    console.warn(`No data found for country code: ${countryCode}`);
                    return '#ccc'; // Default color for missing data
                }
                const yearData = countryData.data.find(
                    (entry: any) => entry.e_startdate === year
                );
                const numExhibitions = yearData?.num_exhibitions || 0;
                return numExhibitions > 0 ? colorScale(numExhibitions) : '#ccc';
            })
            .attr('stroke', '#ffffff')
            .on('mouseover', function (event, d: any) {
                const countryCode =
                    d.properties?.iso_a3 || nameToIsoA3Map[d.properties?.name];
                const countryData = data[countryCode];
                const yearData = countryData?.data.find(
                    (entry: any) => entry.e_startdate === year
                );
                const numExhibitions = yearData?.num_exhibitions || 0;
                const countryName = countryData?.country_name || d.properties?.name || 'Unknown';

                d3.select(this).attr('stroke-width', 2).attr('stroke', '#000');

                const tooltip = d3.select('#tooltip');
                tooltip
                    .style('opacity', 1)
                    .html(
                        `<strong>${countryName}</strong>: ${numExhibitions} exhibitions in ${year}`
                    )
                    .style('left', `${event.pageX + 5}px`)
                    .style('top', `${event.pageY - 28}px`);
            })
            .on('mouseout', function () {
                d3.select(this).attr('stroke-width', 1).attr('stroke', '#ffffff');
                d3.select('#tooltip').style('opacity', 0);
            });

        // Add tooltip if not already present
        if (d3.select('#tooltip').empty()) {
            d3.select('body')
                .append('div')
                .attr('id', 'tooltip')
                .style('position', 'absolute')
                .style('opacity', 0)
                .style('background', 'lightsteelblue')
                .style('border', '1px solid #aaa')
                .style('border-radius', '5px')
                .style('pointer-events', 'none')
                .style('padding', '5px')
                .style('font-size', '12px');
        }
    }, [worldMap, data, year]);

    if (!worldMap || !data) return <p>Loading data...</p>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h1>Geographical Heatmap of Exhibitions</h1>
            <svg ref={svgRef} width={1000} height={500}></svg>
            <input
                type="range"
                min="1902"
                max="1915"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
            />
            <p>Year: {year}</p>
        </div>
    );
};

export default GeoView1;
