import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import UploadModal from './components/UploadModal';
import StudyToolsModal from './components/StudyToolsModal';
import DocumentInfoModal from './components/DocumentInfoModal';
import SettingsModal from './components/SettingsModal';
import Toast from './components/Toast';
import { api } from './services/api';

export default function App() {
  // Navigation & UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [docInfoModalOpen, setDocInfoModalOpen] = useState(false);
  const [selectedDocForInfo, setSelectedDocForInfo] = useState(null);

  // Study Tools state
  const [studyToolModal, setStudyToolModal] = useState({
    isOpen: false,
    mode: 'quiz', // 'quiz' | 'concept' | 'summary' | 'questions'
    data: null,
    isLoading: false,
  });

  // Data state
  const [documents, setDocuments] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [backendHealth, setBackendHealth] = useState(null);

  // Load initial backend health and documents
  useEffect(() => {
    fetchHealth();
    fetchDocuments();
  }, []);

  const fetchHealth = async () => {
    try {
      const data = await api.checkHealth();
      setBackendHealth(data);
    } catch (err) {
      console.warn('Backend not yet reachable:', err.message);
      setBackendHealth({ status: 'offline', gemini_configured: false });
    }
  };

  const fetchDocuments = async () => {
    try {
      const data = await api.getDocuments();
      if (data && data.documents) {
        setDocuments(data.documents);
        if (data.documents.length > 0 && !activeDocument) {
          setActiveDocument(data.documents[0]);
          createNewConversation(data.documents[0].filename);
        }
      }
    } catch (err) {
      console.warn('Could not fetch documents:', err.message);
    }
  };

  const showToast = (type, message, title = null) => {
    setToast({ type, message, title });
  };

  // Helper to create a new conversation thread
  const createNewConversation = (docName = 'New Study Session') => {
    const newId = Date.now().toString();
    const newConv = {
      id: newId,
      title: docName.replace('.pdf', ''),
      messages: [],
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newId);
    return newId;
  };

  // Active messages getter
  const currentConversation = conversations.find((c) => c.id === activeConversationId);
  const currentMessages = currentConversation ? currentConversation.messages : [];

  // Switch active document
  const handleSelectDocument = (doc) => {
    setActiveDocument(doc);
    // Find or create conversation for this document
    const existing = conversations.find((c) => c.title === doc.filename.replace('.pdf', ''));
    if (existing) {
      setActiveConversationId(existing.id);
    } else {
      createNewConversation(doc.filename);
    }
    showToast('info', `Switched active study notes to "${doc.filename}".`);
  };

  // Delete document
  const handleDeleteDocument = async (docId) => {
    try {
      await api.deleteDocument(docId);
      const updated = documents.filter((d) => d.document_id !== docId);
      setDocuments(updated);

      if (activeDocument?.document_id === docId) {
        if (updated.length > 0) {
          setActiveDocument(updated[0]);
        } else {
          setActiveDocument(null);
        }
      }
      showToast('success', 'Document removed from active session.');
    } catch (err) {
      showToast('error', err.message, 'Failed to Delete Document');
    }
  };

  // Upload custom PDF file
  const handleUploadFile = async (file) => {
    setIsUploading(true);
    try {
      const uploadedDoc = await api.uploadPdf(file);
      setDocuments((prev) => [uploadedDoc, ...prev]);
      setActiveDocument(uploadedDoc);
      createNewConversation(uploadedDoc.filename);
      setUploadModalOpen(false);
      showToast(
        'success',
        `Extracted ${uploadedDoc.total_pages} pages into ${uploadedDoc.total_chunks} indexed sections.`,
        'PDF Successfully Processed'
      );
    } catch (err) {
      showToast('error', err.message, 'Upload Processing Error');
    } finally {
      setIsUploading(false);
    }
  };

  // Load pre-packaged sample academic notes
  const handleLoadSampleNotes = async () => {
    setIsUploading(true);
    try {
      const sampleDoc = await api.loadSampleNotes();
      setDocuments((prev) => [sampleDoc, ...prev]);
      setActiveDocument(sampleDoc);
      createNewConversation(sampleDoc.filename);
      setUploadModalOpen(false);
      showToast(
        'success',
        'Loaded AI & Deep Learning Notes (3 Pages, indexed with TF-IDF). You can now ask questions!',
        'Sample Notes Ready'
      );
    } catch (err) {
      showToast('error', err.message, 'Failed to Load Sample');
    } finally {
      setIsUploading(false);
    }
  };

  // Send study question
  const handleSendMessage = async () => {
    if (!input.trim() || !activeDocument || isChatLoading) return;

    const questionText = input.trim();
    setInput('');

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage = {
      role: 'user',
      content: questionText,
      timestamp: timeStr,
    };

    // Ensure active conversation exists
    let convId = activeConversationId;
    if (!convId) {
      convId = createNewConversation(activeDocument.filename);
    }

    // Update conversation with user message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === convId) {
          // If first message, update title
          const updatedTitle =
            c.messages.length === 0
              ? questionText.substring(0, 32) + (questionText.length > 32 ? '...' : '')
              : c.title;
          return {
            ...c,
            title: updatedTitle,
            messages: [...c.messages, userMessage],
          };
        }
        return c;
      })
    );

    setIsChatLoading(true);

    try {
      // Build conversation history for context
      const historyPayload = currentMessages.slice(-4).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await api.askQuestion(
        activeDocument.document_id,
        questionText,
        historyPayload
      );

      const aiMessage = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources || [],
        model: response.model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, aiMessage] } : c))
      );
    } catch (err) {
      console.error('Chat error:', err);
      const isMissingKey =
        err.detail?.includes('GEMINI_API_KEY') || err.message?.includes('GEMINI_API_KEY');

      const errorMessage = {
        role: 'assistant',
        isError: true,
        content: isMissingKey
          ? 'Gemini API key is not configured in backend/.env. Please add your key (GEMINI_API_KEY=AIzaSy...) to enable live AI responses. See Settings for quick guidance.'
          : err.message || 'An error occurred while generating the answer.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, errorMessage] } : c))
      );

      showToast('error', err.message, 'Generation Notice');
    } finally {
      setIsChatLoading(false);
    }
  };

  // Study Tools handlers
  const handleOpenSummary = async () => {
    if (!activeDocument) return;
    setStudyToolModal({
      isOpen: true,
      mode: 'summary',
      data: null,
      isLoading: true,
    });

    try {
      const res = await api.summarizeDocument(activeDocument.document_id);
      setStudyToolModal((prev) => ({
        ...prev,
        data: res.summary,
      }));
    } catch (err) {
      showToast('error', err.message, 'Summary Error');
    } finally {
      setStudyToolModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleOpenConcept = () => {
    if (!activeDocument) return;
    setStudyToolModal({
      isOpen: true,
      mode: 'concept',
      data: null,
      isLoading: false,
    });
  };

  const handleExplainConcept = async (concept) => {
    if (!activeDocument || !concept) return;
    setStudyToolModal((prev) => ({ ...prev, isLoading: true }));

    try {
      const res = await api.explainConcept(activeDocument.document_id, concept);
      setStudyToolModal((prev) => ({
        ...prev,
        data: res.explanation,
      }));
    } catch (err) {
      showToast('error', err.message, 'Concept Explanation Error');
    } finally {
      setStudyToolModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleOpenQuestions = async () => {
    if (!activeDocument) return;
    setStudyToolModal({
      isOpen: true,
      mode: 'questions',
      data: null,
      isLoading: true,
    });

    try {
      const res = await api.generateQuestions(activeDocument.document_id, 5);
      setStudyToolModal((prev) => ({
        ...prev,
        data: res.questions,
      }));
    } catch (err) {
      showToast('error', err.message, 'Questions Generation Error');
    } finally {
      setStudyToolModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleOpenQuiz = async () => {
    if (!activeDocument) return;
    setStudyToolModal({
      isOpen: true,
      mode: 'quiz',
      data: null,
      isLoading: true,
    });

    try {
      const res = await api.generateMCQs(activeDocument.document_id, 4);
      setStudyToolModal((prev) => ({
        ...prev,
        data: res.mcqs || [],
      }));
    } catch (err) {
      showToast('error', err.message, 'Quiz Generation Error');
    } finally {
      setStudyToolModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleClearCurrentChat = () => {
    if (!activeConversationId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === activeConversationId ? { ...c, messages: [] } : c))
    );
    showToast('info', 'Chat conversation cleared.');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-text-primary">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((prev) => !prev)}
        documents={documents}
        activeDocument={activeDocument}
        onSelectDocument={handleSelectDocument}
        onDeleteDocument={handleDeleteDocument}
        onNewChat={() => createNewConversation('New Study Chat')}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenDocInfo={(doc) => {
          setSelectedDocForInfo(doc);
          setDocInfoModalOpen(true);
        }}
        onOpenUpload={() => setUploadModalOpen(true)}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onClearCurrentChat={handleClearCurrentChat}
      />

      {/* Main Chat & Study Area */}
      <ChatArea
        messages={currentMessages}
        isLoading={isChatLoading}
        input={input}
        setInput={setInput}
        onSendMessage={handleSendMessage}
        activeDocument={activeDocument}
        onOpenUpload={() => setUploadModalOpen(true)}
        onLoadSampleNotes={handleLoadSampleNotes}
        onOpenSummary={handleOpenSummary}
        onOpenConcept={handleOpenConcept}
        onOpenQuestions={handleOpenQuestions}
        onOpenQuiz={handleOpenQuiz}
        onOpenDocInfo={(doc) => {
          setSelectedDocForInfo(doc);
          setDocInfoModalOpen(true);
        }}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        sidebarOpen={sidebarOpen}
      />

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadFile={handleUploadFile}
        onLoadSampleNotes={handleLoadSampleNotes}
        isUploading={isUploading}
      />

      {/* Study Tools Modal (Quiz, Explainer, Summary, Questions) */}
      <StudyToolsModal
        isOpen={studyToolModal.isOpen}
        mode={studyToolModal.mode}
        onClose={() => setStudyToolModal((prev) => ({ ...prev, isOpen: false }))}
        data={studyToolModal.data}
        isLoading={studyToolModal.isLoading}
        onExplainConcept={handleExplainConcept}
        onGenerateQuiz={handleOpenQuiz}
        onGenerateSummary={handleOpenSummary}
        onGenerateQuestions={handleOpenQuestions}
        activeDocument={activeDocument}
      />

      {/* Document Information Modal */}
      <DocumentInfoModal
        isOpen={docInfoModalOpen}
        onClose={() => setDocInfoModalOpen(false)}
        document={selectedDocForInfo}
      />

      {/* Settings & Diagnostics Modal */}
      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        health={backendHealth}
        onRefreshHealth={fetchHealth}
        onClearChat={handleClearCurrentChat}
      />

      {/* Notifications Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

