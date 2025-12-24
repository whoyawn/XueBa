import { useState, useEffect, useCallback, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { forceCollide } from 'd3-force';
import type { Chengyu, StrictnessLevel, DictionaryMaps } from './types';
import { loadDictionary, findChengyu, getNextChengyus } from './dictionary';
import './App.css';

interface GraphNode {
  id: string;
  chengyu: Chengyu;
  isCenter?: boolean;
  isTrail?: boolean;
}

interface GraphLink {
  source: string;
  target: string;
  isTrailLink?: boolean;
}

function App() {
  const [dictionary, setDictionary] = useState<DictionaryMaps | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [trail, setTrail] = useState<Chengyu[]>([]);
  const [strictness, setStrictness] = useState<StrictnessLevel>(1);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[], links: GraphLink[] }>({ nodes: [], links: [] });
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const fgRef = useRef<any>();

  const currentChengyu = trail.length > 0 ? trail[trail.length - 1] : null;

  // Load dictionary on mount
  useEffect(() => {
    loadDictionary()
      .then((dict) => {
        setDictionary(dict);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Update graph when trail or strictness changes
  useEffect(() => {
    if (!dictionary || trail.length === 0) {
      setGraphData({ nodes: [], links: [] });
      return;
    }

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Add trail nodes (previous chengyus) and their connections
    trail.forEach((chengyu, index) => {
      const isLastInTrail = index === trail.length - 1;
      nodes.push({
        id: chengyu.text,
        chengyu,
        isCenter: isLastInTrail,
        isTrail: !isLastInTrail
      });

      // Connect trail nodes in sequence
      if (index > 0) {
        links.push({
          source: trail[index - 1].text,
          target: chengyu.text,
          isTrailLink: true
        });
      }
    });

    // Add child nodes for the current (last) chengyu
    const currentChengyu = trail[trail.length - 1];
    const nextChengyus = getNextChengyus(dictionary, currentChengyu, strictness);

    nextChengyus.forEach((chengyu) => {
      // Don't add if it's already in the trail
      if (!trail.some(t => t.text === chengyu.text)) {
        nodes.push({ id: chengyu.text, chengyu });
        links.push({ source: currentChengyu.text, target: chengyu.text });
      }
    });

    setGraphData({ nodes, links });
  }, [dictionary, trail, strictness]);

  // Configure D3 forces when graph is ready
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      const fg = fgRef.current;

      // Strong repulsion to prevent overlapping
      fg.d3Force('charge').strength(-1200);
      fg.d3Force('link').distance((link: any) => link.isTrailLink ? 150 : 200);
      fg.d3Force('center', null); // Disable centering force

      // Add custom force to position nodes by type
      fg.d3Force('position', (alpha: number) => {
        graphData.nodes.forEach((node: any) => {
          if (!node.isCenter && !node.isTrail) {
            // Push child nodes to the right but keep them in bounds
            const targetX = 400;
            const strength = 0.2;
            node.vx = node.vx || 0;
            node.vx += (targetX - (node.x || 0)) * strength;
          } else if (node.isTrail) {
            // Pull trail nodes to the left
            const targetX = -400;
            const strength = 0.2;
            node.vx = node.vx || 0;
            node.vx += (targetX - (node.x || 0)) * strength;
          }
        });
      });

      // Add collision detection to prevent overlaps
      const collisionRadius = 70; // Smaller radius for more compact layout
      fg.d3Force('collide', forceCollide(collisionRadius).strength(1).iterations(3));

      // Set initial positions
      const trailNodes = graphData.nodes.filter(n => n.isTrail);
      const centerNode = graphData.nodes.find(n => n.isCenter);
      const childNodes = graphData.nodes.filter(n => !n.isCenter && !n.isTrail);

      trailNodes.forEach((node, index) => {
        if (!node.x || !node.y) {
          node.x = -400;
          node.y = (index - (trailNodes.length - 1) / 2) * 100;
        }
        delete node.fx;
        delete node.fy;
      });

      // Spread child nodes in a compact grid pattern on the right
      childNodes.forEach((node, index) => {
        if (!node.x || !node.y) {
          const cols = Math.ceil(Math.sqrt(childNodes.length * 1.5)); // More columns for compact layout
          const row = Math.floor(index / cols);
          const col = index % cols;
          node.x = 350 + col * 130; // Closer to center, tighter spacing
          node.y = (row - (Math.ceil(childNodes.length / cols) - 1) / 2) * 90; // Tighter vertical spacing
        }
        delete node.fx;
        delete node.fy;
      });

      // Pin center node at origin (fixed, non-movable)
      if (centerNode) {
        centerNode.fx = 0;
        centerNode.fy = 0;
      }

      // Restart simulation
      fg.d3ReheatSimulation();
    }
  }, [graphData]);

  const handleInputSubmit = () => {
    if (!dictionary || !inputText.trim()) {
      setHasAttemptedSubmit(true);
      return;
    }

    const chengyu = findChengyu(dictionary, inputText.trim());
    if (!chengyu) {
      setError(`"${inputText}" not found in dictionary`);
      setHasAttemptedSubmit(true);
      return;
    }

    setError(null);
    setHasAttemptedSubmit(false);
    setTrail([chengyu]); // Start new trail
    setInputText('');
    setShowInput(false);
  };

  // Auto-submit when 4 characters are entered (but not during IME composition)
  useEffect(() => {
    if (inputText.length === 4 && !currentChengyu && dictionary && !isComposing) {
      const chengyu = findChengyu(dictionary, inputText.trim());
      if (chengyu) {
        setError(null);
        setHasAttemptedSubmit(false);
        setTrail([chengyu]);
        setInputText('');
      } else {
        setError(`"${inputText}" not found in dictionary`);
        setHasAttemptedSubmit(true);
      }
    }
  }, [inputText, currentChengyu, dictionary, isComposing]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    if (node.isTrail) {
      // Clicking a trail node - go back to that point
      const clickedIndex = trail.findIndex(c => c.text === node.chengyu.text);
      if (clickedIndex !== -1) {
        setTrail(prev => prev.slice(0, clickedIndex + 1));
        setError(null);
      }
    } else if (!node.isCenter) {
      // Only add to trail if it's a child node (not center, not already in trail)
      setTrail(prev => [...prev, node.chengyu]);
      setError(null);
    }
  }, [trail]);

  const handleBack = () => {
    if (trail.length > 1) {
      setTrail(prev => prev.slice(0, -1)); // Remove last chengyu
      setError(null);
    }
  };

  const handleStrictnessChange = (level: StrictnessLevel) => {
    setStrictness(level);
  };

  if (loading) {
    return (
      <div className="relative max-w-7xl mx-auto p-8 min-h-screen">
        <div className="bg-white rounded-xl p-12 text-center shadow-lg">
          Loading dictionary...
        </div>
      </div>
    );
  }

  if (error && !dictionary) {
    return (
      <div className="relative max-w-7xl mx-auto p-8 min-h-screen">
        <div className="bg-white rounded-xl p-12 text-center shadow-lg text-red-600">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto p-8 h-screen overflow-hidden">
      <header className="text-center text-white mb-8">
        <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">成语接龙</h1>
      </header>

      {/* Strictness radio in top left */}
      <div className="absolute top-8 left-8 flex gap-2 z-10">
        <label className="cursor-pointer">
          <input
            type="radio"
            name="strictness"
            value="1"
            checked={strictness === 1}
            onChange={() => handleStrictnessChange(1)}
            className="hidden"
          />
          <span className={`flex items-center justify-center px-4 py-2 rounded-lg border-2 transition-all font-medium text-sm shadow-md ${
            strictness === 1
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-600 border-gray-300 hover:border-primary hover:bg-purple-50'
          }`}>pin</span>
        </label>
        <label className="cursor-pointer">
          <input
            type="radio"
            name="strictness"
            value="2"
            checked={strictness === 2}
            onChange={() => handleStrictnessChange(2)}
            className="hidden"
          />
          <span className={`flex items-center justify-center px-4 py-2 rounded-lg border-2 transition-all font-medium text-sm shadow-md ${
            strictness === 2
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-600 border-gray-300 hover:border-primary hover:bg-purple-50'
          }`}>pin1</span>
        </label>
        <label className="cursor-pointer">
          <input
            type="radio"
            name="strictness"
            value="3"
            checked={strictness === 3}
            onChange={() => handleStrictnessChange(3)}
            className="hidden"
          />
          <span className={`flex items-center justify-center px-4 py-2 rounded-lg border-2 transition-all font-medium text-sm shadow-md ${
            strictness === 3
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-600 border-gray-300 hover:border-primary hover:bg-purple-50'
          }`}>字</span>
        </label>
      </div>

      {error && !currentChengyu && (
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 max-w-2xl mx-auto border border-red-300 text-center text-lg font-medium">
          成语不存在
        </div>
      )}

      {/* Main force graph view */}
      {currentChengyu ? (
        <div className="relative w-full mt-8">
          <div className="text-white text-base font-semibold text-center mb-4 drop-shadow-md">
            {graphData.nodes.length - 1} following 成语
          </div>
          <div className="w-full h-[75vh]">
            <ForceGraph2D
              ref={fgRef}
              graphData={graphData}
              nodeLabel={(node: any) => `${node.chengyu.text}\n${node.chengyu.pinyin.join(' ')}`}
              nodeCanvasObject={(node: any, ctx, globalScale) => {
                const label = node.chengyu.text;
                const fontSize = node.isCenter ? 64 : (node.isTrail ? 32 : 20);
                ctx.font = `bold ${fontSize}px Sans-Serif`;
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth + 20, fontSize + 16];

                // Draw card background
                ctx.fillStyle = node.isTrail ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.95)';
                ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
                ctx.shadowBlur = 10;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 4;

                const borderRadius = 12;
                const x = node.x - bckgDimensions[0] / 2;
                const y = node.y - bckgDimensions[1] / 2;
                const width = bckgDimensions[0];
                const height = bckgDimensions[1];

                ctx.beginPath();
                ctx.moveTo(x + borderRadius, y);
                ctx.lineTo(x + width - borderRadius, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + borderRadius);
                ctx.lineTo(x + width, y + height - borderRadius);
                ctx.quadraticCurveTo(x + width, y + height, x + width - borderRadius, y + height);
                ctx.lineTo(x + borderRadius, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - borderRadius);
                ctx.lineTo(x, y + borderRadius);
                ctx.quadraticCurveTo(x, y, x + borderRadius, y);
                ctx.closePath();
                ctx.fill();

                // Reset shadow for text
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;

                // Draw border
                ctx.strokeStyle = node.isCenter ? '#667eea' : (node.isTrail ? '#9333ea' : '#e5e7eb');
                ctx.lineWidth = node.isCenter ? 3 : (node.isTrail ? 2.5 : 2);
                ctx.stroke();

                // Draw text
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = node.isCenter ? '#667eea' : (node.isTrail ? '#9333ea' : '#374151');
                ctx.fillText(label, node.x, node.y);
              }}
              nodePointerAreaPaint={(node: any, color, ctx) => {
                const label = node.chengyu.text;
                const fontSize = node.isCenter ? 64 : (node.isTrail ? 32 : 20);
                ctx.font = `bold ${fontSize}px Sans-Serif`;
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth + 20, fontSize + 16];
                ctx.fillStyle = color;
                ctx.fillRect(
                  node.x - bckgDimensions[0] / 2,
                  node.y - bckgDimensions[1] / 2,
                  bckgDimensions[0],
                  bckgDimensions[1]
                );
              }}
              onNodeClick={handleNodeClick}
              linkColor={(link: any) => link.isTrailLink ? '#9333ea' : '#667eea'}
              linkWidth={(link: any) => link.isTrailLink ? 3 : 2}
              linkDirectionalParticles={(link: any) => link.isTrailLink ? 3 : 2}
              linkDirectionalParticleWidth={2}
              linkDirectionalParticleSpeed={0.005}
              d3AlphaDecay={0.3}
              d3VelocityDecay={0.8}
              cooldownTicks={50}
              enableNodeDrag={(node: any) => !node.isCenter}
              enablePanInteraction={false}
              enableZoomInteraction={false}
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[60vh]">
          <div className={`bg-white rounded-xl p-8 shadow-2xl border-4 transition-all relative ${
            error ? 'border-red-500' : 'border-primary'
          }`}>
            <div className="relative flex gap-4 items-center justify-center">
              {/* Input overlaid with cursor - positioned behind */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => {
                  const newValue = e.target.value;
                  if (!isComposing && newValue.length > 4) {
                    return;
                  }
                  setInputText(newValue);
                  setError(null);
                  setHasAttemptedSubmit(false);
                }}
                onCompositionStart={() => {
                  setIsComposing(true);
                }}
                onCompositionEnd={(e) => {
                  setIsComposing(false);
                  const value = (e.target as HTMLInputElement).value;
                  if (value.length > 4) {
                    setInputText(value.slice(0, 4));
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !isComposing) {
                    handleInputSubmit();
                  }
                }}
                className="absolute top-0 left-0 w-full h-full text-5xl font-bold text-transparent focus:outline-none z-0"
                style={{
                  caretColor: '#667eea',
                  letterSpacing: '96px',
                  paddingLeft: '40px',
                  textIndent: '0px'
                }}
                autoFocus
              />
              {/* Character display boxes - on top */}
              {[0, 1, 2, 3].map((index) => {
                const displayText = isComposing ? '' : inputText;
                const hasChar = displayText[index];
                const shouldShowRed = !hasChar && hasAttemptedSubmit;

                return (
                  <div
                    key={index}
                    className={`w-20 h-24 flex items-center justify-center border-b-4 transition-colors relative z-10 ${
                      shouldShowRed ? 'border-red-400' : 'border-gray-300'
                    }`}
                  >
                    <span className="text-5xl font-bold text-gray-800 pointer-events-none">
                      {hasChar || ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Input modal */}
      {showInput && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]"
          onClick={() => setShowInput(false)}
        >
          <div
            className="bg-white rounded-xl p-8 min-w-[400px] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-6 text-gray-800 text-center text-xl font-semibold">Change 成语</h3>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleInputSubmit()}
              placeholder="Enter a 成语 (4 characters)"
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-primary mb-4"
              maxLength={4}
              autoFocus
            />
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleInputSubmit}
                className="px-8 py-3 text-lg bg-primary text-white border-none rounded-lg cursor-pointer transition-all font-semibold hover:bg-primary/90"
              >
                Go
              </button>
              <button
                onClick={() => setShowInput(false)}
                className="px-8 py-3 text-lg bg-gray-200 text-gray-800 border-none rounded-lg cursor-pointer transition-all font-semibold hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
