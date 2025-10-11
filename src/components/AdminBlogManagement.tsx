import React, { useState, useEffect, useCallback, useRef } from 'react';
import DOMPurify from 'dompurify';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Calendar,
  Save,
  X,
  Upload,
  FileText,
  Star,
  Type,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Strikethrough,
  Code,
  RemoveFormatting,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Image,
  Sparkles
} from 'lucide-react';
import { CustomDropdown } from './CustomDropdown';
import { useToast } from './ToastContainer';
import {
  $getRoot,
  $createParagraphNode,
  $createTextNode,
  EditorState,
  LexicalEditor,
  FORMAT_TEXT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  TextFormatType
} from 'lexical';
import { ListItemNode, ListNode, INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list';
import { HeadingNode, QuoteNode, $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { ParagraphNode, TextNode } from 'lexical';
import { $generateHtmlFromNodes } from '@lexical/html';
import { InitialConfigType, LexicalComposer } from '@lexical/react/LexicalComposer';
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
import { useAuth } from '../hooks/useAuth';
import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL
} from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { logger } from '../lib/logger';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  status: 'draft' | 'published';
  featured: boolean;
  featuredImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  publishedAt?: Timestamp | Date;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  author: string;
  authorId: string;
}

interface BlogCategory {
  id: string;
  name: string;
  description: string;
  color: string;
}

interface AdminBlogManagementProps {
  adminUserId: string;
  adminEmail: string;
}

// Lexical Editor Configuration
const editorConfig: InitialConfigType = {
  namespace: "BlogPostEditor",
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

// Component to initialize editor with HTML content
function InitializeContentPlugin({ htmlContent }: { htmlContent: string }) {
  const [editor] = useLexicalComposerContext();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized && htmlContent && htmlContent.trim()) {
      editor.update(() => {
        try {
          const root = $getRoot();
          root.clear();

          // Sanitize HTML but keep all formatting tags
          const sanitized = DOMPurify.sanitize(htmlContent, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 's', 'del', 'strike'],
            ALLOWED_ATTR: ['class', 'style']
          });

          // Create a temporary DOM element to parse the HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = sanitized;

          // Function to recursively parse DOM nodes and create Lexical nodes
          const parseNode = (domNode: Node, parentLexicalNode: any) => {
            if (domNode.nodeType === Node.TEXT_NODE) {
              if (domNode.textContent && domNode.textContent.trim()) {
                const textNode = $createTextNode(domNode.textContent);
                parentLexicalNode.append(textNode);
              }
            } else if (domNode.nodeType === Node.ELEMENT_NODE) {
              const element = domNode as HTMLElement;
              const tagName = element.tagName.toLowerCase();

              // Handle different HTML elements
              if (tagName === 'p') {
                const paragraph = $createParagraphNode();
                Array.from(element.childNodes).forEach(child => parseNode(child, paragraph));
                if (paragraph.getChildrenSize() === 0) {
                  paragraph.append($createTextNode(''));
                }
                root.append(paragraph);
              } else if (tagName.match(/^h[1-6]$/)) {
                const heading = $createHeadingNode(tagName as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6');
                Array.from(element.childNodes).forEach(child => parseNode(child, heading));
                root.append(heading);
              } else if (tagName === 'blockquote') {
                const quote = $createQuoteNode();
                Array.from(element.childNodes).forEach(child => {
                  if (child.nodeType === Node.TEXT_NODE && child.textContent) {
                    const textNode = $createTextNode(child.textContent);
                    quote.append(textNode);
                  } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const childElement = child as HTMLElement;
                    const childTag = childElement.tagName.toLowerCase();
                    if (childTag === 'strong' || childTag === 'b') {
                      const textNode = $createTextNode(childElement.textContent || '');
                      textNode.setFormat('bold');
                      quote.append(textNode);
                    } else if (childTag === 'em' || childTag === 'i') {
                      const textNode = $createTextNode(childElement.textContent || '');
                      textNode.setFormat('italic');
                      quote.append(textNode);
                    } else {
                      const textNode = $createTextNode(childElement.textContent || '');
                      quote.append(textNode);
                    }
                  }
                });
                root.append(quote);
              } else if (tagName === 'ul') {
                const list = new ListNode('bullet', 1);
                Array.from(element.children).forEach(li => {
                  if (li.tagName.toLowerCase() === 'li') {
                    const listItem = new ListItemNode();
                    Array.from(li.childNodes).forEach(child => parseNode(child, listItem));
                    list.append(listItem);
                  }
                });
                root.append(list);
              } else if (tagName === 'ol') {
                const list = new ListNode('number', 1);
                Array.from(element.children).forEach(li => {
                  if (li.tagName.toLowerCase() === 'li') {
                    const listItem = new ListItemNode();
                    Array.from(li.childNodes).forEach(child => parseNode(child, listItem));
                    list.append(listItem);
                  }
                });
                root.append(list);
              } else if (tagName === 'br') {
                parentLexicalNode.append($createTextNode('\n'));
              } else if (tagName === 'strong' || tagName === 'b') {
                const textNode = $createTextNode(element.textContent || '');
                textNode.setFormat('bold');
                parentLexicalNode.append(textNode);
              } else if (tagName === 'em' || tagName === 'i') {
                const textNode = $createTextNode(element.textContent || '');
                textNode.setFormat('italic');
                parentLexicalNode.append(textNode);
              } else if (tagName === 'u') {
                const textNode = $createTextNode(element.textContent || '');
                textNode.setFormat('underline');
                parentLexicalNode.append(textNode);
              } else if (tagName === 's' || tagName === 'del' || tagName === 'strike') {
                const textNode = $createTextNode(element.textContent || '');
                textNode.setFormat('strikethrough');
                parentLexicalNode.append(textNode);
              } else if (tagName === 'code') {
                const textNode = $createTextNode(element.textContent || '');
                textNode.setFormat('code');
                parentLexicalNode.append(textNode);
              } else {
                // For other elements, just extract text
                Array.from(element.childNodes).forEach(child => parseNode(child, parentLexicalNode));
              }
            }
          };

          // Parse all top-level nodes
          Array.from(tempDiv.childNodes).forEach(node => parseNode(node, root));

          // If no content was added, add an empty paragraph
          if (root.getChildrenSize() === 0) {
            root.append($createParagraphNode());
          }
        } catch (error) {
          console.error('Error parsing HTML content:', error);
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
      setIsInitialized(true);
    }
  }, [editor, htmlContent, isInitialized]);

  return null;
}

