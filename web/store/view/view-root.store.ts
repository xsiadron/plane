import { action, computed, makeObservable, observable, runInAction } from "mobx";
import set from "lodash/set";
import sortBy from "lodash/sortBy";
import reverse from "lodash/reverse";
// stores
import { RootStore } from "store/root.store";
import { ViewStore } from "./view.store";
// types
import { TViewService } from "services/view/types";
import { TView } from "@plane/types";

export type TLoader = "init-loader" | "mutation-loader" | "submitting" | undefined;

type TViewRootStore = {
  // observables
  loader: TLoader;
  viewMap: Record<string, ViewStore>;
  // computed
  viewIds: string[];
  // helper actions
  viewById: (viewId: string) => ViewStore | undefined;
  // actions
  localViewCreate: (view: TView) => Promise<void>;
  fetch: (_loader?: TLoader) => Promise<void>;
  create: (view: Partial<TView>) => Promise<void>;
  remove: (viewId: string) => Promise<void>;
  duplicate: (viewId: string) => Promise<void>;
};

export class ViewRootStore implements TViewRootStore {
  // observables
  loader: TLoader = "init-loader";
  viewMap: Record<string, ViewStore> = {};

  constructor(private store: RootStore, private service: TViewService, private defaultViews: TView[] = []) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      viewMap: observable,
      // computed
      viewIds: computed,
      // actions
      localViewCreate: action,
      fetch: action,
      create: action,
      remove: action,
      duplicate: action,
    });
  }

  // computed
  get viewIds() {
    const views = Object.values(this.viewMap);
    const localViews = views.filter((view) => view.is_local_view);
    let apiViews = views.filter((view) => !view.is_local_view && !view.is_create);
    apiViews = reverse(sortBy(apiViews, "sort_order"));

    const _viewIds = [...localViews.map((view) => view.id), ...apiViews.map((view) => view.id)];

    return _viewIds as string[];
  }

  // helper actions
  viewById = (viewId: string) => this.viewMap?.[viewId] || undefined;

  // actions
  localViewCreate = async (view: TView) => {
    runInAction(() => {
      if (view.id) set(this.viewMap, [view.id], new ViewStore(this.store, view, this.service));
    });
  };

  fetch = async (_loader: TLoader = "init-loader") => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug) return;

      if (this.defaultViews && this.defaultViews.length > 0)
        runInAction(() => {
          this.defaultViews?.forEach((view) => {
            if (view.id) set(this.viewMap, [view.id], new ViewStore(this.store, view, this.service));
          });
        });

      this.loader = _loader;
      const views = await this.service.fetch(workspaceSlug, projectId);
      if (!views) return;

      runInAction(() => {
        views.forEach((view) => {
          if (view.id) set(this.viewMap, [view.id], new ViewStore(this.store, view, this.service));
        });
        this.loader = undefined;
      });
    } catch {}
  };

  create = async (data: Partial<TView>) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug) return;

      const view = await this.service.create(workspaceSlug, data, projectId);
      if (!view) return;

      runInAction(() => {
        if (view.id) set(this.viewMap, [view.id], new ViewStore(this.store, view, this.service));
      });

      if (data.id) this.remove(data.id);
    } catch {}
  };

  remove = async (viewId: string) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !viewId) return;

      if (this.viewMap?.[viewId] != undefined && !this.viewMap?.[viewId]?.is_create)
        await this.service.remove?.(workspaceSlug, viewId, projectId);

      runInAction(() => {
        delete this.viewMap[viewId];
      });
    } catch {}
  };

  duplicate = async (viewId: string) => {
    try {
      const { workspaceSlug, projectId } = this.store.app.router;
      if (!workspaceSlug || !this.service.duplicate) return;

      const view = await this.service.duplicate(workspaceSlug, viewId, projectId);
      if (!view) return;

      runInAction(() => {
        if (view.id) set(this.viewMap, [view.id], new ViewStore(this.store, view, this.service));
      });
    } catch {}
  };
}
