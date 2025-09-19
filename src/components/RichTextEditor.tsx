import React, { useState } from 'react';
import { SerializedEditorState } from 'lexical';
import { Editor } from '@/components/blocks/editor-00/editor';
import { Save, X } from 'lucide-react';

const initialValue = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: "normal",
            style: "",
            text: "",
            type: "text",
            version: 1,
          },
        ],
        direction: "ltr",
        format: "",
        indent: 0,
        type: "paragraph",
        version: 1,
      },
    ],
    direction: "ltr",
    format: "",
    indent: 0,
    type: "root",
    version: 1,
  },
} as unknown as SerializedEditorState;

interface RichTextEditorProps {
  content: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onSave,
  onCancel,
}) => {
  // Parse existing content or use initial value
  const parseContent = (contentString: string): SerializedEditorState => {
    if (!contentString) return initialValue;

    try {
      // If content is HTML, convert to a simple text node for now
      // In a real implementation, you'd want to parse HTML to Lexical nodes
      const textContent = contentString.replace(/<[^>]*>/g, ''); // Strip HTML tags
      return {
        root: {
          children: [
            {
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "",
                  text: textContent,
                  type: "text",
                  version: 1,
                },
              ],
              direction: "ltr",
              format: "",
              indent: 0,
              type: "paragraph",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "root",
          version: 1,
        },
      } as unknown as SerializedEditorState;
    } catch {
      return initialValue;
    }
  };

  const [editorState, setEditorState] = useState<SerializedEditorState>(
    parseContent(content)
  );

  const handleSave = () => {
    // Convert editor state to HTML string
    // This is a simplified conversion - in a real implementation you'd use Lexical's HTML export
    const textContent = extractTextFromEditorState(editorState);
    const htmlContent = `<p>${textContent}</p>`;
    onSave(htmlContent);
  };

  const extractTextFromEditorState = (state: SerializedEditorState): string => {
    try {
      if (state?.root?.children) {
        return state.root.children
          .map((child: any) => {
            if (child.children) {
              return child.children
                .map((textNode: any) => textNode.text || '')
                .join('');
            }
            return '';
          })
          .join('\n');
      }
    } catch {
      // Fallback
    }
    return '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Rich Text Editor</h3>
            <p className="text-sm text-gray-600 mt-1">Write your blog post content with rich formatting</p>
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
              Save
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden p-4">
          <div className="h-full">
            <Editor
              editorSerializedState={editorState}
              onSerializedChange={(value) => setEditorState(value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};