import React, { useState, useCallback } from 'react';
import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
} from 'react-flow-renderer';
import './DecisionTreeFlow.css';
import Modal from 'react-modal';
import yaml from 'js-yaml';

const initialElements = [
  { id: '1', type: 'input', data: { label: 'Root Node', threshold: 1 }, position: { x: 250, y: 5 } },
];

Modal.setAppElement('#root');

function DecisionTreeFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialElements);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [nodeData, setNodeData] = useState({ label: '', threshold: 0 });

  const onNodeDoubleClick = (event, node) => {
    setSelectedNode(node);
    setNodeData({ label: node.data.label || '', threshold: node.data.threshold || 0 });
    setModalIsOpen(true);
  };

  const handleSave = () => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id
          ? { ...node, data: { ...node.data, label: nodeData.label, threshold: nodeData.threshold } }
          : node
      )
    );
    setModalIsOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNodeData((prevData) => ({
      ...prevData,
      [name]: name === 'threshold' ? parseFloat(value) : value,
    }));
  };

  const addNode = useCallback(() => {
    const newNode = {
      id: (nodes.length + 1).toString(),
      data: { label: `Node ${nodes.length + 1}`, threshold: 0 },
      position: { x: Math.random() * 250, y: Math.random() * 250 },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [nodes, setNodes]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const generateYAML = (rootNode) => {
    function traverse(node) {
      if (!node) return null;

      const leftNode = edges.find(edge => edge.source === node.id)?.target;
      const rightNode = edges.find(edge => edge.source === node.id && edge.target !== leftNode)?.target;

      if (node.type === 'input' || (leftNode || rightNode)) {
        return {
          feature: node.data.label,
          threshold: node.data.threshold,
          left: leftNode ? traverse(nodes.find(n => n.id === leftNode)) : null,
          right: rightNode ? traverse(nodes.find(n => n.id === rightNode)) : null,
        };
      } else {
        return {
          name: node.data.label,
          threshold: node.data.threshold,
        };
      }
    }

    const yamlStructure = {
      root: traverse(rootNode),
    };

    return yaml.dump(yamlStructure, { noRefs: true });
  };

  const handleGenerateYAML = () => {
    const rootNode = nodes.find(node => node.type === 'input');  // Supongamos que el nodo raíz es el de tipo 'input'
    const yamlContent = generateYAML(rootNode);

    // Descarga el YAML como un archivo
    const element = document.createElement('a');
    const file = new Blob([yamlContent], { type: 'text/yaml' });
    element.href = URL.createObjectURL(file);
    element.download = 'decision_tree.yaml';
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  };

  return (
    <div className="decision-tree-flow">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        style={{ width: '100%', height: '90vh' }}
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
      <button className="add-node-button" onClick={addNode}>Add Node</button>
      <button className="generate-yaml-button" onClick={handleGenerateYAML}>Generate YAML</button>

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Edit Node"
        className="modal"
        overlayClassName="modal-overlay"
      >
        <h2>Edit Node</h2>
        <label>
          Feature name:
          <input
            type="text"
            name="label"
            value={nodeData.label}
            onChange={handleInputChange}
            placeholder="Enter node label"
          />
        </label>
        <br />
        <label>
          Threshold:
          <input
            type="number"
            name="threshold"
            value={nodeData.threshold}
            onChange={handleInputChange}
            placeholder="Enter threshold"
          />
        </label>
        <br />
        <button onClick={handleSave} className="save-button">Save</button>
      </Modal>
    </div>
  );
}

export default DecisionTreeFlow;