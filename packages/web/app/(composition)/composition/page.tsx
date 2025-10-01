"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getWarlords } from "@/src/repositories/master";
import { CompositionSchema, type Composition } from "@/src/schema/composition";
import type { Warlord } from "@/src/schema/warlord";
import { db } from "@/lib/dexie";
import { CompositionBoard } from "@/src/ui/composition/CompositionBoard";
import { PaletteTabs } from "@/src/ui/palette/PaletteTabs";
import { WarlordPalette } from "@/src/ui/palette/WarlordPalette";

type Index3 = 0 | 1 | 2;

// TODO: 認証実装後にFirebase AuthからuserIdを取得（参照: 01/4.2, 05/1）
const MOCK_USER_ID = "user_mock_001";

// サンプル資産データ（参照: 06/3.2.2 - 疎Map形式、未所持はキー無し）
// NOTE: temp/assets_ownedWarlords.json の ownedWarlords_sparse を使用
const SAMPLE_OWNED_WARLORDS: Record<string, number> = {
  "w_002": 1, "w_004": 2, "w_007": 3, "w_012": 4, "w_021": 5, "w_022": 6,
  "w_023": 1, "w_024": 2, "w_036": 3, "w_037": 4, "w_038": 5, "w_039": 6,
  "w_040": 1, "w_041": 2, "w_042": 3, "w_048": 4, "w_050": 5, "w_054": 6,
  "w_059": 1, "w_061": 2, "w_065": 3, "w_069": 4, "w_075": 5, "w_080": 6,
  "w_082": 1, "w_087": 2, "w_089": 3, "w_093": 4, "w_098": 5, "w_101": 6,
  "w_104": 1, "w_108": 2, "w_116": 3, "w_121": 4, "w_125": 5,
};

