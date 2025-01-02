import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

// ------------------
// Type Definitions
// ------------------
interface NodeDatum extends d3.SimulationNodeDatum {
  id: number; // numeric IDs
  firstname?: string;
  lastname?: string;
  nationality?: string;
  exhibitions_count?: number;
}

// Extend the link type so that D3 knows source/target refer to NodeDatum
interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  weight?: number;
}

// The top-level JSON structure from /data/artvis_collaboration_network.json
interface GraphData {
  nodes: NodeDatum[];
  links: LinkDatum[];
}

const ArtVisCollaborationNetwork: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  // -- State for data and user interactions --
  const [data, setData] = useState<GraphData | null>(null);
  const [minEdgeWeight, setMinEdgeWeight] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<{
    key: 'id' | 'nationality' | 'exhibitions_count';
    direction: 'asc' | 'desc';
  } | null>(null);

  // Example: fetch node-link data
  const fetchCollaborationData = async () => {
    try {
      // Adjust the path to your actual JSON file if needed
      const response = await fetch('/data/artist_collaboration_network.json');
      if (!response.ok) throw new Error('Failed to fetch network data');
      const jsonData: GraphData = await response.json();

      // Convert node IDs to numbers, if they're not already
      jsonData.nodes.forEach((n) => {
        n.id = +n.id; // ensure numeric
      });

      // Convert link sources/targets to numbers if needed
      jsonData.links.forEach((link) => {
        if (typeof link.source === 'string') link.source = +link.source;
        if (typeof link.target === 'string') link.target = +link.target;
      });

      setData(jsonData);
    } catch (error) {
      console.error('Error fetching network data:', error);
      setData(null);
    }
  };

  useEffect(() => {
    fetchCollaborationData();
  }, []);

  // Utility to filter out edges below minEdgeWeight,
  // so we keep a "filtered" version of the graph.
  const filteredData = () => {
    if (!data) return { nodes: [] as NodeDatum[], links: [] as LinkDatum[] };

    // Filter links by weight, then derive the set of used node IDs (number).
    const validLinks = data.links.filter(
      (link) => (link.weight || 0) >= minEdgeWeight
    );

    const usedNodeIds = new Set<number>(
      validLinks.flatMap((link) => [
        typeof link.source === 'object'
          ? (link.source as NodeDatum).id
          : (link.source as number),
        typeof link.target === 'object'
          ? (link.target as NodeDatum).id
          : (link.target as number),
      ])
    );

    // Keep only nodes that appear in at least one link
    const validNodes = data.nodes.filter((node) => usedNodeIds.has(node.id));
    return { nodes: validNodes, links: validLinks };
  };

  // Table summary data (just a trivial example).
  // We’ll show the node’s nationality and how many times it appears.
  const summaryData = () => {
    const { nodes } = filteredData();
    let result = nodes.map((n) => ({
      id: n.id,
      nationality: n.nationality || 'Unknown',
      exhibitions_count: n.exhibitions_count || 0,
    }));

    // Sort if needed
    if (sortConfig) {
      const { key, direction } = sortConfig;
      result.sort((a, b) => {
        if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
        if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  };

  const handleSort = (key: 'id' | 'nationality' | 'exhibitions_count') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Optionally, export the summary as JSON
  const exportData = () => {
    const blob = new Blob([JSON.stringify(summaryData(), null, 2)], {
      type: 'application/json',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'collaboration_summary.json';
    link.click();
  };

  // ---------------
  // MAIN D3 RENDER
  // ---------------
  useEffect(() => {
    if (!data || !svgRef.current) return;

    const { nodes, links } = filteredData();

    // Clear previous render
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Tooltip
    const tooltip = d3.select(tooltipRef.current);

    // Dimensions
    const width = 900;
    const height = 500;

    // Create the force simulation with NodeDatum
    const simulation = d3
      .forceSimulation<NodeDatum>(nodes)
      .force(
        'link',
        d3
          .forceLink<NodeDatum, LinkDatum>(links)
          .id((d) => d.id)
          .distance(500)
      )
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide(25));

    // Prepare color or size scales:
    // nationality might be undefined => fallback to "Unknown"
    const nationalitySet = Array.from(
      new Set(
        nodes.map((n) => n.nationality || "Unknown")
      )
    );
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(nationalitySet)
      .range(d3.schemeCategory10);

    // Node size by exhibitions_count
    const maxExhibitions = d3.max(nodes, (d) => d.exhibitions_count || 0) || 1;
    const sizeScale = d3.scaleSqrt().domain([0, maxExhibitions]).range([5, 30]);

    // Create container group
    const g = svg.append('g');

    // Edges
    const linkSelection = g
      .selectAll<SVGLineElement, LinkDatum>('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-width', (d) => Math.sqrt(d.weight || 1));

    // Nodes
    const nodeSelection = g
      .selectAll<SVGCircleElement, NodeDatum>('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', (d) => sizeScale(d.exhibitions_count || 0))
      .attr('fill', (d) => colorScale(d.nationality || 'Unknown'))
      .on('mouseover', (event, d) => {
        tooltip
          .style('visibility', 'visible')
          .html(`
            <strong>${d.firstname || ''} ${d.lastname || ''}</strong><br/>
            Nationality: ${d.nationality || 'Unknown'}<br/>
            Exhibitions: ${d.exhibitions_count || 0}<br/>
          `);
      })
      .on('mousemove', (event) => {
        tooltip
          .style('top', `${event.pageY + 10}px`)
          .style('left', `${event.pageX + 10}px`);
      })
      .on('mouseout', () => {
        tooltip.style('visibility', 'hidden');
      })
      .call(
        d3
          .drag<SVGCircleElement, NodeDatum>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Zoom handling
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Ticking the simulation
    simulation.on('tick', () => {
      linkSelection
        .attr('x1', (d) => ((d.source as NodeDatum).x ?? 0))
        .attr('y1', (d) => ((d.source as NodeDatum).y ?? 0))
        .attr('x2', (d) => ((d.target as NodeDatum).x ?? 0))
        .attr('y2', (d) => ((d.target as NodeDatum).y ?? 0));

      nodeSelection
        .attr('cx', (d) => d.x ?? 0)
        .attr('cy', (d) => d.y ?? 0);
    });
  }, [data, minEdgeWeight, sortConfig]);

  return (
    <div
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
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

      <h1>Artist Collaboration Network</h1>
      <p style={{ maxWidth: '600px', textAlign: 'center', margin: '10px 0' }}>
        This visualization shows collaborations among artists based on shared
        exhibitions. Nodes represent individual artists, and edges indicate
        shared exhibitions, weighted by how many times artists exhibited
        together.
      </p>

      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <svg
          ref={svgRef}
          width={900}
          height={500}
          style={{ border: '1px solid #ccc' }}
        />
      </div>

      {/* Tooltip Div */}
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

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          width: '100%',
          marginTop: '20px',
        }}
      >
        <div>
          <input
            type="range"
            min="1"
            max="35"
            value={minEdgeWeight}
            onChange={(e) => setMinEdgeWeight(parseInt(e.target.value, 10))}
            style={{ width: '300px' }}
          />
          <p>Minimum Shared-Exhibition Weight: {minEdgeWeight}</p>
        </div>
      </div>

      {/* Data Table */}
      <table
        style={{
          marginTop: '20px',
          borderCollapse: 'collapse',
          width: '80%',
          textAlign: 'left',
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>
              ID
              <button
                onClick={() => handleSort('id')}
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
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>
              Nationality
              <button
                onClick={() => handleSort('nationality')}
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
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>
              Exhibitions
              <button
                onClick={() => handleSort('exhibitions_count')}
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
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                {entry.id}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                {entry.nationality}
              </td>
              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                {entry.exhibitions_count}
              </td>
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

export default ArtVisCollaborationNetwork;