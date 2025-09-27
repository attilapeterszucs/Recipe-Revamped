import React, { useState, useEffect } from 'react';
import { $getRoot, $createParagraphNode, $createTextNode, EditorState, LexicalEditor } from 'lexical';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ParagraphNode, TextNode } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import DOMPurify from 'dompurify';
import {
  InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import { ContentEditable } from '@/components/editor/editor-ui/content-editable';
import { editorTheme } from '@/components/editor/themes/editor-theme';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Save, X, Bold, Italic, Underline, List, ListOrdered, Quote, Undo, Redo, Eye } from 'lucide-react';


const editorConfig: InitialConfigType = {
  namespace: "EnhancedEditor",
  theme: editorTheme,
  nodes: [
    HeadingNode,
    ParagraphNode,
    TextNode,
    QuoteNode,
    ListNode,
    ListItemNode,
  ],
  onError: (error: Error) => {
    console.error(error);
  },
};

interface EnhancedRichTextEditorProps {
  content: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  onPreview?: () => void;
}

// Component to initialize editor with HTML content
function InitializeContentPlugin({ htmlContent }: { htmlContent: string }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (htmlContent && htmlContent.trim()) {
      editor.update(() => {
        try {
          // Clear existing content
          const root = $getRoot();
          root.clear();

          // Simple approach: just extract text content and create paragraph nodes
          // This avoids complex HTML parsing issues while still loading content
          const tempDiv = document.createElement('div');
          // Sanitize HTML content before setting innerHTML to prevent XSS
          tempDiv.innerHTML = DOMPurify.sanitize(htmlContent, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            ALLOWED_ATTR: []
          });

          // Get all text content and split by common block elements
          const textContent = tempDiv.textContent || tempDiv.innerText || '';

          if (textContent.trim()) {
            // Split content into paragraphs (simple approach)
            const paragraphs = textContent.split('\n').filter(p => p.trim());

            if (paragraphs.length > 0) {
              paragraphs.forEach(paragraphText => {
                const paragraph = $createParagraphNode();
                const textNode = $createTextNode(paragraphText.trim());
                paragraph.append(textNode);
                root.append(paragraph);
              });
            } else {
              // Single paragraph
              const paragraph = $createParagraphNode();
              const textNode = $createTextNode(textContent.trim());
              paragraph.append(textNode);
              root.append(paragraph);
            }
          } else {
            // Empty content, add empty paragraph
            const paragraph = $createParagraphNode();
            root.append(paragraph);
          }
        } catch (error) {
          console.error('Error parsing HTML content:', error);
          // Final fallback: create a simple paragraph
          const root = $getRoot();
          root.clear();
          const paragraph = $createParagraphNode();
          const cleanText = htmlContent.replace(/<[^>]*>/g, '').trim();
          if (cleanText) {
            const textNode = $createTextNode(cleanText);
            paragraph.append(textNode);
          }
          root.append(paragraph);
        }
      });
    }
  }, [editor, htmlContent]);

  return null;
}

export const EnhancedRichTextEditor: React.FC<EnhancedRichTextEditorProps> = ({
  content,
  onSave,
  onCancel,
  onPreview,
}) => {
  const [currentHtmlContent, setCurrentHtmlContent] = useState<string>('');

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    // Reference for floating elements - kept for future use
  };

  const handleEditorChange = (_editorState: EditorState, editor: LexicalEditor) => {
    editor.update(() => {
      const htmlString = $generateHtmlFromNodes(editor, null);
      setCurrentHtmlContent(htmlString);
    });
  };

  const handleSave = () => {
    onSave(currentHtmlContent || content);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Enhanced Rich Text Editor</h3>
            <p className="text-sm text-gray-600 mt-1">Create beautiful formatted content with advanced editing tools</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded text-sm transition-colors"
            >
              <X className="w-4 h-4 inline mr-1" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded text-sm transition-colors"
            >
              <Save className="w-4 h-4 inline mr-1" />
              Save Content
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden" style={{ height: 'calc(100vh - 160px)' }}>
          <LexicalComposer initialConfig={editorConfig}>
            <TooltipProvider>
              <div className="h-full flex flex-col">
                {/* Simple Toolbar */}
                <div className="border-b border-gray-200 bg-white flex-shrink-0">
                  <div className="flex items-center gap-1 p-3 overflow-x-auto">
                    <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-3">
                      <button
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Undo"
                      >
                        <Undo className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Redo"
                      >
                        <Redo className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-3">
                      <select className="text-sm px-2 py-1 border border-gray-300 rounded">
                        <option value="paragraph">Paragraph</option>
                        <option value="h1">Heading 1</option>
                        <option value="h2">Heading 2</option>
                        <option value="h3">Heading 3</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-1 border-r border-gray-300 pr-3 mr-3">
                      <button
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Bold"
                      >
                        <Bold className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Italic"
                      >
                        <Italic className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Underline"
                      >
                        <Underline className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Bullet List"
                      >
                        <List className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Numbered List"
                      >
                        <ListOrdered className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 hover:bg-gray-100 rounded transition-colors"
                        title="Quote"
                      >
                        <Quote className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Editor Content */}
                <div className="flex-1 min-h-0" style={{ height: '500px', maxHeight: '500px' }}>
                  <RichTextPlugin
                    contentEditable={
                      <div className="h-full">
                        <div className="h-full overflow-y-scroll overflow-x-hidden" ref={onRef} style={{ maxHeight: '500px' }}>
                          <ContentEditable
                            placeholder="Start writing your blog post content..."
                            className="h-full w-full px-8 py-6 focus:outline-none resize-none block"
                          />
                        </div>
                      </div>
                    }
                    ErrorBoundary={LexicalErrorBoundary}
                  />

                  {/* Plugins */}
                  <InitializeContentPlugin htmlContent={content} />
                  <OnChangePlugin onChange={handleEditorChange} />
                  <HistoryPlugin />
                  <ListPlugin />
                  <CheckListPlugin />
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between flex-shrink-0">
                  <div className="text-sm text-gray-600">
                    Professional rich text editor for blog content
                  </div>

                  <div className="flex items-center gap-2">
                    {onPreview && (
                      <button
                        onClick={onPreview}
                        className="px-3 py-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded text-sm transition-colors"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        View Post
                      </button>
                    )}
                    <button
                      onClick={onCancel}
                      className="px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-3 py-1.5 bg-green-600 text-white hover:bg-green-700 rounded text-sm transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </TooltipProvider>
          </LexicalComposer>
        </div>
      </div>
    </div>
  );
};