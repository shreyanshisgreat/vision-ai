import React, { useState, useEffect } from 'react';
import { AlertCircle, Sparkles, Play, Loader2 } from 'lucide-react';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import ImagePreview from './components/ImagePreview';
import DetectionResults from './components/DetectionResults';
import VisualUnderstandingCard from './components/VisualUnderstandingCard';
import ChatSection from './components/ChatSection';
import { analyzeImage, sendChatMessage, clearChatHistory, checkBackendHealth, getImageSummary } from './services/api';

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
  const [imageSummary, setImageSummary] = useState(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState(false);
  const [summarySource, setSummarySource] = useState(null);

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
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setErrorMessage(null);
    setAnalysisResults(null);
    setConversationId(null);
    setChatMessages([]);
    setImageSummary(null);
    setIsSummaryLoading(false);
    setSummaryError(false);
    setSummarySource(null);
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
      // Fresh clean chat stream ready for user's questions
      setChatMessages([]);

      // Asynchronously trigger Gemini Vision summary ("Explain what you see")
      // Does not block the chat UI and does not create fake chat messages
      setIsSummaryLoading(true);
      setSummaryError(false);
      setImageSummary(null);
      setSummarySource(null);

      getImageSummary(data.conversation_id)
        .then((summaryData) => {
          if (summaryData && summaryData.success && summaryData.summary) {
            setImageSummary(summaryData.summary);
            setSummarySource(summaryData.source);
          } else {
            setSummaryError(true);
          }
        })
        .catch((err) => {
          console.warn('Image summary fetch error:', err);
          setSummaryError(true);
        })
        .finally(() => {
          setIsSummaryLoading(false);
        });
    } catch (err) {
      setErrorMessage(err.message || 'Image analysis failed. Please verify the backend connection and try again.');
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
    if (!cleanQuestion || isChatLoading) return;

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
    setImageSummary(null);
    setIsSummaryLoading(false);
    setSummaryError(false);
    setSummarySource(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Top Header */}
      <Header backendStatus={backendStatus} />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* Error notification banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start justify-between gap-3 shadow-lg animate-fade-in">
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
              className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* State 1: No Image Selected -> Hero & Dropzone */}
        {!selectedFile ? (
          <div className="flex-1 flex flex-col items-center justify-center w-full py-6 sm:py-10">
            <ImageUpload
              onImageSelect={handleImageSelect}
              onError={(msg) => setErrorMessage(msg)}
              onSelectSample={handleSelectSample}
            />
          </div>
        ) : (
          /* State 2: Image Selected -> Interactive Split Workspace */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Image Preview + Technical Detection Details (5-6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <ImagePreview
                imageUrl={imagePreviewUrl}
                fileInfo={{
                  name: selectedFile.name,
                  size: selectedFile.size,
                  width: analysisResults?.image_width || imageDimensions.width,
                  height: analysisResults?.image_height || imageDimensions.height,
                }}
                onAnalyze={handleAnalyze}
                onReset={handleReset}
                isLoading={isAnalyzing}
                detections={analysisResults?.detections}
              />

              {/* Technical Detection Details: Secondary & Collapsible for Judges */}
              {analysisResults && (
                <div className="animate-fade-in">
                  <DetectionResults results={analysisResults} />
                </div>
              )}
            </div>

            {/* Right Column: AI Visual Understanding Card + Conversation Area (6-7 cols) */}
            <div className="lg:col-span-6 space-y-4">
              {/* Primary AI Visual Understanding Card */}
              <VisualUnderstandingCard
                summary={imageSummary}
                isLoading={isSummaryLoading}
                hasError={summaryError}
                source={summarySource}
                isAnalyzed={!!analysisResults}
              />

              {/* Chat Conversation Area */}
              {analysisResults ? (
                <ChatSection
                  messages={chatMessages}
                  onSendMessage={handleSendMessage}
                  onClearChat={handleClearChat}
                  isLoading={isChatLoading}
                  detectedLabels={analysisResults.unique_labels}
                />
              ) : (
                <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-8 text-center flex flex-col items-center justify-center min-h-[400px] gap-4 shadow-xl">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5 max-w-sm">
                    <h3 className="text-base font-semibold text-white">
                      Ready for Analysis
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Click <strong>"Analyze Image"</strong> to initiate your conversational visual intelligence session with Gemini Vision.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-xs sm:text-sm transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-white" />
                        <span>Analyze Image</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
