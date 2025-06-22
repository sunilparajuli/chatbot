// src/components/AdminPanel.jsx
import React, { useEffect, useState, useMemo } from "react";
import { db } from "../firebase";
import { collection, doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";

export default function AdminPanel() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [reply, setReply] = useState("");
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'archive'

  // Effect to fetch all chats from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "chats"), (snapshot) => {
      const sortedChats = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
      setChats(sortedChats);
    });
    return () => unsub();
  }, []);

  // Effect to keep the selectedChat state synchronized with the master chats list
  useEffect(() => {
    if (selectedChat) {
      const freshChatData = chats.find(c => c.id === selectedChat.id);
      if (freshChatData && JSON.stringify(freshChatData) !== JSON.stringify(selectedChat)) {
        setSelectedChat(freshChatData);
      }
    }
  }, [chats, selectedChat]);

  // useMemo to efficiently filter chats for the 'Active' or 'Archived' view
  const filteredChats = useMemo(() => {
    if (viewMode === 'active') {
      return chats.filter(chat => chat.status !== 'ended');
    } else { // 'archive'
      return chats.filter(chat => chat.status === 'ended');
    }
  }, [chats, viewMode]);
  
  // Effect to clear the selection if the selected chat is no longer in the current view
  useEffect(() => {
    if (selectedChat) {
      const isSelectedChatInView = filteredChats.some(chat => chat.id === selectedChat.id);
      if (!isSelectedChatInView) {
        setSelectedChat(null);
      }
    }
  }, [viewMode, filteredChats, selectedChat]);

  const sendReply = async () => {
    if (!reply.trim() || !selectedChat) return;
    await updateDoc(doc(db, "chats", selectedChat.id), {
      messages: arrayUnion({ sender: "admin", text: reply, timestamp: Date.now() }),
    });
    setReply("");
  };

  const handleEndChatByAdmin = async () => {
    if (!selectedChat) return;
    await updateDoc(doc(db, "chats", selectedChat.id), { status: 'ended' });
    setViewMode('archive');
  };

  return (
    <div style={styles.panelContainer}>
      {/* --- CHAT LIST (Sub-sidebar for this specific page) --- */}
      <div style={styles.chatListContainer}>
        <div style={styles.menu}>
          <button 
            onClick={() => setViewMode('active')} 
            style={viewMode === 'active' ? {...styles.menuButton, ...styles.activeMenuButton} : styles.menuButton}
          >
            Active
          </button>
          <button 
            onClick={() => setViewMode('archive')} 
            style={viewMode === 'archive' ? {...styles.menuButton, ...styles.activeMenuButton} : styles.menuButton}
          >
            Archived
          </button>
        </div>
        
        <div style={styles.chatList}>
          {filteredChats.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedChat(c)}
              style={selectedChat?.id === c.id ? {...styles.chatListItem, ...styles.selectedChatListItem} : styles.chatListItem}
            >
              <strong>{c.customerName}</strong>
              <div style={styles.chatListItemTopic}>
                {c.topic || 'General Inquiry'}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* --- CHAT VIEW PANEL (The main content for this page) --- */}
      <div style={styles.chatView}>
        {selectedChat ? (
          <>
            <div style={styles.chatViewHeader}>
              <div>
                <h4>Chat with {selectedChat.customerName}</h4>
                <p style={{ marginTop: 0, marginBottom: 0 }}><strong>Topic:</strong> {selectedChat.topic || 'N/A'}</p>
              </div>
              {selectedChat.status !== 'ended' && (
                <button onClick={handleEndChatByAdmin} style={styles.endChatButton}>
                  End & Archive Chat
                </button>
              )}
            </div>
            <div style={styles.messagesContainer}>
              {selectedChat.messages?.map((m, i) => (
                <div key={i} style={{...styles.messageRow, textAlign: m.sender === 'admin' ? 'right' : 'left'}}>
                  <div style={{ ...styles.messageBubble, ...(m.sender === 'admin' ? styles.adminMessageBubble : styles.customerMessageBubble)}}>
                    <strong>{m.sender === 'admin' ? 'Support' : selectedChat.customerName}:</strong> {m.text}
                  </div>
                </div>
              ))}
            </div>
            {selectedChat.status === 'ended' ? (
                <div style={styles.endedMessage}>This chat has been archived.</div>
            ) : (
                <div style={styles.replyArea}>
                  <input 
                    value={reply} 
                    onChange={(e) => setReply(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && sendReply()} 
                    style={styles.replyInput}
                    placeholder="Type your reply..."
                  />
                  <button onClick={sendReply} style={styles.sendButton}>Send</button>
                </div>
            )}
          </>
        ) : (
          <div style={styles.noChatSelected}>
            <h3>Welcome to the Chat Dashboard</h3>
            <p>Select a chat from the list to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Styles specific to this AdminPanel component
const styles = {
    panelContainer: { display: 'flex', height: '100vh' },
    chatListContainer: { width: 350, borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column' },
    menu: { display: 'flex', borderBottom: '1px solid #ddd' },
    menuButton: { flex: 1, padding: '15px', border: 'none', background: '#f8f9fa', cursor: 'pointer', fontSize: '14px', borderBottom: '3px solid transparent', color: '#666' },
    activeMenuButton: { borderBottom: '3px solid #007bff', fontWeight: 'bold', color: '#000' },
    chatList: { flex: 1, overflowY: 'auto' },
    chatListItem: { padding: '15px 20px', cursor: 'pointer', borderBottom: '1px solid #eee', backgroundColor: '#fff' },
    selectedChatListItem: { backgroundColor: '#e0f7fa' },
    chatListItemTopic: { fontSize: '12px', color: '#555', marginTop: '4px' },
    chatView: { flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f7f9' },
    chatViewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #ddd', paddingBottom: '10px', backgroundColor: '#fff', padding: '15px', borderRadius: '5px 5px 0 0' },
    endChatButton: { background: '#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 5, cursor: 'pointer' },
    messagesContainer: { flex: 1, overflowY: 'auto', border: '1px solid #ddd', padding: '10px', margin: '0', backgroundColor: '#fff', borderTop: 'none', borderBottom: 'none' },
    messageRow: { marginBottom: '8px', display: 'flex', flexDirection: 'column' },
    messageBubble: { display: 'inline-block', padding: '8px 12px', borderRadius: '12px', maxWidth: '80%' },
    adminMessageBubble: { backgroundColor: '#dcf8c6', border: '1px solid #c8e6c9', alignSelf: 'flex-end' },
    customerMessageBubble: { backgroundColor: '#fff', border: '1px solid #eee', alignSelf: 'flex-start' },
    endedMessage: { padding: '15px', textAlign: 'center', background: '#e9ecef', borderRadius: '0 0 5px 5px', color: '#777', border: '1px solid #ddd', borderTop: 'none' },
    replyArea: { display: 'flex', padding: '15px', backgroundColor: '#fff', borderTop: '1px solid #ddd' },
    replyInput: { flex: 1, padding: '10px', marginRight: '10px', borderRadius: '5px', border: '1px solid #ccc' },
    sendButton: { padding: '0 15px', border: 'none', background: '#007bff', color: 'white', borderRadius: '5px', cursor: 'pointer' },
    noChatSelected: { textAlign: 'center', alignSelf: 'center', color: '#777' }
};