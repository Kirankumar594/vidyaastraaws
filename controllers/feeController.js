const Fee = require("../models/feeModel")
const Student = require("../models/Student")
const School = require("../models/School")
const { v4: uuidv4 } = require("uuid")

// Create new fee entry with admin-defined installment breakdown
exports.createFee = async (req, res) => {
  try {
    const { schoolId, installments, studentId, ...rest } = req.body

    if (!schoolId || !studentId || !installments || !Array.isArray(installments) || installments.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "School ID, student ID, and a non-empty array of installments are required." })
    }

    let totalAmount = 0
    const processedInstallments = installments.map((inst, index) => {
      if (typeof inst.amount !== "number" || inst.amount <= 0 || !inst.dueDate) {
        throw new Error(
          `Invalid installment data at index ${index}: amount and dueDate are required and amount must be positive.`,
        )
      }
      const dueDate = new Date(inst.dueDate)
      if (isNaN(dueDate.getTime())) {
        throw new Error(`Invalid due date format for installment at index ${index}.`)
      }

      totalAmount += inst.amount
      return {
        amount: inst.amount,
        paid: 0,
        pending: inst.amount,
        dueDate: dueDate,
        status: "pending",
        paidDate: null,
        receiptNumber: null,
        paymentMethod: null,
      }
    })

    const numberOfInstallments = processedInstallments.length

    const fee = new Fee({
      ...rest,
      schoolId,
      studentId,
      totalAmount,
      numberOfInstallments,
      installments: processedInstallments,
    })
    await fee.save()
    res.status(201).json({ success: true, data: fee })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
}