// Editor Wrapper Component
function RichTextEditorWrapper({ initialContent, onChange }: {
  initialContent: string;
  onChange: (content: string) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const [activeFormats, setActiveFormats] = useState<{
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
    isStrikethrough: boolean;
    isCode: boolean;
    blockType: string;
  }>({
    isBold: false,
    isItalic: false,
    isUnderline: false,
    isStrikethrough: false,
    isCode: false,
    blockType: 'paragraph'
  });
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Track active formats and statistics
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        let currentBlockType = 'paragraph';

        if ($isRangeSelection(selection)) {
          // Get the block type from the anchor node
          const anchorNode = selection.anchor.getNode();
          const element = anchorNode.getKey() === 'root'
            ? anchorNode
            : anchorNode.getTopLevelElementOrThrow();

          const elementType = element.getType();

          if (elementType === 'heading') {
            const headingNode = element as HeadingNode;
            currentBlockType = headingNode.getTag();
          } else if (elementType === 'paragraph') {
            currentBlockType = 'paragraph';
          }

          setActiveFormats({
            isBold: selection.hasFormat('bold'),
            isItalic: selection.hasFormat('italic'),
            isUnderline: selection.hasFormat('underline'),
            isStrikethrough: selection.hasFormat('strikethrough'),
            isCode: selection.hasFormat('code'),
            blockType: currentBlockType
          });
        }

        // Count words and characters
        const text = $getRoot().getTextContent();
        setCharCount(text.length);
        setWordCount(text.trim().split(/\s+/).filter(word => word.length > 0).length);
      });
    });
  }, [editor]);

  const handleFormatText = useCallback((format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  }, [editor]);

  const handleUndo = useCallback(() => {
    editor.dispatchCommand(UNDO_COMMAND, undefined);
  }, [editor]);

  const handleRedo = useCallback(() => {
    editor.dispatchCommand(REDO_COMMAND, undefined);
  }, [editor]);

  const handleHeadingChange = useCallback((tag: 'paragraph' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        if (tag === 'paragraph') {
          $setBlocksType(selection, () => $createParagraphNode());
        } else {
          $setBlocksType(selection, () => $createHeadingNode(tag));
        }
      }
    });
  }, [editor]);

  const handleInsertList = useCallback((type: 'bullet' | 'number') => {
    if (type === 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  }, [editor]);

  const handleInsertQuote = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createQuoteNode());
      }
    });
  }, [editor]);

  const handleClearFormatting = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        nodes.forEach((node) => {
          if ($isTextNode(node)) {
            node.setFormat(0);
          }
        });
      }
    });
  }, [editor]);

  // Debounced onChange to reduce lag
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedOnChange = useCallback(
    (editorState: EditorState, editor: LexicalEditor) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        editor.update(() => {
          const htmlString = $generateHtmlFromNodes(editor, null);
          onChange(htmlString);
        });
      }, 300);
    },
    [onChange]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <ToolbarPlugin
        onFormatText={handleFormatText}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onHeadingChange={handleHeadingChange}
        onInsertList={handleInsertList}
        onInsertQuote={handleInsertQuote}
        onClearFormatting={handleClearFormatting}
        activeFormats={activeFormats}
      />
      <div className="min-h-[500px] max-h-[500px] relative z-[5] bg-white border-t-2 border-blue-200">
        <RichTextPlugin
          contentEditable={
            <div className="h-full">
              <div className="h-full overflow-y-auto px-8 py-6 prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-h1:text-3xl prose-h1:leading-tight prose-h1:mb-8 prose-h1:mt-2 prose-h2:text-2xl prose-h2:leading-tight prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:leading-tight prose-h3:mt-6 prose-h3:mb-3 prose-h4:text-lg prose-h4:leading-snug prose-h4:mt-4 prose-h4:mb-2 prose-h5:text-base prose-h5:leading-snug prose-h5:mt-3 prose-h5:mb-2 prose-h6:text-sm prose-h6:leading-snug prose-h6:mt-2 prose-h6:mb-1 prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-4 prose-p:text-lg prose-strong:text-gray-900 prose-strong:font-bold prose-em:italic prose-ul:my-4 prose-ul:list-disc prose-ul:pl-6 prose-ol:my-4 prose-ol:list-decimal prose-ol:pl-6 prose-li:text-gray-600 prose-li:leading-relaxed prose-li:my-1 prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:pl-6 prose-blockquote:text-gray-600 prose-blockquote:italic prose-blockquote:my-6 prose-blockquote:py-2 prose-code:bg-gray-100 prose-code:text-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:font-mono" style={{ caretColor: '#3b82f6' }}>
                <ContentEditable
                  placeholder="✍️ Start writing your amazing blog post content here... Your content will appear exactly as it will on the blog."
                  className="h-full outline-none min-h-[460px]"
                  placeholderClassName="text-gray-400 pointer-events-none absolute top-0 left-0 overflow-hidden px-8 py-6 text-base italic select-none"
                />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={debouncedOnChange} />
        <HistoryPlugin />
        <ListPlugin />
        <CheckListPlugin />
        <InitializeContentPlugin htmlContent={initialContent} />
      </div>

      {/* Editor Statistics Footer */}
      <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 border-t-2 border-blue-200 px-6 py-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-bold text-gray-700">Live Editor</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-blue-200">
              <span className="text-xs font-medium text-gray-600">Words:</span>
              <span className="text-sm font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{wordCount}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-blue-200">
              <span className="text-xs font-medium text-gray-600">Characters:</span>
              <span className="text-sm font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{charCount}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 font-medium">
            ✨ WYSIWYG: Content displays exactly as it will appear on the blog
          </div>
        </div>
      </div>
    </>
  );
}

