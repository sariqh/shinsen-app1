"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getWarlords } from "@/src/repositories/master";
import { CompositionSchema, type Composition } from "@/src/schema/composition";
import type { Warlord } from "@/src/schema/warlord";
import { db } from "@/lib/dexie";
import { CompositionBoard } from "@/src/ui/composition/CompositionBoard";
import { PaletteTabs } from "@/src/ui/palette/PaletteTabs";
import { WarlordPalette } from "@/src/ui/palette/WarlordPalette";
import { SkillPalette } from "@/src/ui/palette/SkillPalette";
import { TacticsPalette } from "@/src/ui/palette/TacticsPalette";
// 現実データ（開発用バイパス）: TypeScriptファイルからimport（参照: 07/3）
import { skillsMaster } from "@/src/data/skills";
import { assetsData } from "@/src/data/assets";
import { tacticsMaster } from "@/src/data/tactics";

type Index3 = 0 | 1 | 2;
type CompositionIndex = 0 | 1 | 2;

// TODO: 認証実装後にFirebase AuthからuserIdを取得（参照: 01/4.2, 05/1）
const MOCK_USER_ID = "user_mock_001";

// 所持データ（資産）を temp/assets.json から構築
const OWNED_WARLORDS_SPARSE: Record<string, number> = (() => {
  // assets.json は ownedWarlords（ゼロ含む）と ownedWarlords_sparse を持つ
  // 優先: ownedWarlords_sparse、無ければ ownedWarlords のうち値>0のみを抽出
  const sparse = (assetsData as any).ownedWarlords_sparse as Record<string, number> | undefined;
  if (sparse && Object.keys(sparse).length > 0) return sparse;
  const dense = (assetsData as any).ownedWarlords as Record<string, number> | undefined;
  if (!dense) return {};
  const out: Record<string, number> = {};
  for (const [wid, copies] of Object.entries(dense)) {
    if ((copies as number) > 0) out[wid] = copies as number;
  }
  return out;
})();

// 戦法マスタから表示用データ/マップを生成
type SkillMasterItem = (typeof skillsMaster)[number];
const NUMERIC_TYPE_TO_LABEL: Record<number, string> = {
  5: "兵種",
  4: "パッシブ",
  3: "突撃",
  6: "陣法",
  1: "指揮",
  2: "アクティブ",
};

const OWNED_SKILLS_SET: Record<string, true> = (assetsData as any).ownedSkills ?? {};

const SKILL_LIST_FOR_PALETTE: { id: string; name: string; type: string; owned: boolean }[] = (skillsMaster as readonly SkillMasterItem[]).map((s) => ({
  id: s.skillId,
  name: s.name,
  type: NUMERIC_TYPE_TO_LABEL[s.type] ?? "パッシブ",
  owned: OWNED_SKILLS_SET[s.skillId] === true,
}));

// 兵法書マスタから表示用データを生成
type TacticMasterItem = (typeof tacticsMaster)[number];
const TACTICS_LIST_FOR_PALETTE: { id: string; name: string; category: number }[] = (tacticsMaster as readonly TacticMasterItem[]).map((t) => ({
  id: t.tacticId,
  name: t.name,
  category: t.category,
}));