// Get all fees for a student and term with student details
exports.getFees = async (req, res) => {
  try {
    const { studentId, schoolId, page = 1, limit = 10 } = req.query;
    const query = {};

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        message: "School ID is required in query parameters.",
      });
    }
    query.schoolId = schoolId;

    if (studentId) query.studentId = studentId;

    // Convert to number for pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Fetch paginated fees
    const fees = await Fee.find(query)
      .populate({
        path: "studentId",
        select: "name rollNumber class phone email classId",
      })
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 }); // latest first

    // Count total records
    const total = await Fee.countDocuments(query);

    res.status(200).json({
      success: true,
      count: fees.length,
      total,
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: fees,
    });
  } catch (err) {
    console.error("Get fees error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


// Function to update payment status for a specific installment
exports.payInstallment = async (req, res) => {
  try {
    const { id, index } = req.params
    const { schoolId, paymentMethod } = req.body // NEW: paymentMethod

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const fee = await Fee.findById({ _id: id, schoolId: schoolId })

    if (!fee) {
      return res.status(404).json({ success: false, message: "Fee not found or does not belong to this school" })
    }

    const installmentIndex = Number.parseInt(index, 10)
    if (isNaN(installmentIndex) || installmentIndex < 0 || installmentIndex >= fee.installments.length) {
      return res.status(400).json({ success: false, message: "Invalid installment index." })
    }

    const installment = fee.installments[installmentIndex]

    if (installment.status === "paid") {
      return res.status(400).json({ success: false, message: "This installment has already been paid." })
    }

    // Mark the specific installment as paid
    installment.paid = installment.amount
    installment.pending = 0
    installment.status = "paid"
    installment.paidDate = new Date()
    installment.receiptNumber = `FEE-${uuidv4().slice(0, 8).toUpperCase()}` // NEW: Generate receipt number
    installment.paymentMethod = paymentMethod || "N/A" // NEW: Store payment method

    await fee.save()

    res.status(200).json({ success: true, data: fee })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// New function to pay multiple installments
exports.payMultipleInstallments = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId, installmentIndices, paymentMethod } = req.body // NEW: paymentMethod

    if (!schoolId || !Array.isArray(installmentIndices) || installmentIndices.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "School ID and a non-empty array of installment indices are required." })
    }

    const fee = await Fee.findById({ _id: id, schoolId: schoolId })

    if (!fee) {
      return res.status(404).json({ success: false, message: "Fee not found or does not belong to this school" })
    }

    let paidCount = 0
    for (const index of installmentIndices) {
      const installmentIndex = Number.parseInt(index, 10)
      if (isNaN(installmentIndex) || installmentIndex < 0 || installmentIndex >= fee.installments.length) {
        console.warn(`Skipping invalid installment index: ${index}`)
        continue
      }

      const installment = fee.installments[installmentIndex]

      if (installment.status !== "paid") {
        installment.paid = installment.amount
        installment.pending = 0
        installment.status = "paid"
        installment.paidDate = new Date()
        installment.receiptNumber = `FEE-${uuidv4().slice(0, 8).toUpperCase()}` // NEW: Generate receipt number
        installment.paymentMethod = paymentMethod || "N/A" // NEW: Store payment method
        paidCount++
      }
    }

    if (paidCount === 0 && installmentIndices.length > 0) {
      return res.status(400).json({ success: false, message: "All selected installments were already paid." })
    }

    await fee.save()

    res.status(200).json({ success: true, message: `${paidCount} installment(s) updated successfully.`, data: fee })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

// NEW: Function to get data for a specific fee installment receipt
exports.getFeeInstallmentReceiptData = async (req, res) => {
  try {
    const { feeId, installmentIndex } = req.params
    const { schoolId } = req.query

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const fee = await Fee.findById({ _id: feeId, schoolId: schoolId }).populate({
      path: "studentId",
      select: "name rollNumber studentId class phone email", // MODIFIED: Added studentId
    })

    if (!fee) {
      return res.status(404).json({ success: false, message: "Fee not found or does not belong to this school." })
    }

    const parsedIndex = Number.parseInt(installmentIndex, 10)
    if (isNaN(parsedIndex) || parsedIndex < 0 || parsedIndex >= fee.installments.length) {
      return res.status(400).json({ success: false, message: "Invalid installment index." })
    }

    const installment = fee.installments[parsedIndex]

    // Fetch school details
    const school = await School.findById(schoolId)
    if (!school) {
      return res.status(404).json({ success: false, message: "School details not found." })
    }

    res.status(200).json({
      success: true,
      data: {
        fee: {
          _id: fee._id,
          term: fee.term,
          title: fee.title || fee.description || "Fee Payment",
          createdAt: fee.createdAt,
        },
        installment: installment,
        student: fee.studentId,
        school: school,
      },
    })
  } catch (err) {
    console.error("Error fetching fee installment receipt data:", err)
    res.status(500).json({ success: false, message: err.message })
  }
}

// Delete fee
exports.deleteFee = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId } = req.body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const deletedFee = await Fee.findByIdAndDelete({ _id: id, schoolId: schoolId })

    if (!deletedFee) {
      return res.status(404).json({ success: false, message: "Fee not found or does not belong to this school" })
    }

    res.status(200).json({ success: true, message: "Fee deleted" })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
}

  exports.getAllFeesUnfiltered = async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query; // pagination params

      // Count total fees
      const total = await Fee.countDocuments();

      // Fetch fees with pagination and populate student info
      const fees = await Fee.find({})
        .populate({
          path: "studentId",
          select: "name rollNumber class",
        })
        .sort({ createdAt: -1 }) // optional: newest first
        .skip((page - 1) * limit)
        .limit(parseInt(limit));

      res.status(200).json({
        success: true,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        data: fees,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };


exports.updateFee = async (req, res) => {
  try {
    const { id } = req.params
    const { schoolId, installments, totalAmount } = req.body

    if (!schoolId) {
      return res.status(400).json({ success: false, message: "School ID is required." })
    }

    const fee = await Fee.findOne({ _id: id, schoolId })
    if (!fee) {
      return res.status(404).json({ success: false, message: "Fee not found or does not belong to this school." })
    }

    if (installments && Array.isArray(installments) && installments.length > 0) {
      let newTotalAmount = 0
      const processedInstallments = installments.map((inst, index) => {
        if (typeof inst.amount !== "number" || inst.amount <= 0 || !inst.dueDate) {
          throw new Error(
            `Invalid installment data at index ${index}: amount and dueDate are required and amount must be positive.`,
          )
        }
        const dueDate = new Date(inst.dueDate)
        if (isNaN(dueDate.getTime())) {
          throw new Error(`Invalid due date format for installment at index ${index}.`)
        }

        newTotalAmount += inst.amount
        const existingInstallment = fee.installments[index] || {}
        return {
          amount: inst.amount,
          paid: existingInstallment.paid || 0,
          pending: inst.amount - (existingInstallment.paid || 0),
          dueDate: dueDate,
          status: existingInstallment.status || "pending",
          paidDate: existingInstallment.paidDate || null,
          receiptNumber: existingInstallment.receiptNumber || null,
          paymentMethod: existingInstallment.paymentMethod || null,
        }
      })

      fee.installments = processedInstallments
      fee.numberOfInstallments = processedInstallments.length
      fee.totalAmount = totalAmount || newTotalAmount
    } else if (totalAmount) {
      const currentTotal = fee.installments.reduce((sum, inst) => sum + inst.amount, 0)
      if (currentTotal === 0) {
        return res.status(400).json({ success: false, message: "Cannot update total amount with no installments." })
      }
      const scaleFactor = totalAmount / currentTotal
      fee.installments = fee.installments.map((inst) => ({
        ...inst,
        amount: inst.amount * scaleFactor,
        pending: inst.pending > 0 ? inst.pending * scaleFactor : 0,
      }))
      fee.totalAmount = totalAmount
    }

    const calculatedTotal = fee.installments.reduce((sum, inst) => sum + inst.amount, 0)
    if (fee.totalAmount !== calculatedTotal) {
      return res
        .status(400)
        .json({ success: false, message: "Total amount does not match sum of installment amounts." })
    }

    await fee.save()

    res.status(200).json({ success: true, message: "Fee updated successfully.", data: fee })
  } catch (err) {
    res.status(400).json({ success: false, message: err.message })
  }
}
