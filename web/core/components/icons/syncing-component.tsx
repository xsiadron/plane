import { RefreshCcw } from "lucide-react";
import { Tooltip } from "@plane/ui";

export const SyncingComponent = (props: { toolTipContent?: string }) => {
  const { toolTipContent } = props;
  const lockedComponent = (
    <div className="flex-shrink-0 flex h-7 items-center gap-2 rounded-full bg-custom-background-80 px-3 py-0.5 text-xs font-medium text-custom-text-300">
      <RefreshCcw className="h-3 w-3" />
      <span>Syncing</span>
    </div>
  );

  return (
    <>
      {toolTipContent ? <Tooltip tooltipContent={toolTipContent}>{lockedComponent}</Tooltip> : <>{lockedComponent}</>}
    </>
  );
};
