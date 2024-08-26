"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Button } from "@plane/ui";
// helpers
import { findHowManyDaysLeft } from "@/helpers/date-time.helper";
// hooks
import { useInstance, useWorkspace } from "@/hooks/store";
// plane web components
import { ProPlanCloudUpgradeModal } from "@/plane-web/components/license";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

// constants
const MAX_DAYS_LEFT = 4;

export const FreeTrialBanner: FC = observer(() => {
  // hooks
  const { config } = useInstance();
  const { currentWorkspace } = useWorkspace();
  const { currentWorkspaceSubscribedPlanDetail: subscriptionDetail } = useWorkspaceSubscription();

  // states
  const [pricingModalOpen, setPricingModalOpen] = useState(false);

  // derived values
  const daysLeft = findHowManyDaysLeft(subscriptionDetail?.trial_end_date) || 0;

  // validate weather to show the banner or not for the current workspace and subscription details
  if (!currentWorkspace || !subscriptionDetail || !config?.payment_server_base_url) return <></>;
  // validating for offline payment
  if (subscriptionDetail.is_offline_payment || !subscriptionDetail.trial_end_date) return <></>;
  // if the days left is more than the max days left then don't show the banner
  if (daysLeft > MAX_DAYS_LEFT) return <></>;

  return (
    <>
      {/* This modal is intentionally placed inside the condition to avoid unnecessary calls to list product endpoint.  */}
      <ProPlanCloudUpgradeModal
        isOpen={pricingModalOpen}
        handleClose={() => setPricingModalOpen(false)}
        yearlyPlan={false}
      />

      <div className="bg-custom-primary-100/10 text-custom-primary-100 py-2 px-5">
        <div className="relative container mx-auto flex justify-center items-center gap-2">
          <div className="text-sm font-medium">
            Your free trial is ending in {daysLeft} days. When your trial ends, your workspace will downgrade to Free
            and you will lose access to&nbsp;
            <a
              href="https://plane.so/pro"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:font-bold transition-all"
            >
              Pro features
            </a>
            .
          </div>
          <div className="flex-shrink-0">
            <Button variant="outline-primary" size="sm" onClick={() => setPricingModalOpen(true)}>
              Upgrade to Pro
            </Button>
          </div>
        </div>
      </div>
    </>
  );
});
