// src/widget.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import ChatWidget from './components/ChatWidget'; // Adjust path if needed

// Define a custom element name for our widget. It MUST contain a hyphen.
const WIDGET_TAG_NAME = 'react-chat-pop-up';

// Create a class for the custom HTML element
class ReactChatWidget extends HTMLElement {
  connectedCallback() {
    // 1. Create a "shadow root" to encapsulate the widget's styles and HTML
    const shadowRoot = this.attachShadow({ mode: 'open' });
    
    // 2. Create a div inside the shadow root for React to render into
    const mountPoint = document.createElement('div');
    shadowRoot.appendChild(mountPoint);
    
    // 3. Render our ChatWidget into the mount point
    const root = ReactDOM.createRoot(mountPoint);
    root.render(
      <React.StrictMode>
        <ChatWidget />
      </React.StrictMode>
    );
  }
}

// Check if the custom element is already defined before defining it.
if (!customElements.get(WIDGET_TAG_NAME)) {
  customElements.define(WIDGET_TAG_NAME, ReactChatWidget);
}