import { AlertCircle } from "lucide-react";
import { TIssueOrderByOptions } from "@plane/types";
import { ISSUE_ORDER_BY_OPTIONS } from "@/constants/issue";
import { cn } from "@/helpers/common.helper";

type Props = {
  dragColumnOrientation: "justify-start" | "justify-center" | "justify-end";
  canOverlayBeVisible: boolean;
  isDropDisabled: boolean;
  dropErrorMessage?: string;
  orderBy?: TIssueOrderByOptions | undefined;
  isDraggingOverColumn: boolean;
};

export const GroupDragOverlay = (props: Props) => {
  const {
    dragColumnOrientation,
    canOverlayBeVisible,
    isDropDisabled,
    dropErrorMessage,
    orderBy,
    isDraggingOverColumn,
  } = props;

  const shouldOverlayBeVisible = isDraggingOverColumn && canOverlayBeVisible;
  const readableOrderBy = orderBy && ISSUE_ORDER_BY_OPTIONS.find((orderByObj) => orderByObj.key === orderBy)?.title;

  return (
    <div
      className={cn(
        `absolute top-0 left-0 h-full w-full items-center text-sm font-medium text-custom-text-300 rounded bg-custom-background-overlay ${dragColumnOrientation}`,
        {
          "flex flex-col border-[1px] border-custom-border-300 z-[2]": shouldOverlayBeVisible,
        },
        { hidden: !shouldOverlayBeVisible }
      )}
    >
      <div
        className={cn(
          "p-3 my-8 flex flex-col rounded items-center",
          {
            "text-custom-text-200": shouldOverlayBeVisible,
          },
          {
            "text-custom-text-error": isDropDisabled,
          }
        )}
      >
        {dropErrorMessage ? (
          <div className="flex items-center">
            <AlertCircle width={13} height={13} /> &nbsp;
            <span>{dropErrorMessage}</span>
          </div>
        ) : (
          <>
            {readableOrderBy && (
              <span>
                The layout is ordered by <span className="font-semibold">{readableOrderBy}</span>.
              </span>
            )}
            <span>Drop here to move the project.</span>
          </>
        )}
      </div>
    </div>
  );
};
