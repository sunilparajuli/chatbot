// src/components/TopicManager.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

// A recursive component to render each node of the tree
const TreeNode = ({ node, onEdit, onAddChild, onDelete }) => {
  return (
    <div style={{ marginLeft: '20px', borderLeft: '1px solid #ccc', paddingLeft: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', margin: '5px 0' }}>
        <span>{node.name}</span>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => onEdit(node)} style={{...styles.actionButton, background: '#ffc107'}}>Edit</button>
          <button onClick={() => onDelete(node.id)} style={{...styles.actionButton, background: '#dc3545'}}>Delete</button>
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
  const [lang, setLang] = useState('np');
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State for the modal form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState(null); // The node being edited
  const [parentNode, setParentNode] = useState(null); // The parent for a new node

  useEffect(() => {
    const fetchTree = async () => {
      setLoading(true);
      const docRef = doc(db, 'knowledgeBase', lang);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTree(docSnap.data().tree || []);
      } else {
        setTree([]);
      }
      setLoading(false);
    };
    fetchTree();
  }, [lang]);

  const saveTree = async (newTree) => {
    setLoading(true);
    await setDoc(doc(db, 'knowledgeBase', lang), { tree: newTree });
    setTree(newTree);
    setLoading(false);
    setIsModalOpen(false);
    setEditingNode(null);
    setParentNode(null);
  };
  
  // Recursive function to find and update a node
  const updateNodeRecursive = (nodes, updatedNode) => {
    return nodes.map(node => {
        if (node.id === updatedNode.id) {
            return updatedNode;
        }
        if (node.children) {
            return { ...node, children: updateNodeRecursive(node.children, updatedNode) };
        }
        return node;
    });
  };

  // Recursive function to add a new node
  const addChildRecursive = (nodes, pNode, newNode) => {
    return nodes.map(node => {
        if (node.id === pNode.id) {
            return { ...node, children: [...(node.children || []), newNode] };
        }
        if (node.children) {
            return { ...node, children: addChildRecursive(node.children, pNode, newNode) };
        }
        return node;
    });
  };

  // Recursive function to delete a node
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
    setParentNode(null); // null parent means it's a top-level category
    setIsModalOpen(true);
  };

  const handleDeleteNode = (nodeId) => {
    if(window.confirm("Are you sure you want to delete this node and all its children?")){
        const newTree = deleteNodeRecursive(tree, nodeId);
        saveTree(newTree);
    }
  };

  const handleFormSubmit = (formData) => {
    let newTree;
    if (editingNode) { // We are editing an existing node
        const updatedNode = { ...editingNode, ...formData };
        newTree = updateNodeRecursive(tree, updatedNode);
    } else { // We are adding a new node
        const newNode = { ...formData, id: `node_${Date.now()}` };
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
      <Link to="/admin">← Back to Chat Panel</Link>
      <h2>Knowledge Base Manager</h2>
      <div>
        <label>Language:</label>
        <select value={lang} onChange={e => setLang(e.target.value)}>
          <option value="np">Nepali</option>
          <option value="en">English</option>
        </select>
      </div>
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
    const [name, setName] = useState(node?.name || '');
    const [nodeType, setNodeType] = useState(node?.answer ? 'answer' : (node?.leadsToChat ? 'live_chat' : 'branch'));
    const [answer, setAnswer] = useState(node?.answer || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = { name };
        if (nodeType === 'answer') {
            formData.answer = answer;
            delete formData.children;
            delete formData.leadsToChat;
        } else if (nodeType === 'live_chat') {
            formData.leadsToChat = true;
            delete formData.children;
            delete formData.answer;
        } else { // branch
            formData.children = node?.children || [];
            delete formData.answer;
            delete formData.leadsToChat;
        }
        onSubmit(formData);
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <h3>{node ? 'Edit' : 'Add'} Node</h3>
                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}>
                        <label>Name / Question</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} required style={styles.input} />
                    </div>
                    <div style={styles.formGroup}>
                        <label>Node Type</label>
                        <select value={nodeType} onChange={e => setNodeType(e.target.value)} style={styles.input}>
                            <option value="branch">Branch (has more children)</option>
                            <option value="answer">Leaf (shows an answer)</option>
                            <option value="live_chat">Leaf (starts live chat)</option>
                        </select>
                    </div>
                    {nodeType === 'answer' && (
                        <div style={styles.formGroup}>
                            <label>Answer</label>
                            <textarea value={answer} onChange={e => setAnswer(e.target.value)} required rows="5" style={styles.input}></textarea>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={onClose}>Cancel</button>
                        <button type="submit">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const styles = {
    actionButton: { color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', margin: '0 4px', cursor: 'pointer', fontSize: '12px'},
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
    modalContent: { background: 'white', padding: '20px', borderRadius: '8px', width: '500px' },
    formGroup: { marginBottom: '15px' },
    input: { width: '100%', padding: '8px', boxSizing: 'border-box' }
};