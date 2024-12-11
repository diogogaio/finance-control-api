"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userAndTransactionsBackup = exports.clearOldUserActivityLogsSchedule = exports.clearOldErrorLogsSchedule = exports.recurrentTransactionsSchedule = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const node_cron_1 = __importDefault(require("node-cron"));
const date_fns_1 = require("date-fns");
const userModel_1 = require("../models/userModel");
const controllers_1 = require("../controllers");
const errorLogModel_1 = __importDefault(require("../models/errorLogModel"));
const transactionModel_1 = __importDefault(require("../models/transactionModel"));
// Schedule job to run every minute for testing purposes:
// "*/10 * * * * *"
// Schedule job to run every first day of month at 00:00:00 :
// '0 0 1 * *'
// Schedule job to run every day at 00:00:00 :
//"0 0 * * *"
exports.recurrentTransactionsSchedule = node_cron_1.default.schedule("0 0 1 * *", 
// "*/1 * * * * *",
async () => {
    console.log("Running job to check for recurrent transactions");
    try {
        // Get current date
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const lastDayOfCurrentMonth = (0, date_fns_1.lastDayOfMonth)(new Date()).getDate();
        const lastDATEofMonth = new Date(Date.UTC(year, Number(month) - 1, lastDayOfCurrentMonth, 0, 0, 0));
        // Find all recurrent transactions that need to be created
        const recurrentTransactions = await transactionModel_1.default.find({
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
            const createdAt = new Date(Date.UTC(year, Number(month) - 1, dayOfTransaction, 0, 0, 0));
            const newTransaction = new transactionModel_1.default({
                ...transaction.toObject(),
                createdAt,
                clone: true,
                _id: undefined,
                recurrent: true,
            });
            await newTransaction.save();
        }
        console.log("Recurrent transactions processed successfully");
    }
    catch (error) {
        console.error("Error processing recurrent transactions:", error);
        (0, controllers_1.logErrorOnServer)("recurrent-transactions-schedule", error);
    }
}, {
    timezone: "America/Sao_Paulo",
});
exports.clearOldErrorLogsSchedule = node_cron_1.default.schedule("0 0 2 * *", async () => {
    console.log("Running job to check and delete old error logs");
    const today = new Date();
    const deleteOlderThanDate = (0, date_fns_1.sub)(today, { months: 2 });
    try {
        const deleted = await errorLogModel_1.default.deleteMany({
            createdAt: { $lte: deleteOlderThanDate },
        });
    }
    catch (error) {
        console.log("Error processing old error logs scheduled for deletion.");
        (0, controllers_1.logErrorOnServer)("delete-old-logs-schedule", error);
    }
}, {
    timezone: "America/Sao_Paulo",
});
exports.clearOldUserActivityLogsSchedule = node_cron_1.default.schedule("0 0 3 * *", async () => {
    console.log("Running job to check and delete old user activity logs");
    const today = new Date();
    const deleteOlderThanDate = (0, date_fns_1.sub)(today, { months: 2 });
    try {
        const deleted = await errorLogModel_1.default.deleteMany({
            createdAt: { $lte: deleteOlderThanDate },
        });
    }
    catch (error) {
        console.log("Error processing old user activities logs scheduled for deletion.");
        (0, controllers_1.logErrorOnServer)("delete-old-logs-schedule", error);
    }
}, {
    timezone: "America/Sao_Paulo",
});
exports.userAndTransactionsBackup = node_cron_1.default.schedule("*/1 * * * * ", 
// "0 23 * * 1",
async () => {
    const today = new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
    });
    // Extract the date in "yyyy-mm-dd" format
    const formattedDate = new Date(today).toISOString().split("T")[0]; // "yyyy-mm-dd"
    console.log(formattedDate);
    const backupFolder = path_1.default.join(__dirname, "../../../finance-backups");
    console.log(`Starting user and transactions backups at:${backupFolder}`);
    if (!fs_1.default.existsSync(backupFolder)) {
        fs_1.default.mkdirSync(backupFolder, { recursive: true });
    }
    try {
        const userDocs = await userModel_1.UserModel.find().select("+password").lean();
        const transactionDocs = await transactionModel_1.default.find().lean();
        const userBackupFilePath = path_1.default.join(backupFolder, `users-${formattedDate}.json`);
        const transactionBackupFilePath = path_1.default.join(backupFolder, `transactions-${formattedDate}.json`);
        fs_1.default.writeFileSync(userBackupFilePath, JSON.stringify(userDocs, null, 2));
        fs_1.default.writeFileSync(transactionBackupFilePath, JSON.stringify(transactionDocs, null, 2));
        console.log(`User and transactions backup successful: ${backupFolder}`);
    }
    catch (error) {
        console.error("Error during user and transactions backup:", error);
        (0, controllers_1.logErrorOnServer)("users-transactions-backup", error);
    }
}, {
    timezone: "America/Sao_Paulo",
});
//# sourceMappingURL=taskScheduler.js.map