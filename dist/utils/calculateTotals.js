"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTotals = void 0;
const calculateTotals = async (queryObj, query) => {
    const totals = (await query.model.aggregate([
        { $match: queryObj }, // Apply filters
        {
            $facet: {
                byTransactionType: [
                    {
                        $group: {
                            _id: "$transactionType", // Group by "income" or "outcome"
                            totalAmount: { $sum: "$amount" }, // Calculate the total amount for each type
                        },
                    },
                ],
                byTag: [
                    {
                        $group: {
                            _id: { transactionType: "$transactionType", tag: "$tag" }, // Group by transactionType and tag
                            totalAmountByTag: { $sum: "$amount" }, // Calculate total amount per tag
                        },
                    },
                ],
                count: [{ $count: "totalDocuments" }], // Count total documents
            },
        },
    ]));
    //   console.log(JSON.stringify(totals, null, 2));
    // The result of $facet is an array containing the results
    const totalsResult = totals[0];
    // Extract the count from the result
    const totalDocuments = totalsResult.count.length > 0 ? totalsResult.count[0].totalDocuments : 0;
    console.log("Total Documents: " + totalDocuments);
    const incomeTotal = totalsResult.byTransactionType.find((t) => t._id === "income")
        ?.totalAmount || 0;
    const outcomeTotal = totalsResult.byTransactionType.find((t) => t._id === "outcome")
        ?.totalAmount || 0;
    const totalsByEachOutcomeTags = {};
    const totalsByEachIncomeTags = {};
    totalsResult.byTag.forEach((t) => {
        if (t._id.transactionType === "outcome") {
            totalsByEachOutcomeTags[t._id.tag] = t.totalAmountByTag;
        }
        else {
            totalsByEachIncomeTags[t._id.tag] = t.totalAmountByTag;
        }
    });
    //   console.log("totalsEachByIncomeTags", totalsByEachIncomeTags);
    //   console.log("totalsByEachOutcomeTags", totalsByEachOutcomeTags);
    return {
        incomeTotal,
        outcomeTotal,
        totalsByEachIncomeTags,
        totalsByEachOutcomeTags,
        count: totalDocuments,
    };
};
exports.calculateTotals = calculateTotals;
//# sourceMappingURL=calculateTotals.js.map