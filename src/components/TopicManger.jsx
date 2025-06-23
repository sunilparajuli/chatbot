import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

// A recursive component to render each node of the tree
const TreeNode = ({ node, onEdit, onAddChild, onDelete }) => {
  return (
    <div style={{ marginLeft: '20px', borderLeft: '1px solid #ccc', paddingLeft: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', margin: '5px 0' }}>
        {/* MODIFIED: Display both languages for clarity */}
        <span>{node.name?.np || '[No Nepali Name]'} / {node.name?.en || '[No English Name]'}</span>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => onEdit(node)} style={{...styles.actionButton, background: '#ffc107'}}>Edit</button>
          <button onClick={() => onDelete(node.id)} style={{...styles.actionButton, background: '#dc3545'}}>Delete</button>
          {/* A node can have children only if it's not a leaf (answer/chat) */}
          {!node.answer && !node.leadsToChat && (
             <button onClick={() => onAddChild(node)} style={{...styles.actionButton, background: '#28a745'}}>Add Child</button>
          )}
        </div>
      </div>
      {node.children && node.children.map(child => (
        <TreeNode key={child.id} node={child} onEdit={onEdit} onAddChild={onAddChild} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default function TopicManager() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State for the modal form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState(null); // The node being edited
  const [parentNode, setParentNode] = useState(null); // The parent for a new node

  useEffect(() => {
    const fetchTree = async () => {
      setLoading(true);
      // MODIFIED: Always fetch the 'np' document which contains both languages
      const docRef = doc(db, 'knowledgeBase', 'np');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTree(docSnap.data().tree || []);
      } else {
        setTree([]);
      }
      setLoading(false);
    };
    fetchTree();
  }, []); // MODIFIED: Runs only once on component mount

  // MODIFIED: Takes the complete new/updated tree and saves it
  const saveTree = async (newTree) => {
    setLoading(true);
    await setDoc(doc(db, 'knowledgeBase', 'np'), { tree: newTree });
    setTree(newTree); // Update local state to reflect the change
    setLoading(false);
    // Close and reset the modal
    setIsModalOpen(false);
    setEditingNode(null);
    setParentNode(null);
  };
  
  const updateNodeRecursive = (nodes, updatedNode) => {
    return nodes.map(node => {
        if (node.id === updatedNode.id) {
            return updatedNode; // Replace the node with the updated version
        }
        if (node.children) {
            return { ...node, children: updateNodeRecursive(node.children, updatedNode) };
        }
        return node;
    });
  };

  const addChildRecursive = (nodes, pNode, newNode) => {
    return nodes.map(node => {
        if (node.id === pNode.id) {
            const newChildren = [...(node.children || []), newNode];
            return { ...node, children: newChildren };
        }
        if (node.children) {
            return { ...node, children: addChildRecursive(node.children, pNode, newNode) };
        }
        return node;
    });
  };

  const deleteNodeRecursive = (nodes, nodeId) => {
    return nodes.filter(node => node.id !== nodeId).map(node => {
        if(node.children) {
            return { ...node, children: deleteNodeRecursive(node.children, nodeId)};
        }
        return node;
    })
  };

  const handleOpenModalForEdit = (node) => {
    setEditingNode(node);
    setIsModalOpen(true);
  };

  const handleOpenModalForAdd = (pNode) => {
    setParentNode(pNode);
    setIsModalOpen(true);
  };

  const handleOpenModalForNewCategory = () => {
    setParentNode(null);
    setIsModalOpen(true);
  };

  const handleDeleteNode = (nodeId) => {
    if(window.confirm("Are you sure you want to delete this node and all its children?")){
        const newTree = deleteNodeRecursive(tree, nodeId);
        saveTree(newTree);
    }
  };
  
  // MODIFIED: This function now receives the complete, cleaned-up node object from the modal
  const handleFormSubmit = (nodeData) => {
    let newTree;
    if (editingNode) { // We are editing an existing node
        newTree = updateNodeRecursive(tree, nodeData);
    } else { // We are adding a new node
        const newNode = { ...nodeData, id: `node_${Date.now()}` };
        if(parentNode) { // Adding a child to an existing node
            newTree = addChildRecursive(tree, parentNode, newNode);
        } else { // Adding a new top-level category
            newTree = [...tree, newNode];
        }
    }
    saveTree(newTree);
  };

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/admin">← Back to Admin Panel</Link>
      <h2>Knowledge Base Manager</h2>
      <hr />
      {loading ? <p>Loading...</p> : (
        <div>
            <button onClick={handleOpenModalForNewCategory} style={{...styles.actionButton, background: '#17a2b8'}}>Add New Category</button>
            {tree.map(node => (
                <TreeNode key={node.id} node={node} onEdit={handleOpenModalForEdit} onAddChild={handleOpenModalForAdd} onDelete={handleDeleteNode} />
            ))}
        </div>
      )}
      
      {isModalOpen && (
        <NodeEditorModal 
            node={editingNode} 
            onSubmit={handleFormSubmit} 
            onClose={() => { setIsModalOpen(false); setEditingNode(null); setParentNode(null); }} 
        />
      )}
    </div>
  );
}

// The Modal Form Component
const NodeEditorModal = ({ node, onSubmit, onClose }) => {
    // MODIFIED: State for bilingual fields
    const [nameEn, setNameEn] = useState(node?.name?.en || '');
    const [nameNp, setNameNp] = useState(node?.name?.np || '');
    const [answerEn, setAnswerEn] = useState(node?.answer?.en || '');
    const [answerNp, setAnswerNp] = useState(node?.answer?.np || '');
    const [nodeType, setNodeType] = useState(node?.answer ? 'answer' : (node?.leadsToChat ? 'live_chat' : 'branch'));

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // MODIFIED: Construct the complete node object based on the form state
        // Start with properties that are always present (like id, icon if they exist)
        const finalNodeData = {
            id: node?.id,
            icon: node?.icon || 'FiGrid', // Default icon
            name: { en: nameEn, np: nameNp },
        };

        if (nodeType === 'answer') {
            finalNodeData.answer = { en: answerEn, np: answerNp };
        } else if (nodeType === 'live_chat') {
            finalNodeData.leadsToChat = true;
        } else { // branch
            // If we are editing an existing branch, keep its children. Otherwise, empty array.
            finalNodeData.children = node?.children || [];
        }

        onSubmit(finalNodeData);
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <h3>{node ? 'Edit' : 'Add'} Node</h3>
                <form onSubmit={handleSubmit}>
                    {/* MODIFIED: Bilingual input for Name */}
                    <div style={styles.formGroup}>
                        <label>Name / Question (English)</label>
                        <input type="text" value={nameEn} onChange={e => setNameEn(e.target.value)} required style={styles.input} />
                    </div>
                     <div style={styles.formGroup}>
                        <label>Name / Question (Nepali)</label>
                        <input type="text" value={nameNp} onChange={e => setNameNp(e.target.value)} required style={styles.input} />
                    </div>

                    <div style={styles.formGroup}>
                        <label>Node Type</label>
                        <select value={nodeType} onChange={e => setNodeType(e.target.value)} style={styles.input}>
                            <option value="branch">Branch (has more children)</option>
                            <option value="answer">Leaf (shows an answer)</option>
                            <option value="live_chat">Leaf (starts live chat)</option>
                        </select>
                    </div>

                    {/* MODIFIED: Bilingual input for Answer */}
                    {nodeType === 'answer' && (
                        <>
                        <div style={styles.formGroup}>
                            <label>Answer (English)</label>
                            <textarea value={answerEn} onChange={e => setAnswerEn(e.target.value)} required rows="4" style={styles.input}></textarea>
                        </div>
                        <div style={styles.formGroup}>
                            <label>Answer (Nepali)</label>
                            <textarea value={answerNp} onChange={e => setAnswerNp(e.target.value)} required rows="4" style={styles.input}></textarea>
                        </div>
                        </>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <button type="button" onClick={onClose} style={styles.formButton}>Cancel</button>
                        <button type="submit" style={{...styles.formButton, background: '#007bff', color: 'white'}}>Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const styles = {
    actionButton: { color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', margin: '0 4px', cursor: 'pointer', fontSize: '12px'},
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    modalContent: { background: 'white', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '500px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' },
    formGroup: { marginBottom: '15px' },
    input: { width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' },
    formButton: { padding: '10px 20px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', background: '#f0f0f0'}
};