import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { FeatureCollection, Geometry } from 'geojson';

interface ExhibitionData {
    artist_name: string;
    'e.country': string;
    'e.country_3': string;
    num_exhibitions: number;
}

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

const GeoView2 = () => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const legendRef = useRef<SVGSVGElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const [selectedArtist, setSelectedArtist] = useState<string>('Edouard Vuillard');
    const [worldMap, setWorldMap] = useState<any>(null);
    const [data, setData] = useState<ExhibitionData[] | null>(null);
    const [artists, setArtists] = useState<string[]>([]);

    const fetchWorldMap = async () => {
        try {
            const response = await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json');
            if (!response.ok) throw new Error('Failed to fetch world map');
            return await response.json();
        } catch (error) {
            console.error('Error fetching world map:', error);
            return null;
        }
    };

    const fetchData = async (): Promise<ExhibitionData[] | null> => {
        try {
            const response = await fetch('/data/map_df_filtered.json');
            if (!response.ok) throw new Error('Failed to fetch data');
            const exhibitionData: ExhibitionData[] = await response.json();

            const artistNames = [...new Set(exhibitionData.map((d) => d.artist_name))];
            setArtists(artistNames);

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

    const filteredData = (): ExhibitionData[] => {
        if (!data) return [];
        return data.filter((entry) => entry.artist_name === selectedArtist);
    };

    const exportTableData = () => {
        const tableData = filteredData().map((entry) => ({
            Country: entry['e.country'],
            Exhibitions: entry.num_exhibitions,
        }));
        const blob = new Blob([JSON.stringify(tableData, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${selectedArtist}_exhibitions.json`;
        link.click();
    };

    useEffect(() => {
        if (!worldMap || !data || !svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const tooltip = d3.select(tooltipRef.current);

        const width = 700; // Adjusted width for better layout
        const height = 500;

        const geoJSON = topojson.feature(
            worldMap,
            worldMap.objects.countries
        ) as unknown as FeatureCollection<Geometry>;

        const projection = d3.geoMercator().fitSize([width, height], geoJSON);
        const pathGenerator = d3.geoPath().projection(projection);

        const maxExhibitionsOverall = Math.max(...data.map((d) => d.num_exhibitions));

        const colorScale = d3
            .scaleSequentialLog(d3.interpolateReds)
            .domain([1, maxExhibitionsOverall]);

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
                const countryCode =
                    d.properties?.iso_a3 || nameToIsoA3Map[d.properties?.name as keyof typeof nameToIsoA3Map];
                if (!countryCode) return '#ccc';
                const countryData = filteredData().find(
                    (entry) => entry['e.country_3'] === countryCode
                );
                const numExhibitions = countryData?.num_exhibitions || 0;
                return numExhibitions > 0 ? colorScale(numExhibitions) : '#ccc';
            })
            .attr('stroke', '#ffffff')
            .on('mouseover', (event, d: any) => {
                const countryName = d.properties?.name || 'Unknown';
                const countryCode =
                    d.properties?.iso_a3 || nameToIsoA3Map[d.properties?.name as keyof typeof nameToIsoA3Map];
                const countryData = filteredData().find(
                    (entry) => entry['e.country_3'] === countryCode
                );
                const numExhibitions = countryData?.num_exhibitions || 0;

                tooltip.style('visibility', 'visible').html(`
                    <strong>${countryName}</strong><br>
                    Exhibitions: ${numExhibitions}
                `);
            })
            .on('mousemove', (event) => {
                tooltip.style('top', `${event.pageY + 10}px`).style('left', `${event.pageX + 10}px`);
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

        const gradientStops = d3.range(0, 1.1, 0.1).map((t) => ({
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

        legend.append('g').attr('transform', `translate(${legendWidth}, 20)`).call(legendAxis);

        legend
            .append('text')
            .attr('x', -legendHeight / 2 - 20)
            .attr('y', -30)
            .attr('transform', `rotate(-90)`)
            .style('text-anchor', 'middle')
            .text('Number of Exhibitions');
    }, [worldMap, data, selectedArtist]);

    return (
        <div
            style={{
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: '100vh',
                background: 'linear-gradient(to top, #0054a4, #ffffff)',
                color: '#0054a4',
                fontFamily: 'Arial, sans-serif',
                overflowY: 'auto',
            }}
        >
            <button
                style={{
                    alignSelf: 'flex-start',
                    marginBottom: '20px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#0054a4',
                    backgroundColor: '#ffffff',
                    border: '2px solid #0054a4',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                }}
                onClick={() => (window.location.href = '/')}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0054a4';
                    e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#0054a4';
                }}
            >
                Go Back
            </button>

            <h1 style={{ color: '#0054a4' }}>Geographical Heatmap of Exhibitions</h1>
            <p style={{ maxWidth: '600px', textAlign: 'center', margin: '10px 0', color: '#0054a4' }}>
                This map visualizes the number of exhibitions held in various countries by artist.
                You are currently viewing data for <strong>{selectedArtist}</strong>.
                Use the dropdown below to select a different artist.
            </p>

            <select
                value={selectedArtist}
                onChange={(e) => setSelectedArtist(e.target.value)}
                style={{
                    marginBottom: '20px',
                    padding: '10px',
                    fontSize: '14px',
                    border: '2px solid #0054a4',
                    borderRadius: '5px',
                    color: '#0054a4',
                    backgroundColor: '#ffffff',
                }}
            >
                {artists.map((artist) => (
                    <option key={artist} value={artist}>
                        {artist}
                    </option>
                ))}
            </select>

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#ffffff',
                    padding: '10px',
                    borderRadius: '10px',
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    width: '100%',
                    maxWidth: '700px',
                }}
            >
                <svg
                    ref={svgRef}
                    width="100%"
                    height="500px"
                    style={{ border: '1px solid #ccc', maxWidth: '700px' }}
                ></svg>
                <svg
                    ref={legendRef}
                    width={100}
                    height={350}
                    style={{ marginLeft: '10px' }}
                ></svg>
            </div>

            <div
                style={{
                    marginTop: '20px',
                    width: '90%',
                    maxHeight: '400px',
                    overflow: 'auto',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                }}
            >
                <table
                    style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        textAlign: 'left',
                        color: '#0054a4',
                    }}
                >
                    <thead>
                    <tr style={{ backgroundColor: '#f2f2f2', color: '#0054a4' }}>
                        <th
                            style={{
                                padding: '10px',
                                border: '1px solid #ddd',
                                position: 'sticky',
                                top: 0,
                                backgroundColor: '#f2f2f2',
                                zIndex: 1,
                            }}
                        >
                            Country
                        </th>
                        <th
                            style={{
                                padding: '10px',
                                border: '1px solid #ddd',
                                position: 'sticky',
                                top: 0,
                                backgroundColor: '#f2f2f2',
                                zIndex: 1,
                            }}
                        >
                            Exhibitions
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredData().map((entry, index) => (
                        <tr key={index}>
                            <td
                                style={{
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                }}
                            >
                                {entry['e.country']}
                            </td>
                            <td
                                style={{
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                }}
                            >
                                {entry.num_exhibitions}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <button
                style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#0054a4',
                    backgroundColor: '#ffffff',
                    border: '2px solid #0054a4',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0054a4';
                    e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                    e.currentTarget.style.color = '#0054a4';
                }}
                onClick={exportTableData}
            >
                Export Table Data
            </button>
        </div>
    );
};

export default GeoView2;
