import cron from "node-cron";
import { lastDayOfMonth, sub } from "date-fns";

import { logErrorOnServer } from "../controllers";
import ErrorLogModel from "../models/errorLogModel";
import TransactionModel from "../models/transactionModel";

// Schedule job to run every minute for testing purposes:
// "*/10 * * * * *"

// Schedule job to run every first day of month at 00:00:00 :
// '0 0 1 * *'

// Schedule job to run every day at 00:00:00 :
//"0 0 * * *"
export const recurrentTransactionsSchedule = cron.schedule(
  "0 0 1 * *",
  // "*/1 * * * * *",
  async () => {
    console.log("Running job to check for recurrent transactions");

    try {
      // Get current date
      const today = new Date();

      const year = today.getFullYear();
      const month = today.getMonth() + 1;
      const lastDayOfCurrentMonth = lastDayOfMonth(new Date()).getDate();
      const lastDATEofMonth = new Date(
        Date.UTC(year, Number(month) - 1, lastDayOfCurrentMonth, 0, 0, 0)
      );

      // Find all recurrent transactions that need to be created
      const recurrentTransactions = await TransactionModel.find({
        clone: false,
        recurrent: true,
        createdAt: { $lte: lastDATEofMonth },
      });

      console.log("recurrentTransactions: ", recurrentTransactions);
      if (!recurrentTransactions.length) {
        console.log("NO RECURRENT TRANSACTIONS FOUND");
        return;
      }

      for (const transaction of recurrentTransactions) {
        // Create a new transaction based on the recurrent one
        if (transaction.clone) {
          return; // Skip cloning if it's already a clone
        }

        const dateCreated = transaction.createdAt;
        const dayOfTransaction = new Date(dateCreated).getUTCDate();
        const createdAt = new Date(
          Date.UTC(year, Number(month) - 1, dayOfTransaction, 0, 0, 0)
        );

        const newTransaction = new TransactionModel({
          ...transaction.toObject(),
          createdAt,
          clone: true,
          _id: undefined,
          recurrent: true,
        });

        await newTransaction.save();
      }

      console.log("Recurrent transactions processed successfully");
    } catch (error) {
      console.error("Error processing recurrent transactions:", error);
      logErrorOnServer("recurrent-transactions-schedule", error);
    }
  },
  {
    timezone: "America/Sao_Paulo",
  }
);

export const clearOldErrorLogsSchedule = cron.schedule(
  "0 0 2 * *",
  async () => {
    console.log("Running job to check and delete old error logs");
    const today = new Date();
    const deleteOlderThanDate = sub(today, { months: 2 });

    try {
      const deleted = await ErrorLogModel.deleteMany({
        createdAt: { $lte: deleteOlderThanDate },
      });
    } catch (error) {
      console.log("Error processing old error logs scheduled for deletion.");
      logErrorOnServer("delete-old-logs-schedule", error);
    }
  },
  {
    timezone: "America/Sao_Paulo",
  }
);

export const clearOldUserActivityLogsSchedule = cron.schedule(
  "0 0 3 * *",
  async () => {
    console.log("Running job to check and delete old user activity logs");
    const today = new Date();
    const deleteOlderThanDate = sub(today, { months: 2 });

    try {
      const deleted = await ErrorLogModel.deleteMany({
        createdAt: { $lte: deleteOlderThanDate },
      });
    } catch (error) {
      console.log(
        "Error processing old user activities logs scheduled for deletion."
      );
      logErrorOnServer("delete-old-logs-schedule", error);
    }
  },
  {
    timezone: "America/Sao_Paulo",
  }
);
