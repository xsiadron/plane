"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Check } from "lucide-react";
// types
import { IPaymentProduct, IPaymentProductPrice } from "@plane/types";
// ui
import { Button, Loader, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { cn } from "@/helpers/common.helper";
// services
import { WorkspaceService } from "@/plane-web/services";
import { PaymentService } from "@/plane-web/services/payment.service";

const paymentService = new PaymentService();
const workspaceService = new WorkspaceService();

const calculateYearlyDiscount = (monthlyPrice: number, yearlyPricePerMonth: number): number => {
  const monthlyCost = monthlyPrice * 12;
  const yearlyCost = yearlyPricePerMonth * 12;
  const amountSaved = monthlyCost - yearlyCost;
  const discountPercentage = (amountSaved / monthlyCost) * 100;
  return Math.floor(discountPercentage);
};

const renderPlanPricing = (price: number, members: number = 1, recurring: string) => {
  if (recurring === "month") return ((price / 100) * members).toFixed(0);
  if (recurring === "year") return ((price / 1200) * members).toFixed(0);
};

const CloudUpgradePlanPage = observer(() => {
  // states
  const [selectedPlan, setSelectedPlan] = useState<IPaymentProductPrice | null>(null);
  const [isLoading, setLoading] = useState(false);
  // router

  const { selectedWorkspace: workspaceSlug } = useParams();

  // fetch workspace members
  const { data: workspaceMembers, isLoading: isFetching } = useSWR(
    workspaceSlug ? `CLOUD_PRO_WORKSPACE_MEMBER_DETAILS` : null,
    workspaceSlug ? () => workspaceService.fetchWorkspaceMembers(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // fetch products
  const { data: products, isLoading: isLoadingProduct } = useSWR(
    workspaceSlug ? "CLOUD_PRO_PRODUCTS" : null,
    workspaceSlug ? () => paymentService.listProducts(workspaceSlug.toString()) : null,
    {
      errorRetryCount: 2,
      revalidateIfStale: false,
      revalidateOnFocus: false,
    }
  );

  // fetch workspace current plan
  const { data: workspaceSubscription, isLoading: workspaceSubscriptionLoading } = useSWR(
    workspaceSlug ? `CLOUD_PRO_WORKSPACE_SUBSCRIPTION_PLAN_${workspaceSlug}` : null,
    workspaceSlug ? () => paymentService.getWorkspaceCurrentPlan(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  // derived values
  const totalWorkspaceMembers = (workspaceMembers || [])?.filter((member) => member.role >= 15)?.length;
  const proProduct = (products || [])?.find((product: IPaymentProduct) => product?.type === "PRO");

  const monthlyPlan = proProduct?.prices?.find((price) => price.recurring === "month");
  const yearlyPlan = proProduct?.prices?.find((price) => price.recurring === "year");

  const monthlyPlanUnitPrice = (monthlyPlan?.unit_amount || 0) / 100;
  const yearlyPlanUnitPrice = (yearlyPlan?.unit_amount || 0) / 1200;

  const yearlyDiscountedPrice = calculateYearlyDiscount(monthlyPlanUnitPrice, yearlyPlanUnitPrice);

  const workspaceOnTrial =
    workspaceSubscription?.has_activated_free_trial && workspaceSubscription?.trial_end_date ? true : false;

  const handleStripeCheckout = (priceId: string) => {
    if (!workspaceSlug) {
      setToast({
        type: TOAST_TYPE.INFO,
        title: "Please select a workspace to continue",
      });
      return;
    }
    setLoading(true);
    paymentService
      .getCurrentWorkspacePaymentLink(workspaceSlug.toString(), {
        price_id: priceId,
        product_id: proProduct?.id,
      })
      .then((response) => {
        if (response.payment_link) {
          window.open(response.payment_link, "_self");
        }
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.detail ?? "Failed to generate payment link. Please try again.",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleTrialStripeCheckout = (priceId: string) => {
    if (!workspaceSlug) {
      setToast({
        type: TOAST_TYPE.INFO,
        title: "Please select a workspace to continue",
      });
      return;
    }
    setLoading(true);
    paymentService
      .modifyTrailSubscription(workspaceSlug.toString(), {
        price_id: priceId,
      })
      .then((response) => {
        if (response.session_url) {
          window.open(response.session_url, "_self");
        }
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.detail ?? "Failed to generate payment link. Please try again.",
        });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
      <div className="flex flex-col items-center gap-2 pb-4">
        <div className="text-3xl font-semibold">Choose your billing frequency</div>
        {yearlyDiscountedPrice && (
          <div className="text-center text-base text-custom-text-300">{`Upgrade to our yearly plan and get ${Math.round(yearlyDiscountedPrice)}% off.`}</div>
        )}
      </div>

      {isFetching || isLoadingProduct || workspaceSubscriptionLoading ? (
        <div className="flex flex-col rounded gap-1 w-full">
          <Loader.Item height="90px" />
          <Loader.Item height="90px" />
        </div>
      ) : (
        <div className="flex flex-col rounded w-full">
          {proProduct &&
            proProduct.prices.map((plan) => (
              <div
                key={plan.unit_amount}
                className={cn(
                  "flex items-center justify-between gap-6 border-x border border-custom-border-200 cursor-pointer rounded py-6 px-4 first:rounded-b-none last:rounded-t-none",
                  {
                    "border  border-custom-primary-100": plan.recurring === selectedPlan?.recurring,
                  }
                )}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={cn("flex items-center justify-center size-6 rounded-full", {
                      "bg-custom-primary-100 text-white": plan.recurring === selectedPlan?.recurring,
                      "border border-custom-border-200": plan.recurring !== selectedPlan?.recurring,
                    })}
                  >
                    {plan.recurring === selectedPlan?.recurring && <Check className="size-4 stroke-2" />}
                  </span>
                  <div className="flex flex-col">
                    {totalWorkspaceMembers && (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-semibold leading-7">
                          ${renderPlanPricing(plan.unit_amount, 1, plan.recurring)}
                        </span>
                        <span className="text-sm text-custom-text-300">
                          {` per user per ${plan.recurring} x ${totalWorkspaceMembers}`}
                        </span>
                      </div>
                    )}
                    <span className="text-sm text-custom-text-300">
                      {`Billed ${plan.recurring === "month" ? "monthly" : "yearly"}`}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col text-right">
                  {totalWorkspaceMembers && (
                    <span className="text-2xl font-semibold leading-7">
                      ${renderPlanPricing(plan.unit_amount, totalWorkspaceMembers, plan.recurring)}
                    </span>
                  )}
                  <span className="text-sm text-custom-text-300">
                    {plan.recurring === "month" ? "per month" : "per year"}
                  </span>
                </div>
              </div>
            ))}
        </div>
      )}

      {selectedPlan?.recurring && selectedPlan.unit_amount ? (
        <>
          <Button
            className="w-full px-2 my-4"
            onClick={() =>
              workspaceOnTrial ? handleTrialStripeCheckout(selectedPlan.id) : handleStripeCheckout(selectedPlan.id)
            }
          >
            {isLoading
              ? "Redirecting to Stripe..."
              : `Pay $${renderPlanPricing(selectedPlan.unit_amount, totalWorkspaceMembers, selectedPlan.recurring)} every ${selectedPlan?.recurring}`}
          </Button>
        </>
      ) : (
        <>
          <Button className="w-full px-2 my-4" disabled>{`Select a plan to continue`}</Button>
        </>
      )}
    </div>
  );
});

export default CloudUpgradePlanPage;
