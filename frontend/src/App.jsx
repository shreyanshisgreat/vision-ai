import React, { useState, useEffect } from 'react';
import { Bot, AlertCircle } from 'lucide-react';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import ImagePreview from './components/ImagePreview';
import DetectionResults from './components/DetectionResults';
import ChatSection from './components/ChatSection';
import { analyzeImage, sendChatMessage, clearChatHistory, checkBackendHealth } from './services/api';

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [backendStatus, setBackendStatus] = useState('checking');

  // Verify backend health on mount and periodically
  useEffect(() => {
    async function verifyHealth() {
      const res = await checkBackendHealth();
      if (res && res.status === 'healthy') {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    }
    verifyHealth();
    const interval = setInterval(verifyHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Handle new image selection (clears old context & starts fresh conversation)
  const handleImageSelect = (file) => {
    // Revoke previous object URL if any
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setErrorMessage(null);
    setAnalysisResults(null);
    setConversationId(null);
    setChatMessages([]);
    setSelectedFile(file);

    const url = URL.createObjectURL(file);
    setImagePreviewUrl(url);

    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  };

  // Handle 1-click sample image selection
  const handleSelectSample = async (samplePath, filename) => {
    try {
      setErrorMessage(null);
      const res = await fetch(samplePath);
      if (!res.ok) throw new Error('Could not load sample image');
      const blob = await res.blob();
      const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
      handleImageSelect(file);
    } catch (err) {
      setErrorMessage(`Failed to load sample image: ${err.message}`);
    }
  };

  // Run image analysis
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const data = await analyzeImage(selectedFile);
      setAnalysisResults(data);
      setConversationId(data.conversation_id);

      // Add initial greeting from assistant in conversation stream
      const objectSummary =
        data.total_detected > 0
          ? `I've analyzed your image and identified ${data.total_detected} object${
              data.total_detected !== 1 ? 's' : ''
            } (${data.unique_labels.join(', ')}). You can now ask me any questions about this image!`
          : "I've analyzed your image, but didn't detect any prominent everyday objects. Feel free to ask me questions about it!";

      setChatMessages([
        {
          role: 'assistant',
          content: objectSummary,
        },
      ]);
    } catch (err) {
      setErrorMessage(err.message || 'Image analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle sending a chat question
  const handleSendMessage = async (question) => {
    if (!conversationId) {
      setErrorMessage('Please analyze the image first before asking questions.');
      return;
    }

    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;

    // Optimistically add user question to chat UI
    setChatMessages((prev) => [...prev, { role: 'user', content: cleanQuestion }]);
    setIsChatLoading(true);
    setErrorMessage(null);

    try {
      const res = await sendChatMessage(conversationId, cleanQuestion);
      if (res && res.answer) {
        setChatMessages((prev) => [
          ...prev,
          { role: 'assistant', content: res.answer, source: res.source },
        ]);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to get answer. Please try again.');
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'I encountered an error trying to process that question. Please verify the backend connection and try again.',
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Clear conversation messages while preserving the active image session
  const handleClearChat = async () => {
    if (!conversationId) {
      setChatMessages([]);
      return;
    }

    try {
      await clearChatHistory(conversationId);
      setChatMessages([]);
    } catch (err) {
      console.warn('Could not clear remote history, resetting local:', err);
      setChatMessages([]);
    }
  };

  // Reset entire state back to upload dropzone
  const handleReset = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedFile(null);
    setImagePreviewUrl(null);
    setImageDimensions({ width: 0, height: 0 });
    setAnalysisResults(null);
    setConversationId(null);
    setChatMessages([]);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header backendStatus={backendStatus} />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Notice</p>
                <p className="text-xs text-rose-300/90 mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* State 1: No Image Selected -> Dropzone & Welcome */}
        {!selectedFile ? (
          <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full py-8 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-sm text-slate-300 shadow-md w-full space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    Phase 3: Conversational Image Understanding
                  </h2>
                  <p className="text-xs text-indigo-300 font-medium">
                    YOLOv8s Structured Detection + Vision-Language Model (VLM)
                  </p>
                </div>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Upload any photo or select one of the built-in sample scenes. The system uses YOLOv8s for structured COCO object detection and a Vision-Language Model for open-vocabulary visual reasoning and conversational Q&A.
              </p>
            </div>

            <ImageUpload
              onImageSelect={handleImageSelect}
              onError={(msg) => setErrorMessage(msg)}
              onSelectSample={handleSelectSample}
            />
          </div>
        ) : (
          /* State 2: Image Selected -> Interactive Split Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Image Preview & Detected Objects (5 cols on lg) */}
            <div className="lg:col-span-6 space-y-5">
              <ImagePreview
                imageUrl={imagePreviewUrl}
                fileInfo={{
                  name: selectedFile.name,
                  size: selectedFile.size,
                  width: imageDimensions.width,
                  height: imageDimensions.height,
                }}
                onAnalyze={handleAnalyze}
                onReset={handleReset}
                isLoading={isAnalyzing}
                detections={analysisResults?.detections}
              />

              {analysisResults && (
                <div className="animate-fade-in">
                  <DetectionResults results={analysisResults} />
                </div>
              )}
            </div>

            {/* Right Column: Conversational Chat Section (6 cols on lg) */}
            <div className="lg:col-span-6">
              {analysisResults ? (
                <ChatSection
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  onClearChat={handleClearChat}
                  isLoading={isChatLoading}
                  detectedLabels={analysisResults.unique_labels}
                />
              ) : (
                <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-8 text-center flex flex-col items-center justify-center min-h-[360px] gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      Image Ready for Analysis
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mt-1">
                      Click the purple <strong>"Analyze Image"</strong> button on the preview to run the computer vision model and begin your Q&A conversation.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