export default function CompositionPage() {
  const [tab, setTab] = useState<"warlord" | "skill" | "tactics">("warlord");
  const { data: warlords = [] } = useQuery({ queryKey: ["warlords"], queryFn: getWarlords });
  const warlordById: Record<string, Warlord> = useMemo(
    () => Object.fromEntries(warlords.map((w) => [w.id, w] as const)),
    [warlords]
  );

  // 戦法名表示用のマップ（temp/skills.json を元に構築）
  const skillById: Record<string, { name: string }> = useMemo(() => {
    const m: Record<string, { name: string }> = {};
    for (const s of skillsMaster) {
      m[s.skillId] = { name: s.name };
    }
    return m;
  }, []);

  // 兵法書名表示用のマップ（tactics.json を元に構築）
  const tacticById: Record<string, { name: string }> = useMemo(() => {
    const m: Record<string, { name: string }> = {};
    for (const t of tacticsMaster) {
      m[t.tacticId] = { name: t.name };
    }
    return m;
  }, []);

  const emptySlot = useMemo(
    () => ({ warlordId: null, camp: null, skillIds: ["", ""], tacticIds: ["", "", ""], notes: { attr: "", equipSkill: "", memo: "" } }),
    []
  );

  // 参照: 06/3.2.3 Composition スキーマに準拠
  const [compositions, setCompositions] = useState<[Composition, Composition, Composition]>(() => [
    CompositionSchema.parse({
      compositionId: "cmp_a",
      userId: MOCK_USER_ID,
      name: "編成A",
      unitType: 1,
      slots: [emptySlot, emptySlot, emptySlot],
      warlordIdsFlat: ["", "", ""],
      skillIdsFlat: [],
    }),
    CompositionSchema.parse({
      compositionId: "cmp_b",
      userId: MOCK_USER_ID,
      name: "編成B",
      unitType: 1,
      slots: [emptySlot, emptySlot, emptySlot],
      warlordIdsFlat: ["", "", ""],
      skillIdsFlat: [],
    }),
    CompositionSchema.parse({
      compositionId: "cmp_c",
      userId: MOCK_USER_ID,
      name: "編成C",
      unitType: 1,
      slots: [emptySlot, emptySlot, emptySlot],
      warlordIdsFlat: ["", "", ""],
      skillIdsFlat: [],
    }),
  ]);

  // 一時的な互換用State（新Store構造への移行はフェーズ2で完全対応）
  const [activeCompositionIndex, setActiveCompositionIndex] = useState<CompositionIndex | null>(null);
  const [activeSlotIndex, setActiveSlotIndex] = useState<Index3 | null>(null);
  const [activeSkillIndex, setActiveSkillIndex] = useState<0 | 1 | null>(null);
  const [activeTacticIndex, setActiveTacticIndex] = useState<0 | 1 | 2 | null>(null); // 兵法書スロットのアクティブ状態
  const [activeCompositionSlot, setActiveCompositionSlot] = useState<CompositionIndex | null>(null); // 編成スロット全体のアクティブ状態

  // 上下スプリット比率（上:下）。初期は50:50 / 最小35%〜最大75%
  const [panelRatio, setPanelRatio] = useState<number>(() => {
    if (typeof window === "undefined") return 0.5;
    const saved = window.localStorage.getItem("composition_panel_ratio");
    const v = saved ? Number(saved) : 0.5;
    return Number.isFinite(v) ? Math.min(0.75, Math.max(0.35, v)) : 0.5;
  });
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);

  function onSplitPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
  }
  function onSplitPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const ratio = y / rect.height;
    const clamped = Math.min(0.75, Math.max(0.35, ratio));
    setPanelRatio(clamped);
  }
  function onSplitPointerUp() {
    isDraggingRef.current = false;
    try {
      window.localStorage.setItem("composition_panel_ratio", String(panelRatio));
    } catch {
      // noop: localStorage 不可環境は無視
    }
  }

  // 参照: 03/11.3 IndexedDBへの自動保存（500ms debounce）
  useEffect(() => {
    const h = setTimeout(() => {
      void db.drafts.put({ id: "composition_triple_current", data: compositions, updatedAt: Date.now() });
    }, 500);
    return () => clearTimeout(h);
  }, [compositions]);

  function updateComposition(index: CompositionIndex, mut: (c: Composition) => Composition) {
    setCompositions((cs) => {
      const next = [...cs] as [Composition, Composition, Composition];
      next[index] = mut(next[index]);
      return next;
    });
  }

  // 編成スロット全体のスワップ処理
  function swapCompositions(fromCompIdx: CompositionIndex, toCompIdx: CompositionIndex) {
    if (fromCompIdx === toCompIdx) return;
    
    setCompositions((cs) => {
      const next = [...cs] as [Composition, Composition, Composition];
      const temp = next[fromCompIdx];
      next[fromCompIdx] = next[toCompIdx];
      next[toCompIdx] = temp;
      return next;
    });
    
    // スワップ後はアクティブ解除
    setActiveCompositionSlot(null);
  }

  // 戦法の編成間スワップ処理
  function swapSkillAcrossCompositions(fromCompIdx: CompositionIndex, fromSlotIdx: Index3, fromSkillIdx: 0 | 1, toCompIdx: CompositionIndex, toSlotIdx: Index3, toSkillIdx: 0 | 1) {
    setCompositions((cs) => {
      const next = [...cs] as [Composition, Composition, Composition];
      
      if (fromCompIdx === toCompIdx) {
        // 同一編成内のスワップ
        const comp = { ...next[fromCompIdx], slots: next[fromCompIdx].slots.map((s) => ({ ...s })) };
        const fromSkills = (comp.slots[fromSlotIdx].skillIds ?? ["", ""]).slice() as [string, string];
        const toSkills = (comp.slots[toSlotIdx].skillIds ?? ["", ""]).slice() as [string, string];
        
        const temp = fromSkills[fromSkillIdx];
        fromSkills[fromSkillIdx] = toSkills[toSkillIdx];
        toSkills[toSkillIdx] = temp;
        
        comp.slots[fromSlotIdx] = { ...comp.slots[fromSlotIdx], skillIds: fromSkills };
        comp.slots[toSlotIdx] = { ...comp.slots[toSlotIdx], skillIds: toSkills };
        next[fromCompIdx] = comp as Composition;
        return next;
      }
      
      // 異なる編成間のスワップ
      const fromComp = { ...next[fromCompIdx], slots: next[fromCompIdx].slots.map((s) => ({ ...s })) };
      const toComp = { ...next[toCompIdx], slots: next[toCompIdx].slots.map((s) => ({ ...s })) };
      
      const fromSkills = (fromComp.slots[fromSlotIdx].skillIds ?? ["", ""]).slice() as [string, string];
      const toSkills = (toComp.slots[toSlotIdx].skillIds ?? ["", ""]).slice() as [string, string];
      
      const temp = fromSkills[fromSkillIdx];
      fromSkills[fromSkillIdx] = toSkills[toSkillIdx];
      toSkills[toSkillIdx] = temp;
      
      fromComp.slots[fromSlotIdx] = { ...fromComp.slots[fromSlotIdx], skillIds: fromSkills };
      toComp.slots[toSlotIdx] = { ...toComp.slots[toSlotIdx], skillIds: toSkills };
      
      next[fromCompIdx] = fromComp as Composition;
      next[toCompIdx] = toComp as Composition;
      
      return next;
    });
  }

  // 編成間のスワップ処理
  function swapAcrossCompositions(fromCompIdx: CompositionIndex, fromSlotIdx: Index3, toCompIdx: CompositionIndex, toSlotIdx: Index3) {
    setCompositions((cs) => {
      const next = [...cs] as [Composition, Composition, Composition];
      
      if (fromCompIdx === toCompIdx) {
        // 同一編成内のスワップは単一のコピー上で実施
        const comp = { ...next[fromCompIdx], slots: next[fromCompIdx].slots.map((s) => ({ ...s })), warlordIdsFlat: (next[fromCompIdx].warlordIdsFlat ?? ["", "", ""]).slice() as [string, string, string] };
        const tempSlot = comp.slots[fromSlotIdx];
        comp.slots[fromSlotIdx] = comp.slots[toSlotIdx];
        comp.slots[toSlotIdx] = tempSlot;
        const tempId = comp.warlordIdsFlat[fromSlotIdx];
        comp.warlordIdsFlat[fromSlotIdx] = comp.warlordIdsFlat[toSlotIdx];
        comp.warlordIdsFlat[toSlotIdx] = tempId;
        next[fromCompIdx] = comp as Composition;
        return next;
      }
      
      const fromComp = { ...next[fromCompIdx], slots: next[fromCompIdx].slots.map((s) => ({ ...s })), warlordIdsFlat: (next[fromCompIdx].warlordIdsFlat ?? ["", "", ""]).slice() as [string, string, string] };
      const toComp = { ...next[toCompIdx], slots: next[toCompIdx].slots.map((s) => ({ ...s })), warlordIdsFlat: (next[toCompIdx].warlordIdsFlat ?? ["", "", ""]).slice() as [string, string, string] };
      
      // スロット全体をスワップ（武将+配下データ）
      const tempSlot = fromComp.slots[fromSlotIdx];
      fromComp.slots[fromSlotIdx] = toComp.slots[toSlotIdx];
      toComp.slots[toSlotIdx] = tempSlot;
      
      // 検索用フラット配列もスワップ
      const tempId = fromComp.warlordIdsFlat[fromSlotIdx];
      fromComp.warlordIdsFlat[fromSlotIdx] = toComp.warlordIdsFlat[toSlotIdx];
      toComp.warlordIdsFlat[toSlotIdx] = tempId;
      
      next[fromCompIdx] = fromComp as Composition;
      next[toCompIdx] = toComp as Composition;
      
      return next;
    });
  }

  // 参照: 03/3.5 - 武将スロットのクリアは確認ダイアログ
  function clearSlot(compIdx: CompositionIndex, slotIdx: Index3) {
    const slot = compositions[compIdx].slots[slotIdx];
    const warlord = slot?.warlordId ? warlordById[slot.warlordId] : null;
    
    if (warlord && !confirm(`${warlord.name} と配下の戦法/兵法書/メモを一括削除しますか？`)) {
      return;
    }
    
    updateComposition(compIdx, (c) => {
      const next = { ...c, slots: c.slots.map((s) => ({ ...s })), warlordIdsFlat: (c.warlordIdsFlat ?? ["", "", ""]).slice() as [string, string, string] };
      next.slots[slotIdx] = { ...emptySlot };
      next.warlordIdsFlat[slotIdx] = "";
      return next as Composition;
    });
  }

  // 戦法スロット選択
  function selectSkillSlot(slotIdx: Index3, skillIdx: 0 | 1) {
    setActiveSlotIndex(slotIdx);
    setActiveSkillIndex(skillIdx);
    setTab("skill"); // 戦法スロット選択時は戦法パレットを表示
  }

  // 戦法の割当
  function assignSkill(skillId: string) {
    if (activeCompositionIndex === null || activeSlotIndex === null || activeSkillIndex === null) return;
    
    updateComposition(activeCompositionIndex, (c) => {
      const next = { ...c, slots: c.slots.map((s) => ({ ...s })) };
      const skills = (next.slots[activeSlotIndex].skillIds ?? ["", ""]).slice() as [string, string];
      
      // 新規割当（同一武将内のスワップは廃止）
      skills[activeSkillIndex] = skillId;
      
      next.slots[activeSlotIndex] = { ...next.slots[activeSlotIndex], skillIds: skills };
      return next as Composition;
    });
    
    // 割当後もアクティブ維持（連続変更可能）
  }

  // 編成スロット選択ハンドラー
  function onSelectCompositionSlot(compIdx: CompositionIndex) {
    // 同じ編成スロットを再度タップした場合はアクティブ解除
    if (activeCompositionSlot === compIdx) {
      setActiveCompositionSlot(null);
      return;
    }

    // 異なる編成スロットの場合はスワップ
    if (activeCompositionSlot !== null) {
      swapCompositions(activeCompositionSlot, compIdx);
      return;
    }

    // 通常のアクティブ化
    setActiveCompositionSlot(compIdx);
  }

  // 編成名編集ハンドラー（モーダル表示など）
  function onEditCompositionName(compIdx: CompositionIndex) {
    const newName = prompt(`編成名を編集:`, compositions[compIdx].name);
    if (newName && newName.trim() !== compositions[compIdx].name) {
      updateComposition(compIdx, (c) => ({ ...c, name: newName.trim() }));
    }
  }

  // 兵法書の割り当て機能
  function assignTactic(tacticId: string) {
    if (activeCompositionIndex === null || activeSlotIndex === null || activeTacticIndex === null) return;

    updateComposition(activeCompositionIndex, (c) => {
      const next = { ...c, slots: c.slots.map((s) => ({ ...s })) };
      const tactics = (next.slots[activeSlotIndex].tacticIds ?? ["", "", ""]).slice() as [string, string, string];

      // 新規割当
      tactics[activeTacticIndex] = tacticId;

      next.slots[activeSlotIndex] = { ...next.slots[activeSlotIndex], tacticIds: tactics };
      return next as Composition;
    });

    // 割当後もアクティブ維持（連続変更可能）
  }

  // 参照: 03/3.3 - 武将パレットから武将を割当/スワップ
  function assignWarlord(wId: string) {
    if (activeCompositionIndex === null || activeSlotIndex === null) return;
    
    updateComposition(activeCompositionIndex, (c) => {
      const next = { ...c, slots: c.slots.map((s) => ({ ...s })), warlordIdsFlat: (c.warlordIdsFlat ?? ["", "", ""]).slice() as [string, string, string] };
      const existingIndex = next.slots.findIndex((s) => s.warlordId === wId) as number;
      
      // 参照: 03/2, 03/3.4, CURSOR_CONTEXT.md/12章
      // 同じ編成内に既に配置済みの武将を選択した場合 → スロット全体をスワップ
      // 武将スワップ時は配下（skillIds/tacticIds/notes）も一括で入れ替える
      if (existingIndex !== -1 && existingIndex !== activeSlotIndex) {
        // スロット全体をスワップ（武将+配下データ）
        const a = next.slots[activeSlotIndex];
        const b = next.slots[existingIndex as Index3];
        next.slots[activeSlotIndex] = b;
        next.slots[existingIndex as Index3] = a;
        
        // 検索用フラット配列もスワップ
        const tmp = next.warlordIdsFlat[activeSlotIndex];
        next.warlordIdsFlat[activeSlotIndex] = next.warlordIdsFlat[existingIndex as Index3];
        next.warlordIdsFlat[existingIndex as Index3] = tmp;
        
        return next as Composition;
      }
      
      // 新規割当の場合（参照: 03/3.3）
      const w = warlordById[wId];
      next.slots[activeSlotIndex] = { ...next.slots[activeSlotIndex], warlordId: wId, camp: (w?.camp ?? null) as number | null };
      next.warlordIdsFlat[activeSlotIndex] = wId;
      return next as Composition;
    });
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 grid"
      style={{ gridTemplateRows: `${Math.round(panelRatio * 100)}% 8px calc(${Math.round((1 - panelRatio) * 100)}% - 8px)` }}
      aria-label="composition-builder"
      role="main"
    >
      {/* 上：編成ボード（3編成縦並び、ピンチズーム/パン） */}
      <div className="border-b p-2 overflow-hidden" aria-label="board-area">
        <CompositionBoard
          compositions={compositions}
          warlordById={warlordById}
          ownedWarlords={OWNED_WARLORDS_SPARSE}
          activeCompositionIndex={activeCompositionIndex}
          activeSlotIndex={activeSlotIndex}
          activeSkillIndex={activeSkillIndex}
          skillById={skillById}
          onSelectSkillSlot={(ci, si, sk) => {
            // 同じ戦法スロットを再度タップした場合はアクティブ解除
            if (ci === activeCompositionIndex && si === activeSlotIndex && sk === activeSkillIndex) {
              setActiveCompositionIndex(null);
              setActiveSlotIndex(null);
              setActiveSkillIndex(null);
              return;
            }
            
            // 同じ武将内の戦法スロット間のタップは、アクティブスロット変更のみ（スワップ廃止）
            if (ci === activeCompositionIndex && si === activeSlotIndex && activeSkillIndex !== null) {
              setActiveSkillIndex(sk);
              return;
            }
            
            // 異なる武将または異なるスロットの場合はスワップ
            if (activeCompositionIndex !== null && activeSlotIndex !== null && activeSkillIndex !== null) {
              swapSkillAcrossCompositions(activeCompositionIndex, activeSlotIndex, activeSkillIndex, ci, si, sk);
              // スワップ後はアクティブ解除
              setActiveCompositionIndex(null);
              setActiveSlotIndex(null);
              setActiveSkillIndex(null);
              return;
            }
            
            // 通常のアクティブ化
            setActiveCompositionIndex(ci);
            setActiveSlotIndex(si);
            setActiveSkillIndex(sk);
            setTab("skill");
          }}
          onBackgroundClick={() => {
            // 兵法書スロットがアクティブの場合は兵法書パレット以外をタップでアクティブ解除
            if (activeTacticIndex !== null) {
              setActiveCompositionIndex(null);
              setActiveSlotIndex(null);
              setActiveTacticIndex(null);
            }
            // 戦法スロットがアクティブの場合は戦法パレット以外をタップでアクティブ解除
            else if (activeSkillIndex !== null) {
              setActiveCompositionIndex(null);
              setActiveSlotIndex(null);
              setActiveSkillIndex(null);
            }
            // 武将スロットがアクティブの場合は武将パレット以外をタップでアクティブ解除
            else if (activeCompositionIndex !== null || activeSlotIndex !== null) {
              setActiveCompositionIndex(null);
              setActiveSlotIndex(null);
              setActiveSkillIndex(null);
            }
          }}
          onSelectSlot={(ci, si) => {
            // 兵法書スロットがアクティブのときは、武将スロットへアクティブを移す
            if (activeTacticIndex !== null) {
              setActiveCompositionIndex(ci);
              setActiveSlotIndex(si);
              setActiveTacticIndex(null);
              setTab("warlord");
              return;
            }
            // 戦法スロットがアクティブのときは、武将スロットへアクティブを移す
            if (activeSkillIndex !== null) {
              setActiveCompositionIndex(ci);
              setActiveSlotIndex(si);
              setActiveSkillIndex(null);
              setTab("warlord");
              return;
            }
            
            // 同じスロットを再度タップした場合はアクティブ解除
            if (ci === activeCompositionIndex && si === activeSlotIndex) {
              setActiveCompositionIndex(null);
              setActiveSlotIndex(null);
              setActiveSkillIndex(null);
              return;
            }
            
            // アクティブなスロットがある場合は編成間スワップ
            if (activeCompositionIndex !== null && activeSlotIndex !== null && ci !== activeCompositionIndex) {
              swapAcrossCompositions(activeCompositionIndex, activeSlotIndex, ci, si);
              setActiveCompositionIndex(null);
              setActiveSlotIndex(null);
              setActiveSkillIndex(null);
              return;
            }
            
            // 同じ編成内でのスワップ
            if (activeCompositionIndex !== null && activeSlotIndex !== null && ci === activeCompositionIndex && si !== activeSlotIndex) {
              swapAcrossCompositions(ci, activeSlotIndex, ci, si);
              setActiveCompositionIndex(null);
              setActiveSlotIndex(null);
              setActiveSkillIndex(null);
              return;
            }
            
            // 通常のアクティブ化
            setActiveCompositionIndex(ci);
            setActiveSlotIndex(si);
            setActiveSkillIndex(null);
            setTab("warlord"); // 武将スロット選択時は武将パレットを表示
          }}
          onClearSlot={(ci, si) => {
            clearSlot(ci, si);
          }}
          activeTacticIndex={activeTacticIndex}
          onSelectTacticSlot={(ci, si, tk) => {
            // 同じ兵法書スロットを再度タップした場合はアクティブ解除
            if (ci === activeCompositionIndex && si === activeSlotIndex && tk === activeTacticIndex) {
              setActiveCompositionIndex(null);
              setActiveSlotIndex(null);
              setActiveTacticIndex(null);
              return;
            }

            // 同じ武将内の兵法書スロット間のタップは、アクティブスロット変更のみ
            if (ci === activeCompositionIndex && si === activeSlotIndex && activeTacticIndex !== null) {
              setActiveTacticIndex(tk);
              return;
            }

            // 異なる武将または異なるスロットの場合はスワップ（将来実装）
            // 現在は新規割当のみ
            setActiveCompositionIndex(ci);
            setActiveSlotIndex(si);
            setActiveTacticIndex(tk);
            setTab("tactics");
          }}
          tacticById={tacticById}
          compositionNames={[compositions[0].name, compositions[1].name, compositions[2].name]}
          onEditCompositionName={onEditCompositionName}
          activeCompositionSlot={activeCompositionSlot}
          onSelectCompositionSlot={onSelectCompositionSlot}
        />
      </div>
      {/* スプリッター（上下リサイズバー） */}
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="resize-splitter"
        className="w-full bg-gray-200 hover:bg-gray-300 active:bg-gray-400 cursor-row-resize"
        style={{ touchAction: "none" }}
        onPointerDown={onSplitPointerDown}
        onPointerMove={onSplitPointerMove}
        onPointerUp={onSplitPointerUp}
      />

      {/* 下：パレット */}
      <div className="p-2 overflow-hidden" aria-label="palette-area">
        <div className="h-5 border-b flex items-center px-2">
          <PaletteTabs value={tab} onChange={setTab} />
          <div className="ml-auto text-xs text-gray-500">iPhone 16 Pro想定 402×874</div>
        </div>
        <Suspense fallback={<div className="p-2 text-sm text-gray-400">Loading...</div>}>
          <div className="flex-1 min-h-0 overflow-hidden">
            {tab === "warlord" && (
              <div onClick={(e) => e.stopPropagation()}>
                <WarlordPalette
                  warlords={warlords}
                  onPick={(id) => assignWarlord(id)}
                  ownedWarlords={OWNED_WARLORDS_SPARSE}
                />
              </div>
            )}
            {tab === "skill" && (
              <div onClick={(e) => e.stopPropagation()}>
                <SkillPalette
                  skills={SKILL_LIST_FOR_PALETTE}
                  onPick={(id) => assignSkill(id)}
                />
              </div>
            )}
            {tab === "tactics" && (
              <div onClick={(e) => e.stopPropagation()}>
                <TacticsPalette
                  tactics={TACTICS_LIST_FOR_PALETTE as any}
                  onSelectTactic={(id) => assignTactic(id)}
                />
              </div>
            )}
          </div>
        </Suspense>
      </div>
    </div>
  );
}
