"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const calculateTotals_1 = require("./calculateTotals");
let transactionsCount;
class ApiFeatures {
    constructor(query, queryParams, tenantId) {
        this.query = query;
        this.queryParams = queryParams;
        this.tenantId = tenantId;
    }
    async filter() {
        // Handle range queries (gte, gt, lte, lt)
        let queryParams = JSON.stringify({ ...this.queryParams });
        queryParams = queryParams.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
        const queryObj = JSON.parse(queryParams);
        const excludedFields = ["page", "sort", "limit", "fields", "tenantId"];
        excludedFields.forEach((el) => delete queryObj[el]);
        queryObj.tenantId = this.tenantId;
        // Advanced filtering with RegExp for partial matching and Date conversion
        for (const key in queryObj) {
            if ((queryObj.hasOwnProperty(key) &&
                typeof queryObj[key] === "string" &&
                key === "description") ||
                key === "tag") {
                // Apply RegExp for partial matching and case-insensitivity
                queryObj[key] = new RegExp(queryObj[key], "i");
            }
            else if (key === "createdAt" && typeof queryObj[key] === "object") {
                for (const operator in queryObj[key]) {
                    if (queryObj[key].hasOwnProperty(operator)) {
                        // Convert to Date object
                        queryObj[key][operator] = new Date(queryObj[key][operator]);
                    }
                }
            }
            else if (key.includes("amount")) {
                for (const operator in queryObj[key]) {
                    if (queryObj[key].hasOwnProperty(operator)) {
                        // Convert to Date object
                        queryObj[key][operator] = Number(queryObj[key][operator]);
                    }
                }
            }
        }
        this.query = this.query.find(queryObj);
        const { count, incomeTotal, outcomeTotal, totalsByEachIncomeTags, totalsByEachOutcomeTags, } = await (0, calculateTotals_1.calculateTotals)(queryObj, this.query);
        transactionsCount = count;
        return {
            count,
            incomeTotal,
            outcomeTotal,
            totalsByEachIncomeTags,
            totalsByEachOutcomeTags,
            feat: this,
        };
    }
    sort() {
        /*
        Consistent ordering with a secondary unique field (like _id) across all sorting criteria is a good practice. Duplicate entries across pages can occur with any non-unique field like amount, tag, or description. Mongoose can duplicate transactions across pages if their values are the same.
        */
        const sortBy = this.queryParams.sort
            ? `${this.queryParams.sort.split(",").join(" ")} _id`
            : "-createdAt -_id";
        this.query = this.query.sort(sortBy);
        return this;
    }
    limitFields() {
        if (this.queryParams.fields) {
            const fields = this.queryParams.fields.split(",").join(" ");
            this.query = this.query.select(fields);
        }
        else {
            this.query = this.query.select("-__v");
        }
        return this;
    }
    paginate() {
        let page = this.queryParams.page
            ? parseInt(this.queryParams.page, 10)
            : 1;
        let limit = this.queryParams.limit;
        if (limit) {
            limit = limit.toLowerCase().includes("mostrar todos")
                ? (limit = transactionsCount)
                : Number(limit);
        }
        else {
            limit = Number(process.env.QUERY_LIMIT);
        }
        const skip = (page - 1) * limit;
        console.log("SKIP: ", skip);
        console.log("LIMIT: ", limit);
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}
exports.default = ApiFeatures;
// When you instantiate ApiFeatures like this:
// const features = new ApiFeatures(TransactionModel.find(), queryParams, tenantId);
/* TransactionModel.find() returns a Mongoose query object. This query object can be chained with additional query methods, including another .find() or methods like .sort(), .limit(), etc. So when you call this.query.find(queryObj), you're essentially refining the query further.

It's like this:

TransactionModel.find() returns a base query object.
this.query.find(queryObj) refines it based on the queryObj filters.
In Mongoose, you can chain query methods, and each .find() doesn't conflict, because it just refines the query without executing it until you call something like .exec() or await the result.

For example:

 TransactionModel.find() // Base query
  .find({ amount: { $gte: 100 } }) // Further filtering
  .sort({ createdAt: -1 }) // Sorting
  .limit(10); // Limiting

 */
// This is how query chaining works in Mongoose.
//# sourceMappingURL=ApiFeatures.js.map