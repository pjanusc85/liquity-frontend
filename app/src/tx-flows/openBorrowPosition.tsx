import type { FlowDeclaration } from "@/src/services/TransactionFlow";

import { Amount } from "@/src/comps/Amount/Amount";
import { ETH_GAS_COMPENSATION } from "@/src/constants";
import { dnum18 } from "@/src/dnum-utils";
import { fmtnum } from "@/src/formatting";
import { useDelegateDisplayName } from "@/src/liquity-delegate";
import {
  getBranch,
  getCollToken,
  getTroveOperationHints,
  useInterestBatchDelegate,
  usePredictOpenTroveUpfrontFee,
} from "@/src/liquity-utils";
import { AccountButton } from "@/src/screens/TransactionsScreen/AccountButton";
import { LoanCard } from "@/src/screens/TransactionsScreen/LoanCard";
import { TransactionDetailsRow } from "@/src/screens/TransactionsScreen/TransactionsScreen";
import { TransactionStatus } from "@/src/screens/TransactionsScreen/TransactionStatus";
import { usePrice } from "@/src/services/Prices";
import { getIndexedTroveById } from "@/src/subgraph";
import { sleep } from "@/src/utils";
import { vAddress, vBranchId, vDnum } from "@/src/valibot-utils";
import { css } from "@/styled-system/css";
import { ADDRESS_ZERO, InfoTooltip } from "@liquity2/uikit";
import * as dn from "dnum";
import * as v from "valibot";
import { maxUint256, parseEventLogs } from "viem";
import { readContract } from "wagmi/actions";
import { createRequestSchema, verifyTransaction } from "./shared";

const RequestSchema = createRequestSchema(
  "openBorrowPosition",
  {
    branchId: vBranchId(),
    owner: vAddress(),
    ownerIndex: v.number(),
    collAmount: vDnum(),
    boldAmount: vDnum(),
    annualInterestRate: vDnum(),
    maxUpfrontFee: vDnum(),
    interestRateDelegate: v.union([v.null(), vAddress()]),
  },
);

export type OpenBorrowPositionRequest = v.InferOutput<typeof RequestSchema>;

