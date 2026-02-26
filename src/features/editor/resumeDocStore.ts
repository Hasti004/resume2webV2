import { create } from "zustand";
import type { ResumeBasics, ResumeBlock, ResumeDoc } from "@/lib/resumeRepo";

export type EditorTheme = "light" | "dark";

export interface EditorState {
  resumeId: string | null;
  templateId: string | null;
  theme: EditorTheme;
  basics: ResumeBasics;
  blocks: ResumeBlock[];
  selectedBlockId: string | null;
  dirty: boolean;
  saving: boolean;
}

export interface EditorActions {
  setDoc: (resumeId: string, doc: ResumeDoc) => void;
  setTheme: (theme: EditorTheme) => void;
  updateBasics: (patch: Partial<ResumeBasics>) => void;
  updateBlock: (blockId: string, patch: Partial<ResumeBlock>) => void;
  /** Apply full basics and blocks (e.g. after Accept All from AI proposal). */
  setBasicsAndBlocks: (basics: ResumeBasics, blocks: ResumeBlock[]) => void;
  addBlock: (type: string, title?: string) => void;
  /** Add a block with full content (e.g. when accepting a proposed new block from AI). */
  addBlockWithContent: (type: string, content: Record<string, unknown>, sortOrder?: number) => void;
  deleteBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;
  setSaving: (saving: boolean) => void;
  setDirty: (dirty: boolean) => void;
}

function generateBlockId(): string {
  return `block-${crypto.randomUUID()}`;
}

export const useResumeDocStore = create<EditorState & EditorActions>((set) => ({
  resumeId: null,
  templateId: null,
  theme: "dark",
  basics: {},
  blocks: [],
  selectedBlockId: null,
  dirty: false,
  saving: false,

  setDoc: (resumeId, doc) =>
    set({
      resumeId,
      templateId: doc.templateId,
      theme: doc.templateId === "minimal-monochrome" ? "dark" : "light",
      basics: doc.basics ?? {},
      blocks: doc.blocks ?? [],
      selectedBlockId: null,
      dirty: false,
      saving: false,
    }),

  setTheme: (theme) => set({ theme }),

  updateBasics: (patch) =>
    set((state) => ({
      basics: { ...state.basics, ...patch },
      dirty: true,
    })),

  updateBlock: (blockId, patch) =>
    set((state) => ({
      blocks: state.blocks.map((b) =>
        (b.id ?? "") === blockId ? { ...b, ...patch } : b
      ),
      dirty: true,
    })),

  setBasicsAndBlocks: (basics, blocks) =>
    set({ basics, blocks, dirty: true }),

  addBlock: (type, title) =>
    set((state) => {
      const newBlock: ResumeBlock = {
        id: generateBlockId(),
        type,
        content: title ? { title } : {},
        sort_order: state.blocks.length,
      };
      return {
        blocks: [...state.blocks, newBlock],
        selectedBlockId: newBlock.id,
        dirty: true,
      };
    }),

  addBlockWithContent: (type, content, sortOrder) =>
    set((state) => {
      const so = sortOrder ?? state.blocks.length;
      const newBlock: ResumeBlock = {
        id: generateBlockId(),
        type,
        content: content ?? {},
        sort_order: so,
      };
      return {
        blocks: [...state.blocks, newBlock],
        selectedBlockId: newBlock.id,
        dirty: true,
      };
    }),

  deleteBlock: (id) =>
    set((state) => ({
      blocks: state.blocks.filter((b) => (b.id ?? "") !== id),
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
      dirty: true,
    })),

  selectBlock: (id) => set({ selectedBlockId: id }),

  setSaving: (saving) => set({ saving }),

  setDirty: (dirty) => set({ dirty }),
}));
