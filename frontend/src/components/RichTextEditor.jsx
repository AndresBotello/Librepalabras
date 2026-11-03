import { useEffect, useRef } from 'react';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic, List, ListOrdered, Underline,
} from 'lucide-react';
import { richEditorHandlers } from '../utils/richPaste';

/** Cada botón es un comando de `execCommand` sobre la selección del editor. */
const TOOLBAR = [
  { command: 'bold', icon: Bold, title: 'Negrita' },
  { command: 'italic', icon: Italic, title: 'Cursiva' },
  { command: 'underline', icon: Underline, title: 'Subrayado' },
  { command: 'justifyLeft', icon: AlignLeft, title: 'Alinear a la izquierda' },
  { command: 'justifyCenter', icon: AlignCenter, title: 'Centrar' },
  { command: 'justifyRight', icon: AlignRight, title: 'Alinear a la derecha' },
  { command: 'justifyFull', icon: AlignJustify, title: 'Justificar' },
  { command: 'insertUnorderedList', icon: List, title: 'Lista con viñetas' },
  { command: 'insertOrderedList', icon: ListOrdered, title: 'Lista numerada' },
];

/**
 * Editor de texto con formato (HTML), con la misma barra y el mismo pegado
 * limpio que el formulario de obras. El HTML que produce se vuelve a sanear en
 * el servidor: lo que se ve aquí no es lo que se confía allá.
 */
export default function RichTextEditor({ value, onChange, isDark, placeholder, id, minHeightClass = 'min-h-60' }) {
  const editorRef = useRef(null);

  // El `contentEditable` no es un input controlado: solo se reescribe desde
  // fuera (al limpiar el formulario) cuando difiere de lo pintado, o cada tecla
  // movería el cursor al principio.
  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== (value || '')) {
      editor.innerHTML = value || '';
    }
  }, [value]);

  const applyFormatting = (command) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    document.execCommand(command, false, null);
    onChange(editor.innerHTML || '');
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {TOOLBAR.map(({ command, icon: Icon, title }) => (
          <button
            key={command}
            type="button"
            title={title}
            aria-label={title}
            onClick={() => applyFormatting(command)}
            className={`p-2 rounded-lg border transition-colors ${
              isDark
                ? 'border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>

      <div
        id={id}
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        {...richEditorHandlers(onChange)}
        data-placeholder={placeholder}
        className={`w-full ${minHeightClass} px-4 py-2 border rounded-lg text-sm leading-relaxed focus:outline-none focus:ring-1 overflow-y-auto ${
          isDark
            ? 'bg-gray-700 border-gray-600 text-gray-100 focus:ring-gray-400'
            : 'bg-white border-gray-300 text-gray-900 focus:ring-gray-500'
        }`}
        style={{ whiteSpace: 'pre-wrap' }}
      />
    </div>
  );
}
