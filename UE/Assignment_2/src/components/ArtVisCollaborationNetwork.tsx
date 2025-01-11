import React, { useEffect, useRef, useState, useMemo} from 'react';
import * as d3 from 'd3';

// Expanded type definitions to handle D3 force simulation properly
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
  const [minEdgeWeight, setMinEdgeWeight] = useState<number>(20);
  
  const colorScale = useMemo(() => {
    if (!data) return d3.scaleOrdinal<string>().range(d3.schemeCategory10);
    
    const uniqueNationalities = Array.from(
      new Set(data.nodes.map(d => d.nationality || 'Unknown'))
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

      // Calculate total weight of connections for each node
      const nodeWeights = new Map<number, number>();
      jsonData.links.forEach(link => {
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

      // Add weights to nodes
      jsonData.nodes = jsonData.nodes.map(node => ({
        ...node,
        weight: nodeWeights.get(node.id) || 0,
        exhibitions_count: nodeWeights.get(node.id) || 0
      }));

      setData(jsonData);
    } catch (error) {
      console.error('Error fetching network data:', error);
      setData(null);
    }
  };

  const filteredData = () => {
    if (!data) return { nodes: [], links: [] };

    // First filter links based on weight threshold
    const validLinks = data.links.filter(link => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return (link.weight || 0) >= minEdgeWeight && sourceId !== targetId;
    });

    // Get all node IDs that have at least one valid connection
    const connectedNodeIds = new Set(
        validLinks.flatMap(link => {
            const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
            const targetId = typeof link.target === 'object' ? link.target.id : link.target;
            return [sourceId, targetId];
        })
    );

    // Only include nodes that have at least one valid connection
    const validNodes = data.nodes.filter(node => connectedNodeIds.has(node.id));

    return { nodes: validNodes, links: validLinks };
  };

  useEffect(() => {
    fetchCollaborationData();
  }, []);

  // D3 visualization code
  useEffect(() => {
    if (!data || !svgRef.current) return;

    const { nodes, links } = filteredData();
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Make these bigger:
    const width = 1200;
    const height = 700;

    // Create the force simulation
    const simulation = d3
      .forceSimulation<NodeDatum>(nodes)
      .force(
        'link',
        d3
          .forceLink<NodeDatum, LinkDatum>(links)
          .id(d => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(30));

    const g = svg.append('g');

    const maxWeight = d3.max(links, d => d.weight || 0) || 1;
    const linkScale = d3
      .scaleLinear()
      .domain([minEdgeWeight, maxWeight])
      .range([0.2, 1]);

    // Draw links
    const linkSelection = g
      .selectAll<SVGLineElement, LinkDatum>('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', d => linkScale(d.weight || 0))
      .attr('stroke-width', d => Math.sqrt((d.weight || 1) / 5));

    // Draw nodes (circle size depends on exhibitions_count)
    const maxExhibitions = d3.max(nodes, d => d.exhibitions_count || 0) || 1;
    const sizeScale = d3
      .scaleSqrt()
      .domain([0, maxExhibitions])
      .range([5, 20]);

    const nodeSelection = g
      .selectAll<SVGCircleElement, NodeDatum>('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', d => sizeScale(d.exhibitions_count || 0))
      .attr('fill', d => colorScale(d.nationality || 'Unknown'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Create node groups instead of just circles
    const nodeGroups = g
      .selectAll<SVGGElement, NodeDatum>('g.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node');

    // Add circles to the node groups
    nodeGroups
      .append('circle')
      .attr('r', d => sizeScale(d.exhibitions_count || 0))
      .attr('fill', d => colorScale(d.nationality || 'Unknown'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add text labels (initials) to the node groups
    nodeGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.3em')
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .attr('pointer-events', 'none')
      .text(d => {
        const firstInitial = d.firstname?.[0] || '';
        const lastInitial = d.lastname?.[0] || '';
        return `${firstInitial}${lastInitial}`;
      });

    // Function to find connected nodes and links for a given node
    const findConnections = (nodeData: NodeDatum) => {
      const connectedLinks = links.filter(
        link =>
          (link.source as NodeDatum).id === nodeData.id ||
          (link.target as NodeDatum).id === nodeData.id
      );

      const connectedNodeIds = new Set(
        connectedLinks.flatMap(link => [
          (link.source as NodeDatum).id,
          (link.target as NodeDatum).id
        ])
      );
      connectedNodeIds.delete(nodeData.id); // Remove self from connected nodes

      const connectedNodes = nodes.filter(node =>
        connectedNodeIds.has(node.id)
      );

      return { connectedLinks, connectedNodes };
    };

    // Enhanced tooltip and hover effects
    const tooltip = d3.select(tooltipRef.current);
    nodeGroups
      .on('mouseover', (event, d) => {
        const { connectedLinks, connectedNodes } = findConnections(d);
        
        // Highlight connected links
        linkSelection
          .attr('stroke-opacity', link =>
            connectedLinks.includes(link) ? 0.8 : 0.1
          )
          .attr('stroke', link =>
            connectedLinks.includes(link) ? '#ff9900' : '#999'
          );

        // Fixed highlight for connected nodes with proper typing
        nodeGroups
          .selectAll<SVGCircleElement, NodeDatum>('circle')
          .attr('stroke', (node: NodeDatum) =>
            connectedNodes.some(n => n.id === node.id) ? '#ff9900' : '#fff'
          )
          .attr('stroke-width', (node: NodeDatum) =>
            connectedNodes.some(n => n.id === node.id) ? 3 : 2
          );

        // Enhanced tooltip content
        const connectionsList = connectedNodes
          .map(node => `${node.firstname} ${node.lastname} (${node.nationality})`)
          .join('<br/>');

        tooltip.style('visibility', 'visible').html(`
          <strong>${d.firstname} ${d.lastname}</strong><br/>
          Nationality: ${d.nationality}<br/>
          Total Exhibitions: ${d.exhibitions_count}<br/>
          <br/>
          <strong>Connected to ${connectedNodes.length} artists:</strong><br/>
          ${connectionsList}
        `);
      })
      .on('mousemove', event => {
        tooltip
          .style('top', `${event.pageY + 10}px`)
          .style('left', `${event.pageX + 10}px`);
      })
      .on('mouseout', () => {
        // Reset link appearances
        linkSelection
          .attr('stroke', '#999')
          .attr('stroke-opacity', 0.2);

        // Reset node appearances with proper typing
        nodeGroups
          .selectAll<SVGCircleElement, NodeDatum>('circle')
          .attr('stroke', '#fff')
          .attr('stroke-width', 2);

        tooltip.style('visibility', 'hidden');
      });


    // Build legend in the top-right
    const allNationalities = Array.from(
      new Set(data.nodes.map(d => d.nationality || 'Unknown'))
    ).sort();
    
    const legendG = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 130}, 20)`);

      allNationalities.forEach((nat, i) => {
        const legendRow = legendG
          .append('g')
          .attr('transform', `translate(0, ${i * 20})`);
      
        legendRow
          .append('circle')
          .attr('r', 6)
          .attr('fill', colorScale(nat));
      
        legendRow
          .append('text')
          .attr('x', 12)
          .attr('y', 3)
          .text(nat)
          .attr('font-size', '12px')
          .attr('fill', '#333');
      });

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 4])
      .on('zoom', event => {
        g.attr('transform', event.transform);
      });
    svg.call(zoom);

    // Update the simulation tick to handle the node groups
    simulation.on('tick', () => {
      linkSelection
        .attr('x1', d => (d.source as NodeDatum).x || 0)
        .attr('y1', d => (d.source as NodeDatum).y || 0)
        .attr('x2', d => (d.target as NodeDatum).x || 0)
        .attr('y2', d => (d.target as NodeDatum).y || 0);

      nodeGroups.attr('transform', d => `translate(${d.x || 0},${d.y || 0})`);
    });
  }, [data, minEdgeWeight]);

  return (
    <div className="p-5 flex flex-col items-center">
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
      <h1 className="text-2xl font-bold mb-4">Artist Collaboration Network</h1>
      <div className="w-full">
        <svg
          ref={svgRef}
          width={1200}
          height={700}
          className="border border-gray-300"
        />
        <div
          ref={tooltipRef}
          className="absolute hidden bg-white p-2 border border-gray-300 rounded shadow"
        />
        <div className="mt-4">
          <label className="block mb-2">
            Minimum Connection Weight: {minEdgeWeight}
            <input
              type="range"
              min="1"
              max="100"
              value={minEdgeWeight}
              onChange={e => setMinEdgeWeight(parseInt(e.target.value))}
              className="w-full"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default ArtVisCollaborationNetwork;