export const openBorrowPosition: FlowDeclaration<OpenBorrowPositionRequest> = {
  title: "Review & Send Transaction",

  Summary({ request }) {
    const upfrontFee = usePredictOpenTroveUpfrontFee(
      request.branchId,
      request.boldAmount,
      request.interestRateDelegate ?? request.annualInterestRate,
    );

    const boldAmountWithFee = upfrontFee.data && dn.add(
      request.boldAmount,
      upfrontFee.data,
    );

    return (
      <LoanCard
        leverageMode={false}
        loadingState="success"
        loan={{
          type: "borrow",
          status: "active",
          troveId: null,
          borrower: request.owner,
          batchManager: request.interestRateDelegate,
          borrowed: boldAmountWithFee ?? dnum18(0),
          branchId: request.branchId,
          deposit: request.collAmount,
          interestRate: request.annualInterestRate,
        }}
        onRetry={() => {}}
        txPreviewMode
      />
    );
  },

  Details({ request }) {
    const collateral = getCollToken(request.branchId);
    const collPrice = usePrice(collateral.symbol);

    const upfrontFee = usePredictOpenTroveUpfrontFee(
      request.branchId,
      request.boldAmount,
      request.interestRateDelegate ?? request.annualInterestRate,
    );

    const boldAmountWithFee = upfrontFee.data && dn.add(
      request.boldAmount,
      upfrontFee.data,
    );

    const { branchId, interestRateDelegate, boldAmount } = request;
    const delegate = useInterestBatchDelegate(branchId, interestRateDelegate);
    const delegateDisplayName = useDelegateDisplayName(interestRateDelegate);
    const yearlyBoldInterest = dn.mul(
      boldAmount,
      dn.add(request.annualInterestRate, delegate.data?.fee ?? 0),
    );

    return collateral && (
      <>
        <TransactionDetailsRow
          label="Collateral"
          value={[
            `${fmtnum(request.collAmount)} ${collateral.name}`,
            <Amount
              key="end"
              fallback="…"
              prefix="$"
              value={collPrice.data && dn.mul(request.collAmount, collPrice.data)}
            />,
          ]}
        />
        <TransactionDetailsRow
          label="Loan"
          value={[
            <Amount
              key="start"
              fallback="…"
              value={boldAmountWithFee}
              suffix=" BOLD"
            />,
            <div
              key="end"
              className={css({
                display: "flex",
                alignItems: "center",
                gap: 4,
              })}
            >
              <Amount
                fallback="…"
                prefix="Incl. "
                value={upfrontFee.data}
                suffix=" BOLD creation fee"
              />
              <InfoTooltip heading="BOLD creation fee">
                This fee is charged when you open a new loan or increase your debt. It corresponds to 7 days of average
                interest for the respective collateral asset.
              </InfoTooltip>
            </div>,
          ]}
        />
        {request.interestRateDelegate
          ? (
            <TransactionDetailsRow
              label="Interest rate delegate"
              value={[
                <AccountButton
                  key="start"
                  address={request.interestRateDelegate}
                  displayName={delegateDisplayName}
                />,
                <div key="end">
                  {delegate.isLoading
                    ? "Loading…"
                    : (
                      <>
                        <Amount
                          value={request.annualInterestRate}
                          format="pct2z"
                          percentage
                        />{" "}
                        <Amount
                          percentage
                          format="pct2"
                          prefix="+ "
                          suffix="% delegate fee"
                          fallback="…"
                          value={delegate.data?.fee}
                        />
                        <br />
                        <Amount
                          format="2z"
                          prefix="~"
                          suffix=" BOLD per year"
                          value={yearlyBoldInterest}
                        />
                      </>
                    )}
                </div>,
              ]}
            />
          )
          : (
            <TransactionDetailsRow
              label="Interest rate"
              value={[
                <Amount
                  key="start"
                  value={request.annualInterestRate}
                  percentage
                />,
                <Amount
                  key="end"
                  fallback="…"
                  value={boldAmountWithFee && dn.mul(
                    boldAmountWithFee,
                    request.annualInterestRate,
                  )}
                  suffix=" BOLD per year"
                />,
              ]}
            />
          )}
        <TransactionDetailsRow
          label="Refundable gas deposit"
          value={[
            <div
              key="start"
              title={`${fmtnum(ETH_GAS_COMPENSATION, "full")} ETH`}
            >
              {fmtnum(ETH_GAS_COMPENSATION, 4)} ETH
            </div>,
            "Only used in case of liquidation",
          ]}
        />
      </>
    );
  },

  steps: {
    // Approve LST (for zapper)
    approveLst: {
      name: (ctx) => {
        const branch = getBranch(ctx.request.branchId);
        return `Approve ${branch.symbol}`;
      },
      Status: (props) => (
        <TransactionStatus
          {...props}
          approval="approve-only"
        />
      ),
      async commit(ctx) {
        const branch = getBranch(ctx.request.branchId);
        const { LeverageLSTZapper, CollToken } = branch.contracts;

        return ctx.writeContract({
          ...CollToken,
          functionName: "approve",
          args: [
            LeverageLSTZapper.address,
            ctx.preferredApproveMethod === "approve-infinite"
              ? maxUint256 // infinite approval
              : ctx.request.collAmount[0], // exact amount
          ],
        });
      },
      async verify(ctx, hash) {
        await verifyTransaction(ctx.wagmiConfig, hash, ctx.isSafe);
      },
    },

    // Approve collateral for BorrowerOperations (cbBTC and other non-ETH collaterals)
    approveBorrowerOps: {
      name: (ctx) => {
        const branch = getBranch(ctx.request.branchId);
        return `Approve ${branch.symbol}`;
      },
      Status: (props) => (
        <TransactionStatus
          {...props}
          approval="approve-only"
        />
      ),
      async commit(ctx) {
        const branch = getBranch(ctx.request.branchId);
        const { BorrowerOperations, CollToken } = branch.contracts;

        return ctx.writeContract({
          ...CollToken,
          functionName: "approve",
          args: [
            BorrowerOperations.address,
            ctx.preferredApproveMethod === "approve-infinite"
              ? maxUint256 // infinite approval
              : ctx.request.collAmount[0], // exact amount
          ],
        });
      },
      async verify(ctx, hash) {
        await verifyTransaction(ctx.wagmiConfig, hash, ctx.isSafe);
      },
    },

    // Approve WETH for gas compensation (required for all non-ETH collaterals using BorrowerOperations)
    approveWethForGas: {
      name: () => "Approve WETH for gas deposit",
      Status: (props) => (
        <TransactionStatus
          {...props}
          approval="approve-only"
        />
      ),
      async commit(ctx) {
        const branch = getBranch(ctx.request.branchId);
        const { BorrowerOperations } = branch.contracts;

        return ctx.writeContract({
          ...ctx.contracts.WETH,
          functionName: "approve",
          args: [
            BorrowerOperations.address,
            ctx.preferredApproveMethod === "approve-infinite"
              ? maxUint256 // infinite approval
              : ETH_GAS_COMPENSATION[0], // exact amount (0.0375 ETH worth of WETH)
          ],
        });
      },
      async verify(ctx, hash) {
        await verifyTransaction(ctx.wagmiConfig, hash, ctx.isSafe);
      },
    },

    // LeverageLSTZapper mode
    openTroveLst: {
      name: () => "Open Position",
      Status: TransactionStatus,

      async commit(ctx) {
        const { upperHint, lowerHint } = await getTroveOperationHints({
          wagmiConfig: ctx.wagmiConfig,
          contracts: ctx.contracts,
          branchId: ctx.request.branchId,
          interestRate: ctx.request.annualInterestRate[0],
        });

        const branch = getBranch(ctx.request.branchId);
        return ctx.writeContract({
          ...branch.contracts.LeverageLSTZapper,
          functionName: "openTroveWithRawETH" as const,
          args: [{
            owner: ctx.request.owner,
            ownerIndex: BigInt(ctx.request.ownerIndex),
            collAmount: ctx.request.collAmount[0],
            boldAmount: ctx.request.boldAmount[0],
            upperHint,
            lowerHint,
            annualInterestRate: ctx.request.interestRateDelegate
              ? 0n
              : ctx.request.annualInterestRate[0],
            batchManager: ctx.request.interestRateDelegate
              ? ctx.request.interestRateDelegate
              : ADDRESS_ZERO,
            maxUpfrontFee: ctx.request.maxUpfrontFee[0],
            addManager: ADDRESS_ZERO,
            removeManager: ADDRESS_ZERO,
            receiver: ADDRESS_ZERO,
          }],
          value: ETH_GAS_COMPENSATION[0],
        });
      },

      async verify(ctx, hash) {
        const receipt = await verifyTransaction(ctx.wagmiConfig, hash, ctx.isSafe);

        // extract trove ID from logs
        const branch = getBranch(ctx.request.branchId);
        const [troveOperation] = parseEventLogs({
          abi: branch.contracts.TroveManager.abi,
          logs: receipt.logs,
          eventName: "TroveOperation",
        });

        if (!troveOperation?.args?._troveId) {
          throw new Error("Failed to extract trove ID from transaction");
        }

        // wait for the trove to appear in the subgraph with retry limit
        const maxRetries = 10;
        let retries = 0;
        while (retries < maxRetries) {
          try {
            const trove = await getIndexedTroveById(
              branch.branchId,
              `0x${troveOperation.args._troveId.toString(16)}`,
            );
            if (trove !== null) {
              break;
            }
          } catch (error) {
            // If subgraph is failing (e.g., rate limited), log but continue after max retries
            console.warn(`Subgraph query failed (attempt ${retries + 1}/${maxRetries}):`, error);
            if (retries === maxRetries - 1) {
              console.warn("Max retries reached. Transaction was successful but subgraph indexing may be delayed.");
              // Transaction was successful on-chain, so we can safely proceed
              break;
            }
          }
          retries++;
          await sleep(2000); // Wait 2 seconds between retries
        }
      },
    },

    // LeverageWETHZapper mode
    openTroveEth: {
      name: () => "Open Position",
      Status: TransactionStatus,

      async commit(ctx) {
        const { upperHint, lowerHint } = await getTroveOperationHints({
          wagmiConfig: ctx.wagmiConfig,
          contracts: ctx.contracts,
          branchId: ctx.request.branchId,
          interestRate: ctx.request.annualInterestRate[0],
        });

        const branch = getBranch(ctx.request.branchId);
        return ctx.writeContract({
          ...branch.contracts.LeverageWETHZapper,
          functionName: "openTroveWithRawETH",
          args: [{
            owner: ctx.request.owner,
            ownerIndex: BigInt(ctx.request.ownerIndex),
            collAmount: 0n,
            boldAmount: ctx.request.boldAmount[0],
            upperHint,
            lowerHint,
            annualInterestRate: ctx.request.interestRateDelegate
              ? 0n
              : ctx.request.annualInterestRate[0],
            batchManager: ctx.request.interestRateDelegate
              ? ctx.request.interestRateDelegate
              : ADDRESS_ZERO,
            maxUpfrontFee: ctx.request.maxUpfrontFee[0],
            addManager: ADDRESS_ZERO,
            removeManager: ADDRESS_ZERO,
            receiver: ADDRESS_ZERO,
          }],
          value: ctx.request.collAmount[0] + ETH_GAS_COMPENSATION[0],
        });
      },

      async verify(...args) {
        // same verification as openTroveLst
        return openBorrowPosition.steps.openTroveLst?.verify(...args);
      },
    },

    // BorrowerOperations direct mode (for cbBTC)
    openTroveDirectBatch: {
      name: () => "Open Position",
      Status: TransactionStatus,

      async commit(ctx) {
        const { upperHint, lowerHint } = await getTroveOperationHints({
          wagmiConfig: ctx.wagmiConfig,
          contracts: ctx.contracts,
          branchId: ctx.request.branchId,
          interestRate: ctx.request.annualInterestRate[0],
        });

        const branch = getBranch(ctx.request.branchId);

        return ctx.writeContract({
          ...branch.contracts.BorrowerOperations,
          functionName: "openTroveAndJoinInterestBatchManager",
          args: [{
            owner: ctx.request.owner,
            ownerIndex: BigInt(ctx.request.ownerIndex),
            collAmount: ctx.request.collAmount[0],
            boldAmount: ctx.request.boldAmount[0],
            upperHint,
            lowerHint,
            interestBatchManager: ctx.request.interestRateDelegate ?? ADDRESS_ZERO,
            maxUpfrontFee: ctx.request.maxUpfrontFee[0],
            addManager: ADDRESS_ZERO,
            removeManager: ADDRESS_ZERO,
            receiver: ADDRESS_ZERO,
          }],
          // No ETH value - gas compensation is handled via WETH.transferFrom
        });
      },

      async verify(...args) {
        // same verification as openTroveLst
        return openBorrowPosition.steps.openTroveLst?.verify(...args);
      },
    },

    // BorrowerOperations direct mode without batch (for cbBTC)
    openTroveDirectNoBatch: {
      name: () => "Open Position",
      Status: TransactionStatus,

      async commit(ctx) {
        const { upperHint, lowerHint } = await getTroveOperationHints({
          wagmiConfig: ctx.wagmiConfig,
          contracts: ctx.contracts,
          branchId: ctx.request.branchId,
          interestRate: ctx.request.annualInterestRate[0],
        });

        const branch = getBranch(ctx.request.branchId);

        console.log("[DEBUG openTrove] Calling with params:", {
          owner: ctx.request.owner,
          ownerIndex: ctx.request.ownerIndex,
          collAmount: ctx.request.collAmount[0].toString(),
          boldAmount: ctx.request.boldAmount[0].toString(),
          upperHint: upperHint.toString(),
          lowerHint: lowerHint.toString(),
          annualInterestRate: ctx.request.annualInterestRate[0].toString(),
          maxUpfrontFee: ctx.request.maxUpfrontFee[0].toString(),
        });

        return ctx.writeContract({
          ...branch.contracts.BorrowerOperations,
          functionName: "openTrove",
          args: [
            ctx.request.owner,
            BigInt(ctx.request.ownerIndex),
            ctx.request.collAmount[0],
            ctx.request.boldAmount[0],
            upperHint,
            lowerHint,
            ctx.request.annualInterestRate[0],
            ctx.request.maxUpfrontFee[0],
            ADDRESS_ZERO, // addManager
            ADDRESS_ZERO, // removeManager
            ADDRESS_ZERO, // receiver
          ],
          // No ETH value - gas compensation is handled via WETH.transferFrom
        });
      },

      async verify(...args) {
        // same verification as openTroveLst
        return openBorrowPosition.steps.openTroveLst?.verify(...args);
      },
    },
  },

  async getSteps(ctx) {
    const branch = getBranch(ctx.request.branchId);

    // ETH doesn't need approval
    if (branch.symbol === "ETH") {
      return ["openTroveEth"];
    }

    // cbBTC uses BorrowerOperations directly instead of zapper
    if (branch.symbol === "CBBTC") {
      const steps: string[] = [];

      // Check if collateral approval is needed for BorrowerOperations
      const collAllowance = await readContract(ctx.wagmiConfig, {
        ...branch.contracts.CollToken,
        functionName: "allowance",
        args: [ctx.account, branch.contracts.BorrowerOperations.address],
      });

      if (collAllowance < ctx.request.collAmount[0]) {
        steps.push("approveBorrowerOps");
      }

      // Check if WETH approval is needed for gas compensation
      const wethAllowance = await readContract(ctx.wagmiConfig, {
        ...ctx.contracts.WETH,
        functionName: "allowance",
        args: [ctx.account, branch.contracts.BorrowerOperations.address],
      });

      if (wethAllowance < ETH_GAS_COMPENSATION[0]) {
        steps.push("approveWethForGas");
      }

      // Use batch or no-batch version depending on interestRateDelegate
      if (ctx.request.interestRateDelegate) {
        steps.push("openTroveDirectBatch");
      } else {
        steps.push("openTroveDirectNoBatch");
      }

      return steps;
    }

    // For other LSTs (wstETH, rETH), use the zapper
    // Check if approval is needed
    const allowance = await readContract(ctx.wagmiConfig, {
      ...branch.contracts.CollToken,
      functionName: "allowance",
      args: [ctx.account, branch.contracts.LeverageLSTZapper.address],
    });

    const steps: string[] = [];

    if (allowance < ctx.request.collAmount[0]) {
      steps.push("approveLst");
    }

    steps.push("openTroveLst");
    return steps;
  },

  parseRequest(request) {
    return v.parse(RequestSchema, request);
  },
};
