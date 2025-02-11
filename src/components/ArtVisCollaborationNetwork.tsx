import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';

interface NodeDatum extends d3.SimulationNodeDatum {
    id: number;
    firstname?: string;
    lastname?: string;
    nationality?: string;
    exhibitions_count?: number;
    weight?: number;
}

interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
    source: number | NodeDatum;
    target: number | NodeDatum;
    weight?: number;
}

interface GraphData {
    nodes: NodeDatum[];
    links: LinkDatum[];
}

const ArtVisCollaborationNetwork: React.FC = () => {
    const svgRef = useRef<SVGSVGElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const [data, setData] = useState<GraphData | null>(null);
    const [minEdgeWeight, setMinEdgeWeight] = useState<number>(1);

    const colorScale = useMemo(() => {
        if (!data) return d3.scaleOrdinal<string>().range(d3.schemeCategory10);

        const uniqueNationalities = Array.from(
            new Set(data.nodes.map((d) => d.nationality || 'Unknown'))
        ).sort();

        return d3
            .scaleOrdinal<string>()
            .domain(uniqueNationalities)
            .range(d3.schemeCategory10);
    }, [data]);

    const fetchCollaborationData = async () => {
        try {
            const response = await fetch('/data/artist_collaboration_network.json');
            if (!response.ok) throw new Error('Failed to fetch network data');
            const jsonData: GraphData = await response.json();

            const nodeWeights = new Map<number, number>();
            jsonData.links.forEach((link) => {
                const sourceId =
                    typeof link.source === 'object' ? link.source.id : link.source;
                const targetId =
                    typeof link.target === 'object' ? link.target.id : link.target;
                const weight = link.weight || 0;

                if (typeof sourceId === 'number' && typeof targetId === 'number') {
                    nodeWeights.set(sourceId, (nodeWeights.get(sourceId) || 0) + weight);
                    if (sourceId !== targetId) {
                        nodeWeights.set(targetId, (nodeWeights.get(targetId) || 0) + weight);
                    }
                }
            });

            jsonData.nodes = jsonData.nodes.map((node) => ({
                ...node,
                weight: nodeWeights.get(node.id) || 0,
                exhibitions_count: nodeWeights.get(node.id) || 0,
            }));

            setData(jsonData);
        } catch (error) {
            console.error('Error fetching network data:', error);
            setData(null);
        }
    };

    const filteredData = () => {
        if (!data) return { nodes: [], links: [] };

        const validLinks = data.links.filter((link) => {
            const sourceId =
                typeof link.source === 'object' ? link.source.id : link.source;
            const targetId =
                typeof link.target === 'object' ? link.target.id : link.target;

            return (link.weight || 0) >= minEdgeWeight && sourceId !== targetId;
        });

        const connectedNodeIds = new Set(
            validLinks.flatMap((link) => {
                const sourceId =
                    typeof link.source === 'object' ? link.source.id : link.source;
                const targetId =
                    typeof link.target === 'object' ? link.target.id : link.target;
                return [sourceId, targetId];
            })
        );

        const validNodes = data.nodes.filter((node) =>
            connectedNodeIds.has(node.id)
        );

        return { nodes: validNodes, links: validLinks };
    };

    useEffect(() => {
        fetchCollaborationData();
    }, []);

    useEffect(() => {
        if (!data || !svgRef.current) return;

        const { nodes, links } = filteredData();

        if (nodes.length === 0 || links.length === 0) {
            console.warn('No valid nodes or links to render.');
            return;
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const width = 1200;
        const height = 700;

        const simulation = d3
            .forceSimulation<NodeDatum>(nodes)
            .force('link', d3.forceLink<NodeDatum, LinkDatum>(links).id((d) => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-200))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide().radius(30));

        const g = svg.append('g');

        const linkSelection = g
            .selectAll('line')
            .data(links)
            .enter()
            .append('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.5)
            .attr('stroke-width', (d) => Math.sqrt(d.weight || 1));

        const nodeGroups = g
            .selectAll('g.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'node');

        nodeGroups
            .append('circle')
            .attr('r', 10)
            .attr('fill', (d) => colorScale(d.nationality || 'Unknown'))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2);

        nodeGroups
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '.3em')
            .attr('fill', '#fff')
            .attr('font-size', '10px')
            .attr('pointer-events', 'none')
            .text((d) => `${d.firstname?.[0] || ''}${d.lastname?.[0] || ''}`);

        const tooltip = d3.select(tooltipRef.current);

        nodeGroups
            .on('mouseover', (event, d) => {
                const connectedLinks = links.filter(
                    (link) =>
                        (link.source as NodeDatum).id === d.id ||
                        (link.target as NodeDatum).id === d.id
                );

                const connectedNodes = connectedLinks.map((link) => {
                    const otherNodeId =
                        (link.source as NodeDatum).id === d.id
                            ? (link.target as NodeDatum).id
                            : (link.source as NodeDatum).id;

                    return nodes.find((node) => node.id === otherNodeId);
                }).filter((node): node is NodeDatum => !!node);

                const connectedNodeDetails = connectedNodes
                    .map(
                        (node) =>
                            `${node.firstname || ''} ${node.lastname || ''} (${node.nationality || 'Unknown'})`
                    )
                    .join('<br/>');

                linkSelection
                    .attr('stroke', (link) =>
                        connectedLinks.includes(link) ? '#ff9900' : '#999'
                    )
                    .attr('stroke-opacity', (link) =>
                        connectedLinks.includes(link) ? 0.8 : 0.2
                    );

                nodeGroups
                    .selectAll<SVGCircleElement, NodeDatum>('circle')
                    .attr('stroke', (node: NodeDatum) =>
                        connectedNodes.find((n) => n.id === node.id) || d.id === node.id ? '#ff9900' : '#fff'
                    )
                    .attr('stroke-width', (node: NodeDatum) =>
                        connectedNodes.find((n) => n.id === node.id) || d.id === node.id ? 3 : 2
                    );

                tooltip
                    .style('visibility', 'visible')
                    .html(`
                <strong>${d.firstname || ''} ${d.lastname || ''}</strong><br/>
                Nationality: ${d.nationality || 'Unknown'}<br/>
                Exhibitions: ${d.exhibitions_count || 0}<br/>
                <hr/>
                <strong>Connected to:</strong><br/>
                ${connectedNodeDetails || 'None'}
            `);
            })
            .on('mousemove', (event) => {
                tooltip
                    .style('top', `${event.pageY + 10}px`)
                    .style('left', `${event.pageX + 10}px`);
            })
            .on('mouseout', () => {
                linkSelection
                    .attr('stroke', '#999')
                    .attr('stroke-opacity', 0.5);

                nodeGroups
                    .selectAll<SVGCircleElement, NodeDatum>('circle')
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 2);

                tooltip.style('visibility', 'hidden');
            });
        const legendG = svg
            .append('g')
            .attr('transform', `translate(${width - 150}, 50)`);

        const uniqueNationalities = Array.from(
            new Set(nodes.map((d) => d.nationality || 'Unknown'))
        ).sort();

        uniqueNationalities.forEach((nat, i) => {
            const legendRow = legendG.append('g').attr('transform', `translate(0, ${i * 20})`);

            legendRow
                .append('circle')
                .attr('r', 6)
                .attr('fill', colorScale(nat))
                .attr('cx', 10);

            legendRow
                .append('text')
                .attr('x', 20)
                .attr('y', 5)
                .text(nat)
                .attr('font-size', '12px')
                .attr('fill', '#333');
        });

        const zoom = d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
            g.attr('transform', event.transform);
        });

        svg.call(zoom);

        simulation.on('tick', () => {
            linkSelection
                .attr('x1', (d) => (d.source as NodeDatum).x || 0)
                .attr('y1', (d) => (d.source as NodeDatum).y || 0)
                .attr('x2', (d) => (d.target as NodeDatum).x || 0)
                .attr('y2', (d) => (d.target as NodeDatum).y || 0);

            nodeGroups.attr('transform', (d) => `translate(${d.x || 0},${d.y || 0})`);
        });
    }, [data, minEdgeWeight]);

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                padding: '20px',
            }}
        >
            <button
                style={{
                    alignSelf: 'flex-start',
                    marginBottom: '20px',
                    padding: '10px 20px',
                    fontSize: '14px',
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
                onClick={() => (window.location.href = '/')}
            >
                Go Back
            </button>
            <h1
                style={{
                    color: '#0054a4',
                    fontWeight: 'bold',
                    marginBottom: '20px',
                    textAlign: 'center',
                }}
            >
                Artist Collaboration Network
            </h1>
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
                    maxWidth: '1200px',
                }}
            >
                <svg
                    ref={svgRef}
                    width="1200"
                    height="700"
                    style={{
                        border: '1px solid #ccc',
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    }}
                ></svg>
            </div>
            <div
                ref={tooltipRef}
                style={{
                    position: 'absolute',
                    visibility: 'hidden',
                    background: '#ffffff',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
                    pointerEvents: 'none',
                }}
            ></div>
            <div
                style={{
                    marginTop: '20px', // Space above the slider
                    width: '80%',
                    textAlign: 'center',
                    color: '#0054a4', // Blue text for the slider label
                }}
            ><label>
                Minimum Connection Weight: {minEdgeWeight}
                <input
                    type="range"
                    min="1"
                        max="100"
                        value={minEdgeWeight}
                        onChange={(e) => setMinEdgeWeight(parseInt(e.target.value, 10))}
                        style={{
                            width: '100%',
                            accentColor: '#0054a4',
                        }}
                    />
                </label>
            </div>
        </div>
    );
};

export default ArtVisCollaborationNetwork;