export default function CompositionPage() {
  const [tab, setTab] = useState<"warlord" | "skill" | "tactics">("warlord");
  const { data: warlords = [] } = useQuery({ queryKey: ["warlords"], queryFn: getWarlords });
  const warlordById: Record<string, Warlord> = useMemo(
    () => Object.fromEntries(warlords.map((w) => [w.id, w] as const)),
    [warlords]
  );

  const emptySlot = useMemo(
    () => ({ warlordId: null, camp: null, skillIds: ["", ""], tacticIds: ["", "", ""], notes: { attr: "", equipSkill: "", memo: "" } }),
    []
  );

  // 参照: 06/3.2.3 Composition スキーマに準拠
  const [compositions, setCompositions] = useState<[Composition, Composition]>(() => [
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
  ]);

  // 一時的な互換用State（新Store構造への移行はフェーズ2で完全対応）
  const [activeCompositionIndex, setActiveCompositionIndex] = useState<0 | 1>(0);
  const [activeSlotIndex, setActiveSlotIndex] = useState<Index3>(0);

  // 参照: 03/11.3 IndexedDBへの自動保存（500ms debounce）
  useEffect(() => {
    const h = setTimeout(() => {
      void db.drafts.put({ id: "composition_pair_current", data: compositions, updatedAt: Date.now() });
    }, 500);
    return () => clearTimeout(h);
  }, [compositions]);

  function updateComposition(mut: (c: Composition) => Composition) {
    setCompositions((cs) => {
      const next = [...cs] as [Composition, Composition];
      next[activeCompositionIndex] = mut(next[activeCompositionIndex]);
      return next;
    });
  }

  // 参照: 03/3.5 - 武将スロットのクリアは確認ダイアログ
  function clearSlot(i: Index3) {
    const slot = compositions[activeCompositionIndex].slots[i];
    const warlord = slot?.warlordId ? warlordById[slot.warlordId] : null;
    
    if (warlord && !confirm(`${warlord.name} と配下の戦法/兵法書/メモを一括削除しますか？`)) {
      return;
    }
    
    updateComposition((c) => {
      const next = { ...c, slots: c.slots.map((s) => ({ ...s })), warlordIdsFlat: (c.warlordIdsFlat ?? ["", "", ""]).slice() as [string, string, string] };
      next.slots[i] = { ...emptySlot };
      next.warlordIdsFlat[i] = "";
      return next as Composition;
    });
  }

  // 参照: 03/3.3 - 武将パレットから武将を割当/スワップ
  function assignWarlord(wId: string, activeIndex: Index3) {
    updateComposition((c) => {
      const next = { ...c, slots: c.slots.map((s) => ({ ...s })), warlordIdsFlat: (c.warlordIdsFlat ?? ["", "", ""]).slice() as [string, string, string] };
      const existingIndex = next.slots.findIndex((s) => s.warlordId === wId) as number;
      
      // 参照: 03/2, 03/3.4, CURSOR_CONTEXT.md/12章
      // 同じ編成内に既に配置済みの武将を選択した場合 → スロット全体をスワップ
      // 武将スワップ時は配下（skillIds/tacticIds/notes）も一括で入れ替える
      if (existingIndex !== -1 && existingIndex !== activeIndex) {
        // スロット全体をスワップ（武将+配下データ）
        const a = next.slots[activeIndex];
        const b = next.slots[existingIndex as Index3];
        next.slots[activeIndex] = b;
        next.slots[existingIndex as Index3] = a;
        
        // 検索用フラット配列もスワップ
        const tmp = next.warlordIdsFlat[activeIndex];
        next.warlordIdsFlat[activeIndex] = next.warlordIdsFlat[existingIndex as Index3];
        next.warlordIdsFlat[existingIndex as Index3] = tmp;
        
        return next as Composition;
      }
      
      // 新規割当の場合（参照: 03/3.3）
      const w = warlordById[wId];
      next.slots[activeIndex] = { ...next.slots[activeIndex], warlordId: wId, camp: (w?.camp ?? null) as number | null };
      next.warlordIdsFlat[activeIndex] = wId;
      return next as Composition;
    });
  }

  // 参照: 03/3.4 - 編成ボード内で武将スロット同士をタップでスワップ
  function swapWarlordSlots(targetIndex: Index3) {
    const currentSlot = compositions[activeCompositionIndex].slots[activeSlotIndex];
    const targetSlot = compositions[activeCompositionIndex].slots[targetIndex];
    
    // どちらか一方でも武将が配置されていればスワップ実行（片方が空白でもOK）
    if (currentSlot?.warlordId || targetSlot?.warlordId) {
      updateComposition((c) => {
        const next = { ...c, slots: c.slots.map((s) => ({ ...s })), warlordIdsFlat: (c.warlordIdsFlat ?? ["", "", ""]).slice() as [string, string, string] };
        
        // スロット全体をスワップ（武将+配下データ）
        const a = next.slots[activeSlotIndex];
        const b = next.slots[targetIndex];
        next.slots[activeSlotIndex] = b;
        next.slots[targetIndex] = a;
        
        // 検索用フラット配列もスワップ
        const tmp = next.warlordIdsFlat[activeSlotIndex];
        next.warlordIdsFlat[activeSlotIndex] = next.warlordIdsFlat[targetIndex];
        next.warlordIdsFlat[targetIndex] = tmp;
        
        return next as Composition;
      });
    }
  }

  return (
    <div className="h-[calc(100vh-100px)] grid grid-rows-[2fr_1fr]" aria-label="composition-builder" role="main">
      {/* 上：編成ボード（2編成横並び、ピンチズーム/パン） */}
      <div className="border-b p-2 overflow-hidden" aria-label="board-area">
        <CompositionBoard
          compositions={compositions}
          warlordById={warlordById}
          ownedWarlords={SAMPLE_OWNED_WARLORDS}
          activeCompositionIndex={activeCompositionIndex}
          activeSlotIndex={activeSlotIndex}
          onSelectSlot={(ci, si) => {
            // 同じスロットを再度タップした場合は何もしない（アクティブ解除）
            if (ci === activeCompositionIndex && si === activeSlotIndex) {
              return;
            }
            setActiveCompositionIndex(ci);
            setActiveSlotIndex(si);
          }}
          onSwapSlots={(ci, ti) => {
            // 参照: 03/3.4 - 編成ボード内でのスワップは同じ編成内のみ
            if (ci === activeCompositionIndex) {
              swapWarlordSlots(ti);
            }
          }}
          onClearSlot={(ci, si) => {
            // 参照: 03/3.5 - クリアボタン
            if (ci === activeCompositionIndex) {
              clearSlot(si);
            }
          }}
        />
      </div>
      {/* 下：武将パレット */}
      <div className="p-2 overflow-hidden" aria-label="palette-area">
        <div className="h-10 border-b flex items-center px-2">
          <PaletteTabs value={tab} onChange={setTab} />
          <div className="ml-auto text-xs text-gray-500">iPhone 16 Pro想定 402×874</div>
        </div>
        <Suspense fallback={<div className="p-2 text-sm text-gray-400">Loading...</div>}>
          <div className="h-[calc(100%-40px)] overflow-hidden">
            {tab === "warlord" && (
              <WarlordPalette
                warlords={warlords}
                onPick={(id) => assignWarlord(id, activeSlotIndex as Index3)}
                ownedWarlords={SAMPLE_OWNED_WARLORDS}
              />
            )}
            {tab !== "warlord" && <div className="p-3 text-sm text-gray-500">このタブはMVPで後続対応</div>}
          </div>
        </Suspense>
      </div>
    </div>
  );
}