// Toolbar Plugin Component
function ToolbarPlugin({ onFormatText, onUndo, onRedo, onHeadingChange, onInsertList, onInsertQuote, onClearFormatting, activeFormats }: {
  onFormatText: (format: TextFormatType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onHeadingChange: (tag: 'paragraph' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6') => void;
  onInsertList: (type: 'bullet' | 'number') => void;
  onInsertQuote: () => void;
  onClearFormatting: () => void;
  activeFormats: {
    isBold: boolean;
    isItalic: boolean;
    isUnderline: boolean;
    isStrikethrough: boolean;
    isCode: boolean;
    blockType: string;
  };
}) {
  return (
    <div className="bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50 relative z-50">
      {/* Decorative top border */}
      <div className="h-1 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400"></div>

      {/* Row 1: Text Formatting */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 backdrop-blur-sm border-b border-blue-100">
        <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onUndo}
            className="p-2 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105"
            title="Undo"
          >
            <Undo className="w-4 h-4 text-blue-600" />
          </button>
          <button
            type="button"
            onClick={onRedo}
            className="p-2 hover:bg-blue-100 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105"
            title="Redo"
          >
            <Redo className="w-4 h-4 text-blue-600" />
          </button>
        </div>

        {/* Block Type Selector */}
        <div className="flex items-center gap-1 border-r-2 border-blue-200 pr-3 mr-3 pl-3">
          <div className="relative z-[60]">
            <select
              value={activeFormats.blockType}
              onChange={(e) => onHeadingChange(e.target.value as 'paragraph' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6')}
              className="px-3 py-2 pr-8 border-2 rounded-lg text-sm font-bold text-gray-700 hover:border-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 cursor-pointer shadow-sm appearance-none bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-400"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%233b82f6' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.5rem center',
                backgroundSize: '1rem'
              }}
            >
              <option value="paragraph">¶ Paragraph</option>
              <option value="h1">H1 Heading 1 (Largest)</option>
              <option value="h2">H2 Heading 2</option>
              <option value="h3">H3 Heading 3</option>
              <option value="h4">H4 Heading 4</option>
              <option value="h5">H5 Heading 5</option>
              <option value="h6">H6 Heading 6 (Smallest)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onFormatText('bold')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              activeFormats.isBold
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/30 scale-105'
                : 'hover:bg-blue-100 text-blue-600 hover:shadow-md hover:scale-105'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onFormatText('italic')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              activeFormats.isItalic
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/30 scale-105'
                : 'hover:bg-blue-100 text-blue-600 hover:shadow-md hover:scale-105'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onFormatText('underline')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              activeFormats.isUnderline
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/30 scale-105'
                : 'hover:bg-blue-100 text-blue-600 hover:shadow-md hover:scale-105'
            }`}
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onFormatText('strikethrough')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              activeFormats.isStrikethrough
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/30 scale-105'
                : 'hover:bg-blue-100 text-blue-600 hover:shadow-md hover:scale-105'
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onFormatText('code')}
            className={`p-2 rounded-lg transition-all duration-200 ${
              activeFormats.isCode
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/30 scale-105'
                : 'hover:bg-blue-100 text-blue-600 hover:shadow-md hover:scale-105'
            }`}
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Clear Formatting */}
        <div className="flex items-center gap-1 border-l-2 border-blue-200 pl-3 ml-1">
          <button
            type="button"
            onClick={onClearFormatting}
            className="p-2 hover:bg-red-100 rounded-lg transition-all duration-200 text-red-600 hover:shadow-md hover:scale-105"
            title="Clear Formatting"
          >
            <RemoveFormatting className="w-4 h-4" />
          </button>
        </div>
        </div>
      </div>

      {/* Row 2: Lists and Blocks */}
      <div className="flex items-center gap-2 px-4 py-3 backdrop-blur-sm border-b-2 border-blue-200 shadow-inner">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onInsertList('bullet')}
            className="px-3 py-2 hover:bg-blue-100 rounded-lg transition-all duration-200 text-blue-600 hover:shadow-md hover:scale-105 flex items-center gap-2 font-semibold text-sm"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">Bullet List</span>
          </button>
          <button
            type="button"
            onClick={() => onInsertList('number')}
            className="px-3 py-2 hover:bg-blue-100 rounded-lg transition-all duration-200 text-blue-600 hover:shadow-md hover:scale-105 flex items-center gap-2 font-semibold text-sm"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
            <span className="hidden sm:inline">Numbered List</span>
          </button>
          <button
            type="button"
            onClick={onInsertQuote}
            className="px-3 py-2 hover:bg-blue-100 rounded-lg transition-all duration-200 text-blue-600 hover:shadow-md hover:scale-105 flex items-center gap-2 font-semibold text-sm"
            title="Quote"
          >
            <Quote className="w-4 h-4" />
            <span className="hidden sm:inline">Quote</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export const AdminBlogManagement: React.FC<AdminBlogManagementProps> = ({
  adminUserId,
  adminEmail
}) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  // Generate slug from title
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Form state for blog post editor
  const [postForm, setPostForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    tags: [] as string[],
    status: 'draft' as 'draft' | 'published',
    featured: false,
    featuredImage: '',
    seoTitle: '',
    seoDescription: ''
  });

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);

      if (!user) {
        setPosts([]);
        return;
      }

      const postsRef = collection(db, 'blog_posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const postsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BlogPost[];

      setPosts(postsData);
    } catch (error) {
      logger.error('Error loading posts:', { error });
      showError(`Failed to load blog posts: ${error.message}`);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  const loadCategories = useCallback(async () => {
    // Use predefined categories - no Firestore dependency required
    const defaultCategories = [
      { id: '1', name: 'AI & Technology', description: 'AI recipe generation', color: 'blue' },
      { id: '2', name: 'Cooking Tips', description: 'General cooking advice', color: 'green' },
      { id: '3', name: 'Dietary Guides', description: 'Diet-specific content', color: 'purple' },
      { id: '4', name: 'Health & Nutrition', description: 'Health-focused recipes', color: 'pink' },
      { id: '5', name: 'Recipe Transformations', description: 'Recipe conversion examples', color: 'orange' }
    ];
    setCategories(defaultCategories);
  }, []);

  useEffect(() => {
    loadPosts();
    loadCategories();
  }, [loadPosts, loadCategories]);

  const handleCreatePost = () => {
    setEditingPost(null);
    setPostForm({
      title: '',
      excerpt: '',
      content: '',
      category: categories[0]?.name || '',
      tags: [],
      status: 'draft',
      featured: false,
      featuredImage: '',
      seoTitle: '',
      seoDescription: ''
    });
    setShowEditor(true);
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      tags: post.tags,
      status: post.status,
      featured: post.featured,
      featuredImage: post.featuredImage || '',
      seoTitle: post.seoTitle || post.title,
      seoDescription: post.seoDescription || post.excerpt
    });
    setShowEditor(true);
  };

  const handleSavePost = async () => {
    try {
      setSaving(true);

      if (!user) {
        showError('Authentication required. Please sign in again.');
        return;
      }

      const slug = generateSlug(postForm.title);
      const now = serverTimestamp();

      const postData = {
        title: postForm.title,
        slug,
        excerpt: postForm.excerpt,
        content: postForm.content,
        category: postForm.category,
        tags: postForm.tags,
        status: postForm.status,
        featured: postForm.featured,
        featuredImage: postForm.featuredImage,
        seoTitle: postForm.seoTitle || postForm.title,
        seoDescription: postForm.seoDescription || postForm.excerpt,
        author: adminEmail,
        authorId: adminUserId,
        updatedAt: now,
        ...(postForm.status === 'published' && { publishedAt: now }),
        ...(!editingPost && { createdAt: now })
      };

      if (editingPost) {
        const postRef = doc(db, 'blog_posts', editingPost.id);
        await updateDoc(postRef, postData);
        showSuccess('Post updated successfully!');
      } else {
        await addDoc(collection(db, 'blog_posts'), postData);
        showSuccess('Post created successfully!');
      }

      setShowEditor(false);
      loadPosts();
    } catch (error) {
      logger.error('Error saving post:', { error });
      showError(`Failed to save post: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePost = (post: BlogPost) => {
    setPostToDelete(post);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!postToDelete) return;

    setIsDeleting(true);
    try {
      if (!user) {
        showError('Authentication required. Please sign in again.');
        return;
      }

      const postRef = doc(db, 'blog_posts', postToDelete.id);
      await deleteDoc(postRef);

      showSuccess('Post deleted successfully!');
      loadPosts();
      setShowDeleteConfirm(false);
      setPostToDelete(null);
    } catch (error) {
      logger.error('Error deleting post:', { error });
      showError('Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setPostToDelete(null);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      if (!user) {
        showError('Authentication required. Please sign in again.');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file.');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showError('Image file must be smaller than 5MB.');
        return;
      }

      // Create a unique filename
      const timestamp = Date.now();
      const filename = `blog-images/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      // Upload to Firebase Storage
      const storageRef = ref(storage, filename);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      setPostForm(prev => ({ ...prev, featuredImage: downloadURL }));
      showSuccess('Image uploaded successfully!');
    } catch (error) {
      logger.error('Error uploading image:', { error });
      showError('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || post.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const inputValue = e.currentTarget.value.trim();

      if (inputValue) {
        // Handle multiple formats: 'text', 'text, text', 'text,text'
        const tags = inputValue
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0 && !postForm.tags.includes(tag));

        if (tags.length > 0) {
          setPostForm(prev => ({ ...prev, tags: [...prev.tags, ...tags] }));
        }
        e.currentTarget.value = '';
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPostForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-3 text-gray-600">Loading blog posts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center shadow-md">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">Blog Management</h2>
              <p className="text-green-700 font-medium">Create and manage blog posts for RecipeRevamped</p>
            </div>
          </div>
          <button
            onClick={handleCreatePost}
            className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Post
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl flex items-center justify-center shadow-md">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-700 font-bold uppercase tracking-wide">Total Posts</p>
                <p className="text-3xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {posts.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border-2 border-green-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center shadow-md">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-green-700 font-bold uppercase tracking-wide">Published</p>
                <p className="text-3xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {posts.filter(p => p.status === 'published').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-amber-50/50 border-2 border-yellow-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-xl flex items-center justify-center shadow-md">
                <EyeOff className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-yellow-700 font-bold uppercase tracking-wide">Drafts</p>
                <p className="text-3xl font-black bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                  {posts.filter(p => p.status === 'draft').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters Row */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50/50 p-6 rounded-2xl border-2 border-indigo-200 shadow-lg">
          <div className="space-y-5">
            {/* Search - Full Width */}
            <div>
              <label className="block text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-600" />
                Search Posts
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-indigo-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by title, content, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 font-medium bg-white shadow-sm"
                />
              </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-bold text-indigo-900 mb-3">
                  Filter by Category
                </label>
                <CustomDropdown
                  value={selectedCategory}
                  onChange={(value) => setSelectedCategory(value)}
                  options={[
                    { value: 'all', label: 'All Categories', icon: '📁' },
                    ...categories.map(category => ({
                      value: category.name,
                      label: category.name,
                      icon: category.color === 'blue' ? '🔵' : category.color === 'green' ? '🟢' : category.color === 'purple' ? '🟣' : category.color === 'pink' ? '🩷' : '🟠'
                    }))
                  ]}
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-bold text-indigo-900 mb-3">
                  Filter by Status
                </label>
                <CustomDropdown
                  value={selectedStatus}
                  onChange={(value) => setSelectedStatus(value)}
                  options={[
                    { value: 'all', label: 'All Status', icon: '📋' },
                    { value: 'published', label: 'Published', icon: '✅' },
                    { value: 'draft', label: 'Draft', icon: '📝' }
                  ]}
                />
              </div>

              {/* Results Count */}
              <div>
                <label className="block text-sm font-bold text-indigo-900 mb-3">
                  Results
                </label>
                <div className="bg-white border-2 border-indigo-300 rounded-xl px-4 text-center shadow-sm h-[46px] sm:h-[50px] flex items-center justify-center">
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <p className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-none">
                      {filteredPosts.length}
                    </p>
                    <p className="text-sm text-indigo-700 font-medium">
                      {filteredPosts.length === 1 ? 'post' : 'posts'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-black text-gray-900">
            Blog Posts
            <span className="ml-2 text-sm font-medium text-gray-500">({filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'})</span>
          </h3>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-lg text-center py-16 px-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4 shadow-md">
              <FileText className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">No blog posts found</h3>
            <p className="text-sm text-gray-600 font-medium mb-6 max-w-md mx-auto">
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your filters to find what you\'re looking for.'
                : 'Get started by creating your first blog post to share with your audience.'
              }
            </p>
            <button
              onClick={handleCreatePost}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:scale-105"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white border-2 border-gray-200 rounded-2xl p-5 sm:p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:border-blue-300"
              >
                <div className="relative">
                  {/* Action Buttons - Top Right */}
                  <div className="absolute top-0 right-0 flex gap-2">
                    <button
                      onClick={() => handleEditPost(post)}
                      className="w-9 h-9 inline-flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 shadow-md shadow-blue-500/30 hover:shadow-lg hover:scale-105"
                      title="Edit post"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePost(post)}
                      className="w-9 h-9 inline-flex items-center justify-center bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg hover:from-red-600 hover:to-rose-600 transition-all duration-200 shadow-md shadow-red-500/30 hover:shadow-lg hover:scale-105"
                      title="Delete post"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Meta Info - Top */}
                  <div className="flex flex-wrap items-center gap-2 mb-4 pr-20">
                    {/* Category */}
                    <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200 shadow-sm">
                      {post.category}
                    </span>

                    {/* Status */}
                    {post.status === 'published' ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md">
                        <Eye className="w-4 h-4 mr-1.5" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 border-2 border-gray-300">
                        <EyeOff className="w-4 h-4 mr-1.5" />
                        Draft
                      </span>
                    )}

                    {/* Date */}
                    <span className="inline-flex items-center gap-2 text-sm text-gray-700 font-medium">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      {post.publishedAt
                        ? (post.publishedAt instanceof Timestamp
                           ? post.publishedAt.toDate().toLocaleDateString()
                           : new Date(post.publishedAt).toLocaleDateString())
                        : (post.createdAt instanceof Timestamp
                           ? post.createdAt.toDate().toLocaleDateString()
                           : new Date(post.createdAt).toLocaleDateString())
                      }
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex gap-4">
                    {/* Featured Image */}
                    {post.featuredImage && (
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover flex-shrink-0 border-2 border-gray-200 shadow-md"
                      />
                    )}

                    {/* Post Content */}
                    <div className="flex-1 min-w-0">
                      {/* Title with Featured Star */}
                      <div className="flex items-start gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-black text-gray-900 line-clamp-2 flex-1" title={post.title}>
                          {post.title}
                        </h3>
                        {post.featured && (
                          <Star className="w-6 h-6 text-yellow-500 fill-current flex-shrink-0" />
                        )}
                      </div>

                      {/* Excerpt */}
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3 font-medium" title={post.excerpt}>
                        {post.excerpt}
                      </p>

                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {post.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200 shadow-sm"
                              title={tag}
                            >
                              {tag}
                            </span>
                          ))}
                          {post.tags.length > 3 && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                              +{post.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Post Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden transform transition-all duration-300 scale-100 animate-in zoom-in-95">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-5 relative overflow-hidden">
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }} />
              </div>

              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="text-white bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {editingPost ? 'Edit Post' : 'Create New Post'}
                  </h2>
                </div>
                <button
                  onClick={() => setShowEditor(false)}
                  className="text-white/90 hover:text-white transition-all duration-200 p-2 rounded-xl hover:bg-white/20 backdrop-blur-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-180px)]">

            <div className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Title *
                </label>
                <input
                  type="text"
                  value={postForm.title}
                  onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium bg-white shadow-sm"
                  placeholder="Enter post title..."
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Type className="w-5 h-5 text-blue-600" />
                  Excerpt *
                </label>
                <textarea
                  value={postForm.excerpt}
                  onChange={(e) => setPostForm(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium bg-white shadow-sm resize-none"
                  placeholder="Brief description of the post..."
                />
              </div>

              {/* Content - Embedded Rich Text Editor */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Type className="w-5 h-5 text-blue-600" />
                  Content * (Rich Text Editor)
                </label>
                <div className="border-2 border-blue-200 rounded-xl overflow-hidden bg-white shadow-lg">
                  <LexicalComposer initialConfig={editorConfig} key={editingPost?.id || 'new-post'}>
                    <TooltipProvider>
                      <RichTextEditorWrapper
                        initialContent={postForm.content}
                        onChange={(content) => setPostForm(prev => ({ ...prev, content }))}
                      />
                    </TooltipProvider>
                  </LexicalComposer>
                </div>
                {postForm.content && (
                  <p className="text-xs text-gray-600 font-medium mt-2">
                    {postForm.content.length} characters
                  </p>
                )}
              </div>

              {/* Category and Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Category *
                  </label>
                  <CustomDropdown
                    value={postForm.category}
                    onChange={(value) => setPostForm(prev => ({ ...prev, category: value }))}
                    options={[
                      { value: '', label: 'Select category', icon: '📁' },
                      ...categories.map(category => ({
                        value: category.name,
                        label: category.name,
                        icon: category.color === 'blue' ? '🔵' : category.color === 'green' ? '🟢' : category.color === 'purple' ? '🟣' : category.color === 'pink' ? '🩷' : '🟠'
                      }))
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Status
                  </label>
                  <CustomDropdown
                    value={postForm.status}
                    onChange={(value) => setPostForm(prev => ({ ...prev, status: value as 'draft' | 'published' }))}
                    options={[
                      { value: 'draft', label: 'Draft', icon: '📝' },
                      { value: 'published', label: 'Published', icon: '✅' }
                    ]}
                  />
                </div>
              </div>

              {/* Featured Image */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  Featured Image
                </label>
                <div className="space-y-3">
                  {postForm.featuredImage && (
                    <div className="relative">
                      <img
                        src={postForm.featuredImage}
                        alt="Featured"
                        className="w-full h-48 object-cover rounded-xl border-2 border-gray-200 shadow-md"
                      />
                      <button
                        onClick={() => setPostForm(prev => ({ ...prev, featuredImage: '' }))}
                        className="absolute top-3 right-3 p-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-full hover:from-red-600 hover:to-rose-600 shadow-lg hover:scale-110 transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="featured-image-upload"
                    />
                    <label
                      htmlFor="featured-image-upload"
                      className="inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-xl hover:from-purple-200 hover:to-pink-200 cursor-pointer transition-all duration-200 font-bold border-2 border-purple-200 shadow-sm hover:shadow-md"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload Image'}
                    </label>
                    <input
                      type="url"
                      value={postForm.featuredImage}
                      onChange={(e) => setPostForm(prev => ({ ...prev, featuredImage: e.target.value }))}
                      placeholder="Or paste image URL..."
                      className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium bg-white shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-blue-600 text-lg">#️⃣</span>
                  Tags
                </label>
                <div className="space-y-3">
                  {postForm.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-gradient-to-br from-blue-50 to-cyan-50/50 border-2 border-blue-200 rounded-xl">
                      {postForm.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200 shadow-sm font-bold"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-blue-600 hover:text-blue-800 hover:scale-110 transition-transform"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <input
                    type="text"
                    onKeyDown={handleTagInput}
                    placeholder="Type tags and press Enter (supports: 'tag' or 'tag1, tag2')..."
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium bg-white shadow-sm"
                  />
                </div>
              </div>

              {/* Featured toggle */}
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50/50 border-2 border-yellow-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={postForm.featured}
                    onChange={(e) => setPostForm(prev => ({ ...prev, featured: e.target.checked }))}
                    className="h-5 w-5 text-yellow-600 focus:ring-2 focus:ring-yellow-500 border-2 border-gray-300 rounded cursor-pointer transition-all duration-200"
                  />
                  <label htmlFor="featured" className="ml-3 block text-sm text-gray-900 font-bold cursor-pointer">
                    ⭐ Featured post (appears prominently on blog homepage)
                  </label>
                </div>
              </div>

              {/* SEO Section */}
              <div className="border-t-2 border-gray-200 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center shadow-md">
                    <span className="text-xl">🔍</span>
                  </div>
                  <h4 className="text-lg font-black text-gray-900">SEO Settings</h4>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      SEO Title
                    </label>
                    <input
                      type="text"
                      value={postForm.seoTitle}
                      onChange={(e) => setPostForm(prev => ({ ...prev, seoTitle: e.target.value }))}
                      placeholder={postForm.title || "Will use post title if empty"}
                      className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-medium bg-white shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      SEO Description
                    </label>
                    <textarea
                      value={postForm.seoDescription}
                      onChange={(e) => setPostForm(prev => ({ ...prev, seoDescription: e.target.value }))}
                      rows={2}
                      placeholder={postForm.excerpt || "Will use excerpt if empty"}
                      className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 font-medium bg-white shadow-sm resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t-2 border-gray-100 bg-gradient-to-br from-gray-50 to-blue-50/30">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-bold shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePost}
                  disabled={saving || !postForm.title || !postForm.excerpt || !postForm.content || !postForm.category}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-green-500/40 transform hover:scale-105 disabled:transform-none disabled:shadow-none"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : editingPost ? 'Update Post' : 'Create Post'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && postToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 scale-100 animate-in zoom-in-95">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-6 py-5 rounded-t-3xl relative overflow-hidden">
              {/* Decorative pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }} />
              </div>

              <div className="flex items-center justify-center relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="text-white bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Delete Blog Post
                  </h2>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center">
                <p className="text-gray-700 mb-4 font-medium text-base">
                  Are you sure you want to delete this blog post? This action cannot be undone.
                </p>
                <div className="bg-gradient-to-br from-red-50 to-rose-50/50 border-2 border-red-200 rounded-2xl p-4 mb-6 shadow-lg">
                  <p className="text-sm font-black text-gray-900 truncate mb-2">
                    "{postToDelete.title}"
                  </p>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    {postToDelete.status === 'published' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm">
                        <Eye className="w-3 h-3 mr-1" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 border border-gray-300">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Draft
                      </span>
                    )}
                    <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200 shadow-sm">
                      {postToDelete.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-sm hover:shadow-md"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transform hover:scale-105 disabled:transform-none disabled:shadow-none"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Post
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Blog Post Preview</h3>
                <p className="text-sm text-gray-600 mt-1">How your post will appear on the blog</p>
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <article className="max-w-3xl mx-auto">
                {/* Post Header */}
                <header className="mb-8">
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-full">
                      {postForm.category}
                    </span>
                    {postForm.featured && (
                      <span className="inline-block ml-2 px-3 py-1 text-sm font-medium text-yellow-600 bg-yellow-100 rounded-full">
                        <Star className="w-3 h-3 inline mr-1" />
                        Featured
                      </span>
                    )}
                  </div>

                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {postForm.title || 'Untitled Post'}
                  </h1>

                  {postForm.excerpt && (
                    <p className="text-xl text-gray-600 leading-relaxed mb-6">
                      {postForm.excerpt}
                    </p>
                  )}

                  <div className="flex items-center text-sm text-gray-500 mb-6">
                    <Calendar className="w-4 h-4 mr-2" />
                    <time dateTime={new Date().toISOString()}>
                      {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </time>
                    <span className="mx-2">·</span>
                    <span>{postForm.status === 'published' ? 'Published' : 'Draft'}</span>
                  </div>

                  {postForm.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {postForm.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {postForm.featuredImage && (
                    <div className="mb-8">
                      <img
                        src={postForm.featuredImage}
                        alt={postForm.title}
                        className="w-full h-64 md:h-80 object-cover rounded-lg"
                      />
                    </div>
                  )}
                </header>

                {/* Post Content */}
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(
                      postForm.content || '<p>No content yet. Start writing in the editor!</p>',
                      {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img'],
                        ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class']
                      }
                    )
                  }}
                />
              </article>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};