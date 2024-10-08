import { format, startOfToday } from "date-fns";
import { observer } from "mobx-react";
import { Info, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@plane/editor";
import { IIssueFilterOptions, TCycleProgress } from "@plane/types";
import { Loader } from "@plane/ui";
import { useProjectState } from "@/hooks/store";
import ScopeDelta from "./scope-delta";

type Props = {
  setAreaToHighlight: (area: string) => void;
  data: Partial<TCycleProgress>[] | null;
  plotType: string;
  estimateType: string;
  progressLoader?: boolean;
  handleFiltersUpdate: (key: keyof IIssueFilterOptions, value: string[], redirect?: boolean) => void;
  parentWidth?: number;
};
const states = ["completed", "started", "unstarted", "backlog"];

const Summary = observer((props: Props) => {
  const { setAreaToHighlight, data, plotType, estimateType, progressLoader, handleFiltersUpdate, parentWidth } = props;
  const today = format(startOfToday(), "yyyy-MM-dd");
  const dataToday = data?.find((d) => d.date === today);
  const isBehind =
    dataToday &&
    (plotType === "burndown" ? dataToday.ideal! < dataToday.actual! : dataToday.ideal! > dataToday.actual!);

  // store hooks
  const { groupedProjectStates } = useProjectState();
  const scopeChangeCount = data?.reduce((acc, curr, index, array) => {
    // Skip the first element as there's nothing to compare it with
    if (index === 0) return acc;

    // Compare current scope with the previous scope
    if (curr.scope !== array[index - 1].scope && today >= curr.date!) {
      return acc + 1;
    }

    return acc;
  }, 0);

  const stateGroups = {
    primaryStates: [
      {
        group: `Today’s ideal ${plotType === "burndown" ? "Pending" : "Done"}`,
        key: "ideal",
        color: "indigo-400",
        showBg: false,
        dashed: true,
        borderColor: "border-indigo-400",
      },
      {
        group: plotType === "burndown" ? "Pending" : "Done",
        key: "actual",
        color: "green-500",
        showBg: true,
        borderColor: "border-green-500",
      },
      { group: "Started", key: "started", color: "orange-400", showBg: true, borderColor: "border-orange-400" },
      { group: "Scope", key: "scope", color: "blue-500", showBg: false, borderColor: "border-blue-500" },
    ],
    secondaryStates: [
      { group: "Unstarted", key: "unstarted" },
      { group: "Backlog", key: "backlog" },
    ],
  };

  return (
    <div
      className={cn("py-4 pr-6 md:min-w-[250px]", {
        "md:w-[300px]": parentWidth && parentWidth > 700,
        "md:border-r border-custom-border-200": parentWidth && parentWidth > 620,
      })}
    >
      <div className="text-xs text-custom-text-400 font-medium">Summary of cycle issues</div>
      <div
        className={cn("border-b border-custom-border-200 w-full flex text-red-500 py-2", {
          "text-green-500": !isBehind,
        })}
      >
        {progressLoader ? (
          <Loader.Item width="100px" height="20px" />
        ) : dataToday ? (
          <>
            {isBehind ? <TrendingDown className=" mr-2" /> : <TrendingUp className=" mr-2" />}
            <div className="text-md font-medium  flex-1">
              {isBehind ? "Trailing" : "Leading"} by{" "}
              {Math.round(Math.abs((dataToday?.ideal ?? 0) - (dataToday?.actual ?? 0)))}{" "}
              {Math.abs((dataToday?.ideal ?? 0) - (dataToday?.actual ?? 0)) > 1
                ? estimateType
                : estimateType.slice(0, -1)}
            </div>
            <div className="text-[20px] self-end">🏃</div>
          </>
        ) : (
          <div className={cn("text-md font-medium  text-custom-text-300")}>No Data</div>
        )}
      </div>

      <div className="space-y-1 mt-2 pb-4 border-b border-custom-border-200">
        <div className="flex text-xs text-custom-text-400 font-medium">
          <span className="w-5/6 capitalize">{estimateType.slice(0, -1)} states on chart</span>
          <span className="w-1/6 text-end capitalize">{estimateType}</span>
        </div>
        {stateGroups.primaryStates.map((group, index) => (
          <div
            key={index}
            className="flex text-sm w-full justify-between cursor-pointer p-2 rounded hover:bg-custom-background-90"
            onMouseEnter={() => setAreaToHighlight(group.key)}
            onMouseLeave={() => setAreaToHighlight("")}
            onClick={() => {
              if (groupedProjectStates && states.includes(group.key)) {
                const states = groupedProjectStates[group.key].map((state) => state.id);
                handleFiltersUpdate("state", states, true);
              }
            }}
          >
            <div className="flex">
              <hr
                className={cn(
                  `my-auto border-[1px]  w-[12px] ${group.borderColor} ${group.dashed && "border-dashed"} mr-2`
                )}
              />
              <span className="my-auto">{group.group}</span>
            </div>
            <div className="flex gap-2">
              {group.key === "scope" && <ScopeDelta data={data} dataToday={dataToday} />}
              <span className="text-end font-bold text-custom-text-300">
                {progressLoader ? (
                  <Loader.Item width="20px" height="20px" />
                ) : (
                  <span className={`py-0.5 rounded ${group.showBg && `px-1 text-white bg-${group.color}`}`}>
                    {(dataToday && Math.round(dataToday[group.key as keyof TCycleProgress] as number)) || 0}
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-4 mt-2 pb-4 border-b border-custom-border-200">
        <div className="flex text-xs text-custom-text-400 font-medium">
          <span className="w-5/6">Other {estimateType.slice(0, -1)} states</span>
        </div>
        {stateGroups.secondaryStates.map((group, index) => (
          <div
            className="flex text-sm cursor-pointer"
            key={index}
            onClick={() => {
              if (groupedProjectStates && states.includes(group.key)) {
                const states = groupedProjectStates[group.key].map((state) => state.id);
                handleFiltersUpdate("state", states, true);
              }
            }}
          >
            <span className="w-5/6">{group.group}</span>
            <span className="w-1/6 text-end font-bold text-custom-text-300 flex justify-end">
              {progressLoader ? (
                <Loader.Item width="20px" height="20px" />
              ) : (
                (dataToday && dataToday[group.key as keyof TCycleProgress]) || 0
              )}
            </span>
          </div>
        ))}
      </div>

      <div className="text-xs text-custom-text-400 font-medium flex pt-2 gap-2">
        <Info className="text-xs mt-[2px]" size={12} />
        <div className="flex flex-col space-y-2">
          {progressLoader ? (
            <Loader.Item width="200px" height="20px" />
          ) : (
            <span>
              {dataToday?.cancelled || 0} Cancelled {estimateType} (excluded)
            </span>
          )}
          {progressLoader ? (
            <Loader.Item width="200px" height="20px" />
          ) : (
            <span>
              Scope has changed {scopeChangeCount} {scopeChangeCount === 1 ? "time" : "times"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
export default Summary;
