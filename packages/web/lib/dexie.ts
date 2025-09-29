import Dexie, { Table } from "dexie";

export interface Draft { id:string; data:any; updatedAt:number; }
export interface ViewState { id:"global"; scale:number; panX:number; panY:number; ownershipAware:boolean; }
export interface MasterCache { key:"warlords"|"skills"|"tactics"; payload:any; etag?:string; updatedAt:number; }

export class AppDB extends Dexie {
  drafts!: Table<Draft, string>;
  viewState!: Table<ViewState, string>;
  masterCache!: Table<MasterCache, string>;
  constructor() {
    super("shinsen_db");
    this.version(1).stores({
      drafts: "id, updatedAt",
      viewState: "id",
      masterCache: "key, updatedAt",
    });
  }
}
export const db = new AppDB();