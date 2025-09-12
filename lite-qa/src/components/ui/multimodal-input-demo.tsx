'use client';

import React, { useState, useCallback } from 'react';
import { PureMultimodalInput, type Attachment, type UIMessage, type VisibilityType } from './multimodal-ai-chat-input';

export function MultimodalInputDemo() {
  // Minimal state and handlers required by PureMultimodalInput
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false); // Control the stop button visibility
  const [chatId] = useState('demo-input-only'); // Dummy chat ID

  const handleSendMessage = useCallback(({ input, attachments }: { input: string; attachments: Attachment[] }) => {
    console.log("--- 模拟发送消息 ---");
    console.log("输入内容:", input);
    console.log("附件:", attachments);
    console.log("---------------------------------");

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      // In a real app, you'd clear attachments after successful send
      // setAttachments([]);
    }, 2000); // Simulate a 2 second response time

  }, []);

  const handleStopGenerating = useCallback(() => {
    console.log("停止生成按钮被点击 (模拟)。");
    setIsGenerating(false);
  }, []);

  // Other necessary props for PureMultimodalInput
  const canSend = true; // Always allow sending in this minimal demo
  const messages: UIMessage[] = []; // Provide an empty array as required by type, though not used for context here
  const selectedVisibilityType: VisibilityType = 'private'; // Dummy visibility

  return (
    // Added a simple container div for basic centering/padding if needed
    // but the focus is on the input component itself
    <div className="w-full max-w-3xl mx-auto p-4"> 
      <PureMultimodalInput
        chatId={chatId}
        messages={messages} // Empty array
        attachments={attachments}
        setAttachments={setAttachments}
        onSendMessage={handleSendMessage}
        onStopGenerating={handleStopGenerating}
        isGenerating={isGenerating}
        canSend={canSend} // True
        selectedVisibilityType={selectedVisibilityType} // 'private'
      />
    </div>
  );
}
