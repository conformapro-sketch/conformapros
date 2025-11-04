import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link as LinkIcon, Undo, Redo } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function RichTextEditor({ value, onChange, placeholder = 'Saisissez le contenu...', className, disabled = false }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL du lien:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('border border-input rounded-md overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="bg-muted/50 border-b border-input p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run() || disabled}
          className={cn('h-8 w-8 p-0', editor.isActive('bold') && 'bg-primary/20 text-primary')}
          title="Gras"
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run() || disabled}
          className={cn('h-8 w-8 p-0', editor.isActive('italic') && 'bg-primary/20 text-primary')}
          title="Italique"
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          disabled={!editor.can().chain().focus().toggleUnderline().run() || disabled}
          className={cn('h-8 w-8 p-0', editor.isActive('underline') && 'bg-primary/20 text-primary')}
          title="Souligné"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run() || disabled}
          className={cn('h-8 w-8 p-0', editor.isActive('strike') && 'bg-primary/20 text-primary')}
          title="Barré"
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={disabled}
          className={cn('h-8 w-8 p-0', editor.isActive('heading', { level: 1 }) && 'bg-primary/20 text-primary')}
          title="Titre 1"
        >
          <Heading1 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
          className={cn('h-8 w-8 p-0', editor.isActive('heading', { level: 2 }) && 'bg-primary/20 text-primary')}
          title="Titre 2"
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
          className={cn('h-8 w-8 p-0', editor.isActive('heading', { level: 3 }) && 'bg-primary/20 text-primary')}
          title="Titre 3"
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          className={cn('h-8 w-8 p-0', editor.isActive('bulletList') && 'bg-primary/20 text-primary')}
          title="Liste à puces"
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          className={cn('h-8 w-8 p-0', editor.isActive('orderedList') && 'bg-primary/20 text-primary')}
          title="Liste numérotée"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          disabled={disabled}
          className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'left' }) && 'bg-primary/20 text-primary')}
          title="Aligner à gauche"
        >
          <AlignLeft className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          disabled={disabled}
          className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'center' }) && 'bg-primary/20 text-primary')}
          title="Centrer"
        >
          <AlignCenter className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          disabled={disabled}
          className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'right' }) && 'bg-primary/20 text-primary')}
          title="Aligner à droite"
        >
          <AlignRight className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          disabled={disabled}
          className={cn('h-8 w-8 p-0', editor.isActive({ textAlign: 'justify' }) && 'bg-primary/20 text-primary')}
          title="Justifier"
        >
          <AlignJustify className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={setLink}
          disabled={disabled}
          className={cn('h-8 w-8 p-0', editor.isActive('link') && 'bg-primary/20 text-primary')}
          title="Insérer un lien"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <div className="w-px h-8 bg-border mx-1" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run() || disabled}
          className="h-8 w-8 p-0"
          title="Annuler"
        >
          <Undo className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run() || disabled}
          className="h-8 w-8 p-0"
          title="Rétablir"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none p-3 min-h-[200px] focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[200px] [&_.ProseMirror>*:first-child]:mt-0 [&_.ProseMirror>*:last-child]:mb-0"
      />
    </div>
  );
}
