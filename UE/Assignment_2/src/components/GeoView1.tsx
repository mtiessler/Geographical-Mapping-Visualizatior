import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { FeatureCollection, Geometry } from 'geojson';

const nameToIsoA3Map: Record<string, string> = {
    Germany: 'DEU',
    Austria: 'AUT',
    Belgium: 'BEL',
    Czechia: 'CZE',
    Switzerland: 'CHE',
    'United States of America': 'USA',
    Ukraine: 'UKR',
    Australia: 'AUS',
    Spain: 'ESP',
    France: 'FRA',
    Hungary: 'HUN',
    Italy: 'ITA',
    Japan: 'JPN',
    Lithuania: 'LTU',
    Netherlands: 'NLD',
    Poland: 'POL',
    Russia: 'RUS',
    Sweden: 'SWE',
    Unknown: 'Unknown',
};

const importantDates = [
    { year: 1912, description: 'Titanic Sinks' },
    { year: 1914, description: 'Start of WWI' },
];

const GeoView1 = () => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const legendRef = useRef<SVGSVGElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const [year, setYear] = useState<number>(1905);
    const [minExhibitions, setMinExhibitions] = useState<number>(1);
    const [worldMap, setWorldMap] = useState<any>(null);
    const [data, setData] = useState<Record<string, any> | null>(null);
    const [maxExhibitions, setMaxExhibitions] = useState<number>(5000);
    const [sortConfig, setSortConfig] = useState<{ key: 'country' | 'numExhibitions'; direction: 'asc' | 'desc' } | null>(null);

    const fetchWorldMap = async () => {
        try {
            const response = await fetch(
                'https://unpkg.com/world-atlas@2.0.2/countries-110m.json'
            );
            if (!response.ok) throw new Error('Failed to fetch world map');
            return await response.json();
        } catch (error) {
            console.error('Error fetching world map:', error);
            return null;
        }
    };

    const fetchData = async () => {
        try {
            const response = await fetch('/data/1_geographic_timeline.json');
            if (!response.ok) throw new Error('Failed to fetch data');
            const exhibitionData = await response.json();

            const maxExhibitions = Math.max(
                ...Object.values(exhibitionData).flatMap((d: any) =>
                    d.data.map((entry: any) => entry.num_exhibitions)
                )
            );
            setMaxExhibitions(maxExhibitions);

            return exhibitionData;
        } catch (error) {
            console.error('Error fetching data:', error);
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

    const summaryData = () => {
        if (!data) return [];
        let result = Object.entries(data)
            .map(([key, value]: [string, any]) => {
                const yearData = value.data.find((entry: any) => entry.e_startdate === year);
                return {
                    country: value.country_name,
                    numExhibitions: yearData?.num_exhibitions || 0,
                };
            })
            .filter((entry) => entry.numExhibitions >= minExhibitions);

        if (sortConfig) {
            result = result.sort((a, b) => {
                const key = sortConfig.key as keyof typeof a; // Explicitly assert the key type
                if (a[key] < b[key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[key] > b[key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    };

    const handleSort = (key: 'country' | 'numExhibitions') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const exportData = () => {
        const blob = new Blob([JSON.stringify(summaryData(), null, 2)], {
            type: 'application/json',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'exhibitions_data.json';
        link.click();
    };

    useEffect(() => {
        if (!worldMap || !data || !svgRef.current) return;

        const svg = d3.select(svgRef.current as SVGSVGElement);
        svg.selectAll('*').remove();

        const tooltip = d3.select(tooltipRef.current);

        const width = 900;
        const height = 500;

        const geoJSON: FeatureCollection<Geometry> = topojson.feature(
            worldMap,
            worldMap.objects.countries
        ) as unknown as FeatureCollection<Geometry>;

        const projection = d3.geoMercator().fitSize([width, height], geoJSON);
        const pathGenerator = d3.geoPath().projection(projection);

        const colorScale = d3
            .scaleSequentialLog(d3.interpolateReds)
            .domain([1, maxExhibitions]);

        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([1, 8])
            .translateExtent([[0, 0], [width, height]])
            .on('zoom', (event) => {
                svg.select('g').attr('transform', event.transform);
            });

        svg.call(zoom);

        const g = svg.append('g');

        g.selectAll('path')
            .data(geoJSON.features)
            .enter()
            .append('path')
            .attr('d', pathGenerator as any)
            .attr('fill', (d: any) => {
                const countryCode = d.properties?.iso_a3 || nameToIsoA3Map[d.properties?.name];
                if (!countryCode) return '#ccc';
                const countryData = data[countryCode];
                if (!countryData) return '#ccc';
                const yearData = countryData.data.find(
                    (entry: any) => entry.e_startdate === year
                );
                const numExhibitions = yearData?.num_exhibitions || 0;
                return numExhibitions >= minExhibitions ? colorScale(numExhibitions) : '#ccc';
            })
            .attr('stroke', '#ffffff')
            .on('mouseover', (event, d: any) => {
                const countryName = d.properties?.name || 'Unknown';
                const countryCode = d.properties?.iso_a3 || nameToIsoA3Map[d.properties?.name];
                const countryData = data[countryCode];
                const yearData = countryData?.data.find(
                    (entry: any) => entry.e_startdate === year
                );
                const numExhibitions = yearData?.num_exhibitions || 0;

                tooltip.style('visibility', 'visible')
                    .html(`
                        <strong>${countryName}</strong><br>
                        Exhibitions: ${numExhibitions}
                    `);
            })
            .on('mousemove', (event) => {
                tooltip.style('top', `${event.pageY + 10}px`)
                    .style('left', `${event.pageX + 10}px`);
            })
            .on('mouseout', () => {
                tooltip.style('visibility', 'hidden');
            });

        const legend = d3.select(legendRef.current);
        legend.selectAll('*').remove();

        const legendHeight = 300;
        const legendWidth = 20;

        const legendScale = d3
            .scaleLog()
            .domain(colorScale.domain())
            .range([legendHeight, 0]);

        const legendAxis = d3.axisRight(legendScale).ticks(5, '~s').tickSize(6);

        const gradient = legend
            .append('defs')
            .append('linearGradient')
            .attr('id', 'legend-gradient')
            .attr('x1', '0%')
            .attr('x2', '0%')
            .attr('y1', '100%')
            .attr('y2', '0%');

        const gradientStops = d3
            .range(0, 1.1, 0.1)
            .map((t) => ({
                t,
                color: colorScale(
                    colorScale.domain()[0] * (colorScale.domain()[1] / colorScale.domain()[0]) ** t
                ),
            }));

        gradient
            .selectAll('stop')
            .data(gradientStops)
            .enter()
            .append('stop')
            .attr('offset', (d) => `${d.t * 100}%`)
            .attr('stop-color', (d) => d.color);

        legend
            .append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#legend-gradient)')
            .attr('x', 0)
            .attr('y', 20);

        legend
            .append('g')
            .attr('transform', `translate(${legendWidth}, 20)`)
            .call(legendAxis);

        legend
            .append('text')
            .attr('x', -legendHeight / 2 - 20)
            .attr('y', -30)
            .attr('transform', `rotate(-90)`)
            .style('text-anchor', 'middle')
            .text('Number of Exhibitions');
    }, [worldMap, data, year, minExhibitions, maxExhibitions]);

    return (
        <div style={{padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
            <button
                style={{
                    alignSelf: 'flex-start',
                    marginBottom: '10px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    cursor: 'pointer',
                }}
                onClick={() => (window.location.href = '/')}
            >
                Go Back
            </button>
            <h1>Geographical Heatmap of Exhibitions</h1>
            <p style={{maxWidth: '600px', textAlign: 'center', margin: '10px 0'}}>
                This map visualizes the number of exhibitions held in various countries between 1902 and 1915.
                You are currently viewing data for <strong>{year}</strong>
                {importantDates.some((date) => date.year === year) && (
                    <span style={{color: 'red', fontWeight: 'bold'}}>
                        {' '}({importantDates.find((date) => date.year === year)?.description})
                    </span>
                )}.
                Use the sliders below to explore the data for different years and set the minimum number of exhibitions
                required to display a country.
            </p>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <svg ref={svgRef} width={900} height={500} style={{border: '1px solid #ccc'}}></svg>
                <svg ref={legendRef} width={100} height={350} style={{marginLeft: '10px'}}></svg>
            </div>
            <div
                ref={tooltipRef}
                style={{
                    position: 'absolute',
                    visibility: 'hidden',
                    background: '#fff',
                    padding: '5px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    pointerEvents: 'none',
                    zIndex: 10,
                }}
            ></div>
            <div style={{display: 'flex', justifyContent: 'space-around', width: '100%', marginTop: '20px'}}>
                <div>
                    <input
                        type="range"
                        min="1902"
                        max="1915"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value, 10))}
                        style={{width: '300px'}}
                    />
                    <p>Year: {year}</p>
                </div>
                <div>
                    <input
                        type="range"
                        min="1"
                        max={maxExhibitions}
                        value={minExhibitions}
                        onChange={(e) => setMinExhibitions(parseInt(e.target.value, 10))}
                        style={{width: '300px'}}
                    />
                    <p>Minimum Exhibitions: {minExhibitions}</p>
                </div>
            </div>
            <table style={{marginTop: '20px', borderCollapse: 'collapse', width: '80%', textAlign: 'left'}}>
                <thead>
                <tr style={{backgroundColor: '#f2f2f2'}}>
                    <th style={{padding: '10px', border: '1px solid #ddd'}}>
                        Country
                        <button
                            onClick={() => handleSort('country')}
                            style={{
                                marginLeft: '10px',
                                backgroundColor: '#ddd',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '5px',
                            }}
                        >
                            Sort
                        </button>
                    </th>
                    <th style={{padding: '10px', border: '1px solid #ddd'}}>
                        Exhibitions
                        <button
                            onClick={() => handleSort('numExhibitions')}
                            style={{
                                marginLeft: '10px',
                                backgroundColor: '#ddd',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '5px',
                            }}
                        >
                            Sort
                        </button>
                    </th>
                </tr>
                </thead>
                <tbody>
                {summaryData().map((entry, index) => (
                    <tr key={index}>
                        <td style={{padding: '10px', border: '1px solid #ddd'}}>{entry.country}</td>
                        <td style={{padding: '10px', border: '1px solid #ddd'}}>{entry.numExhibitions}</td>
                    </tr>
                ))}
                </tbody>
            </table>
            <button
                style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    cursor: 'pointer',
                }}
                onClick={exportData}
            >
                Export Data
            </button>
        </div>
    );
};

export default GeoView1;
