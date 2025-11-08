import React, { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import { FaSpinner, FaPaperPlane, FaFilePdf } from 'react-icons/fa';

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [pdfName, setPdfName] = useState("");
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePdfUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingPdf(true);
    setPdfName(file.name);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/upload_pdf", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setSessionId(data.session_id);
        setPdfName(data.pdf_name);

        // Add the summary as the first message from the assistant
        setMessages([
          {
            role: "assistant",
            content: data.summary,
            timestamp: new Date().toISOString()
          }
        ]);
      } else {
        // Show error message
        setMessages([
          {
            role: "system",
            content: data.error || "Failed to process PDF. Please try again.",
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      setMessages([
        {
          role: "system",
          content: "An error occurred while uploading the PDF. Please try again.",
          timestamp: new Date().toISOString()
        }
      ]);
    }

    setUploadingPdf(false);
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    if (!inputMessage.trim() || !sessionId) return;

    const userMessage = {
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    // Add user message to chat
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/ask_question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: inputMessage,
          session_id: sessionId
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const assistantMessage = {
          role: "assistant",
          content: data.answer,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage = {
          role: "system",
          content: data.error || "Sorry, I couldn't process your question.",
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        role: "system",
        content: "An error occurred while sending your message.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setLoading(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-screen bg-linear-gradient flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto px-4 py-6 overflow-hidden">
        {/* PDF Upload Section - Only show if no PDF uploaded */}
        {!sessionId && (
          <div className="mb-6">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
                Upload a PDF to Start
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Upload a document and I'll provide a summary, then you can ask me questions about it.
              </p>

              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FaFilePdf className="w-10 h-10 mb-3 text-indigo-500" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF files only</p>
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                  disabled={uploadingPdf}
                />
              </label>

              {uploadingPdf && (
                <div className="flex items-center justify-center mt-4">
                  <FaSpinner className="animate-spin text-indigo-500 mr-2" />
                  <p className="text-gray-600">Processing PDF...</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Interface - Only show if PDF uploaded */}
        {sessionId && (
          <>
            {/* PDF Info Header */}
            <div className="bg-white p-4 rounded-lg shadow mb-4 flex items-center flex-shrink-0">
              <FaFilePdf className="text-red-500 mr-3 text-xl" />
              <div>
                <p className="text-sm text-gray-500">Current Document</p>
                <p className="font-semibold text-gray-800">{pdfName}</p>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 bg-white rounded-lg shadow-lg p-6 mb-4 overflow-y-auto min-h-0">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-3xl px-4 py-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-indigo-500 text-white rounded-br-none'
                          : message.role === 'assistant'
                          ? 'bg-gray-200 text-gray-800 rounded-bl-none'
                          : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.role === 'user'
                            ? 'text-indigo-200'
                            : message.role === 'assistant'
                            ? 'text-gray-500'
                            : 'text-yellow-600'
                        }`}
                      >
                        {formatTime(message.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 px-4 py-3 rounded-lg rounded-bl-none">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="bg-white p-4 rounded-lg shadow-lg flex-shrink-0">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask a question about the document..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className={`p-3 rounded-lg font-semibold text-white transition duration-200 ${
                    loading || !inputMessage.trim()
                      ? "bg-indigo-300 cursor-not-allowed"
                      : "bg-indigo-500 hover:bg-indigo-600"
                  }`}
                >
                  <FaPaperPlane />
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Chatbot;
