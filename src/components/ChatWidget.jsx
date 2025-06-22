import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, addDoc, collection, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

// Import all necessary icons
import { FiMessageSquare, FiX, FiSend, FiArrowLeft, FiHome, FiGrid, FiBriefcase, FiTrendingUp, FiUsers, FiBookOpen, FiHeart, FiShoppingCart, FiAward, FiShield, FiPhoneCall } from "react-icons/fi";
import { BsTree } from "react-icons/bs";

// Icon Map and helper function
const iconMap = { "FiBriefcase": <FiBriefcase size={30} />, "FiShield": <FiShield size={30} />, "FiTrendingUp": <FiTrendingUp size={30} />, "FiUsers": <FiUsers size={30} />, "FiBookOpen": <FiBookOpen size={30} />, "FiHome": <FiHome size={30} />, "FiHeart": <FiHeart size={30} />, "FiShoppingCart": <FiShoppingCart size={30} />, "FiAward": <FiAward size={30} />, "BsTree": <BsTree size={30} />, "FiPhoneCall": <FiPhoneCall size={30} />, "FiGrid": <FiGrid size={30} />, };
const getIcon = (iconName) => iconMap[iconName] || <FiGrid size={30} />;

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('loading');
  const [activeTab, setActiveTab] = useState("");
  const [knowledgeTree, setKnowledgeTree] = useState([]);
  const [history, setHistory] = useState([]); 
  const [currentNode, setCurrentNode] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatStatus, setChatStatus] = useState('active');
  const [selectedTopicName, setSelectedTopicName] = useState('');
  const [widgetConfig, setWidgetConfig] = useState({ organizationName: 'Welcome', welcomeMessage: 'How can we help you?', logoUrl: '' });

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    if(!isOpen) return;
    const unsubTopics = onSnapshot(doc(db, "knowledgeBase", "np"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().tree) {
        const treeData = docSnap.data().tree;
        setKnowledgeTree(treeData);
        if (treeData.length > 0) setActiveTab(treeData[0].name);
        setView('topics');
      } else { setView('error'); }
    });
    const unsubConfig = onSnapshot(doc(db, "widgetConfig", "main"), (docSnap) => {
      if (docSnap.exists()) setWidgetConfig(docSnap.data());
    });
    return () => { unsubTopics(); unsubConfig(); };
  }, [isOpen]);

  useEffect(() => { if (isOpen) scrollToBottom(); }, [messages, view, currentNode]);
  useEffect(() => { if (!chatId) return; const unsub = onSnapshot(doc(db, "chats", chatId), (docSnap) => { if (docSnap.exists()) { setMessages(docSnap.data().messages || []); setChatStatus(docSnap.data().status || 'active'); } }); return () => unsub(); }, [chatId]);

  const toggleChat = () => setIsOpen(!isOpen);

  const resetToTopicsScreen = () => {
    setView('topics');
    setHistory([]);
    setCurrentNode(null);
    setChatId(null);
    setMessages([]);
    setChatStatus('active');
  };

  const handleInitialTopicSelect = (node) => {
    const rootNode = { name: "Root", id: "root", children: knowledgeTree };
    setHistory([rootNode, node]);
    setCurrentNode(node);
    setSelectedTopicName(node.name);
    if (node.answer) setView('answer');
    else if (node.leadsToChat) setView('form');
    else setView('navigating');
  };
  
  const handleNodeSelect = (node) => {
    setHistory(prev => [...prev, node]);
    setCurrentNode(node);
    setSelectedTopicName(node.name);
    if (node.answer) setView('answer');
    else if (node.leadsToChat) setView('form');
    else setView('navigating');
  };

  const goBack = () => {
    const newHistory = history.slice(0, -1);
    const prevNode = newHistory[newHistory.length - 1];
    setView(prevNode.id === 'root' ? 'topics' : 'navigating');
    setHistory(newHistory);
    setCurrentNode(prevNode);
  };
  
  const startChat = async (e) => { e.preventDefault(); if (!name.trim() || !email.trim()) return; const preChatMessages = history.slice(1).map(node => ({ sender: 'system', text: `Selected: ${node.name}`, timestamp: Date.now() })); const docRef = await addDoc(collection(db, "chats"), { customerName: name, customerEmail: email, topic: selectedTopicName, createdAt: serverTimestamp(), messages: preChatMessages, status: 'active', }); setChatId(docRef.id); setView("chat"); };
  const sendMessage = async (e) => { e.preventDefault(); if (!message.trim() || !chatId) return; await updateDoc(doc(db, "chats", chatId), { messages: arrayUnion({ sender: "customer", text: message, timestamp: Date.now() }), }); setMessage(""); };
  const handleEndChat = async () => { if (!chatId) return; await updateDoc(doc(db, "chats", chatId), { status: 'ended' }); };

  // --- THIS IS THE HEADER SHOWN IN YOUR IMAGE ---
  const NavigationHeader = () => (
    <div style={styles.navHeader}>
      <button onClick={goBack} style={styles.navButton} aria-label="Go Back"><FiArrowLeft size={22}/></button>
      <h3 style={styles.navTitle}>{currentNode?.name || ''}</h3>
      <button onClick={resetToTopicsScreen} style={styles.navButton} aria-label="Go Home"><FiHome size={20}/></button>
    </div>
  );

  // --- RENDER METHODS ---

  const renderTopicsView = () => {
    const activeCategory = knowledgeTree.find(cat => cat.name === activeTab);
    const itemsToShow = activeCategory ? activeCategory.children : [];
    return (<><div style={styles.welcomeHeader}><div style={styles.welcomeTextContainer}><h1 style={styles.welcomeTitle}>{widgetConfig.organizationName}</h1><p style={styles.welcomeSubtitle}>{widgetConfig.welcomeMessage}</p></div><img src={widgetConfig.logoUrl} alt="Logo" style={styles.avatar}/></div><div style={styles.contentArea}><div style={styles.tabs}>{knowledgeTree.map(category => (<button key={category.id} style={activeTab === category.name ? {...styles.tab, ...styles.activeTab} : styles.tab} onClick={() => setActiveTab(category.name)}>{category.name}</button>))}</div><div style={styles.topicGrid}>{itemsToShow.map((node) => (<button key={node.id} style={styles.topicButton} onClick={() => handleInitialTopicSelect(node)}><div style={styles.topicIcon}>{getIcon(node.icon)}</div><span style={styles.topicName}>{node.name}</span></button>))}</div></div></>);
  };

  const renderNavigationView = () => (
    <div style={styles.listContainer}>
      <NavigationHeader />
      <div style={styles.listItemsWrapper}>
        {/* --- NEW: RENDER THE CLICKED HISTORY AT THE TOP --- */}
        {history.slice(1).map((histNode) => (
            <div key={`hist-${histNode.id}`} style={styles.historyItem}>
                {histNode.name}
            </div>
        ))}
        {/* --- A VISUAL SEPARATOR --- */}
        {history.length > 1 && <hr style={styles.separator} />}

        {/* Render the current choices below the history */}
        {currentNode?.children?.map(childNode => (
            <button key={childNode.id} onClick={() => handleNodeSelect(childNode)} style={styles.listItem}>
                {childNode.name}
            </button>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );

  const renderAnswerView = () => (
    <div style={styles.listContainer}>
      <NavigationHeader />
      <div style={styles.listItemsWrapper}>
        {history.slice(1).map((histNode) => (<div key={`hist-${histNode.id}`} style={styles.historyItem}>{histNode.name}</div>))}
        {history.length > 1 && <hr style={styles.separator} />}
        <div style={styles.answerBox}><p>{currentNode.answer}</p></div>
      </div>
      <div style={styles.answerFooter}><p>
के यो उपयोगी थियो?</p><button onClick={() => setView('form')} style={styles.formButton}>होइन, सूचना अधिकारीसंग कुराकानी गर्नुहोस्</button></div>
    </div>
  );
  
  const renderLoadingView = () => <div style={styles.centered}><p>Loading...</p></div>;
  const renderErrorView = () => <div style={styles.centered}><p style={{color: 'red'}}>Could not load help topics.</p></div>;
  const renderRegistrationForm = () => <div style={styles.listContainer}><NavigationHeader /><div style={styles.centered}><h2>Start Live Chat</h2><p>Topic: <strong>{selectedTopicName}</strong></p><form onSubmit={startChat} style={styles.form}><input style={styles.formInput} type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} required /><input style={styles.formInput} type="email" placeholder="Your Email" value={email} onChange={e => setEmail(e.target.value)} required /><button type="submit" style={styles.formButton}>Start Chatting</button></form></div></div>;
  const renderChatEndedView = () => <div style={styles.centered}><h3>Chat Ended</h3><p>This conversation has been closed.</p><button onClick={resetToTopicsScreen} style={styles.formButton}>Start New Chat</button></div>;
  const renderChatView = () => ( <div style={styles.messagesContainer}>{messages.map((m, i) => { if (m.sender === 'system') { return <div key={i} style={styles.systemMessage}>{m.text}</div>; } return ( <div key={i} style={{...styles.messageRow, justifyContent: m.sender === 'customer' ? 'flex-end' : 'flex-start'}}><div style={{...styles.messageBubble, ...(m.sender === 'customer' ? styles.customerMessage : styles.supportMessage)}}>{m.text}</div></div> ); })}<div ref={messagesEndRef} /></div> );

  const renderContent = () => {
    if (chatStatus === 'ended') return renderChatEndedView();
    switch (view) {
      case 'loading': return renderLoadingView();
      case 'topics': return renderTopicsView();
      case 'navigating': return renderNavigationView();
      case 'answer': return renderAnswerView();
      case 'form': return renderRegistrationForm();
      case 'chat': return renderChatView();
      case 'error': return renderErrorView();
      default: return renderErrorView();
    }
  };

  return (
    <>
      <button onClick={toggleChat} style={styles.chatBubble} aria-label="Toggle Chat">{isOpen ? <FiX size={24} /> : <FiMessageSquare size={24} />}</button>
      {isOpen && (
        <div style={styles.widgetContainer}>
          <div style={styles.topBar}>
            <span style={styles.topBarTitle}>Support Center</span>
            <button onClick={toggleChat} style={styles.closeButton} aria-label="Close Chat"><FiX size={20} /></button>
          </div>
          <div style={styles.mainContentContainer}>
            {renderContent()}
          </div>
          {view === "chat" && chatStatus === 'active' && (<form onSubmit={sendMessage} style={styles.inputArea}><input style={styles.chatInput} placeholder="Type your query.." value={message} onChange={e => setMessage(e.target.value)} /><button type="submit" style={styles.sendButton} aria-label="Send Message"><FiSend size={20} /></button></form>)}
        </div>
      )}
    </>
  );
}

// --- ALL STYLES MERGED ---
const styles = {
  chatBubble: { position: 'fixed', bottom: '20px', right: '20px', width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#007bff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', zIndex: 1000, },
  widgetContainer: { position: 'fixed', bottom: '100px', right: '20px', width: '370px', height: '70vh', maxHeight: '600px', backgroundColor: '#f8f9fa', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 1000, },
  mainContentContainer: { flex: 1, display: "flex", flexDirection: "column", fontFamily: '"Helvetica Neue", sans-serif', overflow: 'hidden' },
  topBar: { padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', flexShrink: 0, },
  topBarTitle: { fontWeight: 'bold', fontSize: '18px' },
  closeButton: { background: 'none', border: 'none', cursor: 'pointer', padding: 5, color: '#666' },
  welcomeHeader: { background: "linear-gradient(135deg, #4a90e2, #2a6cb2)", color: "white", padding: "20px 20px 50px 20px", borderBottomLeftRadius: "30px", borderBottomRightRadius: "30px", display: 'flex', alignItems: 'center', flexShrink: 0, },
  welcomeTextContainer: { flex: 1 },
  welcomeTitle: { margin: "0 0 10px 0", fontSize: "20px" },
  welcomeSubtitle: { margin: 0, fontSize: "14px", lineHeight: 1.5, opacity: 0.9 },
  avatar: { width: "70px", height: "70px", borderRadius: "50%", border: "2px solid white", marginLeft: '15px', objectFit: 'cover' },
  contentArea: { backgroundColor: "white", borderRadius: "20px", marginTop: "-30px", margin: "0 10px 10px 10px", flex: 1, display: "flex", flexDirection: "column", boxShadow: '0 4px 12px rgba(0,0,0,0.05)', overflow: 'hidden', },
  tabs: { display: "flex", justifyContent: "space-around", borderBottom: "1px solid #e5e7eb", padding: '0 5px', },
  tab: { padding: "12px 8px", border: "none", background: "none", cursor: "pointer", fontSize: "13px", color: "#4b5563", fontWeight: "500", borderBottom: "3px solid transparent", },
  activeTab: { color: "#007bff", borderBottom: "3px solid #007bff" },
  topicGrid: { flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", padding: "15px", overflowY: "auto", },
  topicButton: { background: "#f8f9fa", border: "1px solid #e9ecef", borderRadius: "12px", padding: "10px 5px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", textAlign: "center", transition: "transform 0.2s, box-shadow 0.2s", height: '90px' },
  topicIcon: { color: "#d9534f", marginBottom: "8px", height: '30px' },
  topicName: { fontSize: "12px", color: "#343a40", lineHeight: 1.3 },
  listContainer: { display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'white' },
  navHeader: { display: 'flex', alignItems: 'center', padding: '10px 15px', borderBottom: '1px solid #e5e7eb', backgroundColor: 'white', flexShrink: 0 },
  navButton: { background: 'none', border: 'none', cursor: 'pointer', padding: '5px', color: '#555' },
  navTitle: { flex: 1, textAlign: 'center', margin: 0, fontSize: '18px', fontWeight: 600, color: '#333' },
  listItemsWrapper: { flex: 1, overflowY: 'auto' },
  historyItem: { padding: '12px 20px', color: '#6c757d', fontSize: '14px', fontStyle: 'italic', backgroundColor: '#f8f9fa' },
  separator: { border: 'none', borderTop: '1px solid #e9ecef', margin: '0 20px' },
  listItem: { background: '#fff', border: 'none', borderBottom: '1px solid #f0f0f0', padding: '20px', textAlign: 'left', cursor: 'pointer', width: '100%', fontSize: '16px' },
  answerBox: { padding: '20px', lineHeight: 1.6 },
  answerFooter: { padding: '15px', textAlign: 'center', borderTop: '1px solid #eee', backgroundColor: 'white', flexShrink: 0 },
  centered: { flex: 1, padding: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  form: { width: '100%', maxWidth: '300px', marginTop: '20px' },
  formInput: { width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '15px', boxSizing: 'border-box' },
  formButton: { width: '100%', padding: '12px', border: 'none', borderRadius: '8px', background: '#007bff', color: 'white', fontWeight: 'bold', cursor: 'pointer' },
  messagesContainer: { flex: 1, overflowY: "auto", padding: "15px", backgroundColor: "#F0F4F8", display: 'flex', flexDirection: 'column', gap: '10px', },
  messageRow: { display: 'flex' },
  messageBubble: { padding: '10px 15px', borderRadius: '18px', maxWidth: '80%', lineHeight: 1.4, fontSize: '14px' },
  customerMessage: { background: '#007bff', color: 'white', borderBottomRightRadius: '5px' },
  supportMessage: { background: '#fff', color: '#333', border: '1px solid #e5e7eb', borderBottomLeftRadius: '5px' },
  systemMessage: { textAlign: 'center', color: '#888', fontSize: '12px', margin: '10px 0', fontStyle: 'italic' },
  inputArea: { display: "flex", padding: "10px", borderTop: "1px solid #e5e7eb", backgroundColor: "white", alignItems: "center", flexShrink: 0, },
  chatInput: { flex: 1, border: "none", padding: "10px", borderRadius: "8px", backgroundColor: "#F0F4F8", marginRight: "10px", },
  sendButton: { background: "#007bff", color: "white", border: "none", width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", },
};