import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Link } from 'react-router-dom';

// TreeNode component
const TreeNode = ({ node, onEdit, onAddChild, onDelete }) => {
  return (
    <div style={{ marginLeft: '20px', borderLeft: '1px solid #ccc', paddingLeft: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', margin: '5px 0' }}>
        <span>{node.name?.np || '[No Nepali Name]'} / {node.name?.en || '[No English Name]'}</span>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => onEdit(node)} style={{...styles.actionButton, background: '#ffc107'}}>Edit</button>
          <button onClick={() => onDelete(node.id)} style={{...styles.actionButton, background: '#dc3545'}}>Delete</button>
          {!node.answer && !node.leadsToChat && (
             <button onClick={() => onAddChild(node)} style={{...styles.actionButton, background: '#28a745'}}>Add Child</button>
          )}
        </div>
      </div>
      {/* This map is correct: the variable is `child`, so the key is `child.id` */}
      {node.children && node.children.map(child => (
        <TreeNode key={child.id} node={child} onEdit={onEdit} onAddChild={onAddChild} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default function TopicManager() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState(null);
  const [parentNode, setParentNode] = useState(null);

  useEffect(() => {
    const fetchTree = async () => {
      setLoading(true);
      const docRef = doc(db, 'knowledgeBase', 'np');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) { setTree(docSnap.data().tree || []); }
      setLoading(false);
    };
    fetchTree();
  }, []);

  const saveTree = async (newTree) => { setLoading(true); await setDoc(doc(db, 'knowledgeBase', 'np'), { tree: newTree }); setTree(newTree); setLoading(false); setIsModalOpen(false); setEditingNode(null); setParentNode(null); };
  const updateNodeRecursive = (nodes, updatedNode) => nodes.map(node => node.id === updatedNode.id ? updatedNode : (node.children ? { ...node, children: updateNodeRecursive(node.children, updatedNode) } : node));
  const addChildRecursive = (nodes, pNode, newNode) => nodes.map(node => node.id === pNode.id ? { ...node, children: [...(node.children || []), newNode] } : (node.children ? { ...node, children: addChildRecursive(node.children, pNode, newNode) } : node));
  const deleteNodeRecursive = (nodes, nodeId) => nodes.filter(node => node.id !== nodeId).map(node => node.children ? { ...node, children: deleteNodeRecursive(node.children, nodeId) } : node);
  const handleOpenModalForEdit = (node) => { setEditingNode(node); setIsModalOpen(true); };
  const handleOpenModalForAdd = (pNode) => { setParentNode(pNode); setIsModalOpen(true); };
  const handleOpenModalForNewCategory = () => { setParentNode(null); setIsModalOpen(true); };
  const handleDeleteNode = (nodeId) => { if (window.confirm("Are you sure?")) { saveTree(deleteNodeRecursive(tree, nodeId)); } };
  const handleFormSubmit = (nodeData) => {
    let newTree;
    if (editingNode) { newTree = updateNodeRecursive(tree, nodeData); }
    else { const newNode = { ...nodeData, id: `node_${Date.now()}` }; newTree = parentNode ? addChildRecursive(tree, parentNode, newNode) : [...tree, newNode]; }
    saveTree(newTree);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <Link to="/admin">← Back to Admin Panel</Link>
      <h2>Knowledge Base Manager</h2>
      <hr />
      {loading ? <p>Loading...</p> : (
        <div>
            <button onClick={handleOpenModalForNewCategory} style={{...styles.actionButton, background: '#17a2b8', padding: '10px 15px', fontSize: '14px', marginBottom: '20px'}}>Add New Top-Level Category</button>
            {/* THIS IS THE LINE THAT IS NOW FIXED. The variable is `node`, so the key must be `node.id`. */}
            {tree.map(node => (
              <TreeNode 
                key={node.id} 
                node={node} 
                onEdit={handleOpenModalForEdit} 
                onAddChild={handleOpenModalForAdd} 
                onDelete={handleDeleteNode} 
              />
            ))}
        </div>
      )}
      {isModalOpen && <NodeEditorModal node={editingNode} onSubmit={handleFormSubmit} onClose={() => { setIsModalOpen(false); setEditingNode(null); setParentNode(null); }} />}
    </div>
  );
}

const NodeEditorModal = ({ node, onSubmit, onClose }) => {
    const [nameEn, setNameEn] = useState(node?.name?.en || '');
    const [nameNp, setNameNp] = useState(node?.name?.np || '');
    const [answerEn, setAnswerEn] = useState(node?.answer?.en || '');
    const [answerNp, setAnswerNp] = useState(node?.answer?.np || '');

    const getInitialNodeType = () => {
        if (!node) return 'branch';
        if ('answer' in node) return 'answer';
        if ('leadsToChat' in node) return 'live_chat';
        return 'branch';
    };
    const [nodeType, setNodeType] = useState(getInitialNodeType());

    const handleSubmit = (e) => {
        e.preventDefault();
        const finalNodeData = { id: node?.id, icon: node?.icon || 'FiGrid', name: { en: nameEn, np: nameNp } };
        if (nodeType === 'answer') { finalNodeData.answer = { en: answerEn, np: answerNp }; }
        else if (nodeType === 'live_chat') { finalNodeData.leadsToChat = true; }
        else { finalNodeData.children = node?.children || []; }
        onSubmit(finalNodeData);
    };

    return (
        <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
                <h3>{node ? 'Edit' : 'Add'} Node</h3>
                <form onSubmit={handleSubmit}>
                    <div style={styles.formGroup}><label>Name (English)</label><input type="text" value={nameEn} onChange={e => setNameEn(e.target.value)} required style={styles.input} /></div>
                    <div style={styles.formGroup}><label>Name (Nepali)</label><input type="text" value={nameNp} onChange={e => setNameNp(e.target.value)} required style={styles.input} /></div>
                    <div style={styles.formGroup}>
                        <label>Node Type</label>
                        <select value={nodeType} onChange={e => setNodeType(e.target.value)} style={styles.input}>
                            <option value="branch">Branch (has more children)</option>
                            <option value="answer">Leaf (shows an answer)</option>
                            <option value="live_chat">Leaf (starts live chat)</option>
                        </select>
                    </div>

                    {nodeType === 'answer' && (
                        <>
                          <div style={styles.formGroup}>
                              <label style={{marginBottom: '5px', display: 'block'}}>Answer (English)</label>
                              <textarea
                                  style={{...styles.input, minHeight: '200px', fontFamily: 'sans-serif'}}
                                  value={answerEn}
                                  onChange={e => setAnswerEn(e.target.value)}
                                  placeholder="Enter answer content here. You can use HTML tags like <p>, <b>, <ul>, <li> etc."
                              />
                          </div>
                          <div style={styles.formGroup}>
                              <label style={{marginBottom: '5px', display: 'block'}}>Answer (Nepali)</label>
                              <textarea
                                  style={{...styles.input, minHeight: '200px', fontFamily: 'sans-serif'}}
                                  value={answerNp}
                                  onChange={e => setAnswerNp(e.target.value)}
                                  placeholder="Enter answer content here. You can use HTML tags like <p>, <b>, <ul>, <li> etc."
                              />
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
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, overflowY: 'auto' },
    modalContent: { background: 'white', padding: '25px', borderRadius: '8px', width: '90%', maxWidth: '800px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', margin: '20px 0' },
    formGroup: { marginBottom: '20px' },
    input: { width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px', fontSize: '14px' },
    formButton: { padding: '10px 20px', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer', background: '#f0f0f0'}
};