/*
This component is temporarily disabled due to missing shadcn editor dependencies.
Use EnhancedRichTextEditor instead.

import React, { useState } from 'react';
import { SerializedEditorState } from 'lexical';
import { ListItemNode, ListNode } from '@lexical/list';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { ParagraphNode, TextNode } from 'lexical';
import {
  InitialConfigType,
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';

import { ContentEditable } from '@/components/editor/editor-ui/content-editable';
import { editorTheme } from '@/components/editor/themes/editor-theme';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Save, X } from 'lucide-react';

import { ToolbarPlugin } from '@/components/editor/plugins/toolbar/toolbar-plugin';
import { ActionsPlugin } from '@/components/editor/plugins/actions/actions-plugin';

// Import all the toolbar plugins
import { BlockFormatDropDown } from '@/components/editor/plugins/toolbar/block-format-toolbar-plugin';
import { FormatParagraph } from '@/components/editor/plugins/toolbar/block-format/format-paragraph';
import { FormatHeading } from '@/components/editor/plugins/toolbar/block-format/format-heading';
import { FormatNumberedList } from '@/components/editor/plugins/toolbar/block-format/format-numbered-list';
import { FormatBulletedList } from '@/components/editor/plugins/toolbar/block-format/format-bulleted-list';
import { FormatCheckList } from '@/components/editor/plugins/toolbar/block-format/format-check-list';
import { FormatQuote } from '@/components/editor/plugins/toolbar/block-format/format-quote';
import { ElementFormatToolbarPlugin } from '@/components/editor/plugins/toolbar/element-format-toolbar-plugin';
import { FontFormatToolbarPlugin } from '@/components/editor/plugins/toolbar/font-format-toolbar-plugin';
import { FontColorToolbarPlugin } from '@/components/editor/plugins/toolbar/font-color-toolbar-plugin';
import { FontBackgroundToolbarPlugin } from '@/components/editor/plugins/toolbar/font-background-toolbar-plugin';
import { FontSizeToolbarPlugin } from '@/components/editor/plugins/toolbar/font-size-toolbar-plugin';
import { HistoryToolbarPlugin } from '@/components/editor/plugins/toolbar/history-toolbar-plugin';
import { LinkToolbarPlugin } from '@/components/editor/plugins/toolbar/link-toolbar-plugin';
import { CounterCharacterPlugin } from '@/components/editor/plugins/actions/counter-character-plugin';
import { ImportExportPlugin } from '@/components/editor/plugins/actions/import-export-plugin';
*/

import React from 'react';

interface ComprehensiveRichTextEditorProps {
  content: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

// Temporarily disabled - use EnhancedRichTextEditor instead
export const ComprehensiveRichTextEditor: React.FC<ComprehensiveRichTextEditorProps> = ({
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Component Temporarily Disabled</h3>
        <p className="text-sm text-gray-600 mb-6">
          This comprehensive editor is temporarily disabled due to missing dependencies.
          Please use the Enhanced Rich Text Editor instead.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};