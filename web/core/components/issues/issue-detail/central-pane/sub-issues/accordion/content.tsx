import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { usePathname } from "next/navigation";
import { TIssue } from "@plane/types";
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { TSubIssueOperations } from "@/components/issues/sub-issues";
import { IssueList } from "@/components/issues/sub-issues/issues-list";
// helpers
import { copyTextToClipboard } from "@/helpers/string.helper";
// hooks
import { useEventTracker, useIssueDetail } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  parentIssueId: string;
  disabled: boolean;
};

type TIssueCrudState = { toggle: boolean; parentIssueId: string | undefined; issue: TIssue | undefined };

export const SubIssuesAccordionContent: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, parentIssueId, disabled } = props;
  // router
  const pathname = usePathname();
  // state
  const [issueCrudState, setIssueCrudState] = useState<{
    create: TIssueCrudState;
    existing: TIssueCrudState;
    update: TIssueCrudState;
    delete: TIssueCrudState;
  }>({
    create: {
      toggle: false,
      parentIssueId: undefined,
      issue: undefined,
    },
    existing: {
      toggle: false,
      parentIssueId: undefined,
      issue: undefined,
    },
    update: {
      toggle: false,
      parentIssueId: undefined,
      issue: undefined,
    },
    delete: {
      toggle: false,
      parentIssueId: undefined,
      issue: undefined,
    },
  });

  // store hooks
  const {
    subIssues: { subIssueHelpersByIssueId, setSubIssueHelpers },
    fetchSubIssues,
    createSubIssues,
    updateSubIssue,
    removeSubIssue,
    deleteSubIssue,
  } = useIssueDetail();
  const { captureIssueEvent } = useEventTracker();

  // helpers
  const subIssueHelpers = subIssueHelpersByIssueId(`${parentIssueId}_root`);

  // operations

  const handleIssueCrudState = (
    key: "create" | "existing" | "update" | "delete",
    _parentIssueId: string | null,
    issue: TIssue | null = null
  ) => {
    setIssueCrudState({
      ...issueCrudState,
      [key]: {
        toggle: !issueCrudState[key].toggle,
        parentIssueId: _parentIssueId,
        issue: issue,
      },
    });
  };

  const subIssueOperations: TSubIssueOperations = useMemo(
    () => ({
      copyText: (text: string) => {
        const originURL = typeof window !== "undefined" && window.location.origin ? window.location.origin : "";
        copyTextToClipboard(`${originURL}/${text}`).then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Link Copied!",
            message: "Issue link copied to clipboard.",
          });
        });
      },
      fetchSubIssues: async (workspaceSlug: string, projectId: string, parentIssueId: string) => {
        try {
          await fetchSubIssues(workspaceSlug, projectId, parentIssueId);
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Error fetching sub-issues",
          });
        }
      },
      addSubIssue: async (workspaceSlug: string, projectId: string, parentIssueId: string, issueIds: string[]) => {
        try {
          await createSubIssues(workspaceSlug, projectId, parentIssueId, issueIds);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Sub-issues added successfully",
          });
        } catch (error) {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Error adding sub-issue",
          });
        }
      },
      updateSubIssue: async (
        workspaceSlug: string,
        projectId: string,
        parentIssueId: string,
        issueId: string,
        issueData: Partial<TIssue>,
        oldIssue: Partial<TIssue> = {},
        fromModal: boolean = false
      ) => {
        try {
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
          await updateSubIssue(workspaceSlug, projectId, parentIssueId, issueId, issueData, oldIssue, fromModal);
          captureIssueEvent({
            eventName: "Sub-issue updated",
            payload: { ...oldIssue, ...issueData, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: Object.keys(issueData).join(","),
              change_details: Object.values(issueData).join(","),
            },
            path: pathname,
          });
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Sub-issue updated successfully",
          });
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
        } catch (error) {
          captureIssueEvent({
            eventName: "Sub-issue updated",
            payload: { ...oldIssue, ...issueData, state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: Object.keys(issueData).join(","),
              change_details: Object.values(issueData).join(","),
            },
            path: pathname,
          });
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Error updating sub-issue",
          });
        }
      },
      removeSubIssue: async (workspaceSlug: string, projectId: string, parentIssueId: string, issueId: string) => {
        try {
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
          await removeSubIssue(workspaceSlug, projectId, parentIssueId, issueId);
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success!",
            message: "Sub-issue removed successfully",
          });
          captureIssueEvent({
            eventName: "Sub-issue removed",
            payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
            updates: {
              changed_property: "parent_id",
              change_details: parentIssueId,
            },
            path: pathname,
          });
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
        } catch (error) {
          captureIssueEvent({
            eventName: "Sub-issue removed",
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            updates: {
              changed_property: "parent_id",
              change_details: parentIssueId,
            },
            path: pathname,
          });
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Error removing sub-issue",
          });
        }
      },
      deleteSubIssue: async (workspaceSlug: string, projectId: string, parentIssueId: string, issueId: string) => {
        try {
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
          await deleteSubIssue(workspaceSlug, projectId, parentIssueId, issueId);
          captureIssueEvent({
            eventName: "Sub-issue deleted",
            payload: { id: issueId, state: "SUCCESS", element: "Issue detail page" },
            path: pathname,
          });
          setSubIssueHelpers(parentIssueId, "issue_loader", issueId);
        } catch (error) {
          captureIssueEvent({
            eventName: "Sub-issue removed",
            payload: { id: issueId, state: "FAILED", element: "Issue detail page" },
            path: pathname,
          });
          setToast({
            type: TOAST_TYPE.ERROR,
            title: "Error!",
            message: "Error deleting issue",
          });
        }
      },
    }),
    [fetchSubIssues, createSubIssues, updateSubIssue, removeSubIssue, deleteSubIssue, setSubIssueHelpers]
  );

  const handleFetchSubIssues = useCallback(async () => {
    if (!subIssueHelpers.issue_visibility.includes(parentIssueId)) {
      setSubIssueHelpers(`${parentIssueId}_root`, "preview_loader", parentIssueId);
      await subIssueOperations.fetchSubIssues(workspaceSlug, projectId, parentIssueId);
      setSubIssueHelpers(`${parentIssueId}_root`, "preview_loader", parentIssueId);
    }
    setSubIssueHelpers(`${parentIssueId}_root`, "issue_visibility", parentIssueId);
  }, [
    parentIssueId,
    projectId,
    setSubIssueHelpers,
    subIssueHelpers.issue_visibility,
    subIssueOperations,
    workspaceSlug,
  ]);

  useEffect(() => {
    handleFetchSubIssues();

    return () => {
      handleFetchSubIssues();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentIssueId]);

  return (
    <>
      {subIssueHelpers.issue_visibility.includes(parentIssueId) && (
        <div className="border border-b-0 border-custom-border-100">
          <IssueList
            workspaceSlug={workspaceSlug}
            projectId={projectId}
            parentIssueId={parentIssueId}
            rootIssueId={parentIssueId}
            spacingLeft={10}
            disabled={!disabled}
            handleIssueCrudState={handleIssueCrudState}
            subIssueOperations={subIssueOperations}
          />
        </div>
      )}
    </>
  );
});
