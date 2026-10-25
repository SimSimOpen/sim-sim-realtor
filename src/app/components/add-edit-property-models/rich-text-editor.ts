import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  forwardRef,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

/**
 * Rich text description field (bold / italic / code / lists / quote), mirroring the Blog admin's
 * RichTextEditor.vue: Tiptap StarterKit, value stored as an HTML string. Works as a drop-in
 * form control: `<app-rich-text-editor formControlName="description">`.
 */
@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RichTextEditor),
      multi: true,
    },
  ],
  template: `
    <div class="rte-toolbar">
      @for (tool of tools; track tool.label) {
        <button
          type="button"
          class="rte-btn"
          [class.rte-btn-active]="active[tool.key]"
          (click)="apply(tool)"
        >
          {{ tool.label }}
        </button>
      }
    </div>
    <div class="rte-body">
      @if (isEmpty && !focused) {
        <span class="rte-placeholder">{{ placeholder() }}</span>
      }
      <div #host class="rte-content"></div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .rte-toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
        margin-bottom: 0.5rem;
      }
      .rte-btn {
        border: 1px solid #d1d5db;
        background: white;
        border-radius: 0.375rem;
        padding: 0.25rem 0.6rem;
        font-size: 0.8rem;
        font-weight: 600;
        color: #374151;
        cursor: pointer;
      }
      .rte-btn:hover {
        background: #f3f4f6;
      }
      .rte-btn-active {
        background: #2563eb;
        border-color: #2563eb;
        color: white;
      }
      .rte-body {
        position: relative;
      }
      .rte-placeholder {
        position: absolute;
        left: 0.85rem;
        top: 0.7rem;
        color: #9ca3af;
        font-size: 0.875rem;
        pointer-events: none;
      }
      /* The editor DOM is created by ProseMirror, so its styles need ::ng-deep.
         Visuals match the plain .field inputs of these forms. */
      ::ng-deep .rte-content .ProseMirror {
        min-height: 8rem;
        padding: 0.5rem 0.75rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        background: white;
        box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
      }
      ::ng-deep .rte-content .ProseMirror:focus {
        outline: none;
        border-color: transparent;
        box-shadow: 0 0 0 2px #3b82f6;
      }
      /* Tailwind preflight strips these from generated content */
      ::ng-deep .ProseMirror ul {
        list-style: disc;
        padding-left: 1.5rem;
      }
      ::ng-deep .ProseMirror ol {
        list-style: decimal;
        padding-left: 1.5rem;
      }
      ::ng-deep .ProseMirror blockquote {
        border-left: 3px solid #d1d5db;
        padding-left: 1rem;
        color: #4b5563;
      }
      ::ng-deep .ProseMirror code {
        background: #f3f4f6;
        padding: 0 0.3rem;
        border-radius: 4px;
        font-family: ui-monospace, monospace;
        font-size: 0.85em;
      }
      ::ng-deep .ProseMirror p + p {
        margin-top: 0.5rem;
      }
      ::ng-deep .ProseMirror pre {
        background: #f3f4f6;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        white-space: pre;
        overflow-x: auto;
      }
      ::ng-deep .ProseMirror pre code {
        background: none;
        padding: 0;
      }
    `,
  ],
})
export class RichTextEditor implements AfterViewInit, OnDestroy, ControlValueAccessor {
  private ctr = inject(ChangeDetectorRef);
  private host = viewChild.required<ElementRef<HTMLElement>>('host');

  placeholder = input('');

  /** Tiptap instance once mounted; the toolbar buttons call straight into it. */
  editor?: Editor;
  active: Record<string, boolean> = {};
  isEmpty = true;
  focused = false;

  readonly tools = [
    { label: 'B', key: 'bold', run: (e: Editor) => e.chain().focus().toggleBold().run() },
    { label: 'I', key: 'italic', run: (e: Editor) => e.chain().focus().toggleItalic().run() },
    { label: '</>', key: 'code', run: (e: Editor) => e.chain().focus().toggleCode().run() },
    { label: '• List', key: 'bulletList', run: (e: Editor) => e.chain().focus().toggleBulletList().run() },
    { label: '1. List', key: 'orderedList', run: (e: Editor) => e.chain().focus().toggleOrderedList().run() },
    { label: '" Quote', key: 'blockquote', run: (e: Editor) => e.chain().focus().toggleBlockquote().run() },
  ];

  private onChange: (html: string) => void = () => {};
  private onTouched: () => void = () => {};
  private pendingValue: string | null = null;

  /** Toolbar click; a no-op if the editor hasn't mounted yet. */
  apply(tool: { run: (e: Editor) => unknown }) {
    if (this.editor) tool.run(this.editor);
  }

  ngAfterViewInit() {
    const hostEl = this.host().nativeElement;
    this.editor = new Editor({
      element: hostEl,
      extensions: [StarterKit],
      content: this.pendingValue ?? '',
      onUpdate: ({ editor }) => {
        this.onChange(editor.getHTML());
        this.isEmpty = editor.getText().trim().length === 0;
      },
      onTransaction: () => {
        // Zoneless: toolbar highlight and placeholder live outside Angular events.
        this.refreshState();
        this.ctr.markForCheck();
      },
      onFocus: () => {
        this.focused = true;
      },
      onBlur: () => {
        this.focused = false;
        this.onTouched();
      },
    });
    this.pendingValue = null;
    this.refreshState();
  }

  ngOnDestroy() {
    this.editor?.destroy();
  }

  private refreshState() {
    if (!this.editor) return;
    for (const tool of this.tools) {
      this.active[tool.key] = this.editor.isActive(tool.key);
    }
    this.isEmpty = this.editor.getText().trim().length === 0;
  }

  writeValue(html: string | null) {
    this.pendingValue = html;
    if (this.editor) {
      const next = html ?? '';
      if (next !== this.editor.getHTML()) {
        // false: don't echo the value back through onChange.
        this.editor.commands.setContent(next, { emitUpdate: false });
      }
      this.refreshState();
      this.ctr.markForCheck();
    }
  }

  registerOnChange(fn: (html: string) => void) {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void) {
    this.onTouched = fn;
  }
}
